<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 32px 36px; }
        table { border-collapse: collapse; }
        .w100 { width: 100%; }
        .vt { vertical-align: top; }

        /* Header */
        .brand-name { font-size: 22px; font-weight: 900; color: #1E3A5F; letter-spacing: 1px; }
        .brand-sub  { font-size: 9px; color: #64748b; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
        .inv-label  { font-size: 26px; font-weight: 900; color: #1E3A5F; letter-spacing: -1px; }
        .inv-num    { font-size: 10px; color: #64748b; font-weight: 700; margin-top: 3px; }
        .inv-date   { font-size: 10px; color: #94a3b8; margin-top: 2px; }

        /* Dividers */
        .divider       { border: none; border-top: 2px solid #1E3A5F; margin: 14px 0; }
        .divider-light { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }

        /* Status badge */
        .badge          { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .badge-pending  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-paid     { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .badge-overdue  { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

        /* Party boxes */
        .party-title { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #1E3A5F; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 2px solid #1E3A5F; }
        .party-name  { font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 3px; }
        .party-line  { font-size: 10px; color: #64748b; line-height: 1.7; }

        /* Section label */
        .section-label { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #1E3A5F; margin-bottom: 6px; }

        /* Service charges table */
        .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .fee-table thead th {
            background: #1E3A5F; color: #fff; padding: 8px 12px;
            font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; text-align: left;
        }
        .fee-table tbody td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
        .fee-table tbody tr:nth-child(even) { background: #f8fafc; }
        .fee-table .subtotal-row td { background: #f1f5f9; font-weight: 700; border-top: 1px solid #cbd5e1; }
        .fee-table .tva-row td      { background: #f8fafc; color: #475569; }
        .fee-table .total-row td    { background: #1E3A5F; color: #fff; font-weight: 900; font-size: 12px; }

        /* Declared value box */
        .ref-box { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 14px; margin-bottom: 14px; }
        .ref-box-title { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; color: #475569; margin-bottom: 4px; }
        .ref-box-note  { font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 3px; }

        /* Payment instructions */
        .pay-box { border-left: 3px solid #1E3A5F; padding: 8px 12px; background: #f0f4f8; margin-bottom: 14px; }
        .pay-title { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1E3A5F; margin-bottom: 4px; }
        .pay-line  { font-size: 10px; color: #334155; line-height: 1.7; }

        /* Footer */
        .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 9px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>

{{-- HEADER --}}
<table class="w100" style="margin-bottom:18px;">
    <tr>
        <td class="vt" style="width:50%;">
            <div class="brand-name">SwiftDelivery</div>
            <div class="brand-sub">Logistics &amp; Express Delivery Services</div>
        </td>
        <td class="vt" style="width:50%;text-align:right;">
            <div class="inv-label">INVOICE</div>
            <div class="inv-num">{{ $invoice->invoice_number }}</div>
            <div class="inv-date">Date: {{ \Carbon\Carbon::parse($invoice->invoice_date ?? $invoice->created_at)->format('d M Y') }}</div>
            <div class="inv-date">Due: {{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</div>
            <div style="margin-top:6px;">
                @php $s = strtolower($invoice->status ?? 'pending'); @endphp
                @if($s === 'paid')
                    <span class="badge badge-paid">Paid</span>
                @elseif($s === 'overdue')
                    <span class="badge badge-overdue">Overdue</span>
                @else
                    <span class="badge badge-pending">Pending</span>
                @endif
            </div>
        </td>
    </tr>
</table>

<hr class="divider">

{{-- PARTIES --}}
<table class="w100" style="margin-bottom:18px;">
    <tr>
        <td class="vt" style="width:33%;padding-right:12px;">
            <div class="party-title">Bill To</div>
            <div class="party-name">{{ $invoice->client->company_name ?? (($invoice->client->user->first_name ?? '') . ' ' . ($invoice->client->user->last_name ?? '')) }}</div>
            @if($invoice->client->user->email ?? null)
                <div class="party-line">{{ $invoice->client->user->email }}</div>
            @endif
            @if($invoice->client->user->phone ?? null)
                <div class="party-line">{{ $invoice->client->user->phone }}</div>
            @endif
            @if($invoice->delivery->client_address_1 ?? null)
                <div class="party-line">{{ $invoice->delivery->client_address_1 }}</div>
            @endif
        </td>
        <td class="vt" style="width:33%;padding-right:12px;">
            <div class="party-title">Service Provided By</div>
            <div class="party-name">SwiftDelivery</div>
            <div class="party-line">Express Logistics Network</div>
            <div class="party-line">Tunisia</div>
            <div class="party-line">support@swiftdelivery.tn</div>
        </td>
        <td class="vt" style="width:34%;">
            <div class="party-title">Delivery Reference</div>
            <div class="party-name" style="font-size:11px;">{{ $invoice->delivery->delivery_number ?? '—' }}</div>
            @if($invoice->delivery->dest_city ?? null)
                <div class="party-line">Destination: {{ $invoice->delivery->dest_city }}</div>
            @endif
            @if($invoice->delivery->region->name ?? null)
                <div class="party-line">Dest. Region: {{ $invoice->delivery->region->name }}</div>
            @endif
            @if($invoice->delivery->status ?? null)
                <div class="party-line">Status: {{ ucfirst(str_replace('_', ' ', $invoice->delivery->status)) }}</div>
            @endif
            @if($invoice->delivery->created_at ?? null)
                <div class="party-line">Created: {{ \Carbon\Carbon::parse($invoice->delivery->created_at)->format('d M Y') }}</div>
            @endif
        </td>
    </tr>
</table>

<hr class="divider-light">

{{-- SERVICE CHARGES --}}
@php
    $baseFee    = floatval($invoice->base_fee ?? 5.00);
    $trajetFee  = floatval($invoice->trajet_fee ?? 0);
    $weightFee  = floatval($invoice->weight_fee ?? 0);
    $fragile    = floatval($invoice->fragile_amount ?? 0);
    $subtotal   = floatval($invoice->delivery_fee_subtotal ?? $invoice->subtotal ?? ($baseFee + $trajetFee + $weightFee + $fragile));
    $tva        = floatval($invoice->tva_amount ?? 0);
    $total      = floatval($invoice->total ?? ($subtotal + $tva));
    $delivery   = $invoice->delivery;
    $weight     = floatval($delivery->weight ?? 0);
@endphp

<div class="section-label" style="margin-top:10px;">Service Charges</div>
<table class="fee-table">
    <thead>
        <tr>
            <th style="width:65%;">Description</th>
            <th style="width:35%;text-align:right;">Amount (TND)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Base Service Fee</td>
            <td style="text-align:right;">{{ number_format($baseFee, 2) }}</td>
        </tr>
        <tr>
            <td>Distance Fee (Trajet)
                @if($delivery->region->name ?? null)
                    <span style="color:#94a3b8;font-size:9px;"> — to {{ $delivery->region->name }}</span>
                @endif
            </td>
            <td style="text-align:right;">{{ number_format($trajetFee, 2) }}</td>
        </tr>
        @if($weightFee > 0)
        <tr>
            <td>Weight Surcharge ({{ $weight }} kg)</td>
            <td style="text-align:right;">{{ number_format($weightFee, 2) }}</td>
        </tr>
        @endif
        @if($fragile > 0)
        <tr>
            <td>Fragile Handling (30% surcharge)</td>
            <td style="text-align:right;">{{ number_format($fragile, 2) }}</td>
        </tr>
        @endif
        <tr class="subtotal-row">
            <td>Subtotal (excl. TVA)</td>
            <td style="text-align:right;">{{ number_format($subtotal, 2) }}</td>
        </tr>
        <tr class="tva-row">
            <td>TVA (19%)</td>
            <td style="text-align:right;">+ {{ number_format($tva, 2) }}</td>
        </tr>
        <tr class="total-row">
            <td style="padding:10px 12px;">Total Amount Due</td>
            <td style="text-align:right;padding:10px 12px;font-size:14px;">{{ number_format($total, 2) }} TND</td>
        </tr>
    </tbody>
</table>

{{-- DECLARED MERCHANDISE VALUE (reference only) --}}
@if(($invoice->item_declared_value ?? 0) > 0)
<div class="ref-box">
    <div class="ref-box-title">Declared Merchandise Value</div>
    <table class="w100">
        <tr>
            <td style="font-size:10px;color:#334155;">
                {{ $delivery->item_description ?? 'Goods' }}
                @if($delivery->category ?? null) — {{ $delivery->category }} @endif
            </td>
            <td style="text-align:right;font-size:11px;font-weight:700;color:#334155;">
                {{ number_format($invoice->item_declared_value, 2) }} TND
            </td>
        </tr>
    </table>
    <div class="ref-box-note">For insurance and customs reference only. This value is not included in the invoice total.</div>
</div>
@endif

{{-- PAYMENT INSTRUCTIONS --}}
<div class="pay-box">
    <div class="pay-title">Payment Instructions</div>
    <div class="pay-line">Please settle the invoice amount of <strong>{{ number_format($total, 2) }} TND</strong> by <strong>{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</strong>.</div>
    <div class="pay-line" style="margin-top:3px;">Payment can be made via bank transfer, mobile payment, or at any SwiftDelivery office.</div>
    <div class="pay-line" style="margin-top:3px;">Please reference invoice number <strong>{{ $invoice->invoice_number }}</strong> with your payment.</div>
</div>

{{-- FOOTER --}}
<div class="footer">
    {{ $invoice->invoice_number }} &mdash; Generated {{ now()->format('d M Y H:i') }} &mdash; Thank you for choosing SwiftDelivery.
</div>

</body>
</html>
