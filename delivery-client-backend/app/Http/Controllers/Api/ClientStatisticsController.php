<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ClientStatisticsController extends Controller
{
    public function index(Request $request)
    {
        $client = $request->user()->client;
        $range  = $request->input('range', 'all');

        $query = Delivery::where('client_id', $client->id);

        match ($range) {
            'week'  => $query->where('created_at', '>=', now()->subDays(7)),
            'month' => $query->where('created_at', '>=', now()->subDays(30)),
            'year'  => $query->where('created_at', '>=', now()->subDays(365)),
            default => null,
        };

        $deliveries = $query->get();
        $total      = $deliveries->count();
        $byStatus   = $deliveries->groupBy('status');

        $getCount = fn(string $s) => $byStatus->get($s, collect())->count();

        // Status distribution
        $allStatuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'];
        $statusDistribution = [];
        foreach ($allStatuses as $status) {
            $count = $getCount($status);
            if ($count > 0) {
                $statusDistribution[] = [
                    'status'     => $status,
                    'count'      => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100) : 0,
                ];
            }
        }

        // Deliveries created per day for the last 7 days
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $weeklyActivity[] = [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->format('D'),
                'count' => $deliveries->filter(
                    fn($d) => Carbon::parse($d->created_at)->format('Y-m-d') === $date->format('Y-m-d')
                )->count(),
            ];
        }

        // Average delivery time (creation → delivered)
        $delivered = $byStatus->get('delivered', collect());
        $avgDays = null;
        if ($delivered->isNotEmpty()) {
            $sum = $delivered->sum(
                fn($d) => Carbon::parse($d->created_at)->diffInDays(Carbon::parse($d->updated_at))
            );
            $avgDays = round($sum / $delivered->count(), 1);
        }

        // Most-used destination city
        $topCity = $deliveries
            ->filter(fn($d) => !empty($d->dest_city))
            ->groupBy('dest_city')
            ->map->count()
            ->sortDesc()
            ->keys()
            ->first();

        $successRate = $total > 0 ? round(($getCount('delivered') / $total) * 100) : 0;

        // Last 5 deliveries
        $recent = $deliveries->sortByDesc('created_at')->take(5)->values()->map(fn($d) => [
            'id'                    => $d->id,
            'delivery_number'       => $d->delivery_number,
            'status'                => $d->status,
            'delivery_address_text' => $d->delivery_address_text,
            'dest_city'             => $d->dest_city,
            'created_at'            => $d->created_at,
        ]);

        return response()->json([
            'total'               => $total,
            'delivered'           => $getCount('delivered'),
            'in_transit'          => $getCount('in_transit'),
            'pending'             => $getCount('pending'),
            'failed'              => $getCount('failed'),
            'picked_up'           => $getCount('picked_up'),
            'cancelled'           => $getCount('cancelled'),
            'status_distribution' => $statusDistribution,
            'weekly_activity'     => $weeklyActivity,
            'recent_deliveries'   => $recent,
            'insights'            => [
                'avg_delivery_days' => $avgDays,
                'most_used_region'  => $topCity,
                'success_rate'      => $successRate,
            ],
        ]);
    }
}
