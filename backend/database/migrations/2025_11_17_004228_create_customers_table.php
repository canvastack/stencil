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
        Schema::create('customers', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Customer Information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->enum('type', ['individual', 'business'])->default('individual');
            
            // Business customer fields
            $table->string('company_name')->nullable();
            $table->text('address')->nullable();
            
            // Metadata
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('last_order_at')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('email');
            $table->index('status');
            $table->index('type');
            $table->index('created_at');
            $table->unique(['tenant_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
