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
        Schema::create('customer_quotes', function (Blueprint $table) {
            // Primary keys
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Foreign keys
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('vendor_quote_id')->constrained('vendor_quotes')->cascadeOnDelete();
            
            // Quote identification
            $table->string('quote_number', 50)->unique();
            $table->string('title', 255);
            $table->text('description')->nullable();
            
            // Pricing (all amounts in cents as BIGINT)
            $table->bigInteger('vendor_total_cost'); // Base cost from vendor
            $table->bigInteger('base_profit_amount'); // Initial profit markup
            $table->decimal('base_profit_percentage', 5, 2); // Profit percentage
            
            // Additional costs (all in cents)
            $table->bigInteger('handling_fee')->default(0);
            $table->bigInteger('shipping_cost')->default(0);
            $table->bigInteger('insurance')->default(0);
            $table->bigInteger('other_costs')->default(0);
            $table->text('other_costs_description')->nullable();
            
            // Final pricing (all in cents)
            $table->bigInteger('subtotal');
            $table->decimal('tax_rate', 5, 2)->default(11.00); // Default 11% VAT
            $table->bigInteger('tax_amount');
            $table->bigInteger('grand_total');
            
            // Profit summary
            $table->bigInteger('total_profit_amount');
            $table->decimal('total_profit_percentage', 5, 2);
            
            $table->string('currency', 3)->default('IDR');
            
            // Terms and conditions
            $table->timestamp('valid_until');
            $table->text('payment_terms');
            $table->string('delivery_timeline', 255)->nullable();
            $table->text('terms_and_conditions')->nullable();
            
            // Status workflow
            $table->string('status', 50)->default('draft');
            
            // Timeline tracking
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            
            // Actor tracking
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('sent_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('rejected_by')->nullable()->constrained('users');
            
            // Negotiation fields
            $table->bigInteger('counter_offer_amount')->nullable();
            $table->text('counter_offer_notes')->nullable();
            $table->integer('counter_offer_round')->default(0);
            $table->integer('max_negotiation_rounds')->default(3);
            
            // Approval tracking
            $table->string('approval_method', 20)->nullable();
            $table->text('approval_reason')->nullable();
            $table->text('approval_notes')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Response token for customer actions
            $table->uuid('response_token')->unique()->nullable();
            
            // History and metadata (JSONB)
            $table->json('history')->default('[]');
            $table->json('metadata')->default('{}');
            
            // Timestamps
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['tenant_id', 'order_id'], 'idx_customer_quotes_tenant_order');
            $table->index(['tenant_id', 'status'], 'idx_customer_quotes_tenant_status');
            $table->index('response_token', 'idx_customer_quotes_token');
            $table->index('valid_until', 'idx_customer_quotes_valid_until');
            $table->index('quote_number', 'idx_customer_quotes_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_quotes');
    }
};
