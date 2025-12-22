<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Remove duplicate product categories while keeping the first occurrence
     * for each unique (tenant_id, slug) combination.
     */
    public function up(): void
    {
        // Count total categories before cleanup
        $totalBefore = DB::table('product_categories')->count();
        
        // Remove duplicate categories, keeping only the first occurrence
        // for each unique (tenant_id, slug) combination
        DB::statement("
            DELETE FROM product_categories
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM product_categories
                GROUP BY tenant_id, slug
            )
        ");
        
        // Count total categories after cleanup
        $totalAfter = DB::table('product_categories')->count();
        $deletedCount = $totalBefore - $totalAfter;
        
        if ($deletedCount > 0) {
            echo "✅ Removed {$deletedCount} duplicate product categories (Before: {$totalBefore}, After: {$totalAfter})\n";
        } else {
            echo "ℹ️  No duplicate categories found\n";
        }
    }

    /**
     * Reverse the migrations.
     * 
     * Note: This migration cannot be reversed as we cannot restore
     * the deleted duplicate records. This is intentional - duplicates
     * should not exist in the system.
     */
    public function down(): void
    {
        // Cannot restore deleted duplicates
        echo "⚠️  Warning: This migration cannot be reversed. Deleted duplicates cannot be restored.\n";
    }
};
