<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'delivery_id',
        'client_id',
        'invoice_date',
        'due_date',
        'status',
        'item_declared_value',
        'base_fee',
        'trajet_fee',
        'weight_fee',
        'fragile_amount',
        'delivery_fee_subtotal',
        'delivery_fee',
        'tva_amount',
        'subtotal',
        'tax_total',
        'discount_total',
        'total',
        'amount_paid',
        'balance_due',
        'payment_date',
        'payment_method',
        'payment_reference',
        'notes',
        'terms',
        'payment_instructions',
        'pdf_url',
        'created_by'
    ];

    protected $casts = [
        'invoice_date'          => 'date',
        'due_date'              => 'date',
        'payment_date'          => 'date',
        'item_declared_value'   => 'decimal:2',
        'base_fee'              => 'decimal:2',
        'trajet_fee'            => 'decimal:2',
        'weight_fee'            => 'decimal:2',
        'fragile_amount'        => 'decimal:2',
        'delivery_fee_subtotal' => 'decimal:2',
        'delivery_fee'          => 'decimal:2',
        'tva_amount'            => 'decimal:2',
        'subtotal'              => 'decimal:2',
        'tax_total'             => 'decimal:2',
        'discount_total'        => 'decimal:2',
        'total'                 => 'decimal:2',
        'amount_paid'           => 'decimal:2',
        'balance_due'           => 'decimal:2',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}