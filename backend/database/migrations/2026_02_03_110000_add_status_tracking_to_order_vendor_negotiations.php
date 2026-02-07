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
     * Adds comprehensive status tracking capabilities to order_vendor_negotiations table:
     * - Enhanced status enum with quote workflow states
     * - Status history tracking with JSONB
     * - Timestamp tracking for sent/responded events
     * - Response type and notes for vendor responses
     * - Performance indexes for tenant-scoped queries
     * 
     * Requirements: 3.1, 3.2 (Quote Status Tracking)
     */
    public function up(): void
    {
        // Drop the old enum constraint first
        DB::statement("ALTER TABLE order_vendor_negotiations DROP CONSTRAINT IF EXISTS order_vendor_negotiations_status_check");

        // Update existing status values to match new enum
        DB::statement("
            UPDATE order_vendor_negotiations 
            SET status = CASE 
                WHEN status = 'open' THEN 'draft'
                WHEN status = 'countered' THEN 'countered'
                WHEN status = 'accepted' THEN 'accepted'
                WHEN status = 'rejected' THEN 'rejected'
                WHEN status = 'cancelled' THEN 'rejected'
                WHEN status = 'expired' THEN 'expired'
                ELSE 'draft'
            END
        ");

        // Add new columns
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Change status column to new enum values
            $table->string('status', 50)->default('draft')->change();
            
            // Add status history tracking
            $table->jsonb('status_history')->default('[]')->after('status');
            
            // Add timestamp tracking
            $table->timestamp('sent_at')->nullable()->after('status_history');
            $table->timestamp('responded_at')->nullable()->after('sent_at');
            
            // Add response tracking
            $table->string('response_type', 50)->nullable()->after('responded_at');
            $table->text('response_notes')->nullable()->after('response_type');
            
            // Add indexes for performance
            $table->index(['tenant_id', 'status'], 'idx_ovn_tenant_status');
        });

        // Add check constraint for status enum
        DB::statement("
            ALTER TABLE order_vendor_negotiations 
            ADD CONSTRAINT order_vendor_negotiations_status_check 
            CHECK (status IN ('draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'))
        ");

        // Add check constraint for response_type enum
        DB::statement("
            ALTER TABLE order_vendor_negotiations 
            ADD CONSTRAINT order_vendor_negotiations_response_type_check 
            CHECK (response_type IS NULL OR response_type IN ('accept', 'reject', 'counter'))
        ");

        // Initialize status_history for existing records
        DB::statement("
            UPDATE order_vendor_negotiations 
            SET status_history = jsonb_build_array(
                jsonb_build_object(
                    'from', NULL,
                    'to', status,
                    'changed_by', NULL,
                    'changed_at', created_at::text,
                    'reason', 'Initial status'
                )
            )
            WHERE status_history = '[]'::jsonb
        ");
    }

    /**
     * Reverse the migrations.
     * 
     * Removes status tracking enhancements and reverts to original schema.
     */
    public function down(): void
    {
        // Drop check constraints
        DB::statement("ALTER TABLE order_vendor_negotiations DROP CONSTRAINT IF EXISTS order_vendor_negotiations_status_check");
        DB::statement("ALTER TABLE order_vendor_negotiations DROP CONSTRAINT IF EXISTS order_vendor_negotiations_response_type_check");

        // Revert status values to old enum
        DB::statement("
            UPDATE order_vendor_negotiations 
            SET status = CASE 
                WHEN status = 'draft' THEN 'open'
                WHEN status = 'sent' THEN 'open'
                WHEN status = 'pending_response' THEN 'open'
                WHEN status = 'countered' THEN 'countered'
                WHEN status = 'accepted' THEN 'accepted'
                WHEN status = 'rejected' THEN 'rejected'
                WHEN status = 'expired' THEN 'expired'
                ELSE 'open'
            END
        ");

        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn([
                'status_history',
                'sent_at',
                'responded_at',
                'response_type',
                'response_notes'
            ]);
            
            // Drop new index
            $table->dropIndex('idx_ovn_tenant_status');
        });

        // Restore old enum constraint
        DB::statement("
            ALTER TABLE order_vendor_negotiations 
            ADD CONSTRAINT order_vendor_negotiations_status_check 
            CHECK (status IN ('open', 'countered', 'accepted', 'rejected', 'cancelled', 'expired'))
        ");
    }
};
