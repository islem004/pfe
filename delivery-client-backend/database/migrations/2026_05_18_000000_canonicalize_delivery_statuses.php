<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // pending → created, in_transit → shipped, problem → failed
        foreach (['deliveries', 'delivery_status_histories'] as $table) {
            DB::table($table)->where('status', 'pending')->update(['status' => 'created']);
            DB::table($table)->where('status', 'in_transit')->update(['status' => 'shipped']);
            DB::table($table)->where('status', 'problem')->update(['status' => 'failed']);
        }
    }

    public function down(): void
    {
        foreach (['deliveries', 'delivery_status_histories'] as $table) {
            DB::table($table)->where('status', 'created')->update(['status' => 'pending']);
            DB::table($table)->where('status', 'shipped')->update(['status' => 'in_transit']);
        }
    }
};
