<?php
// app/Http/Controllers/Admin/ClientB2BController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ClientB2BController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Client::with('user')->get());
    }

    public function show($id)
    {
        $client = \App\Models\Client::with('user')->findOrFail($id);
        return response()->json($client);
    }

    public function update(Request $request, $id)
    {
        $client = \App\Models\Client::with('user')->findOrFail($id);

        $request->validate([
            'company_name'   => 'sometimes|required|string|max:255',
            'contact_email'  => 'sometimes|nullable|email|max:255',
            'contact_phone'  => 'sometimes|nullable|string|max:30',
            'billing_address'=> 'sometimes|nullable|string|max:500',
            'tax_id'         => 'sometimes|nullable|string|max:50',
            'is_active'      => 'sometimes|boolean',
        ]);

        $client->update($request->only([
            'company_name', 'contact_email', 'contact_phone',
            'billing_address', 'tax_id', 'is_active',
        ]));

        // Also update the linked user's email/phone if provided
        if ($client->user) {
            $userFields = [];
            if ($request->filled('contact_email'))  $userFields['email'] = $request->contact_email;
            if ($request->filled('contact_phone'))  $userFields['phone'] = $request->contact_phone;
            if (!empty($userFields)) $client->user->update($userFields);
        }

        return response()->json($client->fresh('user'));
    }

    public function destroy($id)
    {
        $client = \App\Models\Client::findOrFail($id);
        $client->delete();
        return response()->json(['message' => 'Client supprimé']);
    }
}
