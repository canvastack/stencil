<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds vendor quote reference fields to orders table for post-acceptance workflow integration.
     * This enables automatic order status sync when vendor accepts a quote and tracks production progress.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Add vendor quote reference
            $table->unsignedBigInteger('vendor_quote_id')->nullable()->after('vendor_id')
                ->comment('Reference to accepted vendor quote (order_vendor_negotiations)');
            
            // Add vendor quote acceptance timestamp
            $table->timestamp('vendor_quote_accepted_at')->nullable()->after('vendor_quote_id')
                ->comment('Timestamp when vendor accepted the quote');
            
            // Add vendor agreed price (in cents)
            $table->bigInteger('vendor_agreed_price')->nullable()->after('vendor_quote_accepted_at')
                ->comment('Price in cents agreed with vendor');
            
            // Add vendor estimated delivery days
            $table->integer('vendor_estimated_delivery_days')->nullable()->after('vendor_agreed_price')
                ->comment('Estimated delivery days provided by vendor');
            
            // Add foreign key constraint to order_vendor_negotiations table
            $table->foreign('vendor_quote_id')
                ->references('id')
                ->on('order_vendor_negotiations')
                ->onDelete('set null');
            
            // Add index on vendor_quote_id for performance
            $table->index('vendor_quote_id', 'idx_orders_vendor_quote_id');
            
            // Add index on vendor_quote_accepted_at for delivery tracking queries
            $table->index('vendor_quote_accepted_at', 'idx_orders_vendor_quote_accepted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['vendor_quote_id']);
            
            // Drop indexes
            $table->dropIndex('idx_orders_vendor_quote_id');
            $table->dropIndex('idx_orders_vendor_quote_accepted_at');
            
            // Drop columns
            $table->dropColumn([
                'vendor_quote_id',
                'vendor_quote_accepted_at',
                'vendor_agreed_price',
                'vendor_estimated_delivery_days',
            ]);
        });
    }
};
