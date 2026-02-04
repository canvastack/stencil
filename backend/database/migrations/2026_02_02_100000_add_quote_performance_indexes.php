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
     * @return void
     */
    public function up()
    {
        // 1. Composite index for duplicate check
        // Used by: CheckExistingQuoteUseCase, QuoteDuplicationChecker
        // Query: WHERE order_id = ? AND vendor_id = ? AND status IN (...)
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_order_vendor_status 
            ON order_vendor_negotiations(order_id, vendor_id, status)
            WHERE status IN (\'draft\', \'open\', \'sent\', \'countered\')
        ');

        // 2. Index for quote listing by order
        // Used by: Quote list filtered by order_id
        // Query: WHERE order_id = ? ORDER BY created_at DESC
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_order_created 
            ON order_vendor_negotiations(order_id, created_at DESC)
        ');

        // 3. Tenant scoping index
        // Used by: Quote list with status filter
        // Query: WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_tenant_status 
            ON order_vendor_negotiations(tenant_id, status, created_at DESC)
        ');

        // 4. Vendor quotes index
        // Used by: Vendor-specific quote listing
        // Query: WHERE vendor_id = ? AND status = ? ORDER BY created_at DESC
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_vendor_status 
            ON order_vendor_negotiations(vendor_id, status, created_at DESC)
        ');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_order_vendor_status');
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_order_created');
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_tenant_status');
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_vendor_status');
    }
};
