<?php

declare(strict_types=1);

namespace App\Domain\Notification\Services;

use App\Domain\Notification\Entities\Notification;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use App\Domain\Quote\Entities\Quote;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\VendorQuoteReceivedMail;
use App\Mail\AdminQuoteResponseMail;
use App\Mail\QuoteExpiredMail;

/**
 * Notification Service
 * 
 * Domain service responsible for creating and sending notifications
 * for quote-related events. Handles both in-app notifications and email delivery.
 * 
 * Business Rules:
 * - All quote events trigger both in-app and email notifications
 * - Failed emails are logged and retried up to 3 times
 * - Notifications are tenant-scoped
 * - Email templates are customizable per tenant
 */
class NotificationService
{
    private const MAX_EMAIL_RETRIES = 3;

    public function __construct(
        private NotificationRepositoryInterface $notificationRepository
    ) {}

    /**
     * Send notification when quote is sent to vendor
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @return void
     */
    public function sendQuoteNotification(Quote $quote, Vendor $vendor): void
    {
        // Vendors are external entities without user accounts
        // Send email directly to vendor email address
        // No in-app notification needed since vendors don't have system access

        // Send email notification with retry logic
        $this->sendEmailWithRetry(
            to: $vendor->email,
            mailable: new VendorQuoteReceivedMail($quote, $vendor),
            context: [
                'quote_uuid' => $quote->getUuid(),
                'vendor_email' => $vendor->email
            ]
        );
    }

    /**
     * Send notification when vendor responds to quote
     * 
     * @param Quote $quote
     * @return void
     */
    public function sendQuoteResponseNotification(Quote $quote): void
    {
        // Get vendor from quote
        $vendor = Vendor::find($quote->getVendorId());
        
        if (!$vendor) {
            Log::warning('Vendor not found for quote response notification', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_id' => $quote->getVendorId()
            ]);
            return;
        }

        // Get all admin users for the tenant
        $adminUsers = User::where('tenant_id', $quote->getTenantId())
            ->whereHas('roles', fn($q) => $q->where('name', 'Admin'))
            ->get();

        if ($adminUsers->isEmpty()) {
            Log::warning('No admin users found for quote response notification', [
                'quote_uuid' => $quote->getUuid(),
                'tenant_id' => $quote->getTenantId()
            ]);
            return;
        }

        foreach ($adminUsers as $admin) {
            // Create in-app notification
            $notification = Notification::quoteResponse(
                tenantId: $quote->getTenantId(),
                userId: $admin->id,
                quoteUuid: $quote->getUuid(),
                quoteNumber: $quote->getQuoteNumber(),
                responseType: $quote->getResponseType() ?? 'unknown',
                vendorName: $vendor->name,
                responseNotes: $quote->getResponseNotes()
            );

            $this->notificationRepository->save($notification);

            // Send email notification with retry logic
            $this->sendEmailWithRetry(
                to: $admin->email,
                mailable: new AdminQuoteResponseMail($quote, $vendor, $admin),
                context: [
                    'quote_uuid' => $quote->getUuid(),
                    'admin_email' => $admin->email,
                    'response_type' => $quote->getResponseType()
                ]
            );
        }
    }

    /**
     * Send notification when quote expires
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @return void
     */
    public function sendQuoteExpiredNotification(Quote $quote, Vendor $vendor): void
    {
        // Get all admin users for the tenant
        $adminUsers = User::where('tenant_id', $quote->getTenantId())
            ->whereHas('roles', fn($q) => $q->where('name', 'admin'))
            ->get();

        if ($adminUsers->isEmpty()) {
            Log::warning('No admin users found for quote expired notification', [
                'quote_uuid' => $quote->getUuid(),
                'tenant_id' => $quote->getTenantId()
            ]);
            return;
        }

        foreach ($adminUsers as $admin) {
            // Create in-app notification
            $notification = Notification::quoteExpired(
                tenantId: $quote->getTenantId(),
                userId: $admin->id,
                quoteUuid: $quote->getUuid(),
                quoteNumber: $quote->getQuoteNumber(),
                vendorName: $vendor->name
            );

            $this->notificationRepository->save($notification);

            // Send email notification with retry logic
            $this->sendEmailWithRetry(
                to: $admin->email,
                mailable: new QuoteExpiredMail($quote, $vendor, $admin),
                context: [
                    'quote_uuid' => $quote->getUuid(),
                    'admin_email' => $admin->email
                ]
            );
        }
    }

    /**
     * Send notification when quote expiration is extended
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @return void
     */
    public function sendQuoteExtendedNotification(Quote $quote, Vendor $vendor): void
    {
        // Vendors are external entities without user accounts
        // Send email directly to vendor email address
        // No in-app notification needed since vendors don't have system access

        // Send email notification with retry logic
        $this->sendEmailWithRetry(
            to: $vendor->email,
            mailable: new VendorQuoteReceivedMail($quote, $vendor), // Reuse same template
            context: [
                'quote_uuid' => $quote->getUuid(),
                'vendor_email' => $vendor->email,
                'action' => 'extended'
            ]
        );
    }

    /**
     * Send email with retry logic
     * 
     * @param string $to Recipient email address
     * @param mixed $mailable Laravel Mailable instance
     * @param array $context Context for logging
     * @return void
     */
    private function sendEmailWithRetry(string $to, $mailable, array $context = []): void
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < self::MAX_EMAIL_RETRIES) {
            try {
                $attempts++;

                // Always use queue for consistency
                Mail::to($to)->queue($mailable);

                // Success - log and return
                if ($attempts > 1) {
                    Log::info('Email sent successfully after retry', array_merge($context, [
                        'attempt' => $attempts,
                        'to' => $to
                    ]));
                }

                return;

            } catch (\Exception $e) {
                $lastException = $e;

                Log::warning('Email send attempt failed', array_merge($context, [
                    'attempt' => $attempts,
                    'to' => $to,
                    'error' => $e->getMessage()
                ]));

                // Wait before retry (exponential backoff)
                if ($attempts < self::MAX_EMAIL_RETRIES) {
                    usleep(pow(2, $attempts) * 100000); // 200ms, 400ms, 800ms
                }
            }
        }

        // All retries failed - log error
        Log::error('Email send failed after all retries', array_merge($context, [
            'attempts' => $attempts,
            'to' => $to,
            'error' => $lastException?->getMessage(),
            'trace' => $lastException?->getTraceAsString()
        ]));

        // Don't throw exception - we don't want to fail the entire operation
        // The in-app notification was already created successfully
    }
}
