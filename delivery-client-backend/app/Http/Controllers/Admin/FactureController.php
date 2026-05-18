<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Picqer\Barcode\BarcodeGeneratorSVG;
use Illuminate\Http\Request;
use App\Models\Invoice;
use App\Models\Delivery;
use App\Http\Traits\InvoiceGenerator;

class FactureController extends Controller
{
    use InvoiceGenerator;

    public function index(Request $request)
    {
        $query = Invoice::with(['client.user', 'delivery']);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Generate invoice for a delivery if one doesn't already exist.
     */
    public function generate(Request $request, $id = null)
    {
        $deliveryId = $id ?? $request->input('delivery_id');

        if (!$deliveryId) {
            return response()->json(['message' => 'Delivery ID required'], 400);
        }

        $delivery = Delivery::with(['client.user', 'client.region', 'items', 'region'])->findOrFail($deliveryId);

        // Return existing invoice if already generated
        $existing = Invoice::where('delivery_id', $delivery->id)->first();
        if ($existing) {
            return response()->json([
                'message' => 'Invoice already exists for this delivery.',
                'invoice' => $existing,
            ], 200);
        }

        $invoice = $this->generateInvoiceForDelivery($delivery);

        return response()->json([
            'message' => 'Invoice generated.',
            'invoice' => $invoice,
        ]);
    }

    /**
     * Generate invoices for every delivery that doesn't have one yet.
     * Skips cancelled deliveries.
     */
    public function generateAllMissing()
    {
        $deliveries = Delivery::with(['client.region', 'items', 'region'])
            ->whereDoesntHave('invoices')
            ->where('status', '!=', 'cancelled')
            ->get();

        $generated = 0;
        foreach ($deliveries as $delivery) {
            try {
                $this->generateInvoiceForDelivery($delivery);
                $generated++;
            } catch (\Exception $e) {
                \Log::error("generateAllMissing: failed for delivery #{$delivery->id}: " . $e->getMessage());
            }
        }

        return response()->json(['generated' => $generated]);
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);

        if ($invoice->pdf_url) {
            $path = storage_path('app/public/' . ltrim(str_replace('/storage/', '', $invoice->pdf_url), '/'));
            if (file_exists($path)) {
                @unlink($path);
            }
        }

        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted.']);
    }
}
