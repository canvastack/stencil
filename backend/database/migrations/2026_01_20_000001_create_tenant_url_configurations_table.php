<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_url_configurations', function (Blueprint $table) {
            // Primary Keys
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Multi-Tenant Scoping
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // URL Configuration
            $table->string('url_pattern', 50);
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_enabled')->default(true);
            
            // Subdomain Configuration (for url_pattern = 'subdomain')
            $table->string('subdomain', 100)->nullable()->unique();
            
            // Path Configuration (for url_pattern = 'path')
            $table->string('url_path', 100)->nullable()->unique();
            
            // Custom Domain Reference (constraint will be added later after custom_domains table exists)
            $table->unsignedBigInteger('custom_domain_id')->nullable();
            
            // Configuration Metadata
            $table->boolean('force_https')->default(true);
            $table->boolean('redirect_to_primary')->default(false);
            
            // SEO & Metadata
            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();
            $table->string('og_image_url', 500)->nullable();
            
            // Audit Trail
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
        });

        // Add check constraints
        DB::statement("ALTER TABLE tenant_url_configurations ADD CONSTRAINT check_url_pattern 
            CHECK (url_pattern IN ('subdomain', 'path', 'custom_domain'))");
        
        DB::statement("ALTER TABLE tenant_url_configurations ADD CONSTRAINT check_subdomain_pattern 
            CHECK (
                (url_pattern = 'subdomain' AND subdomain IS NOT NULL) OR
                (url_pattern != 'subdomain' AND subdomain IS NULL)
            )");
        
        DB::statement("ALTER TABLE tenant_url_configurations ADD CONSTRAINT check_path_pattern 
            CHECK (
                (url_pattern = 'path' AND url_path IS NOT NULL) OR
                (url_pattern != 'path' AND url_path IS NULL)
            )");

        // Create indexes
        Schema::table('tenant_url_configurations', function (Blueprint $table) {
            $table->index('tenant_id', 'idx_tenant_url_config_tenant_id');
            $table->index('uuid', 'idx_tenant_url_config_uuid');
            $table->index('subdomain', 'idx_tenant_url_config_subdomain');
            $table->index('url_path', 'idx_tenant_url_config_path');
            $table->index('is_enabled', 'idx_tenant_url_config_enabled');
            $table->index('deleted_at', 'idx_tenant_url_config_deleted');
            $table->index(['tenant_id', 'is_primary'], 'idx_tenant_url_config_tenant_primary');
        });

        // Create trigger for updated_at
        DB::statement("
            CREATE TRIGGER update_tenant_url_configurations_updated_at
            BEFORE UPDATE ON tenant_url_configurations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
        ");
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS update_tenant_url_configurations_updated_at ON tenant_url_configurations');
        Schema::dropIfExists('tenant_url_configurations');
    }
};
