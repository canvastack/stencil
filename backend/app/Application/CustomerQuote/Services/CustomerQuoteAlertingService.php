<?php

namespace App\Application\CustomerQuote\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use App\Notifications\CustomerQuote\CriticalMetricAlert;
use App\Infrastructure\Persistence\Eloquent\Models\User;

/**
 * Customer Quote Alerting Service
 * 
 * Monitors critical metrics and sends alerts when thresholds are exceeded
 */
class CustomerQuoteAlertingService
{
    private const CACHE_PREFIX = 'alert.last_sent.';
    private const ALERT_COOLDOWN = 3600; // 1 hour cooldown between same alerts

    public function __construct(
        private CustomerQuoteMonitoringService $monitoringService
    ) {}

    /**
     * Check all critical metrics and send alerts if needed
     */
    public function checkCriticalMetrics(int $tenantId): void
    {
        $config = $this->getAlertConfiguration();

        if (!$config['enabled']) {
            return;
        }

        // Check each metric
        $this->checkHighRejectionRate($tenantId, $config);
        $this->checkLowAcceptanceRate($tenantId, $config);
        $this->checkHighExpiryRate($tenantId, $config);
        $this->checkPDFGenerationErrors($config);
        $this->checkEmailDeliveryErrors($config);
        $this->checkOverdueApprovals($tenantId, $config);
    }

    /**
     * Check for high rejection rate
     */
    private function checkHighRejectionRate(int $tenantId, array $config): void
    {
        $threshold = $config['thresholds']['high_rejection_rate'];
        $days = $config['monitoring_period_days'];

        $rejectionRate = $this->monitoringService->getQuoteRejectionRate($tenantId, $days);

        if ($rejectionRate > $threshold) {
            $this->sendAlert(
                $tenantId,
                'high_rejection_rate',
                'High Quote Rejection Rate',
                "Quote rejection rate is {$rejectionRate}% (threshold: {$threshold}%)",
                'critical',
                [
                    'rejection_rate' => $rejectionRate,
                    'threshold' => $threshold,
                    'period_days' => $days,
                ]
            );
        }
    }

    /**
     * Check for low acceptance rate
     */
    private function checkLowAcceptanceRate(int $tenantId, array $config): void
    {
        $threshold = $config['thresholds']['low_acceptance_rate'];
        $days = $config['monitoring_period_days'];

        $acceptanceRate = $this->monitoringService->getQuoteAcceptanceRate($tenantId, $days);

        if ($acceptanceRate < $threshold) {
            $this->sendAlert(
                $tenantId,
                'low_acceptance_rate',
                'Low Quote Acceptance Rate',
                "Quote acceptance rate is {$acceptanceRate}% (threshold: {$threshold}%)",
                'warning',
                [
                    'acceptance_rate' => $acceptanceRate,
                    'threshold' => $threshold,
                    'period_days' => $days,
                ]
            );
        }
    }

    /**
     * Check for high expiry rate
     */
    private function checkHighExpiryRate(int $tenantId, array $config): void
    {
        $threshold = $config['thresholds']['high_expiry_rate'];
        $days = $config['monitoring_period_days'];

        $expiryRate = $this->monitoringService->getQuoteExpiryRate($tenantId, $days);

        if ($expiryRate > $threshold) {
            $this->sendAlert(
                $tenantId,
                'high_expiry_rate',
                'High Quote Expiry Rate',
                "Quote expiry rate is {$expiryRate}% (threshold: {$threshold}%)",
                'warning',
                [
                    'expiry_rate' => $expiryRate,
                    'threshold' => $threshold,
                    'period_days' => $days,
                ]
            );
        }
    }

    /**
     * Check for PDF generation errors
     */
    private function checkPDFGenerationErrors(array $config): void
    {
        $threshold = $config['thresholds']['pdf_generation_errors'];
        $days = $config['error_monitoring_period_days'];

        $errorCount = $this->monitoringService->getPDFGenerationErrorCount($days);

        if ($errorCount > $threshold) {
            $this->sendAlert(
                null,
                'pdf_generation_errors',
                'High PDF Generation Error Rate',
                "PDF generation errors: {$errorCount} in last {$days} days (threshold: {$threshold})",
                'critical',
                [
                    'error_count' => $errorCount,
                    'threshold' => $threshold,
                    'period_days' => $days,
                ]
            );
        }
    }

    /**
     * Check for email delivery errors
     */
    private function checkEmailDeliveryErrors(array $config): void
    {
        $threshold = $config['thresholds']['email_delivery_errors'];
        $days = $config['error_monitoring_period_days'];

        $errorCount = $this->monitoringService->getEmailDeliveryErrorCount($days);

        if ($errorCount > $threshold) {
            $this->sendAlert(
                null,
                'email_delivery_errors',
                'High Email Delivery Error Rate',
                "Email delivery errors: {$errorCount} in last {$days} days (threshold: {$threshold})",
                'critical',
                [
                    'error_count' => $errorCount,
                    'threshold' => $threshold,
                    'period_days' => $days,
                ]
            );
        }
    }

