<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add performance indexes for vendor portal queries to optimize API response times.
     * Target: All API responses < 500ms
     * 
     * Performance Optimizations:
     * 1. Vendor authentication queries (findByUserId)
     * 2. Quote list queries with filters (status, vendor_id, search)
     * 3. Quote expiration queries (findExpiringSoon, findExpiredQuotes)
     * 4. Vendor statistics queries (getVendorStatistics, calculateVendorMetrics)
     * 5. Message thread queries (findByQuote, countUnread)
     * 6. Audit log queries (findByUser, findByAction, findByEntity)
     * 
     * Requirements: 10.2.2 (Performance Optimization)
     */
    public function up(): void
    {
        // ============================================================
        // 1. USERS TABLE - Vendor Authentication Optimization
        // ============================================================
        
        // Composite index for vendor user lookup (email + account_type)
        // Query: WHERE email = ? AND account_type = 'vendor'
        // Used in: VendorAuthMiddleware, AuthenticateVendorUseCase
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_users_email_account_type 
            ON users(email, account_type) 
            WHERE account_type = \'vendor\'
        ');
        
        // Index for failed login tracking
        // Query: WHERE email = ? AND failed_login_attempts > 0
        // Used in: AuthenticateVendorUseCase (account lockout check)
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_users_failed_logins 
            ON users(email, failed_login_attempts) 
            WHERE failed_login_attempts > 0
        ');
        
        // ============================================================
        // 2. VENDORS TABLE - Portal Access & Performance Metrics
        // ============================================================
        
        // Composite index for active portal vendors
        // Query: WHERE tenant_id = ? AND portal_access_enabled = true AND status = 'active'
        // Used in: VendorRepository::findWithPortalAccess
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_vendors_portal_active 
            ON vendors(tenant_id, portal_access_enabled, status) 
            WHERE portal_access_enabled = true AND status = \'active\'
        ');
        
        // Index for vendor performance queries
        // Query: WHERE tenant_id = ? AND status = 'active' ORDER BY rating DESC
        // Used in: Admin vendor list with performance sorting
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_vendors_tenant_status_rating 
            ON vendors(tenant_id, status, rating DESC) 
            WHERE status = \'active\'
        ');
        
        // ============================================================
        // 3. ORDER_VENDOR_NEGOTIATIONS - Quote List & Search Optimization
        // ============================================================
        
        // Composite index for vendor quote list with status filter
        // Query: WHERE vendor_id = ? AND tenant_id = ? AND status = ? ORDER BY created_at DESC
        // Used in: GetVendorQuotesUseCase (most common query)
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_ovn_vendor_tenant_status_created 
            ON order_vendor_negotiations(vendor_id, tenant_id, status, created_at DESC)
        ');
        
        // Index for quote search by quote_number
        // Query: WHERE tenant_id = ? AND quote_number ILIKE '%search%'
        // Used in: GetVendorQuotesUseCase (search functionality)
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_ovn_quote_number_trgm 
            ON order_vendor_negotiations USING gin(quote_number gin_trgm_ops)
        ');
        
        // Composite index for expiring quotes
        // Query: WHERE tenant_id = ? AND status IN ('sent', 'pending_response') AND expires_at BETWEEN ? AND ?
        // Used in: SendQuoteRemindersUseCase, ExpireQuotesUseCase
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_ovn_tenant_status_expires 
            ON order_vendor_negotiations(tenant_id, status, expires_at) 
            WHERE status IN (\'sent\', \'pending_response\', \'countered\') AND expires_at IS NOT NULL
        ');
        
        // Index for vendor response time calculation
        // Query: WHERE vendor_id = ? AND responded_at IS NOT NULL AND sent_at IS NOT NULL
        // Used in: QuoteRepository::calculateVendorMetrics
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_ovn_vendor_response_times 
            ON order_vendor_negotiations(vendor_id, sent_at, responded_at) 
            WHERE responded_at IS NOT NULL AND sent_at IS NOT NULL
        ');
        
        // Composite index for pending vendor action
        // Query: WHERE vendor_id = ? AND tenant_id = ? AND status IN ('sent', 'pending_response') AND responded_at IS NULL
        // Used in: QuoteRepository::findRequiringVendorAction
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_ovn_vendor_pending_action 
            ON order_vendor_negotiations(vendor_id, tenant_id, status, created_at DESC) 
            WHERE status IN (\'sent\', \'pending_response\') AND responded_at IS NULL
        ');
        
        // ============================================================
        // 4. QUOTE_MESSAGES - Message Thread Optimization
        // ============================================================
        
        // Composite index for message thread with read status
        // Query: WHERE quote_id = ? ORDER BY created_at DESC
        // Used in: GetQuoteMessagesUseCase
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_quote_messages_quote_created 
            ON quote_messages(quote_id, created_at DESC)
        ');
        
        // Index for unread message count by sender type
        // Query: WHERE quote_id = ? AND sender_type = 'admin' AND is_read = false
        // Used in: MessageRepository::countUnreadBySenderType
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_quote_messages_unread_sender 
            ON quote_messages(quote_id, sender_type, is_read) 
            WHERE is_read = false
        ');
        
        // ============================================================
        // 5. AUDIT_LOGS - Audit Trail Query Optimization
        // ============================================================
        
        // Composite index for user audit trail
        // Query: WHERE user_id = ? AND tenant_id = ? ORDER BY created_at DESC
        // Used in: AuditLogRepository::findByUser
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_audit_logs_user_tenant_created 
            ON audit_logs(user_id, tenant_id, created_at DESC)
        ');
        
        // Composite index for action type filtering
        // Query: WHERE tenant_id = ? AND action_type = ? ORDER BY created_at DESC
        // Used in: AuditLogRepository::findByAction
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action_created 
            ON audit_logs(tenant_id, action_type, created_at DESC)
        ');
        
        // Composite index for resource audit trail
        // Query: WHERE tenant_id = ? AND resource_type = ? AND resource_id = ? ORDER BY created_at DESC
        // Used in: AuditLogRepository::findByEntity
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_created 
            ON audit_logs(tenant_id, resource_type, resource_id, created_at DESC)
        ');
        
        // Index for audit log retention cleanup
        // Query: WHERE created_at < ? (for deletion)
        // Used in: AuditLogRepository::deleteOlderThan
        // Note: Simple index without WHERE clause for better compatibility
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_audit_logs_created_cleanup 
            ON audit_logs(created_at)
        ');
        
        // ============================================================
        // 6. NOTIFICATIONS - Vendor Notification Optimization
        // ============================================================
        
        // Composite index for unread vendor notifications
        // Query: WHERE user_id = ? AND tenant_id = ? AND read_at IS NULL ORDER BY created_at DESC
        // Used in: Vendor notification dropdown
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_notifications_user_tenant_unread 
            ON notifications(user_id, tenant_id, created_at DESC) 
            WHERE read_at IS NULL
        ');
        
        // ============================================================
        // 7. ENABLE POSTGRESQL EXTENSIONS FOR PERFORMANCE
        // ============================================================
        
        // Enable pg_trgm extension for fuzzy text search (if not already enabled)
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        
        // Enable btree_gin extension for composite GIN indexes (if not already enabled)
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gin');
        
        // ============================================================
        // 8. ANALYZE TABLES FOR QUERY PLANNER OPTIMIZATION
        // ============================================================
        
        // Update PostgreSQL statistics for better query planning
        DB::statement('ANALYZE users');
        DB::statement('ANALYZE vendors');
        DB::statement('ANALYZE order_vendor_negotiations');
        DB::statement('ANALYZE quote_messages');
        DB::statement('ANALYZE audit_logs');
        DB::statement('ANALYZE notifications');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes in reverse order
        DB::statement('DROP INDEX IF EXISTS idx_notifications_user_tenant_unread');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_created_cleanup');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_resource_created');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_tenant_action_created');
        DB::statement('DROP INDEX IF EXISTS idx_audit_logs_user_tenant_created');
        DB::statement('DROP INDEX IF EXISTS idx_quote_messages_unread_sender');
        DB::statement('DROP INDEX IF EXISTS idx_quote_messages_quote_created');
        DB::statement('DROP INDEX IF EXISTS idx_ovn_vendor_pending_action');
        DB::statement('DROP INDEX IF EXISTS idx_ovn_vendor_response_times');
        DB::statement('DROP INDEX IF EXISTS idx_ovn_tenant_status_expires');
        DB::statement('DROP INDEX IF EXISTS idx_ovn_quote_number_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_ovn_vendor_tenant_status_created');
        DB::statement('DROP INDEX IF EXISTS idx_vendors_tenant_status_rating');
        DB::statement('DROP INDEX IF EXISTS idx_vendors_portal_active');
        DB::statement('DROP INDEX IF EXISTS idx_users_failed_logins');
        DB::statement('DROP INDEX IF EXISTS idx_users_email_account_type');
    }
};
