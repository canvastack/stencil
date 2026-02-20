<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add performance indexes for customer quote queries
     */
    public function up(): void
    {
        Schema::table('customer_quotes', function (Blueprint $table) {
            // Composite index for pending approvals query (tenant + status + timestamp)
            $table->index(['tenant_id', 'status', 'responded_at'], 'idx_cq_pending_approval');
            
            // Index for expiring quotes query (valid_until + status)
            $table->index(['valid_until', 'status'], 'idx_cq_expiring');
            
            // Index for customer lookup via order
            $table->index(['order_id', 'status'], 'idx_cq_order_status');
            
            // Index for vendor quote lookup
            $table->index(['vendor_quote_id', 'tenant_id'], 'idx_cq_vendor_tenant');
            
            // Index for created_by user queries
            $table->index(['created_by', 'tenant_id'], 'idx_cq_creator');
            
            // Index for approval queries
            $table->index(['approved_by', 'approved_at'], 'idx_cq_approver');
        });

        Schema::table('customer_quote_approval_settings', function (Blueprint $table) {
            // Already has unique index on tenant_id, but add for consistency
            if (!Schema::hasIndex('customer_quote_approval_settings', 'idx_cqas_tenant')) {
                $table->index('tenant_id', 'idx_cqas_tenant');
            }
        });

        Schema::table('order_documents', function (Blueprint $table) {
            // Composite index for customer quote documents
            $table->index(['customer_quote_id', 'document_type'], 'idx_od_cq_type');
            
            // Index for document status queries
            $table->index(['tenant_id', 'status'], 'idx_od_tenant_status');
            
            // Index for recipient queries
            $table->index(['recipient_type', 'recipient_id'], 'idx_od_recipient');
            
            // Index for document type and date
            $table->index(['document_type', 'document_date'], 'idx_od_type_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_quotes', function (Blueprint $table) {
            $table->dropIndex('idx_cq_pending_approval');
            $table->dropIndex('idx_cq_expiring');
            $table->dropIndex('idx_cq_order_status');
            $table->dropIndex('idx_cq_vendor_tenant');
            $table->dropIndex('idx_cq_creator');
            $table->dropIndex('idx_cq_approver');
        });

        Schema::table('customer_quote_approval_settings', function (Blueprint $table) {
            if (Schema::hasIndex('customer_quote_approval_settings', 'idx_cqas_tenant')) {
                $table->dropIndex('idx_cqas_tenant');
            }
        });

        Schema::table('order_documents', function (Blueprint $table) {
            $table->dropIndex('idx_od_cq_type');
            $table->dropIndex('idx_od_tenant_status');
            $table->dropIndex('idx_od_recipient');
            $table->dropIndex('idx_od_type_date');
        });
    }
};
