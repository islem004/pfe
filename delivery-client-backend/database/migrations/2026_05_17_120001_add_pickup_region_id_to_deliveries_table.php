<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'pickup_region_id')) {
                $table->unsignedBigInteger('pickup_region_id')->nullable()->after('region_id');
                $table->foreign('pickup_region_id')->references('id')->on('regions')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            if (Schema::hasColumn('deliveries', 'pickup_region_id')) {
                $table->dropForeign(['pickup_region_id']);
                $table->dropColumn('pickup_region_id');
            }
        });
    }
};
