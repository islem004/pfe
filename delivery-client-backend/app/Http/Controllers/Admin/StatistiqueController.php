<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatistiqueController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────

    private function applyRange($query, string $range)
    {
        return match ($range) {
            'week'  => $query->where('created_at', '>=', now()->startOfWeek()),
            'month' => $query->where('created_at', '>=', now()->startOfMonth()),
            'year'  => $query->where('created_at', '>=', now()->startOfYear()),
            default => $query,
        };
    }

    private function prevRange(string $range): ?array
    {
        return match ($range) {
            'week'  => [now()->subWeek()->startOfWeek(),  now()->startOfWeek()],
            'month' => [now()->subMonth()->startOfMonth(), now()->startOfMonth()],
            'year'  => [now()->subYear()->startOfYear(),   now()->startOfYear()],
            default => null,
        };
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques  — KPI overview
    // ─────────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $range = $request->input('range', 'all');

        $byStatus = $this->applyRange(Delivery::query(), $range)
            ->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $total       = (int) $byStatus->sum();
        $delivered   = (int) ($byStatus['delivered'] ?? 0);
        $failed      = (int) ($byStatus['failed']    ?? 0);
        $cancelled   = (int) ($byStatus['cancelled'] ?? 0);
        $successRate = $total > 0 ? round(($delivered / $total) * 100, 1) : 0;

        $revenue = (float) $this->applyRange(Invoice::query(), $range)->sum('delivery_fee');

        $prev         = $this->prevRange($range);
        $prevTotal    = 0;
        $prevDelivered = 0;
        $prevRevenue  = 0.0;

        if ($prev) {
            $prevTotal     = Delivery::whereBetween('created_at', $prev)->count();
            $prevDelivered = Delivery::whereBetween('created_at', $prev)->where('status', 'delivered')->count();
            $prevRevenue   = (float) Invoice::whereBetween('created_at', $prev)->sum('delivery_fee');
        }

        $prevRate = $prevTotal > 0 ? round(($prevDelivered / $prevTotal) * 100, 1) : 0;

        $activeClients = Client::count();
        $newThisMonth  = Client::where('created_at', '>=', now()->startOfMonth())->count();
        $newPrevMonth  = Client::whereBetween('created_at', [
            now()->subMonth()->startOfMonth(),
            now()->startOfMonth(),
        ])->count();

        return response()->json([
            'total'          => $total,
            'total_trend'    => $prevTotal > 0 ? round((($total - $prevTotal) / $prevTotal) * 100, 1) : null,
            'delivered'      => $delivered,
            'failed'         => $failed,
            'cancelled'      => $cancelled,
            'success_rate'   => $successRate,
            'rate_trend'     => $prev !== null ? round($successRate - $prevRate, 1) : null,
            'revenue'        => round($revenue, 3),
            'revenue_trend'  => $prevRevenue > 0 ? round((($revenue - $prevRevenue) / $prevRevenue) * 100, 1) : null,
            'active_clients' => $activeClients,
            'new_clients'    => $newThisMonth,
            'clients_trend'  => $newPrevMonth > 0 ? round((($newThisMonth - $newPrevMonth) / $newPrevMonth) * 100, 1) : null,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/success-rates  — donut chart
    // ─────────────────────────────────────────────────────────────
    public function successRates(Request $request)
    {
        $range    = $request->input('range', 'month');
        $regionId = $request->input('region_id');

        $query = Delivery::query();
        if ($regionId) {
            $query->where('region_id', $regionId);
        }
        $this->applyRange($query, $range);

        $stats = $query->selectRaw('status, count(*) as cnt')
            ->groupBy('status')
            ->pluck('cnt', 'status');

        $total = (int) $stats->sum();

        $statuses = [
            'pending'    => 'Pending',
            'confirmed'  => 'Confirmed',
            'in_transit' => 'In Transit',
            'picked_up'  => 'Picked Up',
            'delivered'  => 'Delivered',
            'failed'     => 'Failed',
            'cancelled'  => 'Cancelled',
        ];

        $result = [];
        foreach ($statuses as $key => $label) {
            $count = (int) ($stats[$key] ?? 0);
            if ($count > 0) {
                $result[] = [
                    'name'    => $label,
                    'value'   => $count,
                    'percent' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                ];
            }
        }

        return response()->json($result ?: [['name' => 'No Data', 'value' => 1, 'percent' => 100]]);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/volume  — stacked daily bar chart
    // ─────────────────────────────────────────────────────────────
    public function volumeStats(Request $request)
    {
        $range    = $request->input('range', 'month');
        $regionId = $request->input('region_id');

        $query = Delivery::query();
        if ($regionId) {
            $query->where('region_id', $regionId);
        }

        $since = match ($range) {
            'week'  => now()->subDays(7),
            'year'  => now()->subDays(365),
            default => now()->subDays(30),
        };
        $query->where('created_at', '>=', $since);

        $rows = $query
            ->selectRaw("TO_CHAR(created_at, 'YYYY-MM-DD') as date, status, count(*) as cnt")
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get();

        $grouped = $rows->groupBy('date')->map(fn ($g) => [
            'date'       => $g->first()->date,
            'delivered'  => (int) $g->where('status', 'delivered')->sum('cnt'),
            'in_transit' => (int) $g->whereIn('status', ['in_transit', 'picked_up'])->sum('cnt'),
            'pending'    => (int) $g->whereIn('status', ['pending', 'confirmed'])->sum('cnt'),
            'failed'     => (int) $g->whereIn('status', ['failed', 'cancelled'])->sum('cnt'),
        ])->values();

        return response()->json($grouped);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/evolution  — area chart (count + revenue)
    // ─────────────────────────────────────────────────────────────
    public function evolutionStats(Request $request)
    {
        $view = $request->input('view', 'month');

        if ($view === 'week') {
            $deliveries = Delivery::selectRaw("TO_CHAR(created_at, '\"Week\" IW (IYYY)') as label, count(*) as count")
                ->where('created_at', '>=', now()->subWeeks(8))
                ->groupBy('label')->orderBy('label')->get();

            $revenue = Invoice::selectRaw("TO_CHAR(created_at, '\"Week\" IW (IYYY)') as label, SUM(delivery_fee) as revenue")
                ->where('created_at', '>=', now()->subWeeks(8))
                ->groupBy('label')->pluck('revenue', 'label');
        } else {
            $deliveries = Delivery::selectRaw("TO_CHAR(created_at, 'YYYY-MM') as label, count(*) as count")
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('label')->orderBy('label')->get();

            $revenue = Invoice::selectRaw("TO_CHAR(created_at, 'YYYY-MM') as label, SUM(delivery_fee) as revenue")
                ->where('created_at', '>=', now()->subMonths(12))
                ->groupBy('label')->pluck('revenue', 'label');
        }

        return response()->json($deliveries->map(fn ($d) => [
            'label'   => $d->label,
            'count'   => (int) $d->count,
            'revenue' => round((float) ($revenue[$d->label] ?? 0), 3),
        ]));
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/by-region  — horizontal bar
    // ─────────────────────────────────────────────────────────────
    public function byRegion()
    {
        $data = DB::table('deliveries')
            ->join('regions', 'deliveries.region_id', '=', 'regions.id')
            ->selectRaw('regions.name, COUNT(deliveries.id) as count')
            ->groupBy('regions.id', 'regions.name')
            ->orderByDesc('count')
            ->get();

        return response()->json($data);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/staff-leaderboard  — top 5 drivers this month
    // ─────────────────────────────────────────────────────────────
    public function staffLeaderboard()
    {
        $monthStart = now()->startOfMonth();

        $driverStats = DB::table('staff as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->leftJoin('deliveries as d', function ($j) use ($monthStart) {
                $j->on('d.assigned_staff_id', '=', 's.id')
                  ->where('d.created_at', '>=', $monthStart);
            })
            ->selectRaw("
                s.id,
                s.employee_id,
                u.first_name,
                u.last_name,
                COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed,
                COUNT(CASE WHEN d.status = 'failed'    THEN 1 END) as failed
            ")
            ->groupBy('s.id', 's.employee_id', 'u.first_name', 'u.last_name')
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
            ->take(5)
            ->values();

        $result = $driverStats->map(function ($s) use ($monthStart) {
            $avgSeconds = DB::table('delivery_status_histories as ph')
                ->join('delivery_status_histories as dh', function ($j) {
                    $j->on('ph.delivery_id', '=', 'dh.delivery_id')
                      ->where('dh.status', '=', 'delivered');
                })
                ->join('deliveries as del', 'ph.delivery_id', '=', 'del.id')
                ->where('ph.status', 'picked_up')
                ->where('del.assigned_staff_id', $s->id)
                ->where('del.created_at', '>=', $monthStart)
                ->selectRaw('AVG(EXTRACT(EPOCH FROM (dh.updated_at - ph.updated_at))) as avg_seconds')
                ->value('avg_seconds');

            return [
                'name'              => trim($s->first_name . ' ' . $s->last_name),
                'initials'          => strtoupper(substr($s->first_name ?? '?', 0, 1) . substr($s->last_name ?? '', 0, 1)),
                'employee_id'       => $s->employee_id,
                'completed'         => $s->completed,
                'failed'            => $s->failed,
                'success_rate'      => $s->success_rate,
                'score'             => $s->score,
                'avg_delivery_time' => $avgSeconds !== null ? round($avgSeconds / 60, 1) : null,
            ];
        });

        return response()->json($result);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/meilleur-livreur-mois
    // ─────────────────────────────────────────────────────────────
    public function meilleurLivreurDuMois()
    {
        $monthStart = now()->startOfMonth();

        $best = DB::table('staff as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->leftJoin('deliveries as d', function ($j) use ($monthStart) {
                $j->on('d.assigned_staff_id', '=', 's.id')
                  ->where('d.created_at', '>=', $monthStart);
            })
            ->selectRaw("
                s.id,
                s.employee_id,
                u.first_name,
                u.last_name,
                COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed,
                COUNT(CASE WHEN d.status = 'failed'    THEN 1 END) as failed
            ")
            ->groupBy('s.id', 's.employee_id', 'u.first_name', 'u.last_name')
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
            ->first();

        if (!$best) {
            return response()->json(null);
        }

        $avgSeconds = DB::table('delivery_status_histories as ph')
            ->join('delivery_status_histories as dh', function ($j) {
                $j->on('ph.delivery_id', '=', 'dh.delivery_id')
                  ->where('dh.status', '=', 'delivered');
            })
            ->join('deliveries as del', 'ph.delivery_id', '=', 'del.id')
            ->where('ph.status', 'picked_up')
            ->where('del.assigned_staff_id', $best->id)
            ->where('del.created_at', '>=', $monthStart)
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (dh.updated_at - ph.updated_at))) as avg_seconds')
            ->value('avg_seconds');

        return response()->json([
            'name'              => trim($best->first_name . ' ' . $best->last_name),
            'initials'          => strtoupper(substr($best->first_name ?? '?', 0, 1) . substr($best->last_name ?? '', 0, 1)),
            'employee_id'       => $best->employee_id,
            'completed'         => $best->completed,
            'failed'            => $best->failed,
            'success_rate'      => $best->success_rate,
            'score'             => $best->score,
            'avg_delivery_time' => $avgSeconds !== null ? round($avgSeconds / 60, 1) : null,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/meilleur-livreur-region
    // ─────────────────────────────────────────────────────────────
    public function meilleurLivreurParRegion()
    {
        $regions = Region::all();
        $results = [];

        foreach ($regions as $region) {
            $best = Staff::with('user')
                ->where('region_id', $region->id)
                ->join('deliveries', 'staff.id', '=', 'deliveries.assigned_staff_id')
                ->where('deliveries.status', 'delivered')
                ->whereMonth('deliveries.created_at', now()->month)
                ->whereYear('deliveries.created_at', now()->year)
                ->select('staff.*', DB::raw('COUNT(deliveries.id) as total_delivered'))
                ->groupBy('staff.id')
                ->orderByDesc('total_delivered')
                ->first();

            $results[] = [
                'region'  => $region->name,
                'livreur' => $best ? [
                    'name'            => trim($best->user->first_name . ' ' . $best->user->last_name),
                    'total_delivered' => $best->total_delivered,
                ] : null,
            ];
        }

        return response()->json($results);
    }

    // ─────────────────────────────────────────────────────────────
    //  GET /api/admin/statistiques/recent  — last 10 deliveries
    // ─────────────────────────────────────────────────────────────
    public function recentDeliveries()
    {
        $data = Delivery::with(['client.user', 'assignedStaff.user', 'region'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($d) => [
                'id'              => $d->id,
                'delivery_number' => $d->delivery_number,
                'client'          => $d->client?->company_name ?? $d->client_name ?? 'N/A',
                'status'          => $d->status,
                'staff'           => $d->assignedStaff?->user
                    ? trim($d->assignedStaff->user->first_name . ' ' . $d->assignedStaff->user->last_name)
                    : null,
                'region'     => $d->region?->name ?? 'N/A',
                'created_at' => $d->created_at,
            ]);

        return response()->json($data);
    }
}
