<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Notification;

use App\Domain\Notification\Entities\Notification;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use App\Domain\Quote\Entities\Quote;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationPreference;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Services\Email\EmailServiceInterface;
use Illuminate\Support\Facades\Log;

/**
 * Vendor Notification Service
 * 
 * Infrastructure service for sending notifications to vendors with portal access.
 * Integrates with EmailService and creates in-app notifications for vendor users.
 * 
 * Business Rules:
 * - Only send in-app notifications to vendors with portal access
 * - Always send email notifications regardless of portal access
 * - Check notification preferences before sending
 * - Log all notification attempts
 */
class VendorNotificationService
{
    public function __construct(
        private EmailServiceInterface $emailService,
        private NotificationRepositoryInterface $notificationRepository
    ) {}

    /**
     * Send notification when new quote is assigned to vendor
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @param string $quoteUrl Portal URL to view quote
     * @return void
     */
    public function notifyNewQuote(Quote $quote, Vendor $vendor, string $quoteUrl): void
    {
        try {
            // Send email notification
            $this->emailService->sendNewQuoteNotification(
                vendorEmail: $vendor->email,
                vendorName: $vendor->company_name,
                quoteData: [
                    'quote_number' => $quote->getQuoteNumber(),
                    'order_number' => $quote->getOrderId() ?? 'N/A',
                    'customer_name' => $quote->getCustomerName() ?? 'Unknown',
                    'product_name' => 'Product', // TODO: Get from quote
                    'expires_at' => $quote->getExpiresAt()?->format('Y-m-d H:i:s') ?? 'No deadline',
                    'quote_url' => $quoteUrl,
                ]
            );

            // Create in-app notification if vendor has portal access
            if ($vendor->portal_access_enabled && $vendor->onboarding_status === 'completed') {
                $vendorUser = User::where('vendor_id', $vendor->uuid)
                    ->where('account_type', 'vendor')
                    ->first();

                if ($vendorUser) {
                    $notification = Notification::quoteAssigned(
                        tenantId: $quote->getTenantId(),
                        userId: $vendorUser->id,
                        quoteUuid: $quote->getUuid(),
                        quoteNumber: $quote->getQuoteNumber(),
                        customerName: $quote->getCustomerName() ?? 'Unknown'
                    );

                    $this->notificationRepository->save($notification);
                }
            }

            Log::info('New quote notification sent to vendor', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'vendor_email' => $vendor->email
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send new quote notification to vendor', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send notification when vendor response is received (to admins)
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @param string $responseType 'accepted', 'rejected', or 'countered'
     * @param string $quoteUrl Admin URL to view quote
     * @return void
     */
    public function notifyAdminsOfVendorResponse(
        Quote $quote,
        Vendor $vendor,
        string $responseType,
        string $quoteUrl
    ): void {
        try {
            // Get all admin users for the tenant
            $adminUsers = User::where('tenant_id', $quote->getTenantId())
                ->where('account_type', 'tenant')
                ->whereHas('roles', fn($q) => $q->where('name', 'Admin'))
                ->get();

            if ($adminUsers->isEmpty()) {
                Log::warning('No admin users found for vendor response notification', [
                    'quote_uuid' => $quote->getUuid(),
                    'tenant_id' => $quote->getTenantId()
                ]);
                return;
            }

            // Determine notification type based on response type
            $notificationType = match($responseType) {
                'accepted' => 'vendor_quote_accepted',
                'rejected' => 'vendor_quote_rejected',
                'countered' => 'vendor_quote_countered',
                default => 'vendor_quote_accepted',
            };

            foreach ($adminUsers as $admin) {
                // Check notification preferences
                $preferences = $this->getUserNotificationPreferences($admin->id, $quote->getTenantId());
                $typePreferences = $preferences[$notificationType] ?? ['email' => true, 'in_app' => true];

                // Send email notification if enabled
                if ($typePreferences['email'] ?? true) {
                    $this->emailService->sendQuoteResponseNotification(
                        adminEmails: [$admin->email],
                        responseType: $responseType,
                        quoteData: [
                            'quote_number' => $quote->getQuoteNumber(),
                            'vendor_name' => $vendor->company_name,
                            'order_number' => $quote->getOrderId() ?? 'N/A',
                            'quote_url' => $quoteUrl,
                        ]
                    );
                }

                // Create in-app notification if enabled
                if ($typePreferences['in_app'] ?? true) {
                    $notification = Notification::quoteResponse(
                        tenantId: $quote->getTenantId(),
                        userId: $admin->id,
                        quoteUuid: $quote->getUuid(),
                        quoteNumber: $quote->getQuoteNumber(),
                        responseType: $responseType,
                        vendorName: $vendor->company_name,
                        responseNotes: $this->getResponseMessage($quote, $responseType)
                    );

                    $this->notificationRepository->save($notification);
                }
            }

            Log::info('Vendor response notification sent to admins', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'response_type' => $responseType,
                'admin_count' => $adminUsers->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send vendor response notification to admins', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'response_type' => $responseType,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send notification when quote message is received
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @param string $senderName
     * @param string $message
     * @param string $quoteUrl URL to view quote and messages
     * @return void
     */
    public function notifyQuoteMessage(
        Quote $quote,
        Vendor $vendor,
        string $senderName,
        string $message,
        string $quoteUrl
    ): void {
        try {
            // Send email notification
            $this->emailService->sendQuoteMessageNotification(
                recipientEmail: $vendor->email,
                recipientName: $vendor->company_name,
                senderName: $senderName,
                messageData: [
                    'quote_number' => $quote->getQuoteNumber(),
                    'message_preview' => substr($message, 0, 100),
                    'quote_url' => $quoteUrl,
                ]
            );

            // Create in-app notification if vendor has portal access
            if ($vendor->portal_access_enabled && $vendor->onboarding_status === 'completed') {
                $vendorUser = User::where('vendor_id', $vendor->uuid)
                    ->where('account_type', 'vendor')
                    ->first();

                if ($vendorUser) {
                    $notification = Notification::quoteMessage(
                        tenantId: $quote->getTenantId(),
                        userId: $vendorUser->id,
                        quoteUuid: $quote->getUuid(),
                        quoteNumber: $quote->getQuoteNumber(),
                        senderName: $senderName,
                        messagePreview: substr($message, 0, 100)
                    );

                    $this->notificationRepository->save($notification);
                }
            }

            Log::info('Quote message notification sent to vendor', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'sender' => $senderName
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send quote message notification', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send notification when quote is about to expire
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @param int $hoursRemaining
     * @param string $quoteUrl Portal URL to respond to quote
     * @return void
     */
    public function notifyQuoteExpiringSoon(
        Quote $quote,
        Vendor $vendor,
        int $hoursRemaining,
        string $quoteUrl
    ): void {
        try {
            // Send email notification
            $this->emailService->sendQuoteReminderNotification(
                vendorEmail: $vendor->email,
                vendorName: $vendor->company_name,
                quoteData: [
                    'quote_number' => $quote->getQuoteNumber(),
                    'order_number' => $quote->getOrderId() ?? 'N/A',
                    'expires_at' => $quote->getExpiresAt()?->format('Y-m-d H:i:s') ?? 'No deadline',
                    'days_remaining' => ceil($hoursRemaining / 24),
                    'quote_url' => $quoteUrl,
                ]
            );

            // Create in-app notification if vendor has portal access
            if ($vendor->portal_access_enabled && $vendor->onboarding_status === 'completed') {
                $vendorUser = User::where('vendor_id', $vendor->uuid)
                    ->where('account_type', 'vendor')
                    ->first();

                if ($vendorUser) {
                    $notification = Notification::quoteExpiringSoon(
                        tenantId: $quote->getTenantId(),
                        userId: $vendorUser->id,
                        quoteUuid: $quote->getUuid(),
                        quoteNumber: $quote->getQuoteNumber(),
                        hoursRemaining: $hoursRemaining
                    );

                    $this->notificationRepository->save($notification);
                }
            }

            Log::info('Quote expiring soon notification sent to vendor', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'hours_remaining' => $hoursRemaining
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send quote expiring soon notification', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send notification when quote has expired
     * 
     * @param Quote $quote
     * @param Vendor $vendor
     * @param string $quoteUrl Portal URL to view expired quote
     * @return void
     */
    public function notifyQuoteExpired(Quote $quote, Vendor $vendor, string $quoteUrl): void
    {
        try {
            // Send email notification
            $this->emailService->sendQuoteExpiredNotification(
                vendorEmail: $vendor->email,
                vendorName: $vendor->company_name,
                quoteId: $quote->getQuoteNumber(),
                orderId: $quote->getOrderId() ?? 'N/A',
                deadline: $quote->getExpiresAt()?->format('Y-m-d H:i:s') ?? 'No deadline',
                expiredAt: now()->format('Y-m-d H:i:s'),
                quoteUrl: $quoteUrl
            );

            // Create in-app notification if vendor has portal access
            if ($vendor->portal_access_enabled && $vendor->onboarding_status === 'completed') {
                $vendorUser = User::where('vendor_id', $vendor->uuid)
                    ->where('account_type', 'vendor')
                    ->first();

                if ($vendorUser) {
                    $notification = Notification::quoteExpired(
                        tenantId: $quote->getTenantId(),
                        userId: $vendorUser->id,
                        quoteUuid: $quote->getUuid(),
                        quoteNumber: $quote->getQuoteNumber(),
                        vendorName: $vendor->company_name
                    );

                    $this->notificationRepository->save($notification);
                }
            }

            Log::info('Quote expired notification sent to vendor', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send quote expired notification', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get status color for email template
     * 
     * @param string $responseType
     * @return string
     */
    private function getStatusColor(string $responseType): string
    {
        return match($responseType) {
            'accepted' => '#10b981', // green
            'rejected' => '#ef4444', // red
            'countered' => '#f59e0b', // orange
            default => '#6b7280', // gray
        };
    }

    /**
     * Get response message for notification
     * 
     * @param Quote $quote
     * @param string $responseType
     * @return string
     */
    private function getResponseMessage(Quote $quote, string $responseType): string
    {
        $details = $quote->getQuoteDetails();
        
        return match($responseType) {
            'accepted' => sprintf(
                'Estimated delivery: %d days',
                $details['estimated_delivery_days'] ?? 0
            ),
            'rejected' => $details['rejection_reason'] ?? 'No reason provided',
            'countered' => sprintf(
                'Counter offer: %s',
                number_format($details['counter_offer_amount'] ?? 0, 2)
            ),
            default => 'Response received',
        };
    }

    /**
     * Get user notification preferences
     * 
     * @param int $userId
     * @param string $tenantId
     * @return array
     */
    private function getUserNotificationPreferences(int $userId, string $tenantId): array
    {
        try {
            $notificationPreference = NotificationPreference::where('user_id', $userId)
                ->where('tenant_id', $tenantId)
                ->first();

            if ($notificationPreference) {
                return $notificationPreference->preferences ?? $this->getDefaultPreferences();
            }

            return $this->getDefaultPreferences();
        } catch (\Exception $e) {
            Log::error('Failed to get user notification preferences', [
                'user_id' => $userId,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage()
            ]);
            
            // Return default preferences on error
            return $this->getDefaultPreferences();
        }
    }

    /**
     * Get default notification preferences
     * 
     * @return array
     */
    private function getDefaultPreferences(): array
    {
        return [
            'vendor_quote_accepted' => [
                'email' => true,
                'in_app' => true,
            ],
            'vendor_quote_rejected' => [
                'email' => true,
                'in_app' => true,
            ],
            'vendor_quote_countered' => [
                'email' => true,
                'in_app' => true,
            ],
            'vendor_quote_message' => [
                'email' => true,
                'in_app' => true,
            ],
            'order_status_changes' => [
                'email' => true,
                'in_app' => true,
            ],
            'payment_updates' => [
                'email' => true,
                'in_app' => true,
            ],
            'system_announcements' => [
                'email' => true,
                'in_app' => true,
            ],
        ];
    }
}
