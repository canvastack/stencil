<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customer_quote_approval_settings', function (Blueprint $table) {
            // Primary key
            $table->id();
            
            // Foreign key - one settings record per tenant
            $table->foreignId('tenant_id')->unique()->constrained('tenants')->cascadeOnDelete();
            
            // Auto-approval rules
            $table->boolean('auto_approval_enabled')->default(false);
            $table->bigInteger('auto_approval_threshold')->default(5000000); // 5 juta in cents
            
            // Customer trust requirements
            $table->boolean('require_email_verification')->default(true);
            $table->integer('min_successful_orders')->default(1);
            $table->decimal('min_payment_success_rate', 5, 2)->default(90.00);
            
            // Product type rules
            $table->boolean('auto_approve_standard_products')->default(true);
            $table->boolean('require_approval_custom_products')->default(true);
            
            // Negotiation settings
            $table->integer('max_negotiation_rounds')->default(3);
            $table->boolean('allow_customer_counter_offer')->default(true);
            
            // Notification settings
            $table->boolean('notify_admin_on_auto_approve')->default(true);
            $table->boolean('notify_admin_on_pending_approval')->default(true);
            
            // Timestamps
            $table->timestamps();
            
            // Index for tenant lookups
            $table->index('tenant_id', 'idx_approval_settings_tenant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_quote_approval_settings');
    }
};
