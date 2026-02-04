<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Renames the 'terms' column to 'quote_details' in order_vendor_negotiations table
     * for better semantic clarity. The 'terms' field name was misleading as it suggests
     * "terms & conditions" but actually stores full quote details (title, description, items, notes).
     */
    public function up(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            $table->renameColumn('terms', 'quote_details');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Rollback the column rename from 'quote_details' back to 'terms'
     * to restore the original schema if needed.
     */
    public function down(): void
    {
        Schema::table('order_vendor_negotiations', function (Blueprint $table) {
            $table->renameColumn('quote_details', 'terms');
        });
    }
};
