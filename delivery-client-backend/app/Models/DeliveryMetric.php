<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryMetric extends Model
{
    protected $fillable = [
        'staff_id',
        'date',
        'deliveries_assigned',
        'deliveries_completed',
        'deliveries_failed',
        'on_time_deliveries',
        'average_delivery_time_minutes',
        'total_distance_km'
    ];

    protected $casts = [
        'date' => 'date',
        'total_distance_km' => 'decimal:2',
    ];

    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
