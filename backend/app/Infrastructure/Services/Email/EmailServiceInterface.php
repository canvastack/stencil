<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Email;

/**
 * Email Service Interface
 * 
 * Handles all email notifications for the vendor portal system.
 * Requirements: 7.1-7.16, 10.3, 10.4, 13.4, 13.5, 18.9
 */
interface EmailServiceInterface
{
    /**
     * Send welcome email to newly onboarded vendor
     * 
     * @param string $vendorEmail
     * @param string $vendorName
     * @param string $temporaryPassword
     * @param string $portalUrl
     * @return bool
     */
    public function sendVendorWelcomeEmail(
        string $vendorEmail,
        string $vendorName,
        string $temporaryPassword,
        string $portalUrl
    ): bool;

    /**
     * Send notification to vendor when new quote is assigned
     * 
     * @param string $vendorEmail
     * @param string $vendorName
     * @param array $quoteData [quote_number, order_number, customer_name, product_name, expires_at, quote_url]
     * @return bool
     */
    public function sendNewQuoteNotification(
        string $vendorEmail,
        string $vendorName,
        array $quoteData
    ): bool;

    /**
     * Send notification to admins when vendor responds to quote
     * 
     * @param array $adminEmails
     * @param string $responseType (accepted, rejected, countered)
     * @param array $quoteData [quote_number, vendor_name, order_number, quote_url]
     * @return bool
     */
    public function sendQuoteResponseNotification(
        array $adminEmails,
        string $responseType,
        array $quoteData
    ): bool;

    /**
     * Send notification when new message is added to quote
     * 
     * @param string $recipientEmail
     * @param string $recipientName
     * @param string $senderName
     * @param array $messageData [quote_number, message_preview, quote_url]
     * @return bool
     */
    public function sendQuoteMessageNotification(
        string $recipientEmail,
        string $recipientName,
        string $senderName,
        array $messageData
    ): bool;

    /**
     * Send notification when quote expires
     * 
     * @param string $vendorEmail
     * @param string $vendorName
     * @param array $quoteData [quote_number, order_number, expired_at]
     * @return bool
     */
    public function sendQuoteExpiredNotification(
        string $vendorEmail,
        string $vendorName,
        array $quoteData
    ): bool;

    /**
     * Send reminder email when quote is about to expire (3 days before)
     * 
     * @param string $vendorEmail
     * @param string $vendorName
     * @param array $quoteData [quote_number, order_number, expires_at, days_remaining, quote_url]
     * @return bool
     */
    public function sendQuoteReminderNotification(
        string $vendorEmail,
        string $vendorName,
        array $quoteData
    ): bool;

    /**
     * Send password reset email to vendor
     * 
     * @param string $vendorEmail
     * @param string $vendorName
     * @param string $resetToken
     * @param string $resetUrl
     * @return bool
     */
    public function sendPasswordResetEmail(
        string $vendorEmail,
        string $vendorName,
        string $resetToken,
        string $resetUrl
    ): bool;
}
