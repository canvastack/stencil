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
        Schema::create('provider_switch_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('old_provider_id')->nullable();
            $table->unsignedBigInteger('new_provider_id');
            $table->enum('reason', ['quota_exhausted', 'api_failure', 'manual_switch', 'provider_disabled'])->default('quota_exhausted');
            $table->text('metadata')->nullable(); // JSON for additional context
            $table->timestamp('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('old_provider_id')->references('id')->on('exchange_rate_providers')->onDelete('set null');
            $table->foreign('new_provider_id')->references('id')->on('exchange_rate_providers')->onDelete('cascade');

            // Indexes
            $table->index('tenant_id');
            $table->index('created_at');
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'reason']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provider_switch_events');
    }
};
