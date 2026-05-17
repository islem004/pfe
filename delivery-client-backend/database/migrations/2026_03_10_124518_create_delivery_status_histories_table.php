<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries')->onDelete('cascade');
            $table->string('status');
            $table->string('previous_status')->nullable();

            // Location tracking
            $table->decimal('location_lat', 10, 8)->nullable();
            $table->decimal('location_lng', 11, 8)->nullable();
            $table->text('location_address')->nullable();

            // Details
            $table->foreignId('updated_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('updated_at')->useCurrent();
            $table->text('notes')->nullable();

            // For failed/problem deliveries
            $table->string('problem_type')->nullable();
            $table->text('resolution_notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_status_histories');
    }
};