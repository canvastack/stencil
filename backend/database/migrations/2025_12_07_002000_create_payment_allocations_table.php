<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_payment_transaction_id')
                  ->constrained('order_payment_transactions')
                  ->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            
            // Allocation types for PT CEX business model
            $table->enum('allocation_type', [
                'customer_dp',      // Customer DP 50%
                'customer_final',   // Customer final payment
                'vendor_dp',        // Vendor DP payment
                'vendor_final',     // Vendor final payment
                'profit_margin',    // Company profit
                'admin_fee',        // Administrative fee
                'tax_withholding',  // Tax withholding
                'other'            // Other allocations
            ]);
            
            // Allocation amounts
            $table->bigInteger('allocated_amount'); // Amount in cents
            $table->decimal('allocated_percentage', 5, 2)->nullable(); // Percentage of total
            $table->string('currency', 3)->default('IDR');
            
            // Description and metadata
            $table->text('description')->nullable();
            $table->json('metadata')->nullable(); // Additional allocation data
            
            // Status tracking
            $table->enum('status', [
                'pending', 'allocated', 'paid', 'cancelled'
            ])->default('pending');
            
            // Related entities
            $table->foreignId('target_vendor_id')->nullable()->constrained('vendors');
            $table->foreignId('target_customer_id')->nullable()->constrained('customers');
            
            // Audit
            $table->foreignId('allocated_by')->constrained('users');
            $table->timestamp('allocated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('uuid');
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'allocation_type']);
            $table->index(['tenant_id', 'status']);
            $table->index('order_payment_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
    }
};