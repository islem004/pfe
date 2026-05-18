<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Notification;
use App\Models\ProofOfDelivery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffDeliveryController extends Controller
{
    // Get all assigned deliveries
    public function index(Request $request)
    {
        $staff = $request->user()->staff;

        $deliveries = Delivery::where('assigned_staff_id', $staff->id)
            ->with(['client', 'items', 'statusHistories', 'region'])
            ->latest()
            ->get();

        return response()->json($deliveries);
    }

    // Get single delivery
    public function show(Request $request, $id)
    {
        $staff = $request->user()->staff;

        $delivery = Delivery::where('assigned_staff_id', $staff->id)
            ->with(['client', 'items', 'statusHistories'])
            ->findOrFail($id);

        return response()->json($delivery);
    }

    // Scan barcode and find delivery
    public function scanBarcode(Request $request)
    {
        $request->validate([
            'barcode_value' => 'required|string',
        ]);

        $staff = $request->user()->staff;

        $delivery = Delivery::where('barcode_value', $request->barcode_value)
            ->where('assigned_staff_id', $staff->id)
            ->with(['client', 'items', 'statusHistories'])
            ->first();

        if (!$delivery) {
            return response()->json(['message' => 'Delivery not found or not assigned to you'], 404);
        }

        return response()->json($delivery);
    }

    // Update delivery status
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:created,confirmed,picked_up,shipped,delivered,failed,cancelled',
            'notes'  => 'nullable|string',
        ]);

        $staff = $request->user()->staff;

        $delivery = Delivery::where('assigned_staff_id', $staff->id)
            ->with('client.user')
            ->findOrFail($id);

        $delivery->update(['status' => $request->status]);

        $delivery->statusHistories()->create([
            'status'     => $request->status,
            'updated_by' => $request->user()->id,
            'notes'      => $request->notes ?? 'Status updated by staff',
        ]);

        // Notify the client
        try {
            $client = $delivery->client;
            if ($client && $client->user_id) {
                $statusLabel = match ($request->status) {
                    'created'    => 'Created',
                    'confirmed'  => 'Confirmed & Processed',
                    'picked_up'  => 'Picked Up',
                    'shipped'    => 'Shipped',
                    'delivered'  => 'Delivered Successfully',
                    'failed'     => 'Delivery Failed',
                    'cancelled'  => 'Cancelled',
                    default      => ucfirst(str_replace('_', ' ', $request->status)),
                };

                Notification::create([
                    'user_id'             => $client->user_id,
                    'type'                => 'delivery_update',
                    'title'               => 'Delivery Status Update',
                    'message'             => "Your delivery #{$delivery->delivery_number} is now: {$statusLabel}.",
                    'related_entity_type' => 'delivery',
                    'related_entity_id'   => $delivery->id,
                    'is_read'             => false,
                    'created_at'          => now(),
                ]);
            }
        } catch (\Exception $e) {
            \Log::error("StaffDeliveryController: notification failed for delivery #{$delivery->id}: " . $e->getMessage());
        }

        return response()->json([
            'message'  => 'Status updated successfully',
            'delivery' => $delivery->load('statusHistories'),
        ]);
    }

    // Staff personal statistics
    public function statistics(Request $request)
    {
        $staff = $request->user()->staff;
        $deliveries = Delivery::where('assigned_staff_id', $staff->id)->get();

        $total = $deliveries->count();
        $byStatus = $deliveries->groupBy('status');

        $statuses = ['created', 'confirmed', 'picked_up', 'shipped', 'delivered', 'failed', 'cancelled'];
        $statusDistribution = [];
        foreach ($statuses as $status) {
            $count = $byStatus->has($status) ? $byStatus[$status]->count() : 0;
            if ($count > 0) {
                $statusDistribution[] = [
                    'status'     => $status,
                    'count'      => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100) : 0,
                ];
            }
        }

        // Deliveries completed per day for the last 7 days
        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = $deliveries->filter(fn($d) =>
                $d->status === 'delivered' &&
                \Carbon\Carbon::parse($d->updated_at)->format('Y-m-d') === $date->format('Y-m-d')
            )->count();
            $weeklyActivity[] = [
                'date'  => $date->format('Y-m-d'),
                'label' => $date->format('D'),
                'count' => $count,
            ];
        }

        $recent = $deliveries->sortByDesc('created_at')->take(5)->values()->map(fn($d) => [
            'id'                   => $d->id,
            'delivery_number'      => $d->delivery_number,
            'status'               => $d->status,
            'delivery_address_text'=> $d->delivery_address_text,
            'dest_city'            => $d->dest_city,
            'created_at'           => $d->created_at,
        ]);

        return response()->json([
            'total'               => $total,
            'delivered'           => $byStatus->has('delivered')  ? $byStatus['delivered']->count()  : 0,
            'shipped'             => $byStatus->has('shipped')     ? $byStatus['shipped']->count()    : 0,
            'created'             => $byStatus->has('created')     ? $byStatus['created']->count()    : 0,
            'failed'              => $byStatus->has('failed')      ? $byStatus['failed']->count()     : 0,
            'picked_up'           => $byStatus->has('picked_up')   ? $byStatus['picked_up']->count()  : 0,
            'status_distribution' => $statusDistribution,
            'weekly_activity'     => $weeklyActivity,
            'recent_deliveries'   => $recent,
        ]);
    }

    // Current staff's rank this month vs all other staff
    public function myRank(Request $request)
    {
        $staff      = $request->user()->staff;
        $monthStart = now()->startOfMonth();

        $allStats = DB::table('staff as s')
            ->leftJoin('deliveries as d', function ($j) use ($monthStart) {
                $j->on('d.assigned_staff_id', '=', 's.id')
                  ->where('d.created_at', '>=', $monthStart);
            })
            ->selectRaw("
                s.id,
                COUNT(CASE WHEN d.status = 'delivered' THEN 1 END) as completed,
                COUNT(CASE WHEN d.status = 'failed'    THEN 1 END) as failed
            ")
            ->groupBy('s.id')
            ->get()
            ->map(function ($s) {
                $s->completed    = (int) $s->completed;
                $s->failed       = (int) $s->failed;
                $total           = $s->completed + $s->failed;
                $rate            = $total > 0 ? $s->completed / $total : 0;
                $s->score        = round($s->completed * $rate, 2);
                $s->success_rate = $total > 0 ? round($rate * 100) : 0;
                return $s;
            })
            ->filter(fn ($s) => ($s->completed + $s->failed) > 0)
            ->sortByDesc('score')
            ->values();

        $mine = $allStats->firstWhere('id', $staff->id);

        if (!$mine) {
            return response()->json([
                'rank'         => null,
                'completed'    => 0,
                'failed'       => 0,
                'success_rate' => 0,
                'score'        => 0,
                'total_ranked' => $allStats->count(),
            ]);
        }

        $rank = $allStats->search(fn ($s) => $s->id === $staff->id) + 1;

        return response()->json([
            'rank'         => $rank,
            'completed'    => $mine->completed,
            'failed'       => $mine->failed,
            'success_rate' => $mine->success_rate,
            'score'        => $mine->score,
            'total_ranked' => $allStats->count(),
        ]);
    }

    // Upload proof of delivery
    public function uploadProof(Request $request, $id)
{
    $request->validate([
        'photo'  => 'required|image|max:5048',
        'notes'  => 'nullable|string',
    ]);

    $staff = $request->user()->staff;

    $delivery = Delivery::where('assigned_staff_id', $staff->id)
        ->findOrFail($id);

    $path = $request->file('photo')->store('proofs', 'public');

    $proof = ProofOfDelivery::create([
        'delivery_id'      => $delivery->id,
        'photo_urls'       => [$path],
        'recipient_notes'  => $request->notes,
        'created_by'       => $request->user()->id,
        'created_at'       => now(),
    ]);

    return response()->json([
        'message' => 'Proof uploaded successfully',
        'proof'   => $proof,
    ], 201);
}
}