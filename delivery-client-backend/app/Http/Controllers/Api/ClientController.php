<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function show(Request $request)
    {
        $client = $request->user()->client;

        if (!$client) {
            return response()->json(['message' => 'Client profile not found'], 404);
        }

        return response()->json($client->load('region'));
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            return response()->json(['message' => 'Profil client introuvable'], 404);
        }

        $request->validate([
            'first_name'      => 'sometimes|string|max:255',
            'last_name'       => 'sometimes|string|max:255',
            'phone'           => 'sometimes|nullable|string',
            'company_name'    => 'sometimes|string|max:255',
            'tax_id'          => 'sometimes|nullable|string',
            'billing_address' => 'sometimes|nullable|string',
            'shipping_address'=> 'sometimes|nullable|string',
            'region_id'       => 'sometimes|exists:regions,id',
        ]);

        // Update User info
        $user->update($request->only(['first_name', 'last_name', 'phone']));

        // Update Client info
        $client->update($request->only([
            'company_name',
            'tax_id',
            'billing_address',
            'shipping_address',
            'region_id',
        ]));

        return response()->json([
            'message' => 'Profil mis à jour avec succès',
            'user'    => $user->load('client.region'),
        ]);
    }
}