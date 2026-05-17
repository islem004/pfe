<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained('staff')->onDelete('cascade');
            $table->date('date');
            $table->integer('deliveries_assigned')->default(0);
            $table->integer('deliveries_completed')->default(0);
            $table->integer('deliveries_failed')->default(0);
            $table->integer('on_time_deliveries')->default(0);
            $table->integer('average_delivery_time_minutes')->nullable();
            $table->decimal('total_distance_km', 10, 2)->nullable();
            $table->timestamps();
            
            $table->unique(['staff_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_metrics');
    }
};
