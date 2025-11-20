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
        Schema::create('refund_approval_workflows', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('payment_refund_id')->constrained('payment_refunds')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            
            // Workflow configuration
            $table->string('workflow_name')->default('standard_refund_approval');
            $table->integer('step_number');
            $table->integer('total_steps');
            $table->boolean('is_current_step')->default(false);
            $table->boolean('is_completed')->default(false);
            
            // Step details
            $table->string('step_name'); // e.g., 'manager_approval', 'finance_approval', 'final_approval'
            $table->text('step_description')->nullable();
            $table->enum('step_type', ['approval', 'review', 'notification', 'processing'])->default('approval');
            $table->enum('approval_level', ['low', 'medium', 'high', 'critical'])->default('medium');
            
            // Assigned approver
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('role_required')->nullable()->constrained('roles')->nullOnDelete(); // Alternative to specific user
            $table->json('permission_requirements')->nullable(); // Required permissions
            
            // Approval decision
            $table->enum('decision', ['pending', 'approved', 'rejected', 'escalated', 'skipped'])->default('pending');
            $table->text('decision_reason')->nullable();
            $table->json('decision_metadata')->nullable(); // Additional decision data
            
            // Decision maker
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->string('decision_ip_address')->nullable();
            $table->text('decision_user_agent')->nullable();
            
            // Timing and SLA
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->integer('sla_hours')->default(24); // SLA in hours
            $table->boolean('is_overdue')->default(false);
            $table->boolean('sla_breached')->default(false);
            
            // Escalation
            $table->boolean('can_be_escalated')->default(true);
            $table->foreignId('escalated_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('escalated_at')->nullable();
            $table->text('escalation_reason')->nullable();
            
            // Conditions and rules
            $table->json('approval_conditions')->nullable(); // Conditions that must be met
            $table->json('auto_approval_rules')->nullable(); // Rules for automatic approval
            $table->boolean('requires_manual_review')->default(true);
            
            // Notification tracking
            $table->boolean('notification_sent')->default(false);
            $table->timestamp('notification_sent_at')->nullable();
            $table->json('notification_channels')->nullable(); // email, sms, in-app, etc.
            $table->integer('reminder_count')->default(0);
            $table->timestamp('last_reminder_sent_at')->nullable();
            
            // Business logic
            $table->decimal('refund_amount_threshold', 15, 2)->nullable(); // Amount that triggered this approval step
            $table->json('risk_assessment')->nullable(); // Risk factors and scores
            $table->boolean('requires_additional_documentation')->default(false);
            $table->json('required_documents')->nullable(); // List of required documents
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('payment_refund_id');
            $table->index('order_id');
            $table->index('assigned_to');
            $table->index('decided_by');
            $table->index('step_number');
            $table->index('decision');
            $table->index('is_current_step');
            $table->index('is_completed');
            $table->index('assigned_at');
            $table->index('due_at');
            $table->index('is_overdue');
            $table->index('created_at');
            $table->index(['tenant_id', 'decision']);
            $table->index(['payment_refund_id', 'step_number']);
            $table->index(['assigned_to', 'decision']);
            $table->index(['tenant_id', 'assigned_to', 'is_current_step']);
            
            // Unique constraint to prevent duplicate steps
            $table->unique(['payment_refund_id', 'step_number'], 'unique_refund_workflow_step');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refund_approval_workflows');
    }
};