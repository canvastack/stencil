<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Create audit_logs table for tracking vendor actions and system events.
     * Requirements: 16.1, 16.2, 16.3, 16.4
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            // Primary Key
            $table->id();
            
            // Multi-Tenant Isolation (MANDATORY)
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            // Actor Information
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('user_type', 20);
            
            // Action Details
            $table->string('action_type', 50);
            $table->string('resource_type', 50);
            $table->string('resource_id', 255)->nullable();
            
            // Action Data
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
            $table->jsonb('metadata')->default('{}');
            
            // Request Context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            // Timestamp (no updated_at needed for audit logs)
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
        });
        
        // Add check constraint for user_type
        DB::statement("ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_type_check CHECK (user_type IN ('platform', 'tenant', 'vendor'))");
        
        // Indexes for performance
        DB::statement('CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id)');
        DB::statement('CREATE INDEX idx_audit_logs_user ON audit_logs(user_id)');
        DB::statement('CREATE INDEX idx_audit_logs_action ON audit_logs(action_type)');
        DB::statement('CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id)');
        DB::statement('CREATE INDEX idx_audit_logs_created ON audit_logs(tenant_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC)');
        
        // Add comments
        DB::statement("COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all vendor portal actions and system events'");
        DB::statement("COMMENT ON COLUMN audit_logs.user_type IS 'Type of user who performed the action: platform, tenant, or vendor'");
        DB::statement("COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (e.g., login, quote_accepted, profile_updated)'");
        DB::statement("COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., quote, vendor, message)'");
        DB::statement("COMMENT ON COLUMN audit_logs.resource_id IS 'UUID of the affected resource'");
        DB::statement("COMMENT ON COLUMN audit_logs.old_values IS 'Previous values before update (for update actions)'");
        DB::statement("COMMENT ON COLUMN audit_logs.new_values IS 'New values after update (for update actions)'");
        DB::statement("COMMENT ON COLUMN audit_logs.metadata IS 'Additional context data for the action'");
        DB::statement("COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request'");
        DB::statement("COMMENT ON COLUMN audit_logs.user_agent IS 'Browser/client user agent string'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
