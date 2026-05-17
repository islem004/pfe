<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #333; }
        .info { margin-bottom: 20px; }
        .barcode { text-align: center; margin: 30px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <h1>Facture N° {{ $invoice->invoice_number }}</h1>

    <div class="info">
        <p><strong>Client :</strong> {{ $commande->client->company_name ?? 'Client inconnu' }}</p>
        <p><strong>Livraison :</strong> {{ $commande->delivery_number }}</p>
        <p><strong>Adresse départ :</strong> {{ $commande->pickup_address_text }}</p>
        <p><strong>Adresse livraison :</strong> {{ $commande->delivery_address_text }}</p>
        <p><strong>Statut :</strong> {{ ucfirst($commande->status) }}</p>
        <p><strong>Date :</strong> {{ $invoice->created_at->format('d/m/Y') }}</p>
        <p><strong>Échéance :</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</p>
    </div>

    <div class="barcode">
        {!! $barcode !!}
        <p><strong>Code-barres :</strong> {{ $commande->barcode_value }}</p>
    </div>

    <h2>Articles</h2>
    <table>
        <thead>
            <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($commande->items as $item)
            <tr>
                <td>{{ $item->item_name }}</td>
                <td>{{ $item->quantity }}</td>
                <td>{{ number_format($item->unit_price, 2) }} TND</td>
                <td>{{ number_format($item->total, 2) }} TND</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total">
        <p>Total : {{ number_format($commande->items->sum('total'), 2) }} TND</p>
    </div>
</body>
</html>