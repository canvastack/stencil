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
        Schema::create('roles', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs 
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Multi-tenant isolation (NULL for platform roles)
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
            
            // Role Information
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->json('abilities')->nullable(); // Permissions array
            $table->enum('level', ['platform', 'tenant'])->default('tenant');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index('slug');
            $table->index('level');
            $table->index('is_active');
            $table->index('created_at');
            
            // Unique constraints
            $table->unique(['tenant_id', 'slug']); // Slug unique per tenant
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};