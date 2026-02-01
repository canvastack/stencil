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
        Schema::create('api_quota_tracking', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('provider_id');
            $table->integer('requests_made')->default(0);
            $table->integer('quota_limit');
            $table->integer('year');
            $table->integer('month');
            $table->timestamp('last_reset_at')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('provider_id')->references('id')->on('exchange_rate_providers')->onDelete('cascade');

            // Indexes
            $table->index('provider_id');
            $table->index(['provider_id', 'year', 'month']);
            $table->unique(['provider_id', 'year', 'month']); // One record per provider per month
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_quota_tracking');
    }
};
