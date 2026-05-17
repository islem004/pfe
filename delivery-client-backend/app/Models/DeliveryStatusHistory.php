<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryStatusHistory extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'delivery_id',
        'status',
        'previous_status',
        'location_lat',
        'location_lng',
        'location_address',
        'updated_by',
        'updated_at',
        'created_at',
        'notes',
        'problem_type',
        'resolution_notes'
    ];

    protected $casts = [
        'updated_at' => 'datetime',
        'created_at' => 'datetime',
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