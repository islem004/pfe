<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $fillable = [
        'user_id',
        'employee_id',
        'hire_date',
        'is_active',
        'region_id',
        'address',
        'off_days'
    ];

    protected $casts = [
        'off_days' => 'array',
        'hire_date' => 'date',
        'is_active' => 'boolean'
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
        return $this->hasMany(Delivery::class, 'assigned_staff_id');
    }

    public function assignedDeliveries()
    {
        return $this->hasMany(Delivery::class, 'assigned_staff_id');
    }
}