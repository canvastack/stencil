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
            // Vendor negotiation fields
            $table->bigInteger('vendor_quoted_price')->nullable()->after('vendor_id');
            $table->integer('vendor_lead_time_days')->nullable()->after('vendor_quoted_price');
            $table->text('negotiation_notes')->nullable()->after('vendor_lead_time_days');
            $table->json('vendor_terms')->nullable()->after('negotiation_notes');
            $table->bigInteger('quotation_amount')->nullable()->after('vendor_terms');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'vendor_quoted_price',
                'vendor_lead_time_days',
                'negotiation_notes',
                'vendor_terms',
                'quotation_amount',
            ]);
        });
    }
};
