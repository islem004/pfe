<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'latitude',
        'longitude'
    ];

    public function pickupDeliveries()
    {
        return $this->hasMany(Delivery::class, 'pickup_address_id');
    }

    public function deliveryDeliveries()
    {
        return $this->hasMany(Delivery::class, 'delivery_address_id');
    }
}