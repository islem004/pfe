<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proof_of_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_id')->constrained('deliveries')->onDelete('cascade');

            // Signature
            $table->string('signature_image_url')->nullable();
            $table->string('signature_name')->nullable();
            $table->timestamp('signature_date')->nullable();

            // Photos
            $table->json('photo_urls')->nullable();

            // Recipient info
            $table->string('recipient_name')->nullable();
            $table->string('recipient_relationship')->nullable();
            $table->text('recipient_notes')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proof_of_deliveries');
    }
};