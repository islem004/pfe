<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $client = $request->user()->client;

        $merchandiseValue = DB::table('delivery_items as di')
            ->join('deliveries as d', 'di.delivery_id', '=', 'd.id')
            ->where('d.client_id', $client->id)
            ->sum(DB::raw('di.quantity * di.unit_price'));

        if (!$merchandiseValue) {
            $merchandiseValue = Delivery::where('client_id', $client->id)->sum('item_price');
        }

        $stats = [
            'total'             => Delivery::where('client_id', $client->id)->count(),
            'pending'           => Delivery::where('client_id', $client->id)->where('status', 'pending')->count(),
            'in_transit'        => Delivery::where('client_id', $client->id)->where('status', 'in_transit')->count(),
            'delivered'         => Delivery::where('client_id', $client->id)->where('status', 'delivered')->count(),
            'failed'            => Delivery::where('client_id', $client->id)->where('status', 'failed')->count(),
            'merchandise_value' => round((float) $merchandiseValue, 3),
        ];

        // Load all deliveries once for chart computations
        $allDeliveries = Delivery::where('client_id', $client->id)->get();

        // Weekly activity – deliveries created over the last 7 days
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $weeklyActivity[] = [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->format('D'),
                'count' => $allDeliveries->filter(
                    fn($d) => Carbon::parse($d->created_at)->format('Y-m-d') === $date->format('Y-m-d')
                )->count(),
            ];
        }

        // Status distribution
        $byStatus    = $allDeliveries->groupBy('status');
        $allStatuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'];
        $statusDistribution = [];
        foreach ($allStatuses as $status) {
            $count = $byStatus->get($status, collect())->count();
            if ($count > 0) {
                $statusDistribution[] = [
                    'status'     => $status,
                    'count'      => $count,
                    'percentage' => $stats['total'] > 0 ? round(($count / $stats['total']) * 100) : 0,
                ];
            }
        }

        // Insights
        $delivered = $byStatus->get('delivered', collect());
        $avgDays   = null;
        if ($delivered->isNotEmpty()) {
            $sum     = $delivered->sum(
                fn($d) => Carbon::parse($d->created_at)->diffInDays(Carbon::parse($d->updated_at))
            );
            $avgDays = round($sum / $delivered->count(), 1);
        }

        $topCity = $allDeliveries
            ->filter(fn($d) => !empty($d->dest_city))
            ->groupBy('dest_city')
            ->map->count()
            ->sortDesc()
            ->keys()
            ->first();

        $successRate = $stats['total'] > 0 ? round(($stats['delivered'] / $stats['total']) * 100) : 0;

        // Latest 3 active deliveries (in-progress orders only)
        $activeDeliveries = Delivery::where('client_id', $client->id)
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled'])
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get(['id', 'delivery_number', 'status', 'delivery_address_text', 'dest_city', 'created_at']);

        return response()->json([
            'message'             => 'Dashboard stats',
            'stats'               => $stats,
            'weekly_activity'     => $weeklyActivity,
            'status_distribution' => $statusDistribution,
            'insights'            => [
                'avg_delivery_days' => $avgDays,
                'most_used_region'  => $topCity,
                'success_rate'      => $successRate,
            ],
            'active_deliveries'   => $activeDeliveries,
        ]);
    }
}