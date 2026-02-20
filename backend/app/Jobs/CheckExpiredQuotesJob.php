<?php

namespace App\Jobs;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Job to check and handle expired quotes
 * 
 * Scheduled job that runs hourly to:
 * - Mark expired quotes
 * - Send expiry warnings
 * - Send expiry notifications
 */
class CheckExpiredQuotesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    /**
     * Execute the job.
     */
    public function handle(EmailService $emailService): void
    {
        try {
            Log::info('Starting expired quotes check');

            $now = Carbon::now();
            $warning24h = $now->copy()->addHours(24);
            $warning12h = $now->copy()->addHours(12);

            // 1. Mark expired quotes
            $expiredCount = $this->markExpiredQuotes($now);

            // 2. Send 24-hour warnings
            $warning24Count = $this->sendExpiryWarnings($warning24h, '24h', $emailService);

            // 3. Send 12-hour warnings
            $warning12Count = $this->sendExpiryWarnings($warning12h, '12h', $emailService);

            // 4. Send expiry notifications for newly expired quotes
            $notificationCount = $this->sendExpiryNotifications($emailService);

            Log::info('Expired quotes check completed', [
                'expired_count' => $expiredCount,
                'warning_24h_count' => $warning24Count,
                'warning_12h_count' => $warning12Count,
                'notification_count' => $notificationCount,
            ]);
        } catch (\Exception $e) {
            Log::error('Expired quotes check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Mark quotes as expired
     */
    private function markExpiredQuotes(Carbon $now): int
    {
        $quotes = CustomerQuote::where('valid_until', '<', $now)
            ->whereIn('status', ['sent', 'viewed', 'countered'])
            ->whereNull('expired_at')
            ->get();

        $count = 0;
        foreach ($quotes as $quote) {
            $quote->update([
                'status' => 'expired',
                'expired_at' => $now,
            ]);

            // Add history entry
            $history = $quote->history ?? [];
            $history[] = [
                'action' => 'quote_expired',
                'actor_type' => 'system',
                'actor_id' => null,
                'timestamp' => $now->toIso8601String(),
                'details' => [
                    'valid_until' => $quote->valid_until->toIso8601String(),
                ],
            ];
            $quote->update(['history' => $history]);

            $count++;
        }

        if ($count > 0) {
            Log::info("Marked {$count} quotes as expired");
        }

        return $count;
    }

    /**
     * Send expiry warnings
     */
    private function sendExpiryWarnings(Carbon $warningTime, string $warningType, EmailService $emailService): int
    {
        // Get quotes expiring within the warning window
        $quotes = CustomerQuote::whereBetween('valid_until', [
                $warningTime->copy()->subMinutes(30),
                $warningTime->copy()->addMinutes(30)
            ])
            ->whereIn('status', ['sent', 'viewed', 'countered'])
            ->get();

        $count = 0;
        foreach ($quotes as $quote) {
            // Check if warning already sent
            $metadata = $quote->metadata ?? [];
            $warningKey = "expiry_warning_{$warningType}_sent";
            
            if (!isset($metadata[$warningKey])) {
                // Send warning email
                // TODO: Implement warning email
                // $emailService->sendExpiryWarning($quote, $warningType);

                // Mark warning as sent
                $metadata[$warningKey] = true;
                $metadata["{$warningKey}_at"] = now()->toIso8601String();
                $quote->update(['metadata' => $metadata]);

                $count++;
            }
        }

        if ($count > 0) {
            Log::info("Sent {$count} {$warningType} expiry warnings");
        }

        return $count;
    }

    /**
     * Send expiry notifications for newly expired quotes
     */
    private function sendExpiryNotifications(EmailService $emailService): int
    {
        // Get quotes that expired in the last hour and haven't been notified
        $quotes = CustomerQuote::where('status', 'expired')
            ->where('expired_at', '>=', now()->subHour())
            ->get();

        $count = 0;
        foreach ($quotes as $quote) {
            // Check if notification already sent
            $metadata = $quote->metadata ?? [];
            
            if (!isset($metadata['expiry_notification_sent'])) {
                // Send expiry notification
                $emailService->sendQuoteExpired($quote);

                // Mark notification as sent
                $metadata['expiry_notification_sent'] = true;
                $metadata['expiry_notification_sent_at'] = now()->toIso8601String();
                $quote->update(['metadata' => $metadata]);

                $count++;
            }
        }

        if ($count > 0) {
            Log::info("Sent {$count} expiry notifications");
        }

        return $count;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Check expired quotes job failed', [
            'error' => $exception->getMessage(),
        ]);
    }
}
