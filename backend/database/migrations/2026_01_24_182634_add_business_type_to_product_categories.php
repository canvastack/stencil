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
        Schema::table('product_categories', function (Blueprint $table) {
            $table->string('business_type')->nullable()->after('slug');
            $table->index('business_type');
            $table->index(['tenant_id', 'business_type']);
        });
        
        DB::statement("
            UPDATE product_categories SET business_type = CASE
                WHEN slug LIKE '%award%' OR slug LIKE '%trophy%' OR slug LIKE '%troph%' OR slug LIKE '%plak%' OR slug LIKE '%plaque%' THEN 'award_plaque'
                WHEN slug LIKE '%glass%' OR slug LIKE '%kaca%' THEN 'glass_etching'
                WHEN slug LIKE '%metal%' OR slug LIKE '%steel%' OR slug LIKE '%stainless%' OR slug LIKE '%aluminum%' OR slug LIKE '%brass%' OR slug LIKE '%kuningan%' THEN 'metal_etching'
                WHEN slug LIKE '%signage%' OR slug LIKE '%sign%' OR slug LIKE '%papan%' THEN 'signage'
                WHEN slug LIKE '%industrial%' OR slug LIKE '%industri%' THEN 'industrial_etching'
                ELSE 'custom_etching'
            END
            WHERE business_type IS NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'business_type']);
            $table->dropIndex(['business_type']);
            $table->dropColumn('business_type');
        });
    }
};
