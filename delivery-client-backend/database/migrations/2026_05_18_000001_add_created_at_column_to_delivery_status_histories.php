<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_status_histories', function (Blueprint $table) {
            $table->timestamp('created_at')->nullable()->after('id');
        });

        // Backfill: use updated_at value for existing rows
        DB::statement('UPDATE delivery_status_histories SET created_at = updated_at WHERE created_at IS NULL');
    }

    public function down(): void
    {
        Schema::table('delivery_status_histories', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};
