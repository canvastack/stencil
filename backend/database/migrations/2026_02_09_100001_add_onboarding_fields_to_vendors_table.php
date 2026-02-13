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
     * Add onboarding tracking fields to vendors table for vendor portal support.
     * Requirements: 2.1, 2.2, 17.1, 17.4, 17.5
     */
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            // Onboarding Status Tracking
            $table->string('onboarding_status', 20)->default('pending')->after('status');
            $table->timestamp('onboarding_completed_at')->nullable()->after('onboarding_status');
            
            // Portal Access Control
            $table->boolean('portal_access_enabled')->default(false)->after('onboarding_completed_at');
            $table->timestamp('portal_last_access_at')->nullable()->after('portal_access_enabled');
            
            // Onboarding Email Tracking
            $table->timestamp('welcome_email_sent_at')->nullable()->after('portal_last_access_at');
            $table->timestamp('temporary_password_expires_at')->nullable()->after('welcome_email_sent_at');
        });
        
        // Add check constraint for onboarding_status
        DB::statement("ALTER TABLE vendors ADD CONSTRAINT vendors_onboarding_status_check CHECK (onboarding_status IN ('pending', 'in_progress', 'completed'))");
        
        // Add indexes for performance
        DB::statement('CREATE INDEX idx_vendors_onboarding_status ON vendors(tenant_id, onboarding_status)');
        DB::statement('CREATE INDEX idx_vendors_portal_access ON vendors(tenant_id, portal_access_enabled) WHERE portal_access_enabled = true');
        
        // Add comments to explain the fields
        DB::statement("COMMENT ON COLUMN vendors.onboarding_status IS 'Vendor onboarding progress: pending (not started), in_progress (started but not completed), completed (fully onboarded)'");
        DB::statement("COMMENT ON COLUMN vendors.onboarding_completed_at IS 'Timestamp when vendor completed onboarding process'");
        DB::statement("COMMENT ON COLUMN vendors.portal_access_enabled IS 'Whether vendor can access the vendor portal'");
        DB::statement("COMMENT ON COLUMN vendors.portal_last_access_at IS 'Last time vendor logged into the portal'");
        DB::statement("COMMENT ON COLUMN vendors.welcome_email_sent_at IS 'Timestamp when welcome email with credentials was sent'");
        DB::statement("COMMENT ON COLUMN vendors.temporary_password_expires_at IS 'Expiration timestamp for temporary password (7 days from creation)'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            // Drop indexes first
            DB::statement('DROP INDEX IF EXISTS idx_vendors_portal_access');
            DB::statement('DROP INDEX IF EXISTS idx_vendors_onboarding_status');
            
            // Drop check constraint
            DB::statement('ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_onboarding_status_check');
            
            // Drop columns
            $table->dropColumn([
                'onboarding_status',
                'onboarding_completed_at',
                'portal_access_enabled',
                'portal_last_access_at',
                'welcome_email_sent_at',
                'temporary_password_expires_at'
            ]);
        });
    }
};
