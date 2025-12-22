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
     * Fix slug unique constraint to be scoped per tenant instead of global.
     * Also make constraints ignore soft-deleted records (partial unique index).
     * This allows different tenants to have products with the same slug,
     * and allows re-using slugs from deleted products.
     */
    public function up(): void
    {
        // Drop the global unique constraint on slug
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['slug']);
        });

        // Create partial unique index for tenant_id + slug (only for non-deleted)
        // PostgreSQL supports partial indexes with WHERE clause
        DB::statement('CREATE UNIQUE INDEX products_tenant_slug_unique ON products (tenant_id, slug) WHERE deleted_at IS NULL');

        // Also fix SKU to be per-tenant and ignore soft-deleted
        try {
            Schema::table('products', function (Blueprint $table) {
                $table->dropUnique(['sku']);
            });
            
            DB::statement('CREATE UNIQUE INDEX products_tenant_sku_unique ON products (tenant_id, sku) WHERE deleted_at IS NULL');
        } catch (\Exception $e) {
            // SKU constraint might already be fixed or not exist
            \Log::warning('Could not update SKU constraint: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop partial unique indexes (drop as constraint first if exists)
        try {
            DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_slug_unique');
        } catch (\Exception $e) {
            DB::statement('DROP INDEX IF EXISTS products_tenant_slug_unique');
        }
        
        // Revert back to global unique constraint (not recommended for multi-tenant)
        Schema::table('products', function (Blueprint $table) {
            $table->unique('slug');
        });

        try {
            try {
                DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tenant_sku_unique');
            } catch (\Exception $e) {
                DB::statement('DROP INDEX IF EXISTS products_tenant_sku_unique');
            }
            
            Schema::table('products', function (Blueprint $table) {
                $table->unique('sku');
            });
        } catch (\Exception $e) {
            \Log::warning('Could not revert SKU constraint: ' . $e->getMessage());
        }
    }
};
