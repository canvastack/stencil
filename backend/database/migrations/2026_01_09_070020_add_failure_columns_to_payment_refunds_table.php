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
        Schema::table('payment_refunds', function (Blueprint $table) {
            $table->text('failure_reason')->nullable()->after('gateway_error_message')
                  ->comment('Detailed reason for refund failure');
            $table->timestamp('failed_at')->nullable()->after('completed_at')
                  ->comment('Timestamp when refund failed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_refunds', function (Blueprint $table) {
            $table->dropColumn(['failure_reason', 'failed_at']);
        });
    }
};
