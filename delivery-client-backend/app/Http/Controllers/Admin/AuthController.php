<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $user = User::where('email', $request->email)->with('roles')->first();

        // Check if user is an admin
        if (!$user->roles()->where('name', 'admin')->exists()) {
            return response()->json(['message' => 'Access denied. Admin role required.'], 403);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account disabled.'], 403);
        }

        $user->update(['last_login' => now()]);
        $token = $user->createToken('admin_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout successful']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }
}
