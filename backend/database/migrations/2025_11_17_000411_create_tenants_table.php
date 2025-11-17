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
        Schema::create('tenants', function (Blueprint $table) {
            // Primary Key (BIGSERIAL for references)
            $table->id();
            
            // UUID for public-facing IDs and tenant identification
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Tenant Information
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('domain')->nullable()->unique();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            
            // Subscription Management  
            $table->enum('subscription_status', ['trial', 'active', 'suspended', 'expired'])->default('trial');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            
            // Platform Relationship
            $table->foreignId('created_by')->nullable()->constrained('accounts')->nullOnDelete();
            
            // Configuration
            $table->json('settings')->nullable();
            $table->json('features')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index('uuid');
            $table->index('slug');
            $table->index('status');
            $table->index('subscription_status');
            $table->index('created_at');
            $table->index('domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};