<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_number')->unique();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('assigned_staff_id')->nullable()->constrained('staff')->onDelete('set null');

            // Addresses
            $table->foreignId('pickup_address_id')->nullable()->constrained('addresses')->onDelete('set null');
            $table->foreignId('delivery_address_id')->nullable()->constrained('addresses')->onDelete('set null');
            $table->text('pickup_address_text')->nullable();
            $table->text('delivery_address_text')->nullable();

            // Scheduling
            $table->timestamp('scheduled_pickup_time')->nullable();
            $table->timestamp('scheduled_delivery_time')->nullable();
            $table->timestamp('actual_pickup_time')->nullable();
            $table->timestamp('actual_delivery_time')->nullable();

            // Status
            $table->string('status')->default('draft');
            $table->string('failure_reason')->nullable();

            // Barcode
            $table->string('barcode_value')->unique()->nullable();
            $table->string('barcode_format')->nullable();
            $table->string('barcode_image_url')->nullable();

            // Metadata
            $table->string('priority')->default('normal');
            $table->text('special_instructions')->nullable();
            $table->text('internal_notes')->nullable();

            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};