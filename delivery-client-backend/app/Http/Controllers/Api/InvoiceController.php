<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $client = $request->user()->client;

        if (!$client) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $query = Invoice::where('client_id', $client->id)
            ->with(['delivery']);

        $invoices = $query->orderBy('created_at', 'desc')->get();

        return response()->json($invoices);
    }

    public function show(Request $request, $id)
    {
        $client = $request->user()->client;

        $invoice = Invoice::where('client_id', $client->id)
            ->with(['delivery.items'])
            ->findOrFail($id);

        return response()->json($invoice);
    }

    public function filter(Request $request)
    {
        $client = $request->user()->client;

        $query = Invoice::where('client_id', $client->id)
            ->with(['delivery']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->whereDate('invoice_date', '>=', $request->from);
        }

        if ($request->has('to')) {
            $query->whereDate('invoice_date', '<=', $request->to);
        }

        $invoices = $query->orderBy('invoice_date', 'desc')->paginate(10);

        return response()->json($invoices);
    }

    public function printInvoice(Request $request, $id)
    {
        $user = $request->user();
        $query = Invoice::with(['delivery.items', 'delivery.region', 'client.user']);

        // If not admin, restrict to own invoices
        if (!$user->hasRole('admin')) {
            $client = $user->client;
            if (!$client) {
                return response()->json(['message' => 'Client profile not found'], 404);
            }
            $query->where('client_id', $client->id);
        }

        $invoice = $query->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', compact('invoice'));
        return $pdf->stream('facture-' . $invoice->invoice_number . '.pdf');
    }
}