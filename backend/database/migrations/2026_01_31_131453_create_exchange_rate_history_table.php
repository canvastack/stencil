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
        Schema::create('exchange_rate_history', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->decimal('rate', 15, 4);
            $table->unsignedBigInteger('provider_id')->nullable();
            $table->enum('source', ['manual', 'api', 'cached'])->default('api');
            $table->enum('event_type', ['rate_change', 'provider_switch', 'api_request', 'manual_update'])->default('rate_change');
            $table->text('metadata')->nullable(); // JSON for additional context
            $table->timestamp('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('provider_id')->references('id')->on('exchange_rate_providers')->onDelete('set null');

            // Indexes
            $table->index('tenant_id');
            $table->index('created_at');
            $table->index(['tenant_id', 'created_at']);
            $table->index(['tenant_id', 'event_type']);
            $table->index(['tenant_id', 'provider_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rate_history');
    }
};
