<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Delivery;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Milon\Barcode\DNS1D;
use App\Http\Traits\InvoiceGenerator;

class DeliveryController extends Controller
{
    use InvoiceGenerator;

    public function index(Request $request)
    {
        $client = $request->user()->client;

        $query = Delivery::where('client_id', $client->id)
            ->with(['items', 'statusHistories', 'invoices']);

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
                  ->orWhere('recipient_phone_1', 'like', $term)
                  ->orWhere('recipient_phone_2', 'like', $term)
                  ->orWhere('delivery_address_text', 'like', $term)
                  ->orWhere('dest_city', 'like', $term)
                  ->orWhere('item_description', 'like', $term);

                // Safe Status Mapping
                if (stripos('created pending awaiting', $search) !== false) $q->orWhere('status', 'created');
                if (stripos('confirmed processed', $search) !== false) $q->orWhere('status', 'confirmed');
                if (stripos('shipped in transit shipping', $search) !== false) $q->orWhere('status', 'shipped');
                if (stripos('delivered', $search) !== false) $q->orWhere('status', 'delivered');
                if (stripos('failed failure', $search) !== false) $q->orWhere('status', 'failed');
                if (stripos('cancelled', $search) !== false) $q->orWhere('status', 'cancelled');
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

        // 5. Address Filter
        $address = $request->input('adresse') ?? $request->input('address');
        if ($address) {
            $term = '%' . $address . '%';
            $query->where(function($q) use ($term) {
                $q->where('delivery_address_text', 'like', $term)
                  ->orWhere('dest_city', 'like', $term)
                  ->orWhere('dest_street', 'like', $term)
                  ->orWhere('dest_address_2', 'like', $term);
            });
        }

        $deliveries = $query->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($deliveries);
    }

    public function store(Request $request)
    {
        $request->validate([
            // New Detailed Fields
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
            'region_id'              => 'required|exists:regions,id',

            // Legacy/Compatible Fields
            'pickup_address_text'    => 'nullable|string',
            'delivery_address_text'  => 'nullable|string',
            'scheduled_pickup_time'  => 'nullable|date',
            'scheduled_delivery_time'=> 'nullable|date',
            'priority'               => 'in:low,normal,high,urgent',
            'special_instructions'   => 'nullable|string',
            'items'                  => 'sometimes|array',
        ]);

        $client = $request->user()->client;

        $deliveryNumber = 'DEL-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));
        $barcodeValue = strtoupper(Str::random(12));

        $delivery = Delivery::create([
            'delivery_number'        => $deliveryNumber,
            'client_id'              => $client->id,
            
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
            'priority'               => $request->priority ?? 'normal',
            'special_instructions'   => $request->special_instructions ?? $request->note,
            'region_id'              => $request->region_id,
            'pickup_region_id'       => $client->region_id,
            'status'                 => 'created',
            'barcode_value'          => $barcodeValue,
            'barcode_format'         => 'CODE128',
            'shipping_fee'           => 0,
            'created_by'             => $request->user()->id,
        ]);

        $items = $request->items;
        if (empty($items)) {
            $items = [[
                'item_name' => $request->item_description ?? ('Parcel: ' . ($request->category ?? 'Standard')),
                'quantity'  => 1,
                'weight'    => $request->weight ?? 0.5,
                'unit_price' => $request->item_price ?? 0,
            ]];
        }

        $invSubtotal = 0;
        $invTaxTotal = 0;
        $invDiscountTotal = 0;
        $invTotal = 0;

        foreach ($items as $index => $item) {
            $qty = floatval($item['quantity'] ?? 1);
            $price = floatval($item['unit_price'] ?? 0);
            $subtotal = $qty * $price;
            $discountAmount = $subtotal * (floatval($item['discount_percent'] ?? 0) / 100);
            $taxAmount = ($subtotal - $discountAmount) * (floatval($item['tax_rate'] ?? 0) / 100);
            $total = $subtotal - $discountAmount + $taxAmount;

            $invSubtotal += $subtotal;
            $invTaxTotal += $taxAmount;
            $invDiscountTotal += $discountAmount;
            $invTotal += $total;

            $delivery->items()->create([
                'item_code'        => $item['item_code'] ?? null,
                'item_name'        => $item['item_name'] ?? ($item['name'] ?? 'Item ' . ($index + 1)),
                'description'      => $item['description'] ?? null,
                'quantity'         => $qty,
                'unit'             => $item['unit'] ?? 'piece',
                'unit_price'       => $price,
                'discount_percent' => $item['discount_percent'] ?? 0,
                'discount_amount'  => $discountAmount,
                'tax_rate'         => $item['tax_rate'] ?? 0,
                'tax_amount'       => $taxAmount,
                'subtotal'         => $subtotal,
                'total'            => $total,
                'notes'            => $item['notes'] ?? null,
                'sort_order'       => $index,
            ]);
        }

        $delivery->statusHistories()->create([
            'status'     => 'created',
            'updated_by' => $request->user()->id,
            'notes'      => 'Delivery created',
        ]);

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => 'delivery_created',
            'entity_type'=> 'delivery',
            'entity_id'  => $delivery->id,
            'new_values' => ['delivery_number' => $delivery->delivery_number, 'status' => 'created'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        // Notify Admins about the new delivery
        $admins = \App\Models\User::whereHas('roles', function($q) {
            $q->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_delivery',
                'title' => 'New Delivery',
                'message' => "A new delivery SD-{$delivery->delivery_number} has been created by {$request->user()->first_name}.",
                'related_entity_type' => 'delivery',
                'related_entity_id' => $delivery->id,
                'created_at' => now(),
            ]);
        }

        // AUTOMATIC INVOICE GENERATION
        $delivery->load(['region', 'client.region', 'items']);
        $this->generateInvoiceForDelivery($delivery);

        return response()->json([
            'message'  => 'Delivery and Invoices created successfully',
            'delivery' => $delivery->load('items', 'statusHistories', 'invoices'),
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)
            ->with(['items', 'statusHistories', 'invoice', 'invoices', 'proofOfDelivery'])
            ->findOrFail($id);

        return response()->json($delivery);
    }

    public function update(Request $request, $id)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)->findOrFail($id);

