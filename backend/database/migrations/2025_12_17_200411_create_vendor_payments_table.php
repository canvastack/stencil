<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->string('order_id')->nullable();
            $table->string('invoice_number')->unique();
            $table->string('vendor_name');
            $table->text('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->enum('status', ['pending', 'paid', 'overdue', 'scheduled', 'processing'])->default('pending');
            $table->string('payment_method')->nullable();
            $table->json('payment_details')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'vendor_id']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'due_date']);
            $table->index('invoice_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_payments');
    }
};
