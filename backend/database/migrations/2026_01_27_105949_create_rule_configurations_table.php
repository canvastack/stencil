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
        Schema::create('rule_configurations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('tenant_id'); // Changed from uuid to unsignedBigInteger
            $table->string('rule_code', 100);
            $table->boolean('enabled')->default(true);
            $table->integer('priority')->default(100);
            $table->json('parameters')->nullable();
            $table->json('applicable_contexts')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['tenant_id', 'rule_code']);
            $table->index(['tenant_id', 'enabled']);
            $table->index(['rule_code']);
            $table->index(['priority']);

            // Foreign key constraint
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Unique constraint to prevent duplicate rule configurations per tenant
            $table->unique(['tenant_id', 'rule_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rule_configurations');
    }
};
