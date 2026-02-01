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
        Schema::table('exchange_rate_settings', function (Blueprint $table) {
            $table->foreign('active_provider_id')
                  ->references('id')
                  ->on('exchange_rate_providers')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exchange_rate_settings', function (Blueprint $table) {
            $table->dropForeign(['active_provider_id']);
        });
    }
};
