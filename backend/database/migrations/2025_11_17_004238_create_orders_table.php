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
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Customer reference
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            
            // Order Information
            $table->string('order_number')->unique();
            $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])->default('pending');
            $table->bigInteger('total_amount'); // In smallest currency unit (cents)
            $table->string('currency', 3)->default('IDR');
            
            // Order Items (JSON for simplicity, could be separate table)
            $table->json('items');
            
            // Shipping Information
            $table->json('shipping_address')->nullable();
            $table->string('shipping_method')->nullable();
            $table->bigInteger('shipping_cost')->nullable();
            
            // Payment Information
            $table->string('payment_method')->nullable();
            $table->string('payment_status')->default('pending');
            $table->timestamp('payment_date')->nullable();
            
            // Fulfillment
            $table->string('tracking_number')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('customer_id');
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
