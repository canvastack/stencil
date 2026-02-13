<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the existing status check constraint
        DB::statement("ALTER TABLE order_vendor_negotiations DROP CONSTRAINT IF EXISTS order_vendor_negotiations_status_check");
        
        // Add the updated constraint with admin_countered status
        DB::statement("
            ALTER TABLE order_vendor_negotiations 
            ADD CONSTRAINT order_vendor_negotiations_status_check 
            CHECK (status IN ('draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'admin_countered', 'expired'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the constraint with admin_countered
        DB::statement("ALTER TABLE order_vendor_negotiations DROP CONSTRAINT IF EXISTS order_vendor_negotiations_status_check");
        
        // Restore the original constraint without admin_countered
        DB::statement("
            ALTER TABLE order_vendor_negotiations 
            ADD CONSTRAINT order_vendor_negotiations_status_check 
            CHECK (status IN ('draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'))
        ");
    }
};
