<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds quote_number column to order_vendor_negotiations table
     * for unique quote identification and tracking.
     */
    public function up(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Add quote_number column after uuid
            $table->string('quote_number', 50)->unique()->nullable()->after('uuid');
            
            // Add index for faster lookups
            $table->index('quote_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            // Drop index first
            $table->dropIndex(['quote_number']);
            
            // Drop column
            $table->dropColumn('quote_number');
        });
    }
};
