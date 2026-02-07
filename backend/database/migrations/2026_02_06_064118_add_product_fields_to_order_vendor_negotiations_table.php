<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds product-related fields to order_vendor_negotiations table
     * to support the Quote entity's product information storage.
     * 
     * Fields added:
     * - product_id: Reference to the product being quoted
     * - quantity: Quantity of the product requested
     * - specifications: JSON field for product specifications
     * - notes: Additional notes about the quote
     */
    public function up(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Add product reference
            $table->unsignedBigInteger('product_id')->nullable()->after('vendor_id');
            
            // Add quantity
            $table->integer('quantity')->nullable()->after('product_id');
            
            // Add specifications as JSON
            $table->json('specifications')->nullable()->after('quantity');
            
            // Add notes
            $table->text('notes')->nullable()->after('specifications');
            
            // Add foreign key constraint for product_id
            // Changed from ON DELETE SET NULL to ON DELETE RESTRICT
            // Quotes should not lose product reference when product is deleted
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('restrict');
            
            // Add index for product_id for faster lookups
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['product_id']);
            
            // Drop index
            $table->dropIndex(['product_id']);
            
            // Drop columns
            $table->dropColumn(['product_id', 'quantity', 'specifications', 'notes']);
        });
    }
};
