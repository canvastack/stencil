<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds composite indexes for efficient review aggregation queries.
     * These indexes optimize AVG(rating) and COUNT(*) GROUP BY product_id queries.
     */
    public function up(): void
    {
        Schema::table('customer_reviews', function (Blueprint $table) {
            // Composite index for aggregating ratings by product
            $table->index(['product_id', 'rating'], 'idx_reviews_product_rating');
            
            // Composite index for recent reviews queries
            $table->index(['product_id', 'created_at'], 'idx_reviews_product_created');
            
            // Additional index for approved reviews aggregation
            $table->index(['product_id', 'is_approved', 'rating'], 'idx_reviews_product_approved_rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_reviews', function (Blueprint $table) {
            $table->dropIndex('idx_reviews_product_rating');
            $table->dropIndex('idx_reviews_product_created');
            $table->dropIndex('idx_reviews_product_approved_rating');
        });
    }
};
