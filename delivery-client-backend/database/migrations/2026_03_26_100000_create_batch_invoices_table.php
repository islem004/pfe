<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->date('batch_date');
            $table->date('period_start');
            $table->date('period_end');
            $table->string('status');
            $table->decimal('total_amount', 10, 2);
            $table->integer('invoice_count');
            $table->string('pdf_url')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('batch_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_invoice_id')->constrained('batch_invoices')->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->unique(['batch_invoice_id', 'invoice_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_invoice_items');
        Schema::dropIfExists('batch_invoices');
    }
};
