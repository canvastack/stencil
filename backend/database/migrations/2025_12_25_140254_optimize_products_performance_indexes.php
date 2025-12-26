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
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_status_type ON products(status, type)');
        
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_type_status ON products(type, status)');
        
        DB::statement('CREATE INDEX IF NOT EXISTS idx_products_price_status ON products(price, status)');
        
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_products_list_covering ON products(
                status, 
                type, 
                created_at
            ) INCLUDE (id, uuid, name, slug, price, stock_quantity)
        ');
        
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_products_search_tsvector ON products 
            USING gin(to_tsvector(\'english\', COALESCE(name, \'\') || \' \' || COALESCE(description, \'\') || \' \' || COALESCE(tags::text, \'\')))
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_products_status_type');
        DB::statement('DROP INDEX IF EXISTS idx_products_type_status');
        DB::statement('DROP INDEX IF EXISTS idx_products_price_status');
        DB::statement('DROP INDEX IF EXISTS idx_products_list_covering');
        DB::statement('DROP INDEX IF EXISTS idx_products_search_tsvector');
    }
};
