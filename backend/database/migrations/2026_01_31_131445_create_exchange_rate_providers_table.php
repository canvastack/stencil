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
        Schema::create('exchange_rate_providers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name', 100);
            $table->string('code', 50)->unique();
            $table->string('api_url', 255);
            $table->text('api_key')->nullable(); // Encrypted
            $table->boolean('requires_api_key')->default(true);
            $table->boolean('is_unlimited')->default(false);
            $table->integer('monthly_quota')->nullable();
            $table->integer('priority')->default(1);
            $table->boolean('is_enabled')->default(true);
            $table->integer('warning_threshold')->default(50);
            $table->integer('critical_threshold')->default(20);
            $table->timestamps();

            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Indexes
            $table->index('tenant_id');
            $table->index('code');
            $table->index(['tenant_id', 'priority']);
            $table->index(['tenant_id', 'is_enabled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exchange_rate_providers');
    }
};
