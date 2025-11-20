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
        Schema::create('payment_refunds', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('original_transaction_id')->constrained('order_payment_transactions')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            
            // Refund identification
            $table->string('refund_reference')->unique();
            $table->string('gateway_refund_id')->nullable(); // Payment gateway refund ID
            
            // Refund details
            $table->enum('type', ['full', 'partial'])->default('partial');
            $table->enum('status', ['pending', 'processing', 'approved', 'rejected', 'completed', 'failed'])->default('pending');
            $table->bigInteger('refund_amount'); // Amount in cents
            $table->bigInteger('original_amount'); // Original transaction amount
            $table->string('currency', 3)->default('IDR');
            
            // Refund method and details
            $table->enum('refund_method', ['original_method', 'bank_transfer', 'cash', 'store_credit', 'manual'])->default('original_method');
            $table->json('refund_details')->nullable(); // Bank account, payment gateway details, etc.
            
            // Business reasons and notes
            $table->enum('reason_category', ['customer_request', 'order_cancellation', 'product_defect', 'shipping_issue', 'duplicate_payment', 'fraud', 'other'])->default('customer_request');
            $table->text('reason');
            $table->text('internal_notes')->nullable();
            $table->json('supporting_documents')->nullable(); // File paths, URLs, etc.
            
            // Approval workflow
            $table->json('approval_workflow')->nullable(); // Who approved, when, etc.
            $table->foreignId('initiated_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Important timestamps
            $table->timestamp('requested_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            // Gateway integration
            $table->json('gateway_response')->nullable(); // Payment gateway API response
            $table->string('gateway_error_code')->nullable();
            $table->text('gateway_error_message')->nullable();
            
            // Financial tracking
            $table->bigInteger('fee_amount')->default(0); // Refund processing fees
            $table->bigInteger('net_refund_amount')->storedAs('refund_amount - fee_amount'); // Calculated field
            
            // Business intelligence
            $table->boolean('is_disputed')->default(false);
            $table->boolean('affects_vendor_payment')->default(false);
            $table->json('impact_analysis')->nullable(); // Business impact data
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('order_id');
            $table->index('customer_id');
            $table->index('vendor_id');
            $table->index('original_transaction_id');
            $table->index('refund_reference');
            $table->index('gateway_refund_id');
            $table->index('status');
            $table->index('type');
            $table->index('reason_category');
            $table->index('requested_at');
            $table->index('created_at');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'reason_category']);
            $table->index(['order_id', 'status']);
            $table->index(['customer_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_refunds');
    }
};