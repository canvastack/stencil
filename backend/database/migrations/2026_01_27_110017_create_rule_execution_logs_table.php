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
        Schema::create('rule_execution_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('tenant_id'); // Changed from uuid to unsignedBigInteger
            $table->string('rule_code', 100);
            $table->string('context', 50);
            $table->json('result');
            $table->decimal('execution_time', 8, 3); // milliseconds with 3 decimal precision
            $table->timestamp('executed_at');
            $table->timestamps();

            // Indexes for performance
            $table->index(['tenant_id', 'executed_at']);
            $table->index(['tenant_id', 'rule_code']);
            $table->index(['rule_code', 'executed_at']);
            $table->index(['context']);
            $table->index(['executed_at']);

            // Foreign key constraint
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rule_execution_logs');
    }
};
