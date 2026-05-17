<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Region;

class Client extends Model
{
    protected $fillable = [
        'user_id',
        'company_name',
        'tax_id',
        'billing_address',
        'shipping_address',
        'region_id',
        'contact_person',
        'contact_email',
        'contact_phone',
        'logo_url',
        'payment_terms',
        'credit_limit',
        'is_active',
        'is_premium',
        'premium_discount_deliveries_left'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function region()
    {
        return $this->belongsTo(Region::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}