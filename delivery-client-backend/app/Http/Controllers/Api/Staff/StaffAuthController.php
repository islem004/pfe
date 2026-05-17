<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StaffAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
            ->with(['staff.region', 'roles'])
            ->first();

        // Check for deleted account before password verification
        if ($user && $user->status === 'deleted') {
            return response()->json([
                'message' => 'This account no longer exists.',
                'error'   => 'account_deleted',
            ], 403);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if (!$user->hasRole('staff')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check for disabled account after credentials are verified
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been disabled. Please contact your administrator.',
                'error'   => 'account_disabled',
            ], 403);
        }

        $user->update(['last_login' => now()]);
        $token = $user->createToken('staff_token')->plainTextToken;

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => 'login',
            'entity_type'=> 'user',
            'entity_id'  => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('staff.region', 'roles'));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}