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
        // Note: Using string columns with enum validation at model level
        // Laravel/Eloquent doesn't support custom PostgreSQL enums well with migrations

        // Refund Requests table
        Schema::create('refund_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->bigInteger('tenant_id')->unsigned(); // Match tenants.id type
            $table->bigInteger('order_id')->unsigned(); // Match orders.id type
            $table->string('request_number', 50)->unique();
            
            // Request Details
            $table->string('refund_reason'); // customer_request, quality_issue, timeline_delay, vendor_failure, production_error, shipping_damage, other
            $table->string('refund_type'); // full_refund, partial_refund, replacement_order, credit_note
            $table->decimal('customer_request_amount', 12, 2)->nullable();
            $table->integer('quality_issue_percentage')->default(100); // Percentage for partial quality issues
            $table->integer('delay_days')->nullable(); // Days of delay for timeline_delay refunds
            $table->json('evidence_documents')->nullable();
            $table->text('customer_notes')->nullable();
            
            // Status & Workflow  
            $table->string('status')->default('pending_review'); // pending_review, under_investigation, pending_finance, pending_manager, approved, processing, completed, rejected, disputed, cancelled
            $table->bigInteger('current_approver_id')->unsigned()->nullable(); // Match users.id type
            
            // Financial Calculation
            $table->json('calculation');
            
            // Audit fields
            $table->bigInteger('requested_by')->unsigned(); // Match users.id type
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('current_approver_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('requested_by')->references('id')->on('users');
            
            // Indexes
            $table->index(['tenant_id', 'status']);
            $table->index(['order_id']);
            $table->index(['request_number']);
        });

        // Refund Approvals table
        Schema::create('refund_approvals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('refund_request_id');
            $table->bigInteger('tenant_id')->unsigned();
            $table->bigInteger('approver_id')->unsigned(); // Match users.id type
            $table->integer('approval_level');
            
            // Decision
            $table->string('decision'); // approved, rejected, needs_info
            $table->text('decision_notes')->nullable();
            $table->timestamp('decided_at')->useCurrent();
            
            // Financial Review (for finance level)
            $table->json('reviewed_calculation')->nullable();
            $table->decimal('adjusted_amount', 12, 2)->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('refund_request_id')->references('id')->on('refund_requests')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants');
            $table->foreign('approver_id')->references('id')->on('users');
            
            // Indexes
            $table->index(['refund_request_id', 'approval_level']);
            $table->index('tenant_id');
        });

        // Insurance Fund Transactions table
        Schema::create('insurance_fund_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->bigInteger('tenant_id')->unsigned(); // Match tenants.id type
            $table->bigInteger('order_id')->unsigned()->nullable(); // Match orders.id type
            $table->uuid('refund_request_id')->nullable();
            
            // Transaction Details
            $table->string('transaction_type'); // contribution, withdrawal
            $table->decimal('amount', 12, 2);
            $table->text('description');
            
            // Balance Tracking
            $table->decimal('balance_before', 12, 2);
            $table->decimal('balance_after', 12, 2);
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('refund_request_id')->references('id')->on('refund_requests')->onDelete('set null');
            
            // Indexes
            $table->index(['tenant_id', 'transaction_type']);
            $table->index(['created_at']);
        });

        // Refund Disputes table
        Schema::create('refund_disputes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('refund_request_id');
            $table->bigInteger('tenant_id')->unsigned(); // Match tenants.id type
            
            // Dispute Details
            $table->string('dispute_reason'); // refund_amount, liability_party, calculation_error, evidence_dispute, timeline_dispute
            $table->text('customer_claim');
            $table->json('evidence_customer')->nullable();
            
            // Company Response
            $table->text('company_response')->nullable();
            $table->json('evidence_company')->nullable();
            
            // Resolution
            $table->string('status')->default('open'); // open, under_review, mediation, resolved, escalated
            $table->text('resolution_notes')->nullable();
            $table->decimal('final_refund_amount', 12, 2)->nullable();
            
            // Mediator (if external mediation needed)
            $table->text('mediator_contact')->nullable();
            $table->decimal('mediation_cost', 10, 2)->nullable();
            
            $table->timestamps();
            $table->timestamp('resolved_at')->nullable();
            
            // Foreign keys
            $table->foreign('refund_request_id')->references('id')->on('refund_requests')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            
            // Indexes
            $table->index(['tenant_id', 'status']);
            $table->index(['refund_request_id']);
        });

        // Vendor Liability table
        Schema::create('vendor_liabilities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->bigInteger('tenant_id')->unsigned(); // Match tenants.id type
            $table->bigInteger('vendor_id')->unsigned(); // Match vendors.id type
            $table->bigInteger('order_id')->unsigned(); // Match orders.id type
            $table->uuid('refund_request_id')->nullable();
            
            // Liability Details
            $table->decimal('liability_amount', 12, 2);
            $table->text('reason');
            $table->enum('status', ['pending_claim', 'claimed', 'recovered', 'written_off'])->default('pending_claim');
            
            // Recovery Tracking
            $table->timestamp('claim_date')->nullable();
            $table->timestamp('recovery_date')->nullable();
            $table->decimal('recovered_amount', 12, 2)->nullable();
            $table->text('recovery_notes')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('vendor_id')->references('id')->on('vendors')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('refund_request_id')->references('id')->on('refund_requests')->onDelete('set null');
            
            // Indexes
            $table->index(['tenant_id', 'vendor_id']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_liabilities');
        Schema::dropIfExists('refund_disputes');
        Schema::dropIfExists('insurance_fund_transactions');
        Schema::dropIfExists('refund_approvals');
        Schema::dropIfExists('refund_requests');
        
        // No custom enums to drop (using string fields)
    }
};