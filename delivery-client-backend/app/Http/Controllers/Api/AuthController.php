<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\AuditLog;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'phone'        => 'required|string|max:30',
            'phone2'       => 'required|string|max:30',
            'email'        => 'required|string|email|unique:users',
            'address'      => 'required|string|max:500',
            'address2'     => 'nullable|string|max:500',
            'region_id'    => 'required|exists:regions,id',
            'tax_id'       => 'required|string|max:100',
            'password'     => 'required|string|min:8|confirmed',
        ]);

        // Derive a display name from company name
        $nameParts = explode(' ', trim($request->company_name), 2);
        $firstName = $nameParts[0];
        $lastName  = $nameParts[1] ?? $nameParts[0];

        // Create user
        $user = User::create([
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'phone'      => $request->phone,
            'is_active'  => true,
        ]);

        // Assign client role
        $clientRole = Role::where('name', 'client')->first();
        if ($clientRole) {
            $user->roles()->attach($clientRole->id, [
                'assigned_at' => now(),
            ]);
        }

        // Create client profile
        Client::create([
            'user_id'          => $user->id,
            'company_name'     => $request->company_name,
            'tax_id'           => $request->tax_id,
            'billing_address'  => $request->address,
            'shipping_address' => $request->address2,
            'region_id'        => $request->region_id,
            'contact_email'    => $request->email,
            'contact_phone'    => $request->phone2 ?? $request->phone,
            'is_active'        => true,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token'   => $token,
            'user'    => $user->load('client'),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Check for deleted account before password verification
        $userCheck = User::where('email', $request->email)->first();
        if ($userCheck && $userCheck->status === 'deleted') {
            return response()->json([
                'message' => 'This account no longer exists.',
                'error'   => 'account_deleted',
            ], 403);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $user = User::where('email', $request->email)->with('client', 'roles')->first();

        // Check for disabled account after credentials are verified
        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been disabled. Please contact support.',
                'error'   => 'account_disabled',
            ], 403);
        }

        $user->update(['last_login' => now()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id'    => $user->id,
            'action'     => 'login',
            'entity_type'=> 'user',
            'entity_id'  => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        $role = $user->roles->first()?->name ?? 'client';

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $user,
            'role'    => $role,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('client', 'roles'));
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
                'errors' => ['current_password' => ['Current password is incorrect.']]
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'phone'       => 'nullable|string',
            'avatar'      => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $data = $request->only(['first_name', 'last_name', 'phone']);

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user->load('client', 'roles'),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'No account found with this email.'], 404);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}