<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('domain_mappings', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Domain Information
            $table->string('domain')->unique();
            $table->string('subdomain')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->enum('status', ['pending', 'active', 'inactive', 'failed'])->default('pending');
            $table->enum('verification_method', ['dns', 'file', 'email'])->default('dns');
            $table->string('verification_token')->nullable();
            $table->timestamp('verified_at')->nullable();
            
            // SSL Configuration
            $table->boolean('ssl_enabled')->default(false);
            $table->json('ssl_config')->nullable();
            $table->timestamp('ssl_expires_at')->nullable();
            
            // Metadata
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('domain');
            $table->index('status');
            $table->index('is_primary');
            $table->index(['tenant_id', 'is_primary']);
            $table->index(['tenant_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domain_mappings');
    }
};
