<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Account A: Platform Owners
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->enum('account_type', ['platform_owner'])->default('platform_owner');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->json('settings')->nullable();
            $table->string('avatar')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // Account B: Tenants  
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Business name
            $table->string('slug')->unique(); // for URL: canvastencil.com/tenant_slug
            $table->string('domain')->nullable()->unique(); // custom domain: tenant.com
            $table->string('database')->nullable(); // if using separate DB per tenant
            $table->json('data')->nullable(); // tenant-specific configuration
            $table->enum('status', ['active', 'inactive', 'suspended', 'trial'])->default('trial');
            $table->enum('subscription_status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->uuid('created_by')->nullable(); // Account A user who created this tenant
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('accounts')->onDelete('set null');
            $table->index(['status', 'subscription_status']);
            $table->index(['domain']); // for custom domain lookups
        });

        // Tenant Subscriptions
        Schema::create('tenant_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('plan_name'); // basic, professional, enterprise
            $table->decimal('monthly_price', 10, 2);
            $table->integer('user_limit')->default(5);
            $table->integer('product_limit')->default(100);
            $table->integer('storage_limit_mb')->default(1000); // 1GB
            $table->boolean('custom_domain_enabled')->default(false);
            $table->boolean('api_access_enabled')->default(false);
            $table->json('features')->nullable(); // JSON array of enabled features
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'status']);
        });

        // Domain Mappings (for custom domain support)
        Schema::create('domain_mappings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('domain'); // custom domain: tenant1.com
            $table->string('subdomain')->nullable(); // subdomain: shop.tenant1.com  
            $table->boolean('is_primary')->default(true);
            $table->boolean('ssl_enabled')->default(false);
            $table->string('ssl_certificate_path')->nullable();
            $table->enum('status', ['pending', 'active', 'failed'])->default('pending');
            $table->json('dns_records')->nullable(); // Required DNS configuration
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['domain', 'subdomain']);
            $table->index(['domain', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('domain_mappings');
        Schema::dropIfExists('tenant_subscriptions');
        Schema::dropIfExists('tenants');
        Schema::dropIfExists('accounts');
    }
};
