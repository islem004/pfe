<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Region;
use Illuminate\Http\Request;

class RegionController extends Controller
{
    public function index()
    {
        return response()->json(Region::all());
    }

    public function show($id)
    {
        $region = Region::findOrFail($id);
        return response()->json($region);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:regions,name',
        ]);

        $region = Region::create(['name' => $request->name]);

        return response()->json([
            'message' => 'Region created successfully',
            'region'  => $region,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $region = Region::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:regions,name,' . $id,
        ]);

        $region->update(['name' => $request->name]);

        return response()->json([
            'message' => 'Region updated successfully',
            'region'  => $region,
        ]);
    }

    public function destroy($id)
    {
        $region = Region::findOrFail($id);
        $region->delete();

        return response()->json(['message' => 'Region deleted successfully']);
    }
}
