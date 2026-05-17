<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Complaint::where('user_id', $request->user()->id)->with('delivery')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'delivery_id' => 'nullable|exists:deliveries,id',
        ]);

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'delivery_id' => $request->delivery_id,
            'subject' => $request->subject,
            'description' => $request->description,
            'status' => 'pending',
        ]);

        // Notify Admins
        $admins = User::whereHas('roles', function($q) {
            $q->where('name', 'admin');
        })->get();

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'new_complaint',
                'title' => 'New Complaint',
                'message' => "New complaint from {$request->user()->first_name}: {$request->subject}",
                'related_entity_type' => 'complaint',
                'related_entity_id' => $complaint->id,
                'created_at' => now(),
            ]);
        }

        return response()->json($complaint, 201);
    }

    public function adminIndex()
    {
        return response()->json(
            Complaint::with(['user', 'delivery'])->latest()->get()
        );
    }

    public function adminUpdate(Request $request, $id)
    {
        $complaint = Complaint::findOrFail($id);

        $request->validate([
            'status' => 'required|in:pending,resolved',
            'admin_response' => 'nullable|string',
        ]);

        $complaint->update($request->only(['status', 'admin_response']));

        // Notify Client
        Notification::create([
            'user_id' => $complaint->user_id,
            'type' => 'complaint_update',
            'title' => 'Complaint Processed',
            'message' => "Your complaint '{$complaint->subject}' has been received and processed. Thank you for your message.",
            'related_entity_type' => 'complaint',
            'related_entity_id' => $complaint->id,
            'created_at' => now(),
        ]);

        return response()->json($complaint);
    }

    public function adminAcknowledge(Request $request, $id)
    {
        \Illuminate\Support\Facades\Log::info('--- ADMIN ACKNOWLEDGE START ---');
        \Illuminate\Support\Facades\Log::info('Target ID: ' . $id);
        
        $complaint = Complaint::findOrFail($id);
        \Illuminate\Support\Facades\Log::info('Found Complaint for User: ' . $complaint->user_id);

        // Update status to 'resolved' to show visible change in client list
        $complaint->update(['status' => 'resolved']);
        \Illuminate\Support\Facades\Log::info('Status updated to resolved');

        // Notify Client with exact message requested
        $notif = Notification::create([
            'user_id' => $complaint->user_id,
            'type' => 'complaint_update',
            'title' => 'Complaint Received',
            'message' => "Your complaint '{$complaint->subject}' has been received, thank you for your message.",
            'related_entity_type' => 'complaint',
            'related_entity_id' => $complaint->id,
            'created_at' => now(),
        ]);
        
        \Illuminate\Support\Facades\Log::info('Notification created ID: ' . $notif->id);

        return response()->json([
            'message' => 'Acknowledgment sent successfully',
            'complaint' => $complaint
        ]);
    }
}
