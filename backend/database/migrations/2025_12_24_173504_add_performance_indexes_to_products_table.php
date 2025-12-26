<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add performance indexes for public product filtering, search, and sorting
     */
    public function up(): void
    {
        // Enable pg_trgm extension FIRST (PostgreSQL only)
        // This must be done before creating trigram-based GIN indexes
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        }
        
        Schema::table('products', function (Blueprint $table) {
            // Single column indexes for filtering and sorting
            $table->index('subcategory', 'idx_products_subcategory');
            $table->index('stock_quantity', 'idx_products_stock_quantity');
            $table->index('average_rating', 'idx_products_average_rating');
            $table->index('view_count', 'idx_products_view_count');
            
            // Composite indexes for common query patterns
            // Public featured products (homepage)
            $table->index(['tenant_id', 'status', 'featured'], 'idx_products_tenant_status_featured');
            
            // Category browsing with published filter
            $table->index(['tenant_id', 'status', 'category_id'], 'idx_products_tenant_status_category');
            
            // Top-rated products
            $table->index(['tenant_id', 'status', 'average_rating'], 'idx_products_tenant_status_rating');
            
            // Stock availability check
            $table->index(['tenant_id', 'status', 'stock_quantity'], 'idx_products_tenant_status_stock');
            
            // Sorting by creation date (newest first)
            $table->index(['tenant_id', 'status', 'created_at'], 'idx_products_tenant_status_created');
        });
        
        // GIN indexes for full-text search (PostgreSQL only)
        // These enable fast ILIKE searches on text fields using trigram matching
        if (DB::connection()->getDriverName() === 'pgsql') {
            try {
                DB::statement('CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(name gin_trgm_ops)');
                DB::statement('CREATE INDEX IF NOT EXISTS idx_products_description_gin ON products USING gin(description gin_trgm_ops)');
                DB::statement('CREATE INDEX IF NOT EXISTS idx_products_long_description_gin ON products USING gin(long_description gin_trgm_ops)');
            } catch (\Exception $e) {
                // If GIN index creation fails, it's okay - the standard B-tree indexes will still work
                \Log::warning('Failed to create GIN indexes for full-text search: ' . $e->getMessage());
            }
            
            // Note: Skipping GIN index for tags field since it's JSON type (not JSONB)
            // JSON type doesn't support GIN indexes in PostgreSQL
            // Search on tags will still work via JSON containment query but may be slower
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop GIN indexes first (PostgreSQL only)
        if (DB::connection()->getDriverName() === 'pgsql') {
            try {
                DB::statement('DROP INDEX IF EXISTS idx_products_long_description_gin CASCADE');
                DB::statement('DROP INDEX IF EXISTS idx_products_description_gin CASCADE');
                DB::statement('DROP INDEX IF EXISTS idx_products_name_gin CASCADE');
            } catch (\Exception $e) {
                // Ignore errors if indexes don't exist
            }
        }
        
        Schema::table('products', function (Blueprint $table) {
            // Drop composite indexes
            $table->dropIndex('idx_products_tenant_status_created');
            $table->dropIndex('idx_products_tenant_status_stock');
            $table->dropIndex('idx_products_tenant_status_rating');
            $table->dropIndex('idx_products_tenant_status_category');
            $table->dropIndex('idx_products_tenant_status_featured');
            
            // Drop single column indexes
            $table->dropIndex('idx_products_view_count');
            $table->dropIndex('idx_products_average_rating');
            $table->dropIndex('idx_products_stock_quantity');
            $table->dropIndex('idx_products_subcategory');
        });
    }
};
