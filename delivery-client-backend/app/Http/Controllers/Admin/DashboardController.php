<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        // ── KPI counts ──────────────────────────────────────────────
        $byStatus = Delivery::selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $total     = (int) $byStatus->sum();
        $pending   = (int) (($byStatus['created']   ?? 0) + ($byStatus['confirmed'] ?? 0));
        $inTransit = (int) (($byStatus['shipped']   ?? 0) + ($byStatus['picked_up'] ?? 0));
        $delivered = (int) ($byStatus['delivered'] ?? 0);

        // ── Trend vs last month ──────────────────────────────────────
        $thisMonth = Delivery::where('created_at', '>=', now()->startOfMonth())->count();
        $lastMonth = Delivery::whereBetween('created_at', [
            now()->subMonth()->startOfMonth(),
            now()->startOfMonth(),
        ])->count();
        $trend = $lastMonth > 0
            ? round((($thisMonth - $lastMonth) / $lastMonth) * 100, 1)
            : null;

        // ── Weekly trend (last 7 days, one row per day) ─────────────
        $rawWeekly = Delivery::selectRaw("TO_CHAR(created_at, 'YYYY-MM-DD') as date, count(*) as count")
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('count', 'date');

        $weeklyTrend = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $weeklyTrend->push(['date' => $date, 'count' => (int) ($rawWeekly[$date] ?? 0)]);
        }

        // ── Unassigned active deliveries (max 5) ────────────────────
        $unassigned = Delivery::with('client.user')
            ->whereNull('assigned_staff_id')
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($d) => [
                'id'              => $d->id,
                'delivery_number' => $d->delivery_number,
                'client_name'     => $d->client?->company_name ?? ($d->client_name ?? 'N/A'),
                'dest_city'       => $d->dest_city ?? ($d->delivery_address_text ?? 'N/A'),
                'status'          => $d->status,
            ]);

        $unassignedTotal = Delivery::whereNull('assigned_staff_id')
            ->whereNotIn('status', ['delivered', 'failed', 'cancelled'])
            ->count();

        // ── Top 3 drivers this week (score = completed × success_rate) ─
        $weekStart = now()->startOfWeek();

        $topDrivers = DB::table('staff as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->leftJoin('deliveries as d', function ($j) use ($weekStart) {
                $j->on('d.assigned_staff_id', '=', 's.id')
                  ->where('d.created_at', '>=', $weekStart);
            })
            ->selectRaw("
                s.id,
                u.first_name,
                u.last_name,
                COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed,
                COUNT(CASE WHEN d.status = 'failed'    THEN 1 END) as failed
            ")
            ->groupBy('s.id', 'u.first_name', 'u.last_name')
            ->get()
            ->map(function ($s) {
                $s->completed = (int) $s->completed;
                $s->failed    = (int) $s->failed;
                $total        = $s->completed + $s->failed;
                $rate         = $total > 0 ? $s->completed / $total : 0;
                $s->score        = round($s->completed * $rate, 2);
                $s->success_rate = $total > 0 ? round($rate * 100) : 0;
                return $s;
            })
            ->filter(fn ($s) => ($s->completed + $s->failed) > 0)
            ->sortByDesc('score')
            ->take(3)
            ->values()
            ->map(function ($s) use ($weekStart) {
                $avgSeconds = DB::table('delivery_status_histories as ph')
                    ->join('delivery_status_histories as dh', function ($j) {
                        $j->on('ph.delivery_id', '=', 'dh.delivery_id')
                          ->where('dh.status', '=', 'delivered');
                    })
                    ->join('deliveries as del', 'ph.delivery_id', '=', 'del.id')
                    ->where('ph.status', 'picked_up')
                    ->where('del.assigned_staff_id', $s->id)
                    ->where('del.created_at', '>=', $weekStart)
                    ->selectRaw('AVG(EXTRACT(EPOCH FROM (dh.updated_at - ph.updated_at))) as avg_seconds')
                    ->value('avg_seconds');

                return [
                    'name'              => trim($s->first_name . ' ' . $s->last_name),
                    'initials'          => strtoupper(substr($s->first_name ?? '?', 0, 1) . substr($s->last_name ?? '', 0, 1)),
                    'completed'         => $s->completed,
                    'failed'            => $s->failed,
                    'success_rate'      => $s->success_rate,
                    'score'             => $s->score,
                    'avg_delivery_time' => $avgSeconds !== null ? round($avgSeconds / 60, 1) : null,
                ];
            });

        // ── Recent activity feed (last 8 events) ────────────────────
        $statusChanges = DB::table('delivery_status_histories as h')
            ->join('deliveries as d', 'h.delivery_id', '=', 'd.id')
            ->leftJoin('clients as c', 'd.client_id', '=', 'c.id')
            ->leftJoin('users as u', 'c.user_id', '=', 'u.id')
            ->select(
                DB::raw("'status_change' as type"),
                'h.status',
                'd.delivery_number',
                DB::raw("COALESCE(c.company_name, CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) as actor"),
                DB::raw('h.updated_at as created_at')
            )
            ->orderBy('h.updated_at', 'desc')
            ->limit(6)
            ->get();

        $newClients = DB::table('clients as c')
            ->join('users as u', 'c.user_id', '=', 'u.id')
            ->select(
                DB::raw("'new_client' as type"),
                DB::raw("NULL as status"),
                DB::raw("NULL as delivery_number"),
                DB::raw("COALESCE(c.company_name, CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,''))) as actor"),
                'c.created_at'
            )
            ->orderBy('c.created_at', 'desc')
            ->limit(4)
            ->get();

        $activity = $statusChanges->concat($newClients)
            ->sortByDesc('created_at')
            ->take(8)
            ->values()
            ->map(fn ($e) => [
                'type'            => $e->type,
                'status'          => $e->status ?? null,
                'delivery_number' => $e->delivery_number ?? null,
                'actor'           => trim($e->actor ?? ''),
                'created_at'      => $e->created_at,
            ]);

        return response()->json([
            'total'            => $total,
            'pending'          => $pending,
            'in_transit'       => $inTransit,
            'delivered'        => $delivered,
            'trend'            => $trend,
            'weekly_trend'     => $weeklyTrend->values(),
            'status_breakdown' => $byStatus,
            'unassigned'       => $unassigned,
            'unassigned_total' => $unassignedTotal,
            'top_drivers'      => $topDrivers,
            'recent_activity'  => $activity,
        ]);
    }
}
