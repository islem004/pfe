<?php
// app/Http/Controllers/Admin/LivraisonController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Http\Traits\InvoiceGenerator;

class LivraisonController extends Controller
{
    use InvoiceGenerator;

    // ─────────────────────────────────────────────────────────────
    //  List all deliveries with filtering (status, name, address, ID)
    // ─────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = Delivery::with(['client.user', 'assignedStaff.user', 'invoices', 'region']);

        // 1. Direct ID/Delivery Number Filter (Highest Priority)
        $idParam = $request->input('id') ?? $request->input('delivery_number');
        if ($idParam) {
            $query->where('delivery_number', 'like', '%' . $idParam . '%');
        }

        // 2. Global Search (Multi-field)
        if ($request->filled('search')) {
            $term = '%' . $request->search . '%';
            $search = $request->search;

            $query->where(function($q) use ($term, $search) {
                // Main Table Fields ONLY (Safe and Fast)
                $q->where('delivery_number', 'like', $term)
                  ->orWhere('client_name', 'like', $term)
                  ->orWhere('client_phone', 'like', $term)
                  ->orWhere('recipient_phone_1', 'like', $term)
                  ->orWhere('recipient_phone_2', 'like', $term)
                  ->orWhere('delivery_address_text', 'like', $term)
                  ->orWhere('dest_city', 'like', $term);

                // Safe Status Mapping
                if (stripos('pending awaiting', $search) !== false) $q->orWhere('status', 'pending');
                if (stripos('confirmed processed confirmed', $search) !== false) $q->orWhere('status', 'confirmed');
                if (stripos('in_transit in transit shipping shipped', $search) !== false) $q->orWhere('status', 'in_transit');
                if (stripos('delivered delivered', $search) !== false) $q->orWhere('status', 'delivered');
                if (stripos('failed failed failure', $search) !== false) $q->orWhere('status', 'failed');
                if (stripos('cancelled cancelled', $search) !== false) $q->orWhere('status', 'cancelled');
            });
        }

        // 3. Explicit Status Filter
        $status = $request->input('etat') ?? $request->input('status');
        if ($status) {
            $query->where('status', $status);
        }

