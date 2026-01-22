<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_domains', function (Blueprint $table) {
            // Primary Keys
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Multi-Tenant Scoping
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Domain Information
            $table->string('domain_name', 255)->unique();
            $table->boolean('is_verified')->default(false);
            $table->string('verification_method', 50)->nullable();
            $table->string('verification_token', 255);
            $table->timestamp('verified_at')->nullable();
            
            // SSL Configuration
            $table->boolean('ssl_enabled')->default(false);
            $table->string('ssl_certificate_path', 500)->nullable();
            $table->timestamp('ssl_certificate_issued_at')->nullable();
            $table->timestamp('ssl_certificate_expires_at')->nullable();
            $table->boolean('auto_renew_ssl')->default(true);
            
            // DNS Configuration
            $table->string('dns_provider', 100)->nullable();
            $table->string('dns_record_id', 255)->nullable();
            $table->string('dns_zone_id', 255)->nullable();
            
            // Status
            $table->string('status', 50)->default('pending_verification');
            
            // Configuration
            $table->boolean('redirect_to_https')->default(true);
            $table->string('www_redirect', 50)->nullable()->default('add_www');
            
            // Metadata
            $table->jsonb('metadata')->default('{}');
            
            // Audit Trail
            $table->timestamps();
            $table->timestamp('deleted_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
        });

        // Add check constraints
        DB::statement("ALTER TABLE custom_domains ADD CONSTRAINT check_verification_method 
            CHECK (verification_method IN ('dns_txt', 'dns_cname', 'file_upload') OR verification_method IS NULL)");
        
        DB::statement("ALTER TABLE custom_domains ADD CONSTRAINT check_dns_provider 
            CHECK (dns_provider IN ('cloudflare', 'route53', 'manual') OR dns_provider IS NULL)");
        
        DB::statement("ALTER TABLE custom_domains ADD CONSTRAINT check_status 
            CHECK (status IN ('pending_verification', 'verified', 'active', 'failed', 'suspended'))");
        
        DB::statement("ALTER TABLE custom_domains ADD CONSTRAINT check_www_redirect 
            CHECK (www_redirect IN ('add_www', 'remove_www', 'both') OR www_redirect IS NULL)");

        // Create indexes
        Schema::table('custom_domains', function (Blueprint $table) {
            $table->index('tenant_id', 'idx_custom_domains_tenant_id');
            $table->index('uuid', 'idx_custom_domains_uuid');
            $table->index('domain_name', 'idx_custom_domains_domain');
            $table->index('status', 'idx_custom_domains_status');
            $table->index('is_verified', 'idx_custom_domains_verified');
            $table->index('ssl_certificate_expires_at', 'idx_custom_domains_ssl_expiry');
            $table->index('deleted_at', 'idx_custom_domains_deleted');
            $table->index(['tenant_id', 'domain_name'], 'idx_custom_domains_tenant_domain');
        });

        // Create trigger for updated_at
        DB::statement("
            CREATE TRIGGER update_custom_domains_updated_at
            BEFORE UPDATE ON custom_domains
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
        ");
    }

    public function down(): void
    {
        DB::statement('DROP TRIGGER IF EXISTS update_custom_domains_updated_at ON custom_domains');
        Schema::dropIfExists('custom_domains');
    }
};
