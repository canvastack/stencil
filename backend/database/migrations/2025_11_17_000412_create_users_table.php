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
        Schema::create('users', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for Sanctum compatibility)
            $table->id();
            
            // UUID for public-facing IDs 
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Multi-tenant isolation (MANDATORY)
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // User Information
            $table->string('name');
            $table->string('email');
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('department')->nullable();
            $table->json('location')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes (MANDATORY for multi-tenant)
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index('status');
            $table->index('created_at');
            $table->index('department');
            
            // Unique constraints scoped to tenant
            $table->unique(['tenant_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};