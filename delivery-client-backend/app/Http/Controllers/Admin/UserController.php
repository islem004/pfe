<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Mail\AccountActivatedMail;

class UserController extends Controller
{
    public function index()
    {
        // Exclude admins from the client management list
        return response()->json(
            User::whereDoesntHave('roles', function ($query) {
                $query->where('name', 'admin');
            })->with(['client' => function($q) { $q->with('region')->withCount('deliveries'); }, 'staff.region', 'roles'])->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'nullable|string',
            'last_name' => 'nullable|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
            'role' => 'required|in:client,staff',
            'company_name' => 'required_if:role,client',
            'tax_id' => 'required_if:role,client',
            'region_id' => 'required_if:role,staff|exists:regions,id',
            'phone' => 'nullable|string',
            'phone2' => 'nullable|string',
            'address' => 'nullable|string',
            'address2' => 'nullable|string',
            'off_days' => 'nullable|array',
        ]);

        $firstName = $request->first_name;
        $lastName = $request->last_name;

        if ($request->role === 'client' && (!$firstName || !$lastName)) {
            $nameParts = explode(' ', trim($request->company_name), 2);
            $firstName = $firstName ?? $nameParts[0];
            $lastName = $lastName ?? ($nameParts[1] ?? $nameParts[0]);
        }

        $user = User::create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'status' => 'active',
            'is_active' => true,
        ]);

        $user->assignRole($request->role);

        if ($request->role === 'client') {
            \App\Models\Client::create([
                'user_id' => $user->id,
                'company_name' => $request->company_name,
                'tax_id' => $request->tax_id,
                'billing_address' => $request->address,
                'shipping_address' => $request->address2,
                'contact_phone' => $request->phone,
                'contact_email' => $request->email,
                'is_active' => true,
            ]);
        } else {
            \App\Models\Staff::create([
                'user_id' => $user->id,
                'employee_id' => 'STF-' . strtoupper(Str::random(6)),
                'hire_date' => now(),
                'region_id' => $request->region_id,
                'address' => $request->address,
                'off_days' => $request->off_days,
                'is_active' => true,
            ]);
        }

        return response()->json($user->load('client', 'staff'), 201);
    }

    public function pending()
    {
        return response()->json(
            User::where('status', 'pending')
                ->whereDoesntHave('roles', function ($query) {
                    $query->where('name', 'admin');
                })
                ->with(['client.region'])->latest()->get()
        );
    }

    public function approve($id)
    {
        $user = User::findOrFail($id);

        $user->update([
            'status'             => 'active',
            'is_active'          => true,
            'email_verified_at'  => now(),
            'verification_code'  => null,
        ]);

        // TODO: send approval notification email to client once email service is configured.

        return response()->json([
            'message' => "Account approved. {$user->email} can now log in.",
            'user'    => $user->load('client'),
        ]);
    }

    public function reject($id)
    {
        $user = User::findOrFail($id);

        $user->update([
            'status'    => 'rejected',
            'is_active' => false,
        ]);

        // TODO: send rejection notification email to client once email service is configured.

        return response()->json([
            'message' => "Account rejected.",
            'user'    => $user->load('client'),
        ]);
    }

    public function disable($id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => false]);

        return response()->json([
            'message' => "User $id disabled"
        ]);
    }

    public function enable($id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true, 'status' => 'active']);

        return response()->json([
            'message' => "User $id reactivated"
        ]);
    }

    public function delete($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'message' => "User $id deleted"
        ]);
    }

    public function activity($id)
    {
        User::findOrFail($id);

        $logs = AuditLog::where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($logs);
    }
}
