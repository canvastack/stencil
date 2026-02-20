<?php

namespace App\Infrastructure\Services;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Email Service for Customer Quote Workflow
 * 
 * Handles all email communications related to customer quotes
 */
class EmailService
{
    /**
     * Send customer quote email with portal link
     */
    public function sendCustomerQuote(CustomerQuote $quote): bool
    {
        try {
            $customer = $quote->order->customer;
            
            if (!$customer || !$customer->email) {
                Log::warning('Cannot send quote email: customer email not found', [
                    'quote_id' => $quote->id,
                    'order_id' => $quote->order_id,
                ]);
                return false;
            }

            // TODO: Implement actual email sending with Mail facade
            // Mail::to($customer->email)->send(new CustomerQuoteMail($quote));
            
            Log::info('Customer quote email sent', [
                'quote_id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'customer_email' => $customer->email,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send customer quote email', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send counter offer notification to admin
     */
    public function sendCounterOfferNotification(CustomerQuote $quote): bool
    {
        try {
            // Get admin emails from tenant settings
            $adminEmails = $this->getAdminEmails($quote->tenant_id);
            
            if (empty($adminEmails)) {
                Log::warning('Cannot send counter offer notification: no admin emails found', [
                    'quote_id' => $quote->id,
                    'tenant_id' => $quote->tenant_id,
                ]);
                return false;
            }

            // TODO: Implement actual email sending
            // Mail::to($adminEmails)->send(new CounterOfferNotificationMail($quote));
            
            Log::info('Counter offer notification sent to admin', [
                'quote_id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'admin_emails' => $adminEmails,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send counter offer notification', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send counter offer accepted notification to customer
     * 
     * Note: Reuses QuoteApprovedMail since counter offer acceptance
     * leads to the same outcome - payment required
     */
    public function sendCounterOfferAccepted(CustomerQuote $quote): bool
    {
        try {
            $customer = $quote->order->customer;
            
            if (!$customer || !$customer->email) {
                return false;
            }

            // Generate payment URL for customer portal
            $paymentUrl = config('app.frontend_url') . '/customer/quotes/' . $quote->uuid . '/payment';

            // Reuse QuoteApprovedMail - counter offer acceptance is essentially quote approval
            Mail::to($customer->email)->send(new \App\Mail\QuoteApprovedMail($quote, $paymentUrl));
            
            Log::info('Counter offer accepted email sent', [
                'quote_id' => $quote->id,
                'customer_email' => $customer->email,
                'payment_url' => $paymentUrl,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send counter offer accepted email', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send counter offer rejected notification to customer
     */
    public function sendCounterOfferRejected(CustomerQuote $quote, string $reason): bool
    {
        try {
            $customer = $quote->order->customer;
            
            if (!$customer || !$customer->email) {
                return false;
            }

            // TODO: Implement actual email sending
            // Mail::to($customer->email)->send(new CounterOfferRejectedMail($quote, $reason));
            
            Log::info('Counter offer rejected email sent', [
                'quote_id' => $quote->id,
                'customer_email' => $customer->email,
                'reason' => $reason,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send counter offer rejected email', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send admin counter offer to customer
     */
    public function sendAdminCounterOffer(CustomerQuote $quote): bool
    {
        try {
            $customer = $quote->order->customer;
            
            if (!$customer || !$customer->email) {
                return false;
            }

            // TODO: Implement actual email sending
            // Mail::to($customer->email)->send(new AdminCounterOfferMail($quote));
            
            Log::info('Admin counter offer email sent', [
                'quote_id' => $quote->id,
                'customer_email' => $customer->email,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send admin counter offer email', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send quote approved notification to customer
     */
    public function sendQuoteApproved(CustomerQuote $quote): bool
    {
        try {
            $customer = $quote->order->customer;
            
            if (!$customer || !$customer->email) {
                return false;
            }

            // Generate payment URL for customer portal
            $paymentUrl = config('app.frontend_url') . '/customer/quotes/' . $quote->uuid . '/payment';

            Mail::to($customer->email)->send(new \App\Mail\QuoteApprovedMail($quote, $paymentUrl));
            
            Log::info('Quote approved email sent', [
                'quote_id' => $quote->id,
                'customer_email' => $customer->email,
                'payment_url' => $paymentUrl,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send quote approved email', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send quote expired notification
     */
    public function sendQuoteExpired(CustomerQuote $quote): bool
    {
        try {
            $customer = $quote->order->customer;
            
            if (!$customer || !$customer->email) {
                Log::warning('Cannot send quote expired email: customer email not found', [
                    'quote_id' => $quote->id,
                    'order_id' => $quote->order_id,
                ]);
                return false;
            }

            // Send quote expired email
            Mail::to($customer->email)->send(new \App\Mail\CustomerQuoteExpiredMail($quote));
            
            Log::info('Quote expired email sent', [
                'quote_id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'customer_email' => $customer->email,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send quote expired email', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Send pending approval notification to admin
     */
    public function sendPendingApprovalNotification(CustomerQuote $quote, string $reason): bool
    {
        try {
            $adminEmails = $this->getAdminEmails($quote->tenant_id);
            
            if (empty($adminEmails)) {
                return false;
            }

            // TODO: Implement actual email sending
            // Mail::to($adminEmails)->send(new PendingApprovalNotificationMail($quote, $reason));
            
            Log::info('Pending approval notification sent to admin', [
                'quote_id' => $quote->id,
                'reason' => $reason,
                'admin_emails' => $adminEmails,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send pending approval notification', [
                'quote_id' => $quote->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get admin emails for tenant
     */
    private function getAdminEmails(int $tenantId): array
    {
        // TODO: Get from tenant settings or user roles
        // For now, return empty array (will be implemented in Phase 5)
        return [];
    }
}
