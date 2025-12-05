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
            // Add tenant_id column as nullable first
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
        });

        // Update existing records with a default tenant_id (first tenant)
        $firstTenant = \Illuminate\Support\Facades\DB::table('tenants')->first();
        if ($firstTenant) {
            \Illuminate\Support\Facades\DB::table('tenant_pages')
                ->whereNull('tenant_id')
                ->update(['tenant_id' => $firstTenant->id]);
        }

        Schema::table('tenant_pages', function (Blueprint $table) {
            // Make tenant_id not nullable after updating existing records
            $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
            
            // Add foreign key constraint
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            
            // Add composite index for performance
            $table->index(['tenant_id', 'slug']);
            $table->index(['tenant_id', 'status', 'published_at']);
            $table->index(['tenant_id', 'page_type', 'language']);
            $table->index(['tenant_id', 'is_homepage', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenant_pages', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id', 'slug']);
            $table->dropIndex(['tenant_id', 'status', 'published_at']);
            $table->dropIndex(['tenant_id', 'page_type', 'language']);
            $table->dropIndex(['tenant_id', 'is_homepage', 'status']);
            $table->dropColumn('tenant_id');
        });
    }
};