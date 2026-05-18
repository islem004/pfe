<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureClientApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Only gate client accounts — admins and staff are unaffected
        if (!$user->hasRole('client')) {
            return $next($request);
        }

        if ($user->status === 'pending') {
            return response()->json([
                'message' => 'Your account is pending admin approval. You\'ll be able to log in once an admin approves it.',
                'error'   => 'account_pending',
            ], 403);
        }

        if ($user->status === 'rejected') {
            return response()->json([
                'message' => 'Your account has been rejected. Contact support for more information.',
                'error'   => 'account_rejected',
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account has been disabled. Please contact support.',
                'error'   => 'account_disabled',
            ], 403);
        }

        return $next($request);
    }
}
