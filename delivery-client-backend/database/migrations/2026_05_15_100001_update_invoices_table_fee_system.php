<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop the type column (was 'items' or 'shipping')
            $table->dropColumn('type');

            // New fee breakdown columns
            $table->decimal('item_declared_value', 12, 3)->default(0)->after('balance_due');
            $table->decimal('delivery_fee', 12, 3)->default(0)->after('item_declared_value');
            $table->decimal('tva_amount', 12, 3)->default(0)->after('delivery_fee');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('type')->nullable()->after('client_id');
            $table->dropColumn(['item_declared_value', 'delivery_fee', 'tva_amount']);
        });
    }
};
