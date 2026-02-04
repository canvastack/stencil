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
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Composite index for duplicate quote check
            // Used when checking for existing active quotes for order + vendor combination
            $table->index(
                ['order_id', 'vendor_id', 'status'],
                'idx_ovn_order_vendor_status'
            );

            // Composite index for quote listing by order
            // Used when fetching all quotes for a specific order, sorted by creation date
            $table->index(
                ['order_id', 'created_at'],
                'idx_ovn_order_created'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Drop indexes in reverse order
            $table->dropIndex('idx_ovn_order_created');
            $table->dropIndex('idx_ovn_order_vendor_status');
        });
    }
};
