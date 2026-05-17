<?php
// app/Http/Controllers/Admin/LivreurController.php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class LivreurController extends Controller
{
    /**
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return Response::json(Staff::withCount(['assignedDeliveries as active_deliveries_count' => function ($query) {
                $query->whereIn('status', ['confirmed', 'picked_up', 'in_transit']);
            }])
            ->with('user', 'region')
            ->get());
    }

    /**
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $staff = Staff::with(['user', 'region', 'assignedDeliveries' => function($q) {
            $q->whereNotIn('status', ['delivered', 'cancelled', 'returned'])
              ->with(['client', 'region']);
        }])->findOrFail($id);
        return Response::json($staff);
    }

    /**
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Typically staff is created from a User
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'employee_id' => 'required|string|unique:staff,employee_id',
            'hire_date' => 'nullable|date',
            'region_id' => 'nullable|exists:regions,id',
        ]);

        $staff = Staff::create($validated);
        return Response::json($staff->load('user'), 201);
    }

    /**
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $staff = Staff::with('user')->findOrFail($id);

        $request->validate([
            'region_id'   => 'nullable|exists:regions,id',
            'employee_id' => 'sometimes|required|string|unique:staff,employee_id,' . $id,
            'first_name'  => 'sometimes|string|max:100',
            'last_name'   => 'sometimes|string|max:100',
            'phone'       => 'sometimes|string|max:30',
            'address'     => 'sometimes|nullable|string|max:255',
        ]);

        $staffFields = array_filter($request->only(['region_id', 'employee_id', 'off_days']), fn($v) => !is_null($v));
        if (!empty($staffFields)) {
            $staff->update($staffFields);
        }

        $userFields = array_filter($request->only(['first_name', 'last_name', 'phone', 'address']), fn($v) => !is_null($v));
        if (!empty($userFields) && $staff->user) {
            $staff->user->update($userFields);
        }

        return Response::json($staff->fresh()->load('user', 'region'));
    }

    /**
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $staff = Staff::findOrFail($id);
        $staff->delete();
        return Response::json(['message' => 'Driver deleted']);
    }

    /**
     * @return JsonResponse
     */
    public function getBest(): JsonResponse
    {
        $best = Staff::with('user')
            ->withCount(['assignedDeliveries as successful_deliveries' => function ($query) {
                $query->where('status', 'delivered');
            }])
            ->orderBy('successful_deliveries', 'desc')
            ->first();

        return Response::json($best);
    }
}