    /**
     * Check for overdue approvals
     */
    private function checkOverdueApprovals(int $tenantId, array $config): void
    {
        $slaHours = $config['thresholds']['approval_sla_hours'];

        $overdueCount = \App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote::where('tenant_id', $tenantId)
            ->where('status', 'pending_approval')
            ->where('responded_at', '<', now()->subHours($slaHours))
            ->count();

        if ($overdueCount > 0) {
            $this->sendAlert(
                $tenantId,
                'overdue_approvals',
                'Overdue Quote Approvals',
                "{$overdueCount} quotes pending approval for more than {$slaHours} hours",
                'warning',
                [
                    'overdue_count' => $overdueCount,
                    'sla_hours' => $slaHours,
                ]
            );
        }
    }

    /**
     * Send alert via configured channels
     */
    private function sendAlert(
        ?int $tenantId,
        string $alertType,
        string $title,
        string $message,
        string $severity,
        array $data = []
    ): void {
        // Check cooldown
        $cacheKey = self::CACHE_PREFIX . $alertType . ($tenantId ? ".{$tenantId}" : '');
        
        if (Cache::has($cacheKey)) {
            return; // Alert already sent recently
        }

        // Log alert
        Log::channel('customer_quote')->warning("Alert: {$title}", [
            'alert_type' => $alertType,
            'severity' => $severity,
            'message' => $message,
            'tenant_id' => $tenantId,
            'data' => $data,
        ]);

        // Send to Slack if configured
        if (config('logging.channels.slack.url')) {
            $this->sendSlackAlert($title, $message, $severity, $data);
        }

        // Send email notifications to admins
        $this->sendEmailAlert($tenantId, $title, $message, $severity, $data);

        // Set cooldown
        Cache::put($cacheKey, true, self::ALERT_COOLDOWN);
    }

    /**
     * Send Slack alert
     */
    private function sendSlackAlert(string $title, string $message, string $severity, array $data): void
    {
        try {
            $color = match($severity) {
                'critical' => 'danger',
                'warning' => 'warning',
                default => 'good',
            };

            $emoji = match($severity) {
                'critical' => ':rotating_light:',
                'warning' => ':warning:',
                default => ':information_source:',
            };

            Log::channel('slack')->warning("{$emoji} **{$title}**\n{$message}", $data);
        } catch (\Exception $e) {
            Log::error('Failed to send Slack alert', [
                'error' => $e->getMessage(),
                'title' => $title,
            ]);
        }
    }

    /**
     * Send email alert to admins
     */
    private function sendEmailAlert(?int $tenantId, string $title, string $message, string $severity, array $data): void
    {
        try {
            // Get admin users for the tenant (or platform admins if no tenant)
            $admins = $this->getAlertRecipients($tenantId);

            if ($admins->isEmpty()) {
                return;
            }

            Notification::send(
                $admins,
                new CriticalMetricAlert($title, $message, $severity, $data)
            );
        } catch (\Exception $e) {
            Log::error('Failed to send email alert', [
                'error' => $e->getMessage(),
                'title' => $title,
            ]);
        }
    }

    /**
     * Get users who should receive alerts
     */
    private function getAlertRecipients(?int $tenantId): \Illuminate\Support\Collection
    {
        $query = User::query();

        if ($tenantId) {
            // Get tenant admins
            $query->where('tenant_id', $tenantId)
                  ->whereHas('roles', function ($q) {
                      $q->where('name', 'admin');
                  });
        } else {
            // Get platform admins
            $query->where('account_type', 'platform');
        }

        return $query->get();
    }

    /**
     * Get alert configuration
     */
    private function getAlertConfiguration(): array
    {
        return [
            'enabled' => env('QUOTE_ALERTS_ENABLED', true),
            'monitoring_period_days' => env('QUOTE_ALERT_MONITORING_PERIOD', 7),
            'error_monitoring_period_days' => env('QUOTE_ALERT_ERROR_PERIOD', 1),
            'thresholds' => [
                'high_rejection_rate' => env('QUOTE_ALERT_REJECTION_RATE', 20), // %
                'low_acceptance_rate' => env('QUOTE_ALERT_ACCEPTANCE_RATE', 50), // %
                'high_expiry_rate' => env('QUOTE_ALERT_EXPIRY_RATE', 15), // %
                'pdf_generation_errors' => env('QUOTE_ALERT_PDF_ERRORS', 5), // count
                'email_delivery_errors' => env('QUOTE_ALERT_EMAIL_ERRORS', 5), // count
                'approval_sla_hours' => env('QUOTE_ALERT_APPROVAL_SLA', 24), // hours
            ],
        ];
    }

    /**
     * Manually trigger alert check (for testing)
     */
    public function triggerManualCheck(int $tenantId): array
    {
        $this->checkCriticalMetrics($tenantId);

        return [
            'status' => 'completed',
            'tenant_id' => $tenantId,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Clear alert cooldown (for testing)
     */
    public function clearAlertCooldown(string $alertType, ?int $tenantId = null): void
    {
        $cacheKey = self::CACHE_PREFIX . $alertType . ($tenantId ? ".{$tenantId}" : '');
        Cache::forget($cacheKey);
    }
}
