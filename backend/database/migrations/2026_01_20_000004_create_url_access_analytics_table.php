<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('url_access_analytics', function (Blueprint $table) {
            // Primary Keys
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Relations
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->unsignedBigInteger('url_config_id')->nullable();
            
            // Access Details
            $table->string('accessed_url', 500);
            $table->string('url_pattern_used', 50);
            
            // Request Info
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->string('country_code', 2)->nullable();
            $table->string('city', 100)->nullable();
            
            // Response
            $table->smallInteger('http_status_code')->nullable();
            $table->integer('response_time_ms')->nullable();
            
            // Timestamps
            $table->timestamp('accessed_at')->default(DB::raw('CURRENT_TIMESTAMP'));
        });

        // Create indexes for analytics queries
        Schema::table('url_access_analytics', function (Blueprint $table) {
            $table->index('tenant_id', 'idx_url_analytics_tenant_id');
            $table->index('url_config_id', 'idx_url_analytics_config_id');
            $table->index('accessed_at', 'idx_url_analytics_accessed_at');
            $table->index('country_code', 'idx_url_analytics_country');
            $table->index('http_status_code', 'idx_url_analytics_status');
            $table->index(['tenant_id', 'accessed_at'], 'idx_url_analytics_tenant_date');
        });

        // Create function-based index for date-based queries
        DB::statement('CREATE INDEX idx_url_analytics_accessed_at_date ON url_access_analytics (DATE(accessed_at))');

        // Add foreign key constraint for url_config_id
        Schema::table('url_access_analytics', function (Blueprint $table) {
            $table->foreign('url_config_id', 'fk_url_analytics_config')
                ->references('id')
                ->on('tenant_url_configurations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('url_access_analytics');
    }
};
