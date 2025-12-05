<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenant_pages', function (Blueprint $table) {
            // Drop the existing unique index on slug
            $table->dropUnique(['slug']);
            
            // Create a composite unique index on tenant_id and slug
            $table->unique(['tenant_id', 'slug'], 'tenant_pages_tenant_slug_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_pages', function (Blueprint $table) {
            // Drop the composite unique index
            $table->dropUnique('tenant_pages_tenant_slug_unique');
            
            // Restore the original unique index on slug
            $table->unique('slug');
        });
    }
};