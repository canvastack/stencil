<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add admin_counter_offer field to enable two-way negotiation.
     * Admin can now counter vendor's counter offer instead of just accept/reject.
     */
    public function up(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            $table->bigInteger('admin_counter_offer')->nullable()->after('latest_offer')
                ->comment('Admin counter offer amount in cents (for two-way negotiation)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            $table->dropColumn('admin_counter_offer');
        });
    }
};
