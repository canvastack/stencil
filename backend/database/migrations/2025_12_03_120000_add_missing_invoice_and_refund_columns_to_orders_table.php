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
            // Add missing invoice related columns
            $table->string('invoice_number')->nullable()->after('metadata');
            $table->timestamp('invoice_generated_at')->nullable()->after('invoice_number');
            
            // Add missing completion related columns
            $table->timestamp('completed_at')->nullable()->after('invoice_generated_at');
            $table->boolean('completion_recorded')->default(false)->after('completed_at');
            
            // Add missing refund related columns
            $table->bigInteger('refund_amount')->default(0)->after('completion_recorded');
            $table->string('refund_status')->default('none')->after('refund_amount');
            $table->timestamp('refunded_at')->nullable()->after('refund_status');
            
            // Add indexes for the new columns
            $table->index('invoice_number');
            $table->index('refund_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['invoice_number']);
            $table->dropIndex(['refund_status']);
            
            $table->dropColumn([
                'invoice_number',
                'invoice_generated_at',
                'completed_at',
                'completion_recorded',
                'refund_amount',
                'refund_status',
                'refunded_at',
            ]);
        });
    }
};