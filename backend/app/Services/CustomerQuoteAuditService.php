<?php

namespace App\Services;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Customer Quote Audit Service
 * 
 * Provides comprehensive audit logging for all customer quote actions
 * Tracks who did what, when, and from where
 */
class CustomerQuoteAuditService
{
    /**
     * Log a quote action
     *
     * @param CustomerQuote $quote
     * @param string $action
     * @param string $actorType (admin|customer|system)
     * @param int|null $actorId
     * @param array $metadata
     * @return void
     */
    public function logAction(
        CustomerQuote $quote,
        string $action,
        string $actorType,
        ?int $actorId = null,
        array $metadata = []
    ): void {
        $entry = [
            'action' => $action,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'timestamp' => now()->toIso8601String(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $metadata,
        ];
        
        // Add to quote history - ensure history is an array
        $history = is_array($quote->history) ? $quote->history : [];
        $history[] = $entry;
        $quote->history = $history;
        $quote->save();
        
        // Also log to Laravel log for monitoring
        Log::info("Customer Quote Action: {$action}", [
            'quote_id' => $quote->id,
            'quote_uuid' => $quote->uuid,
            'quote_number' => $quote->quote_number,
            'tenant_id' => $quote->tenant_id,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'ip_address' => $entry['ip_address'],
        ]);
        
        // Store in separate audit log table for compliance
        $this->storeInAuditTable($quote, $entry);
    }
    
    /**
     * Log quote view action
     *
     * @param CustomerQuote $quote
     * @param string $actorType
     * @param int|null $actorId
     * @return void
     */
    public function logView(CustomerQuote $quote, string $actorType = 'customer', ?int $actorId = null): void
    {
        $this->logAction($quote, 'quote_viewed', $actorType, $actorId, [
            'viewed_at' => now()->toIso8601String(),
        ]);
    }
    
    /**
     * Log quote acceptance
     *
     * @param CustomerQuote $quote
     * @param int $customerId
     * @param string $approvalMethod
     * @param string|null $approvalReason
     * @return void
     */
    public function logAcceptance(
        CustomerQuote $quote,
        int $customerId,
        string $approvalMethod,
        ?string $approvalReason = null
    ): void {
        $this->logAction($quote, 'quote_accepted', 'customer', $customerId, [
            'approval_method' => $approvalMethod,
            'approval_reason' => $approvalReason,
            'accepted_at' => now()->toIso8601String(),
        ]);
    }
    
    /**
     * Log quote rejection
     *
     * @param CustomerQuote $quote
     * @param int $customerId
     * @param string $reason
     * @return void
     */
    public function logRejection(CustomerQuote $quote, int $customerId, string $reason): void
    {
        $this->logAction($quote, 'quote_rejected', 'customer', $customerId, [
            'rejection_reason' => $reason,
            'rejected_at' => now()->toIso8601String(),
        ]);
    }
    
    /**
     * Log counter offer
     *
     * @param CustomerQuote $quote
     * @param int $customerId
     * @param int $counterAmount
     * @param string $notes
     * @return void
     */
    public function logCounterOffer(
        CustomerQuote $quote,
        int $customerId,
        int $counterAmount,
        string $notes
    ): void {
        $this->logAction($quote, 'counter_offer_submitted', 'customer', $customerId, [
            'counter_amount' => $counterAmount,
            'original_amount' => $quote->grand_total,
            'difference' => $quote->grand_total - $counterAmount,
            'notes' => $notes,
            'round' => $quote->counter_offer_round + 1,
        ]);
    }
    
    /**
     * Log admin approval
     *
     * @param CustomerQuote $quote
     * @param int $adminId
     * @param string|null $notes
     * @return void
     */
    public function logAdminApproval(CustomerQuote $quote, int $adminId, ?string $notes = null): void
    {
        $this->logAction($quote, 'admin_approved', 'admin', $adminId, [
            'approval_notes' => $notes,
            'approved_at' => now()->toIso8601String(),
        ]);
    }
    
    /**
     * Log admin rejection
     *
     * @param CustomerQuote $quote
     * @param int $adminId
     * @param string $reason
     * @return void
     */
    public function logAdminRejection(CustomerQuote $quote, int $adminId, string $reason): void
    {
        $this->logAction($quote, 'admin_rejected', 'admin', $adminId, [
            'rejection_reason' => $reason,
            'rejected_at' => now()->toIso8601String(),
        ]);
    }
    
    /**
     * Log security event
     *
     * @param CustomerQuote|null $quote
     * @param string $event
     * @param array $details
     * @return void
     */
    public function logSecurityEvent(?CustomerQuote $quote, string $event, array $details = []): void
    {
        $logData = [
            'event' => $event,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'url' => request()->fullUrl(),
            'details' => $details,
            'timestamp' => now()->toIso8601String(),
        ];
        
        if ($quote) {
            $logData['quote_id'] = $quote->id;
            $logData['quote_uuid'] = $quote->uuid;
            $logData['tenant_id'] = $quote->tenant_id;
        }
        
        Log::warning("Security Event: {$event}", $logData);
        
        // Store in security audit table
        DB::table('security_audit_log')->insert([
            'event_type' => $event,
            'quote_id' => $quote?->id,
            'tenant_id' => $quote?->tenant_id,
            'ip_address' => $logData['ip_address'],
            'user_agent' => $logData['user_agent'],
            'url' => $logData['url'],
            'details' => json_encode($details),
            'created_at' => now(),
        ]);
    }
    
    /**
     * Store audit entry in separate table for compliance
     *
     * @param CustomerQuote $quote
     * @param array $entry
     * @return void
     */
    private function storeInAuditTable(CustomerQuote $quote, array $entry): void
    {
        try {
            DB::table('customer_quote_audit_log')->insert([
                'quote_id' => $quote->id,
                'tenant_id' => $quote->tenant_id,
                'action' => $entry['action'],
                'actor_type' => $entry['actor_type'],
                'actor_id' => $entry['actor_id'],
                'ip_address' => $entry['ip_address'],
                'user_agent' => $entry['user_agent'],
                'metadata' => json_encode($entry['metadata']),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the operation
            Log::error('Failed to store audit entry', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Get audit trail for a quote
     *
     * @param CustomerQuote $quote
     * @return array
     */
    public function getAuditTrail(CustomerQuote $quote): array
    {
        return DB::table('customer_quote_audit_log')
            ->where('quote_id', $quote->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }
}
