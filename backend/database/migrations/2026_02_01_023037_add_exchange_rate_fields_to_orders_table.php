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
        Schema::table('orders', function (Blueprint $table) {
            // Exchange rate at the time of order creation
            $table->decimal('exchange_rate', 20, 6)->nullable()->after('currency');
            
            // Original amount in USD (stored in cents)
            $table->bigInteger('original_amount_usd')->nullable()->after('exchange_rate');
            
            // Converted amount in IDR (stored in cents)
            $table->bigInteger('converted_amount_idr')->nullable()->after('original_amount_usd');
            
            // Add index for reporting queries
            $table->index('exchange_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['exchange_rate']);
            $table->dropColumn(['exchange_rate', 'original_amount_usd', 'converted_amount_idr']);
        });
    }
};
