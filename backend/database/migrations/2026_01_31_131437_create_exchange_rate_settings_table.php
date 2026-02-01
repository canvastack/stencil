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
        Schema::create('exchange_rate_settings', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->enum('mode', ['manual', 'auto'])->default('auto');
            $table->decimal('manual_rate', 15, 4)->nullable();
            $table->decimal('current_rate', 15, 4)->nullable();
            $table->unsignedBigInteger('active_provider_id')->nullable();
            $table->boolean('auto_update_enabled')->default(true);
            $table->time('auto_update_time')->default('00:00:00');
            $table->timestamp('last_updated_at')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            // Note: active_provider_id foreign key will be added after exchange_rate_providers table is created

            // Indexes
            $table->index('tenant_id');
            $table->index('mode');
            $table->unique(['tenant_id']); // One setting per tenant
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rate_settings');
    }
};
