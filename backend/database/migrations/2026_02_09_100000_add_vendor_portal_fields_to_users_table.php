<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add vendor-specific fields to users table for vendor portal support.
     * Requirements: 1.7, 2.4, 15.9
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Vendor Portal Fields
            $table->uuid('vendor_id')->nullable()->after('tenant_id');
            $table->string('account_type', 20)->default('tenant')->after('vendor_id');
            
            // Add indexes
            $table->index('vendor_id', 'idx_users_vendor_id');
            $table->index('account_type', 'idx_users_account_type');
            $table->index(['vendor_id', 'account_type'], 'idx_users_vendor_account');
        });
        
        // Add check constraint for account_type using raw SQL
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_account_type_check CHECK (account_type IN ('platform', 'tenant', 'vendor'))");
        
        // Add comments to explain the fields
        DB::statement("COMMENT ON COLUMN users.vendor_id IS 'Foreign key to vendors.id in tenant schema (nullable for non-vendor users)'");
        DB::statement("COMMENT ON COLUMN users.account_type IS 'User account type: platform (platform admin), tenant (tenant user), vendor (vendor portal user)'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex('idx_users_vendor_account');
            $table->dropIndex('idx_users_account_type');
            $table->dropIndex('idx_users_vendor_id');
            
            // Drop check constraint
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_type_check');
            
            // Drop columns
            $table->dropColumn(['vendor_id', 'account_type']);
        });
    }
};
