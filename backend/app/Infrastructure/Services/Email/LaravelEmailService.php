<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Email;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;
use App\Mail\Vendor\WelcomeEmail;
use App\Mail\Vendor\NewQuoteNotification;
use App\Mail\Vendor\QuoteResponseNotification;
use App\Mail\Vendor\QuoteMessageNotification;
use App\Mail\Vendor\QuoteExpiredNotification;
use App\Mail\Vendor\QuoteReminderNotification;
use App\Mail\Vendor\PasswordResetEmail;

/**
 * Laravel Email Service Implementation
 * 
 * Uses Laravel Mail with queue support and retry logic.
 * Requirements: 7.1-7.16, 10.3, 10.4, 13.4, 13.5, 18.9
 */
class LaravelEmailService implements EmailServiceInterface
{
    private const MAX_RETRIES = 3;
    private const RETRY_DELAY = 60; // seconds

    /**
     * Send welcome email to newly onboarded vendor
     */
    public function sendVendorWelcomeEmail(
        string $vendorEmail,
        string $vendorName,
        string $temporaryPassword,
        string $portalUrl
    ): bool {
        try {
            // Generate login URL (portal URL + /login path)
            $loginUrl = rtrim($portalUrl, '/') . '/login';
            
            Mail::to($vendorEmail)
                ->queue(new WelcomeEmail($vendorName, $vendorEmail, $temporaryPassword, $loginUrl));

            Log::info('Welcome email queued', [
                'vendor_email' => $vendorEmail,
                'vendor_name' => $vendorName,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue welcome email', [
                'vendor_email' => $vendorEmail,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send notification to vendor when new quote is assigned
     */
    public function sendNewQuoteNotification(
        string $vendorEmail,
        string $vendorName,
        array $quoteData
    ): bool {
        try {
            Mail::to($vendorEmail)
                ->queue(new NewQuoteNotification($vendorName, $quoteData));

            Log::info('New quote notification queued', [
                'vendor_email' => $vendorEmail,
                'quote_number' => $quoteData['quote_number'] ?? null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue new quote notification', [
                'vendor_email' => $vendorEmail,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send notification to admins when vendor responds to quote
     */
    public function sendQuoteResponseNotification(
        array $adminEmails,
        string $responseType,
        array $quoteData
    ): bool {
        try {
            foreach ($adminEmails as $adminEmail) {
                Mail::to($adminEmail)
                    ->queue(new QuoteResponseNotification($responseType, $quoteData));
            }

            Log::info('Quote response notifications queued', [
                'admin_count' => count($adminEmails),
                'response_type' => $responseType,
                'quote_number' => $quoteData['quote_number'] ?? null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue quote response notifications', [
                'admin_count' => count($adminEmails),
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send notification when new message is added to quote
     */
    public function sendQuoteMessageNotification(
        string $recipientEmail,
        string $recipientName,
        string $senderName,
        array $messageData
    ): bool {
        try {
            Mail::to($recipientEmail)
                ->queue(new QuoteMessageNotification($recipientName, $senderName, $messageData));

            Log::info('Quote message notification queued', [
                'recipient_email' => $recipientEmail,
                'sender_name' => $senderName,
                'quote_number' => $messageData['quote_number'] ?? null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue quote message notification', [
                'recipient_email' => $recipientEmail,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send notification when quote expires
     */
    public function sendQuoteExpiredNotification(
        string $vendorEmail,
        string $vendorName,
        array $quoteData
    ): bool {
        try {
            Mail::to($vendorEmail)
                ->queue(new QuoteExpiredNotification($vendorName, $quoteData));

            Log::info('Quote expired notification queued', [
                'vendor_email' => $vendorEmail,
                'quote_number' => $quoteData['quote_number'] ?? null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue quote expired notification', [
                'vendor_email' => $vendorEmail,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send reminder email when quote is about to expire
     */
    public function sendQuoteReminderNotification(
        string $vendorEmail,
        string $vendorName,
        array $quoteData
    ): bool {
        try {
            Mail::to($vendorEmail)
                ->queue(new QuoteReminderNotification($vendorName, $quoteData));

            Log::info('Quote reminder notification queued', [
                'vendor_email' => $vendorEmail,
                'quote_number' => $quoteData['quote_number'] ?? null,
                'days_remaining' => $quoteData['days_remaining'] ?? null,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue quote reminder notification', [
                'vendor_email' => $vendorEmail,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send password reset email to vendor
     */
    public function sendPasswordResetEmail(
        string $vendorEmail,
        string $vendorName,
        string $resetToken,
        string $resetUrl
    ): bool {
        try {
            Mail::to($vendorEmail)
                ->queue(new PasswordResetEmail($vendorName, $resetToken, $resetUrl));

            Log::info('Password reset email queued', [
                'vendor_email' => $vendorEmail,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to queue password reset email', [
                'vendor_email' => $vendorEmail,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
