<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $fillable = ['name', 'base_delivery_fee'];

    protected $casts = [
        'base_delivery_fee' => 'decimal:3',
    ];

    public function staff()
    {
        return $this->hasMany(Staff::class);
    }

    /**
     * Returns the distance tier between two region names.
     * Tiers: same | nearby | medium | long | remote
     */
    public static function tierBetween(string $fromName, string $toName): string
    {
        $from = strtolower(trim($fromName));
        $to   = strtolower(trim($toName));

        if ($from === $to) {
            return 'same';
        }

        $remote = ['tozeur', 'tataouine', 'kebili', 'medenine', 'gafsa'];
        if (in_array($from, $remote) || in_array($to, $remote)) {
            return 'remote';
        }

        $pairs = [
            'nearby' => [
                ['tunis', 'ariana'],
                ['tunis', 'ben arous'],
                ['tunis', 'manouba'],
                ['sousse', 'monastir'],
                ['sousse', 'mahdia'],
                ['sfax', 'mahdia'],
            ],
            'medium' => [
                ['tunis', 'sousse'],
                ['tunis', 'bizerte'],
                ['tunis', 'nabeul'],
                ['tunis', 'zaghouan'],
                ['sousse', 'kairouan'],
            ],
            'long' => [
                ['tunis', 'sfax'],
                ['tunis', 'gabes'],
                ['sousse', 'sfax'],
            ],
        ];

        foreach ($pairs as $tier => $list) {
            foreach ($list as [$a, $b]) {
                if (($from === $a && $to === $b) || ($from === $b && $to === $a)) {
                    return $tier;
                }
            }
        }

        return 'remote';
    }
}