        if ($delivery->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft deliveries can be edited'
            ], 403);
        }

        $request->validate([
            'pickup_address_text'    => 'sometimes|string',
            'delivery_address_text'  => 'sometimes|string',
            'scheduled_pickup_time'  => 'nullable|date',
            'scheduled_delivery_time'=> 'nullable|date',
            'priority'               => 'sometimes|in:low,normal,high,urgent',
            'special_instructions'   => 'nullable|string',
            'region_id'              => 'sometimes|exists:regions,id',
        ]);

        $delivery->update($request->only([
            'pickup_address_text',
            'delivery_address_text',
            'scheduled_pickup_time',
            'scheduled_delivery_time',
            'priority',
            'special_instructions',
            'region_id',
        ]));

        return response()->json([
            'message'  => 'Delivery updated successfully',
            'delivery' => $delivery->load('items'),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)->findOrFail($id);

        if ($delivery->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft deliveries can be deleted'
            ], 403);
        }

        $delivery->delete();

        return response()->json(['message' => 'Delivery deleted successfully']);
    }

    public function track(Request $request, $id)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)
            ->with(['statusHistories' => function($query) {
                $query->orderBy('id', 'desc');
            }])
            ->findOrFail($id);

        return response()->json([
            'delivery_number' => $delivery->delivery_number,
            'current_status'  => $delivery->status,
            'history'         => $delivery->statusHistories,
        ]);
    }
    public function printDeliveryForm(Request $request, $id)
    {
        $user = $request->user();
        $query = Delivery::with(['items', 'client', 'assignedStaff.user', 'region']);

        // If not admin, restrict to own deliveries
        if (!$user->hasRole('admin')) {
            $client = $user->client;
            if (!$client) {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
            $query->where('client_id', $client->id);
        }

        $delivery = $query->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.delivery-form', compact('delivery'));
        return $pdf->stream('bon-livraison-' . $delivery->delivery_number . '.pdf');
    }

    public function rate(Request $request, $id)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)->findOrFail($id);

        if ($delivery->status !== 'delivered') {
            return response()->json([
                'message' => 'You can only rate completed deliveries.'
            ], 403);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'rating_comment' => 'nullable|string|max:1000',
        ]);

        $delivery->update([
            'rating' => $request->rating,
            'rating_comment' => $request->rating_comment,
        ]);

        // Create a Complaint (Reclamation) automatically
        $complaint = \App\Models\Complaint::create([
            'user_id' => $request->user()->id,
            'delivery_id' => $delivery->id,
            'subject' => "Delivery Evaluation: {$delivery->delivery_number}",
            'description' => "Rating: {$request->rating}/5 stars. \nComment: " . ($request->rating_comment ?? 'None'),
            'status' => 'pending',
        ]);

        // Notify Admins (logic copied from ComplaintController)
        $admins = \App\Models\User::whereHas('roles', function($q) {
            $q->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_complaint',
                'title' => 'New Review / Complaint',
                'message' => "New review from {$request->user()->first_name} ({$request->rating}/5 stars)",
                'related_entity_type' => 'complaint',
                'related_entity_id' => $complaint->id,
                'created_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Thank you for your evaluation! The admin has been notified.',
            'delivery' => $delivery
        ]);
    }


}