<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // PT CEX Business Model Fields
            $table->bigInteger('vendor_cost')->nullable()->after('total_amount'); // Cost from vendor
            $table->bigInteger('customer_price')->nullable()->after('vendor_cost'); // Price to customer  
            $table->bigInteger('markup_amount')->nullable()->after('customer_price'); // Profit margin
            $table->decimal('markup_percentage', 5, 2)->nullable()->after('markup_amount'); // Markup %
            
            // Payment type for PT CEX (DP 50% vs Full 100%)
            $table->enum('payment_type', ['dp_50', 'full_100'])->nullable()->after('payment_status');
            $table->bigInteger('paid_amount')->default(0)->after('payment_type'); // Already exists, just reorder
            $table->bigInteger('remaining_amount')->default(0)->after('paid_amount'); // Track remaining
            
            // Vendor relationship
            $table->text('vendor_notes')->nullable()->after('internal_notes');
            $table->timestamp('vendor_assigned_at')->nullable()->after('vendor_notes');
            
            // Production timeline
            $table->timestamp('production_start')->nullable()->after('estimated_delivery');
            $table->timestamp('production_end')->nullable()->after('production_start');
            $table->timestamp('quality_check_at')->nullable()->after('production_end');
            
            // Business workflow timestamps
            $table->timestamp('quote_sent_at')->nullable()->after('quality_check_at');
            $table->timestamp('quote_approved_at')->nullable()->after('quote_sent_at');
            $table->timestamp('dp_received_at')->nullable()->after('quote_approved_at');
            $table->timestamp('final_payment_at')->nullable()->after('dp_received_at');
            
            // Index the new business fields
            $table->index(['tenant_id', 'payment_type']);
            $table->index(['tenant_id', 'vendor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'vendor_cost',
                'customer_price', 
                'markup_amount',
                'markup_percentage',
                'payment_type',
                'remaining_amount',
                'vendor_notes',
                'vendor_assigned_at',
                'production_start',
                'production_end',
                'quality_check_at',
                'quote_sent_at',
                'quote_approved_at',
                'dp_received_at',
                'final_payment_at'
            ]);
            
            $table->dropIndex(['tenant_id', 'payment_type']);
            $table->dropIndex(['tenant_id', 'vendor_id', 'status']);
        });
    }
};