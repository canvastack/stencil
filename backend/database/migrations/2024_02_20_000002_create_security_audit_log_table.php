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
        Schema::create('security_audit_log', function (Blueprint $table) {
            $table->id();
            
            // Event details
            $table->string('event_type', 100); // suspicious_activity, sql_injection_attempt, etc.
            $table->unsignedBigInteger('quote_id')->nullable();
            $table->unsignedBigInteger('tenant_id')->nullable();
            
            // Request details
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->text('url')->nullable();
            
            // Event details
            $table->json('details')->nullable();
            
            // Timestamp
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('event_type');
            $table->index('quote_id');
            $table->index('tenant_id');
            $table->index('ip_address');
            $table->index('created_at');
            $table->index(['tenant_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_audit_log');
    }
};
