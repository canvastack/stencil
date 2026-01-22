<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_verification_logs', function (Blueprint $table) {
            // Primary Keys
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Relations
            $table->foreignId('custom_domain_id')->constrained('custom_domains')->cascadeOnDelete();
            
            // Verification Details
            $table->timestamp('verification_attempt_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->string('verification_method', 50);
            $table->string('verification_status', 50);
            
            // Results
            $table->jsonb('verification_response')->default('{}');
            $table->text('error_message')->nullable();
            $table->jsonb('dns_records_found')->default('[]');
            
            // Metadata
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 500)->nullable();
            
            // Timestamps
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
        });

        // Add check constraints
        DB::statement("ALTER TABLE domain_verification_logs ADD CONSTRAINT check_verification_status 
            CHECK (verification_status IN ('success', 'failed', 'pending'))");

        // Create indexes
        Schema::table('domain_verification_logs', function (Blueprint $table) {
            $table->index('custom_domain_id', 'idx_domain_verify_logs_domain_id');
            $table->index('uuid', 'idx_domain_verify_logs_uuid');
            $table->index('verification_status', 'idx_domain_verify_logs_status');
            $table->index('created_at', 'idx_domain_verify_logs_created');
            $table->index(['custom_domain_id', 'verification_status'], 'idx_domain_verify_logs_domain_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_verification_logs');
    }
};
