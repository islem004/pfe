<?php

namespace App\Http\Traits;

use App\Models\Invoice;
use App\Models\Region;
use Illuminate\Support\Str;

trait InvoiceGenerator
{
    /**
     * Generate an invoice for a delivery using the standard fee formula.
     *
     * Formula:
     *   base_fee             = 5.00 TND (fixed)
     *   trajet_fee           = 0/3/7/13/20 TND based on region tier
     *   weight_fee           = 0/3/6/12/20 TND based on weight bracket
     *   fragile_amount       = (base + trajet + weight) × 0.30 if is_fragile
     *   delivery_fee_subtotal = sum of above
     *   tva_amount           = subtotal × 0.19
     *   total                = subtotal + tva
     */
    protected function generateInvoiceForDelivery(\App\Models\Delivery $delivery): ?Invoice
    {
        if (!$delivery->relationLoaded('client')) {
            $delivery->load('client.region');
        } elseif ($delivery->client && !$delivery->client->relationLoaded('region')) {
            $delivery->client->load('region');
        }

        if (!$delivery->relationLoaded('region')) {
            $delivery->load('region');
        }

        if (!$delivery->relationLoaded('items')) {
            $delivery->load('items');
        }

        // Step 1: Base fee
        $baseFee = 5.00;

        // Step 2: Trajet fee from pickup (client) region → destination region
        $pickupRegionName = $delivery->client?->region?->name ?? '';
        $destRegionName   = $delivery->region?->name ?? '';
        $tier = Region::tierBetween($pickupRegionName, $destRegionName);
        $trajetFee = match ($tier) {
            'same'   =>  0.0,
            'nearby' =>  3.0,
            'medium' =>  7.0,
            'long'   => 13.0,
            default  => 20.0, // remote
        };

        // Step 3: Weight surcharge
        $weight = floatval($delivery->weight ?? 0);
        $weightFee = match (true) {
            $weight > 20 => 20.0,
            $weight > 10 => 12.0,
            $weight > 5  =>  6.0,
            $weight > 2  =>  3.0,
            default      =>  0.0,
        };

        // Step 4: Fragile surcharge
        $fragileAmount = $delivery->is_fragile
            ? round(($baseFee + $trajetFee + $weightFee) * 0.30, 2)
            : 0.0;

        // Step 5: Subtotal
        $subtotal = round($baseFee + $trajetFee + $weightFee + $fragileAmount, 2);

        // Step 6: TVA (19%)
        $tvaAmount = round($subtotal * 0.19, 2);

        // Step 7: Total
        $total = round($subtotal + $tvaAmount, 2);

        // Declared merchandise value (reference only – not billed)
        $itemDeclaredValue = $delivery->items->sum(
            fn($i) => floatval($i->quantity) * floatval($i->unit_price)
        );
        if ($itemDeclaredValue == 0 && $delivery->item_price > 0) {
            $itemDeclaredValue = floatval($delivery->item_price);
        }

        $deliveryPart  = Str::after($delivery->delivery_number, 'DEL-');
        $invoiceNumber = 'INV-' . $deliveryPart;

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                $number = $attempt > 1
                    ? $invoiceNumber . '-' . strtoupper(Str::random(3))
                    : $invoiceNumber;

                return Invoice::create([
                    'invoice_number'        => $number,
                    'delivery_id'           => $delivery->id,
                    'client_id'             => $delivery->client_id,
                    'invoice_date'          => now(),
                    'due_date'              => now()->addDays(7),
                    'status'                => 'pending',
                    'item_declared_value'   => round($itemDeclaredValue, 2),
                    'base_fee'              => $baseFee,
                    'trajet_fee'            => $trajetFee,
                    'weight_fee'            => $weightFee,
                    'fragile_amount'        => $fragileAmount,
                    'delivery_fee_subtotal' => $subtotal,
                    'delivery_fee'          => $subtotal,
                    'tva_amount'            => $tvaAmount,
                    'subtotal'              => $subtotal,
                    'tax_total'             => $tvaAmount,
                    'discount_total'        => 0,
                    'total'                 => $total,
                    'amount_paid'           => 0,
                    'balance_due'           => $total,
                    'created_by'            => auth()->id() ?? $delivery->created_by,
                ]);

            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() === '23000' && $attempt < 5) {
                    continue;
                }
                throw $e;
            }
        }

        return null;
    }
}
