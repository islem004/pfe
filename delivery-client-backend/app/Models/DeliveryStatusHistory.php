<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryStatusHistory extends Model
{
    protected $fillable = [
        'delivery_id',
        'status',
        'previous_status',
        'location_lat',
        'location_lng',
        'location_address',
        'updated_by',
        'notes',
        'problem_type',
        'resolution_notes'
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}