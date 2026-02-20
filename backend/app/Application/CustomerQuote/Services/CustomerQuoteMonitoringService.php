<?php

namespace App\Application\CustomerQuote\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Customer Quote Monitoring Service
 * 
 * Provides comprehensive monitoring for customer quote workflow including:
 * - Quote action logging
 * - Quote acceptance rate metrics
 * - Negotiation round metrics
 * - Auto-approval rate metrics
 * - Quote expiration tracking
 * - PDF generation error tracking
 * - Email delivery tracking
 */
class CustomerQuoteMonitoringService
{
    /**
     * Log quote action with context
     */
    public function logQuoteAction(
        string $action,
        int $quoteId,
        ?int $userId = null,
        ?int $customerId = null,
        array $context = []
    ): void {
        $logData = [
            'action' => $action,
            'quote_id' => $quoteId,
            'user_id' => $userId,
            'customer_id' => $customerId,
            'timestamp' => now()->toIso8601String(),
            'context' => $context,
        ];

        Log::channel('customer_quote')->info("Quote Action: {$action}", $logData);

        // Store in cache for metrics calculation
        $this->incrementActionCounter($action);
    }

    /**
     * Log quote acceptance with approval method
     */
    public function logQuoteAcceptance(
        int $quoteId,
        string $approvalMethod,
        ?string $approvalReason = null,
        array $metadata = []
    ): void {
        $logData = [
            'quote_id' => $quoteId,
            'approval_method' => $approvalMethod,
            'approval_reason' => $approvalReason,
            'metadata' => $metadata,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('customer_quote')->info("Quote Accepted: {$approvalMethod}", $logData);

        // Track approval method metrics
        $this->incrementApprovalMethodCounter($approvalMethod);
    }

    /**
     * Log quote rejection with reason
     */
    public function logQuoteRejection(
        int $quoteId,
        string $rejectedBy,
        string $reason,
        array $context = []
    ): void {
        $logData = [
            'quote_id' => $quoteId,
            'rejected_by' => $rejectedBy,
            'reason' => $reason,
            'context' => $context,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('customer_quote')->warning("Quote Rejected", $logData);

        // Track rejection reasons
        $this->incrementRejectionReasonCounter($reason);
    }

    /**
     * Log negotiation round
     */
    public function logNegotiationRound(
        int $quoteId,
        int $roundNumber,
        string $initiator,
        int $originalAmount,
        int $counterAmount,
        array $context = []
    ): void {
        $logData = [
            'quote_id' => $quoteId,
            'round_number' => $roundNumber,
            'initiator' => $initiator,
            'original_amount' => $originalAmount,
            'counter_amount' => $counterAmount,
            'difference' => $originalAmount - $counterAmount,
            'difference_percentage' => (($originalAmount - $counterAmount) / $originalAmount) * 100,
            'context' => $context,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('customer_quote')->info("Negotiation Round {$roundNumber}", $logData);

        // Track negotiation metrics
        $this->incrementNegotiationRoundCounter($roundNumber);
    }

    /**
     * Log quote expiration
     */
    public function logQuoteExpiration(int $quoteId, array $context = []): void
    {
        $logData = [
            'quote_id' => $quoteId,
            'context' => $context,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('customer_quote')->warning("Quote Expired", $logData);

        // Track expiration metrics
        $this->incrementActionCounter('quote_expired');
    }

    /**
     * Log PDF generation error
     */
    public function logPDFGenerationError(
        string $documentType,
        int $quoteId,
        \Exception $exception,
        array $context = []
    ): void {
        $logData = [
            'document_type' => $documentType,
            'quote_id' => $quoteId,
            'error_message' => $exception->getMessage(),
            'error_trace' => $exception->getTraceAsString(),
            'context' => $context,
            'timestamp' => now()->toIso8601String(),
        ];

        Log::channel('customer_quote')->error("PDF Generation Failed: {$documentType}", $logData);

        // Track PDF generation errors
        $this->incrementErrorCounter('pdf_generation', $documentType);
    }

    /**
     * Log email delivery status
     */
    public function logEmailDelivery(
        string $emailType,
        int $quoteId,
        string $recipient,
        bool $success,
        ?string $errorMessage = null,
        array $context = []
    ): void {
        $logData = [
            'email_type' => $emailType,
            'quote_id' => $quoteId,
            'recipient' => $recipient,
            'success' => $success,
            'error_message' => $errorMessage,
            'context' => $context,
            'timestamp' => now()->toIso8601String(),
        ];

        if ($success) {
            Log::channel('customer_quote')->info("Email Sent: {$emailType}", $logData);
        } else {
            Log::channel('customer_quote')->error("Email Failed: {$emailType}", $logData);
            $this->incrementErrorCounter('email_delivery', $emailType);
        }
    }

    /**
     * Get quote acceptance rate
     */
    public function getQuoteAcceptanceRate(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.quote_acceptance_rate.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $totalQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', '!=', 'draft')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            if ($totalQuotes === 0) {
                return 0.0;
            }

            $acceptedQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'accepted')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            return ($acceptedQuotes / $totalQuotes) * 100;
        });
    }