        // 4. Region Filter
        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        // 5. Client Filter
        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        return response()->json($query->latest()->paginate(20));
    }

    // ─────────────────────────────────────────────────────────────
    //  Return data needed to populate status filter
    // ─────────────────────────────────────────────────────────────
    public function filtersData()
    {
        $statuses = [
            'pending', 'confirmed', 'in_transit', 'delivered', 'failed', 'cancelled',
        ];

        return response()->json(compact('statuses'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'client_id'              => 'required|exists:clients,id',
            // Snapshot Fields
            'client_name'            => 'nullable|string',
            'client_address_1'       => 'nullable|string',
            'client_address_2'       => 'nullable|string',
            'client_phone'           => 'nullable|string',
            'client_fax'             => 'nullable|string',
            'item_description'       => 'nullable|string',
            'category'               => 'nullable|string',
            'weight'                 => 'nullable|string',
            'is_fragile'             => 'nullable|boolean',
            'item_price'             => 'nullable|numeric',
            'recipient_phone_1'      => 'nullable|string',
            'recipient_phone_2'      => 'nullable|string',
            'dest_city'              => 'nullable|string',
            'dest_postal_code'       => 'nullable|string',
            'dest_street'            => 'nullable|string',
            'dest_address_2'         => 'nullable|string',

            'pickup_address_text'    => 'nullable|string',
            'delivery_address_text'  => 'nullable|string',
            'scheduled_pickup_time'  => 'required|date',
            'scheduled_delivery_time'=> 'required|date',
            'items'                  => 'required|array',
            'region_id'              => 'required|exists:regions,id',
        ]);

        $deliveryNumber = 'DEL-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        $barcodeValue = strtoupper(Str::random(12));

        $client = Client::findOrFail($request->client_id);
        
        $delivery = Delivery::create([
            'delivery_number'        => $deliveryNumber,
            'client_id'              => $request->client_id,
            
            // Snapshots
            'client_name'            => $request->client_name,
            'client_address_1'       => $request->client_address_1,
            'client_address_2'       => $request->client_address_2,
            'client_phone'           => $request->client_phone,
            'client_fax'             => $request->client_fax,
            'item_description'       => $request->item_description,
            'category'               => $request->category,
            'weight'                 => $request->weight,
            'is_fragile'             => $request->is_fragile ?? false,
            'item_price'             => $request->item_price,
            'recipient_phone_1'      => $request->recipient_phone_1,
            'recipient_phone_2'      => $request->recipient_phone_2,
            'dest_city'              => $request->dest_city,
            'dest_postal_code'       => $request->dest_postal_code,
            'dest_street'            => $request->dest_street,
            'dest_address_2'         => $request->dest_address_2,

            'pickup_address_text'    => $request->pickup_address_text ?? ($request->client_address_1 . ' ' . $request->client_address_2),
            'delivery_address_text'  => $request->delivery_address_text ?? ($request->dest_street . ', ' . $request->dest_city),
            'scheduled_pickup_time'  => $request->scheduled_pickup_time,
            'scheduled_delivery_time'=> $request->scheduled_delivery_time,
            'status'                 => 'pending',
            'barcode_value'          => $barcodeValue,
            'barcode_format'         => 'CODE128',
            'shipping_fee'           => 0,
            'created_by'             => auth()->id(),
            'region_id'              => $request->region_id,
        ]);

        $invSubtotal = 0;
        $invTaxTotal = 0;
        $invDiscountTotal = 0;
        $invTotal = 0;

        foreach ($request->items as $index => $item) {
            $qty = $item['quantity'] ?? 1;
            $price = $item['unit_price'] ?? 0;
            $subtotal = $qty * $price;
            $discountAmount = $subtotal * (($item['discount_percent'] ?? 0) / 100);
            $taxAmount = ($subtotal - $discountAmount) * (($item['tax_rate'] ?? 0) / 100);
            $total = $subtotal - $discountAmount + $taxAmount;

            $invSubtotal += $subtotal;
            $invTaxTotal += $taxAmount;
            $invDiscountTotal += $discountAmount;
            $invTotal += $total;

            $delivery->items()->create([
                'item_name'        => $item['item_name'] ?? ($item['name'] ?? 'Article ' . ($index + 1)),
                'quantity'         => $qty,
                'unit_price'       => $price,
                'discount_amount'  => $discountAmount,
                'tax_amount'       => $taxAmount,
                'subtotal'         => $subtotal,
                'total'            => $total,
                'sort_order'       => $index,
            ]);
        }

        // CREATE INVOICE
        $delivery->load('region');
        ['delivery_fee' => $deliveryFee, 'tva_amount' => $tvaAmount] = $this->calculateDeliveryFee($delivery);
        $this->generateInvoice($delivery, $request->client_id, $invTotal, $deliveryFee, $tvaAmount, auth()->id());

        AuditLog::create([
            'user_id'    => auth()->id(),
            'action'     => 'delivery_created',
            'entity_type'=> 'delivery',
            'entity_id'  => $delivery->id,
            'new_values' => ['delivery_number' => $delivery->delivery_number, 'status' => 'pending'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json($delivery->load(['items', 'invoices', 'client.user']), 201);
    }

    public function show($id)
    {
        $livraison = \App\Models\Delivery::with(['client.user', 'assignedStaff.user', 'statusHistories', 'items', 'invoices', 'region'])->findOrFail($id);
        return response()->json($livraison);
    }

    public function update(Request $request, $id)
    {
        $livraison = Delivery::with('client')->findOrFail($id);
        $oldStatus = $livraison->status;

        $staffChanged = false;
        if ($request->filled('assigned_staff_id')) {
            $staffChanged = $livraison->assigned_staff_id != $request->assigned_staff_id;
            $livraison->assigned_staff_id = $request->assigned_staff_id;

            // AUTOMATION: If assigning a driver to a pending delivery, force it to 'confirmed'
            if ($livraison->status === 'pending') {
                $livraison->status = 'confirmed';
            }
        }

        // Only update status if the request has a VALID non-empty value
        if ($request->filled('status')) {
             $livraison->status = $request->status;
        }

        if ($request->has('internal_notes')) {
            $livraison->internal_notes = $request->internal_notes;
        }

        if ($livraison->isDirty()) {
            $livraison->save();

            // Record status history
            $livraison->statusHistories()->create([
                'status'     => $livraison->status,
                'updated_by' => auth()->id(),
                'notes'      => $request->history_note ?? "Updated via admin dashboard",
            ]);

            if ($oldStatus !== 'confirmed' && $livraison->status === 'confirmed') {
                if ($livraison->invoices()->count() < 1) {
                    try {
                        app(\App\Http\Controllers\Admin\FactureController::class)->generate(new \Illuminate\Http\Request(['delivery_id' => $livraison->id]));
                    } catch (\Exception $e) {
                        \Log::error('Auto-invoice generation failed on status update', ['error' => $e->getMessage()]);
                    }
                }
            }

            // Notify assigned staff when delivery is assigned to them
            if ($staffChanged && $livraison->assigned_staff_id) {
                try {
                    $assignedStaff = \App\Models\Staff::find($livraison->assigned_staff_id);
                    if ($assignedStaff) {
                        Notification::create([
                            'user_id'             => $assignedStaff->user_id,
                            'type'                => 'delivery_assigned',
                            'title'               => 'New Delivery Assigned',
                            'message'             => "Delivery #{$livraison->delivery_number} has been assigned to you.",
                            'related_entity_type' => 'delivery',
                            'related_entity_id'   => $livraison->id,
                            'is_read'             => false,
                            'created_at'          => now(),
                        ]);
                    }
                } catch (\Exception $e) {
                    \Log::error("Failed to notify staff for delivery #{$livraison->id}: " . $e->getMessage());
                }
            }

            // Notify client if status actually changed (automated OR manual)
            if ($livraison->status !== $oldStatus) {
                AuditLog::create([
                    'user_id'    => auth()->id(),
                    'action'     => 'delivery_status_changed',
                    'entity_type'=> 'delivery',
                    'entity_id'  => $livraison->id,
                    'old_values' => ['status' => $oldStatus],
                    'new_values' => ['status' => $livraison->status, 'delivery_number' => $livraison->delivery_number],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);

                $this->notifyClient($livraison);
                
                // Premium Upgrade Logic
                if ($livraison->status === 'delivered') {
                    $client = $livraison->client;
                    if ($client && !$client->is_premium) {
                        $deliveredCount = Delivery::where('client_id', $client->id)
                            ->where('status', 'delivered')
                            ->count();
                        
                        if ($deliveredCount >= 30) {
                            $client->update([
                                'is_premium' => true,
                                'premium_discount_deliveries_left' => 5
                            ]);
                            
                            \Log::info("Client {$client->id} upgraded to Premium!");
                        }
                    }
                }
            }
        }

        return response()->json($livraison->load(['client.user', 'assignedStaff.user', 'statusHistories', 'invoices', 'region']));
    }

    // ─────────────────────────────────────────────────────────────
    //  Send a push notification to the delivery's client
    // ─────────────────────────────────────────────────────────────
    private function notifyClient(Delivery $livraison): void
    {
        try {
            $client = $livraison->client;
            if (!$client || !$client->user_id) {
                \Log::warning("LivraisonController: cannot notify — client or user_id missing for delivery #{$livraison->id}");
                return;
            }

            $statusLabel = match ($livraison->status) {
                'confirmed'  => 'Confirmed & Processed',
                'in_transit' => 'In Transit',
                'delivered'  => 'Delivered Successfully ✅',
                'failed'     => 'Delivery Failed ❌',
                'cancelled'  => 'Cancelled',
                default      => ucfirst(str_replace('_', ' ', $livraison->status)),
            };

            Notification::create([
                'user_id'             => $client->user_id,
                'type'                => 'delivery_update',
                'title'               => 'Your delivery update',
                'message'             => "Your delivery #{$livraison->delivery_number} is now: {$statusLabel}.",
                'related_entity_type' => 'delivery',
                'related_entity_id'   => $livraison->id,
                'is_read'             => false,
                'created_at'          => now(),
            ]);
        } catch (\Exception $e) {
            \Log::error("LivraisonController: notification failed for delivery #{$livraison->id}: " . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $livraison = \App\Models\Delivery::findOrFail($id);
        $livraison->delete();
        return response()->json(['message' => 'Delivery deleted']);
    }

    public function printDeliveryForm($id)
    {
        $delivery = Delivery::with(['items', 'client', 'assignedStaff.user', 'region'])->findOrFail($id);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.delivery-form', compact('delivery'));
        return $pdf->stream('bon-livraison-' . $delivery->delivery_number . '.pdf');
    }

}
