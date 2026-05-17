<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Http\Request;

class DeliveryItemController extends Controller
{
    public function store(Request $request, $deliveryId)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)->findOrFail($deliveryId);

        if ($delivery->status !== 'draft') {
            return response()->json([
                'message' => 'Items can only be added to draft deliveries'
            ], 403);
        }

        $request->validate([
            'item_name'        => 'required|string',
            'quantity'         => 'required|numeric|min:0.01',
            'unit_price'       => 'required|numeric|min:0',
            'unit'             => 'nullable|string',
            'item_code'        => 'nullable|string',
            'description'      => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'tax_rate'         => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $subtotal = $request->quantity * $request->unit_price;
        $discountAmount = $subtotal * (($request->discount_percent ?? 0) / 100);
        $taxAmount = ($subtotal - $discountAmount) * (($request->tax_rate ?? 0) / 100);
        $total = $subtotal - $discountAmount + $taxAmount;

        $item = $delivery->items()->create([
            'item_code'        => $request->item_code,
            'item_name'        => $request->item_name,
            'description'      => $request->description,
            'quantity'         => $request->quantity,
            'unit'             => $request->unit ?? 'piece',
            'unit_price'       => $request->unit_price,
            'discount_percent' => $request->discount_percent ?? 0,
            'discount_amount'  => $discountAmount,
            'tax_rate'         => $request->tax_rate ?? 0,
            'tax_amount'       => $taxAmount,
            'subtotal'         => $subtotal,
            'total'            => $total,
            'notes'            => $request->notes,
            'sort_order'       => $delivery->items()->count(),
        ]);

        return response()->json([
            'message' => 'Item added successfully',
            'item'    => $item,
        ], 201);
    }

    public function update(Request $request, $deliveryId, $itemId)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)->findOrFail($deliveryId);

        if ($delivery->status !== 'draft') {
            return response()->json([
                'message' => 'Items can only be edited in draft deliveries'
            ], 403);
        }

        $item = $delivery->items()->findOrFail($itemId);

        $request->validate([
            'item_name'        => 'sometimes|string',
            'quantity'         => 'sometimes|numeric|min:0.01',
            'unit_price'       => 'sometimes|numeric|min:0',
            'unit'             => 'nullable|string',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'tax_rate'         => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $quantity   = $request->quantity ?? $item->quantity;
        $unitPrice  = $request->unit_price ?? $item->unit_price;
        $discount   = $request->discount_percent ?? $item->discount_percent;
        $taxRate    = $request->tax_rate ?? $item->tax_rate;

        $subtotal       = $quantity * $unitPrice;
        $discountAmount = $subtotal * ($discount / 100);
        $taxAmount      = ($subtotal - $discountAmount) * ($taxRate / 100);
        $total          = $subtotal - $discountAmount + $taxAmount;

        $item->update([
            'item_name'        => $request->item_name ?? $item->item_name,
            'quantity'         => $quantity,
            'unit_price'       => $unitPrice,
            'unit'             => $request->unit ?? $item->unit,
            'discount_percent' => $discount,
            'discount_amount'  => $discountAmount,
            'tax_rate'         => $taxRate,
            'tax_amount'       => $taxAmount,
            'subtotal'         => $subtotal,
            'total'            => $total,
            'notes'            => $request->notes ?? $item->notes,
        ]);

        return response()->json([
            'message' => 'Item updated successfully',
            'item'    => $item,
        ]);
    }

    public function destroy(Request $request, $deliveryId, $itemId)
    {
        $client = $request->user()->client;

        $delivery = Delivery::where('client_id', $client->id)->findOrFail($deliveryId);

        if ($delivery->status !== 'draft') {
            return response()->json([
                'message' => 'Items can only be deleted from draft deliveries'
            ], 403);
        }

        $item = $delivery->items()->findOrFail($itemId);
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }
}