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
        // First, drop old unique constraint
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('unique_settings_key');
        });
        
        // Add tenant_id column as nullable first
        Schema::table('settings', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->after('id')->nullable();
        });
        
        // Delete any existing records without tenant context (cleanup)
        DB::table('settings')->delete();
        
        // Now make tenant_id NOT NULL and add constraints
        Schema::table('settings', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            
            // Add new composite unique constraint (tenant_id + key)
            $table->unique(['tenant_id', 'key'], 'unique_settings_tenant_key');
            
            // Add index for tenant_id
            $table->index('tenant_id', 'idx_settings_tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            // Drop indexes and foreign key
            $table->dropUnique('unique_settings_tenant_key');
            $table->dropIndex('idx_settings_tenant_id');
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
            
            // Restore old unique constraint
            $table->unique('key', 'unique_settings_key');
        });
    }
};
