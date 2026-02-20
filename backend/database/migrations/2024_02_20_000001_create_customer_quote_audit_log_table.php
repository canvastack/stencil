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
        Schema::create('customer_quote_audit_log', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('quote_id');
            $table->unsignedBigInteger('tenant_id');
            
            // Action details
            $table->string('action', 100); // quote_viewed, quote_accepted, etc.
            $table->string('actor_type', 20); // admin, customer, system
            $table->unsignedBigInteger('actor_id')->nullable();
            
            // Request details
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            
            // Additional metadata
            $table->json('metadata')->nullable();
            
            // Timestamp
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('quote_id');
            $table->index('tenant_id');
            $table->index('action');
            $table->index('actor_type');
            $table->index('created_at');
            $table->index(['tenant_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_quote_audit_log');
    }
};