    /**
     * Get quote rejection rate
     */
    public function getQuoteRejectionRate(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.quote_rejection_rate.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $totalQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', '!=', 'draft')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            if ($totalQuotes === 0) {
                return 0.0;
            }

            $rejectedQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'rejected')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            return ($rejectedQuotes / $totalQuotes) * 100;
        });
    }

    /**
     * Get counter offer rate
     */
    public function getCounterOfferRate(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.counter_offer_rate.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $totalQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', '!=', 'draft')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            if ($totalQuotes === 0) {
                return 0.0;
            }

            $counteredQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('counter_offer_round', '>', 0)
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            return ($counteredQuotes / $totalQuotes) * 100;
        });
    }

    /**
     * Get average negotiation rounds
     */
    public function getAverageNegotiationRounds(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.avg_negotiation_rounds.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $result = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('counter_offer_round', '>', 0)
                ->where('created_at', '>=', now()->subDays($days))
                ->avg('counter_offer_round');

            return $result ?? 0.0;
        });
    }

    /**
     * Get auto-approval rate
     */
    public function getAutoApprovalRate(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.auto_approval_rate.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $totalAccepted = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'accepted')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            if ($totalAccepted === 0) {
                return 0.0;
            }

            $autoApproved = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'accepted')
                ->where('approval_method', 'auto')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            return ($autoApproved / $totalAccepted) * 100;
        });
    }

    /**
     * Get average time to acceptance
     */
    public function getAverageTimeToAcceptance(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.avg_time_to_acceptance.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $quotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'accepted')
                ->whereNotNull('sent_at')
                ->whereNotNull('approved_at')
                ->where('created_at', '>=', now()->subDays($days))
                ->select('sent_at', 'approved_at')
                ->get();

            if ($quotes->isEmpty()) {
                return 0.0;
            }

            $totalHours = 0;
            foreach ($quotes as $quote) {
                $sentAt = \Carbon\Carbon::parse($quote->sent_at);
                $approvedAt = \Carbon\Carbon::parse($quote->approved_at);
                $totalHours += $sentAt->diffInHours($approvedAt);
            }

            return $totalHours / $quotes->count();
        });
    }

    /**
     * Get quote expiry rate
     */
    public function getQuoteExpiryRate(int $tenantId, int $days = 30): float
    {
        $cacheKey = "metrics.quote_expiry_rate.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $totalQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', '!=', 'draft')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            if ($totalQuotes === 0) {
                return 0.0;
            }

            $expiredQuotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'expired')
                ->where('created_at', '>=', now()->subDays($days))
                ->count();

            return ($expiredQuotes / $totalQuotes) * 100;
        });
    }

    /**
     * Get approval reasons breakdown
     */
    public function getApprovalReasonsBreakdown(int $tenantId, int $days = 30): array
    {
        $cacheKey = "metrics.approval_reasons.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $quotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('approval_method', 'manual')
                ->whereNotNull('approval_reason')
                ->where('created_at', '>=', now()->subDays($days))
                ->select('approval_reason')
                ->get();

            $breakdown = [];
            foreach ($quotes as $quote) {
                $reason = $quote->approval_reason;
                $breakdown[$reason] = ($breakdown[$reason] ?? 0) + 1;
            }

            return $breakdown;
        });
    }

    /**
     * Get rejection reasons breakdown
     */
    public function getRejectionReasonsBreakdown(int $tenantId, int $days = 30): array
    {
        $cacheKey = "metrics.rejection_reasons.{$tenantId}.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($tenantId, $days) {
            $quotes = DB::table('customer_quotes')
                ->where('tenant_id', $tenantId)
                ->where('status', 'rejected')
                ->whereNotNull('rejection_reason')
                ->where('created_at', '>=', now()->subDays($days))
                ->select('rejection_reason')
                ->get();

            $breakdown = [];
            foreach ($quotes as $quote) {
                $reason = $quote->rejection_reason;
                $breakdown[$reason] = ($breakdown[$reason] ?? 0) + 1;
            }

            return $breakdown;
        });
    }

    /**
     * Get PDF generation error count
     */
    public function getPDFGenerationErrorCount(int $days = 7): int
    {
        $cacheKey = "metrics.pdf_errors.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($days) {
            return (int) Cache::get("errors.pdf_generation.count.{$days}", 0);
        });
    }

    /**
     * Get email delivery error count
     */
    public function getEmailDeliveryErrorCount(int $days = 7): int
    {
        $cacheKey = "metrics.email_errors.{$days}";

        return Cache::remember($cacheKey, 300, function () use ($days) {
            return (int) Cache::get("errors.email_delivery.count.{$days}", 0);
        });
    }

    /**
     * Get comprehensive metrics dashboard
     */
    public function getMetricsDashboard(int $tenantId, int $days = 30): array
    {
        return [
            'acceptance_rate' => $this->getQuoteAcceptanceRate($tenantId, $days),
            'rejection_rate' => $this->getQuoteRejectionRate($tenantId, $days),
            'counter_offer_rate' => $this->getCounterOfferRate($tenantId, $days),
            'avg_negotiation_rounds' => $this->getAverageNegotiationRounds($tenantId, $days),
            'auto_approval_rate' => $this->getAutoApprovalRate($tenantId, $days),
            'avg_time_to_acceptance' => $this->getAverageTimeToAcceptance($tenantId, $days),
            'expiry_rate' => $this->getQuoteExpiryRate($tenantId, $days),
            'approval_reasons' => $this->getApprovalReasonsBreakdown($tenantId, $days),
            'rejection_reasons' => $this->getRejectionReasonsBreakdown($tenantId, $days),
            'pdf_errors' => $this->getPDFGenerationErrorCount(7),
            'email_errors' => $this->getEmailDeliveryErrorCount(7),
        ];
    }

    /**
     * Increment action counter
     */
    private function incrementActionCounter(string $action): void
    {
        $key = "metrics.quote_actions.{$action}." . now()->format('Y-m-d');
        Cache::increment($key);
        Cache::put($key, Cache::get($key, 0), now()->addDays(30));
    }

    /**
     * Increment approval method counter
     */
    private function incrementApprovalMethodCounter(string $method): void
    {
        $key = "metrics.approval_method.{$method}." . now()->format('Y-m-d');
        Cache::increment($key);
        Cache::put($key, Cache::get($key, 0), now()->addDays(30));
    }

    /**
     * Increment rejection reason counter
     */
    private function incrementRejectionReasonCounter(string $reason): void
    {
        $key = "metrics.rejection_reason." . md5($reason) . "." . now()->format('Y-m-d');
        Cache::increment($key);
        Cache::put($key, Cache::get($key, 0), now()->addDays(30));
    }

    /**
     * Increment negotiation round counter
     */
    private function incrementNegotiationRoundCounter(int $round): void
    {
        $key = "metrics.negotiation_round.{$round}." . now()->format('Y-m-d');
        Cache::increment($key);
        Cache::put($key, Cache::get($key, 0), now()->addDays(30));
    }

    /**
     * Increment error counter
     */
    private function incrementErrorCounter(string $errorType, string $subType): void
    {
        $key = "errors.{$errorType}.{$subType}." . now()->format('Y-m-d');
        Cache::increment($key);
        Cache::put($key, Cache::get($key, 0), now()->addDays(7));

        // Also increment total count
        $totalKey = "errors.{$errorType}.count.7";
        Cache::increment($totalKey);
    }
}
