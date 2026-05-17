<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Delivery Form {{ $delivery->delivery_number }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; padding: 24px; }

        /* ── Typography helpers ── */
        .label   { font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid #eee; }
        .info-box { background: #f7f8fa; border-radius: 4px; padding: 8px 10px; line-height: 1.7; min-height: 55px; font-size: 10px; }
        .info-box strong { color: #333; }

        /* ── Items / sig tables ── */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .data-table thead th { background: #1a1a2e; color: #fff; padding: 6px 8px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.8px; text-align: left; }
        .data-table tbody tr:nth-child(even) { background: #f5f6fa; }
        .data-table tbody td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
        .data-table tfoot td { padding: 6px 8px; font-weight: 700; border-top: 2px solid #1a1a2e; font-size: 10px; }
        .tr { text-align: right; }
        .tc { text-align: center; }

        /* ── Misc ── */
        .fragile { display: inline-block; background: #fff3e0; border: 1px solid #ffb74d; color: #e65100; font-size: 8px; font-weight: 700; padding: 1px 5px; border-radius: 10px; text-transform: uppercase; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; background: #e8f4fd; color: #1a6dad; border: 1px solid #b3d7f5; }
        .barcode-box { text-align: center; margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; }
        .bc-value { font-size: 12px; font-weight: 700; letter-spacing: 2px; margin-top: 3px; }
        .bc-hint  { font-size: 8px; color: #888; margin-top: 2px; }
        .sig-line { border-top: 1px solid #aaa; padding-top: 3px; font-size: 8px; color: #aaa; }
        .sig-title { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #555; margin-bottom: 40px; }
        .footer { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 5px; font-size: 8px; color: #aaa; text-align: center; }
        .instructions-box { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; padding: 8px 10px; margin-bottom: 12px; font-size: 10px; }
        .section-gap { margin-bottom: 10px; }
    </style>
</head>
<body>

{{-- ── HEADER — table layout (no floats) ── --}}
<table width="100%" style="border-bottom: 3px solid #1a1a2e; padding-bottom: 10px; margin-bottom: 14px; border-collapse: collapse;">
    <tr>
        <td style="vertical-align: top; width: 60%;">
            <div style="font-size: 20px; font-weight: 900; color: #1a1a2e; letter-spacing: 1px;">Delivery Form</div>
            <div style="font-size: 10px; color: #666; margin-top: 2px;">Logistics &amp; Transport Document</div>
        </td>
        <td style="vertical-align: top; text-align: right; width: 40%;">
            <div style="font-size: 14px; font-weight: 700; color: #1a1a2e;">{{ $delivery->delivery_number }}</div>
            <div style="font-size: 9px; color: #888; margin-top: 2px;">Created: {{ \Carbon\Carbon::parse($delivery->created_at)->format('d M Y') }}</div>
            @if($delivery->scheduled_delivery_time)
            <div style="font-size: 9px; color: #888; margin-top: 1px;">Est. Delivery: {{ \Carbon\Carbon::parse($delivery->scheduled_delivery_time)->format('d M Y') }}</div>
            @endif
            <div style="margin-top: 4px;"><span class="status-badge">{{ ucfirst(str_replace('_', ' ', $delivery->status)) }}</span></div>
        </td>
    </tr>
</table>

{{-- ── BARCODE ── --}}
@if($delivery->barcode_value)
<div class="barcode-box">
    {!! DNS1D::getBarcodeHTML($delivery->barcode_value, 'C128', 2, 55, 'black', true) !!}
    <div class="bc-value">{{ $delivery->barcode_value }}</div>
    <div class="bc-hint">Scan to track this delivery</div>
</div>
@endif

{{-- ── CLIENT / DELIVERY ADDRESS — table layout ── --}}
<table width="100%" style="margin-bottom: 12px; border-collapse: collapse;">
    <tr>
        <td style="vertical-align: top; width: 49%; padding-right: 8px;">
            <div class="label">Client / Sender</div>
            <div class="info-box">
                <strong>{{ $delivery->client->company_name ?? $delivery->client_name ?? 'N/A' }}</strong><br>
                @if($delivery->client_address_1)
                    {{ $delivery->client_address_1 }}{{ $delivery->client_address_2 ? ', ' . $delivery->client_address_2 : '' }}<br>
                @elseif($delivery->pickup_address_text)
                    {{ $delivery->pickup_address_text }}<br>
                @endif
                @if($delivery->client_phone) Tel: {{ $delivery->client_phone }}<br> @endif
                @if($delivery->client_fax)   Fax: {{ $delivery->client_fax }} @endif
            </div>
        </td>
        <td style="vertical-align: top; width: 2%;"></td>
        <td style="vertical-align: top; width: 49%; padding-left: 8px;">
            <div class="label">Delivery Address</div>
            <div class="info-box">
                @if($delivery->dest_street)    {{ $delivery->dest_street }}<br> @endif
                @if($delivery->dest_address_2) {{ $delivery->dest_address_2 }}<br> @endif
                @if($delivery->dest_city)
                    {{ $delivery->dest_city }}{{ $delivery->dest_postal_code ? ' — ' . $delivery->dest_postal_code : '' }}<br>
                @elseif(!$delivery->dest_street)
                    {{ $delivery->delivery_address_text ?? 'N/A' }}<br>
                @endif
                @if($delivery->recipient_phone_1) Tel: {{ $delivery->recipient_phone_1 }}<br> @endif
                @if($delivery->recipient_phone_2) Tel 2: {{ $delivery->recipient_phone_2 }} @endif
            </div>
        </td>
    </tr>
</table>

{{-- ── PACKAGE DETAILS / DRIVER — table layout ── --}}
<table width="100%" style="margin-bottom: 12px; border-collapse: collapse;">
    <tr>
        <td style="vertical-align: top; width: 49%; padding-right: 8px;">
            <div class="label">Package Details</div>
            <div class="info-box">
                @if($delivery->item_description) <strong>Description:</strong> {{ $delivery->item_description }}<br> @endif
                @if($delivery->category)         <strong>Category:</strong> {{ $delivery->category }}<br> @endif
                @if($delivery->weight)           <strong>Weight:</strong> {{ $delivery->weight }} kg<br> @endif
                @if($delivery->item_price)       <strong>Declared Value:</strong> {{ number_format($delivery->item_price, 3) }} TND<br> @endif
                <strong>Fragile:</strong>
                @if($delivery->is_fragile) <span class="fragile">YES — HANDLE WITH CARE</span> @else No @endif
            </div>
        </td>
        <td style="vertical-align: top; width: 2%;"></td>
        <td style="vertical-align: top; width: 49%; padding-left: 8px;">
            <div class="label">Assigned Driver</div>
            <div class="info-box">
                @if($delivery->assignedStaff)
                    <strong>{{ ($delivery->assignedStaff->user->first_name ?? '') }} {{ ($delivery->assignedStaff->user->last_name ?? '') }}</strong><br>
                    @if($delivery->assignedStaff->employee_id)   ID: {{ $delivery->assignedStaff->employee_id }}<br> @endif
                    @if($delivery->assignedStaff->user->phone ?? null) Tel: {{ $delivery->assignedStaff->user->phone }}<br> @endif
                @else
                    <em style="color:#aaa;">Not yet assigned</em><br>
                @endif
                @if($delivery->region) Region: <strong>{{ $delivery->region->name }}</strong> @endif
            </div>
        </td>
    </tr>
</table>

{{-- ── ITEMS TABLE ── --}}
<div class="label" style="margin-bottom: 6px;">Items</div>
<table class="data-table">
    <thead>
        <tr>
            <th style="width:6%;">#</th>
            <th style="width:42%;">Description</th>
            <th class="tc" style="width:16%;">Qty</th>
            <th class="tr" style="width:18%;">Unit Price (TND)</th>
            <th class="tr" style="width:18%;">Total (TND)</th>
        </tr>
    </thead>
    <tbody>
        @forelse($delivery->items as $i => $item)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td>{{ $item->item_name }}</td>
            <td class="tc">{{ $item->quantity }} {{ $item->unit ?? 'pcs' }}</td>
            <td class="tr">{{ number_format($item->unit_price, 3) }}</td>
            <td class="tr">{{ number_format($item->total ?? ($item->quantity * $item->unit_price), 3) }}</td>
        </tr>
        @empty
        <tr><td colspan="5" class="tc" style="color:#aaa;font-style:italic;">No items listed</td></tr>
        @endforelse
    </tbody>
    <tfoot>
        <tr>
            <td colspan="4" class="tr" style="color:#555;">Declared Value Total</td>
            <td class="tr">{{ number_format($delivery->items->sum('total') ?: $delivery->item_price, 3) }} TND</td>
        </tr>
    </tfoot>
</table>

{{-- ── SPECIAL INSTRUCTIONS ── --}}
@if($delivery->special_instructions)
<div class="label" style="margin-bottom: 5px;">Special Instructions</div>
<div class="instructions-box">{{ $delivery->special_instructions }}</div>
@endif

{{-- ── SIGNATURES — table layout ── --}}
<div class="label" style="margin-top: 8px; margin-bottom: 7px;">Signatures</div>
<table width="100%" style="border-collapse: collapse;">
    <tr>
        <td style="vertical-align: top; width: 33%; padding-right: 12px;">
            <div class="sig-title">Sender Signature</div>
            <div class="sig-line">Name &amp; Date</div>
        </td>
        <td style="vertical-align: top; width: 33%; padding: 0 12px;">
            <div class="sig-title">Driver Signature</div>
            <div class="sig-line">Name &amp; Date</div>
        </td>
        <td style="vertical-align: top; width: 34%; padding-left: 12px;">
            <div class="sig-title">Recipient Signature</div>
            <div class="sig-line">Name &amp; Date</div>
        </td>
    </tr>
</table>

{{-- ── FOOTER ── --}}
<div class="footer">
    Delivery Form &mdash; {{ $delivery->delivery_number }} &mdash; Generated {{ now()->format('d M Y H:i') }} &mdash; This document is proof of shipment.
</div>

</body>
</html>
