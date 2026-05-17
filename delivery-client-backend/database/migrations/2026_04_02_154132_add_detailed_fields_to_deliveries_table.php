<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            // Client Snapshot
            $table->string('client_name')->nullable();
            $table->string('client_address_1')->nullable();
            $table->string('client_address_2')->nullable();
            $table->string('client_phone')->nullable();
            $table->string('client_fax')->nullable();

            // Package Details
            $table->text('item_description')->nullable();
            $table->string('category')->nullable(); // Vetement, Meuble, etc.
            $table->string('weight')->nullable();
            $table->boolean('is_fragile')->default(false);
            $table->decimal('item_price', 10, 2)->nullable();

            // Destination Detailed Info
            $table->string('recipient_phone_1')->nullable();
            $table->string('recipient_phone_2')->nullable();
            $table->string('dest_city')->nullable();
            $table->string('dest_postal_code')->nullable();
            $table->string('dest_street')->nullable();
            $table->string('dest_address_2')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn([
                'client_name', 'client_address_1', 'client_address_2', 'client_phone', 'client_fax',
                'item_description', 'category', 'weight', 'is_fragile', 'item_price',
                'recipient_phone_1', 'recipient_phone_2', 'dest_city', 'dest_postal_code', 
                'dest_street', 'dest_address_2'
            ]);
        });
    }
};
