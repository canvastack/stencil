<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable();

            $table->string('order_number')->unique();
            $table->string('status')->default('new');
            $table->string('payment_status')->default('unpaid');
            $table->string('production_type')->nullable();

            $table->json('items');

            $table->bigInteger('subtotal')->default(0);
            $table->bigInteger('tax')->default(0);
            $table->bigInteger('shipping_cost')->default(0);
            $table->bigInteger('discount')->default(0);
            $table->bigInteger('total_amount')->default(0);
            $table->bigInteger('down_payment_amount')->default(0);
            $table->bigInteger('total_paid_amount')->default(0);
            $table->bigInteger('total_disbursed_amount')->default(0);
            $table->string('currency', 3)->default('IDR');

            $table->json('shipping_address')->nullable();
            $table->json('billing_address')->nullable();
            $table->string('shipping_method')->nullable();

            $table->text('customer_notes')->nullable();
            $table->text('internal_notes')->nullable();

            $table->string('payment_method')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->timestamp('down_payment_due_at')->nullable();
            $table->timestamp('down_payment_paid_at')->nullable();
            $table->timestamp('estimated_delivery')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('tracking_number')->nullable();

            $table->json('payment_schedule')->nullable();
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('customer_id');
            $table->index('vendor_id');
            $table->index('order_number');
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
