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
        Schema::create('vendors', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant isolation
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Vendor Information
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            
            // Business Information
            $table->string('company_name')->nullable();
            $table->string('tax_id')->nullable();
            $table->json('payment_terms')->nullable();
            
            // Contact Information
            $table->json('contacts')->nullable(); // Multiple contact persons
            
            // Metadata
            $table->json('metadata')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('tenant_id');
            $table->index('email');
            $table->index('status');
            $table->index('created_at');
            $table->unique(['tenant_id', 'email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};
