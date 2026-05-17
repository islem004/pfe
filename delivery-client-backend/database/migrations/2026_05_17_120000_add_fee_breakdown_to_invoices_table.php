<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'base_fee')) {
                $table->decimal('base_fee', 10, 2)->default(0)->after('item_declared_value');
            }
            if (!Schema::hasColumn('invoices', 'trajet_fee')) {
                $table->decimal('trajet_fee', 10, 2)->default(0)->after('base_fee');
            }
            if (!Schema::hasColumn('invoices', 'weight_fee')) {
                $table->decimal('weight_fee', 10, 2)->default(0)->after('trajet_fee');
            }
            if (!Schema::hasColumn('invoices', 'fragile_amount')) {
                $table->decimal('fragile_amount', 10, 2)->default(0)->after('weight_fee');
            }
            if (!Schema::hasColumn('invoices', 'delivery_fee_subtotal')) {
                $table->decimal('delivery_fee_subtotal', 10, 2)->default(0)->after('fragile_amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(array_filter(
                ['base_fee', 'trajet_fee', 'weight_fee', 'fragile_amount', 'delivery_fee_subtotal'],
                fn($col) => Schema::hasColumn('invoices', $col)
            ));
        });
    }
};
