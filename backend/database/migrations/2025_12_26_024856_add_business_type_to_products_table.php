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
     * Phase 1.2: Add business_type column to products table
     * This fixes the type filter mismatch where frontend sends business types
     * (metal_etching, glass_etching, award_plaque) but DB has technical types
     * (physical, digital, service)
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Add business-facing type classification
            $table->string('business_type')->nullable()->after('type');
            
            // Add indexes for performance
            $table->index('business_type');
            $table->index(['tenant_id', 'business_type']);
        });
        
        // Migrate existing data based on product name and category patterns
        // This ensures existing products are categorized correctly
        DB::statement("
            UPDATE products SET business_type = CASE
                WHEN name ILIKE '%metal%' OR name ILIKE '%steel%' OR name ILIKE '%aluminum%' OR name ILIKE '%kuningan%' OR name ILIKE '%besi%' THEN 'metal_etching'
                WHEN name ILIKE '%glass%' OR name ILIKE '%kaca%' OR name ILIKE '%acrylic%' OR name ILIKE '%akrilik%' THEN 'glass_etching'
                WHEN name ILIKE '%award%' OR name ILIKE '%plakat%' OR name ILIKE '%trophy%' OR name ILIKE '%penghargaan%' THEN 'award_plaque'
                WHEN name ILIKE '%signage%' OR name ILIKE '%sign%' OR name ILIKE '%papan%' THEN 'signage'
                WHEN name ILIKE '%industrial%' OR name ILIKE '%industri%' THEN 'industrial_etching'
                ELSE 'general'
            END
            WHERE business_type IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['business_type']);
            $table->dropIndex(['tenant_id', 'business_type']);
            $table->dropColumn('business_type');
        });
    }
};
