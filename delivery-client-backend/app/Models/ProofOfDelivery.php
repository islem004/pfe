<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProofOfDelivery extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'delivery_id',
        'signature_image_url',
        'signature_name',
        'signature_date',
        'photo_urls',
        'recipient_name',
        'recipient_relationship',
        'recipient_notes',
        'created_at',
        'created_by'
    ];

    protected $casts = [
        'photo_urls' => 'array',
        'signature_date' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}