<?php

namespace App\Infrastructure\Services\Email;

use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Quote Notification Service
 * 
 * Handles email notifications for quote-related events:
 * - Vendor counter offer rejection
 * - Vendor counter offer acceptance
 * - Customer quotation ready
 */
class QuoteNotificationService
{
    /**
     * Send rejection notification to vendor
     * 
     * @param OrderVendorNegotiation $quote
     * @param string $rejectionReason
     * @return bool
     */
    public function sendVendorRejectionEmail(OrderVendorNegotiation $quote, string $rejectionReason): bool
    {
        try {
            // Validate vendor has email
            if (!$quote->vendor || !$quote->vendor->email) {
                Log::warning('[QuoteNotificationService] Vendor email not found', [
                    'quote_id' => $quote->uuid,
                    'vendor_id' => $quote->vendor_id,
                ]);
                return false;
            }

            $vendorEmail = $quote->vendor->email;
            $vendorName = $quote->vendor->name ?? $quote->vendor->company ?? 'Vendor';
            
            // Generate quote number
            $quoteNumber = $quote->created_at 
                ? sprintf('QT-%s-%05d', $quote->created_at->format('Ym'), $quote->id)
                : 'QT-DRAFT';

            // Extract counter offer details
            $quoteDetails = $quote->quote_details ?? [];
            $counterOffer = $quoteDetails['counter_offer'] ?? null;
            
            // Get rejection count from rejection_history
            $rejectionHistory = $quoteDetails['rejection_history'] ?? [];
            $rejectionCount = count($rejectionHistory);
            
            // Prepare email data
            $emailData = [
                'vendor_name' => $vendorName,
                'quote_number' => $quoteNumber,
                'quote_uuid' => $quote->uuid,
                'rejection_reason' => $rejectionReason,
                'rejection_count' => $rejectionCount,
                'counter_offer' => $counterOffer,
                'original_offer' => $quote->initial_offer,
                'currency' => $quote->currency,
                'submitted_at' => $counterOffer['submitted_at'] ?? null,
                'admin_contact_email' => config('mail.from.address'),
                'admin_contact_name' => config('mail.from.name'),
                'portal_url' => config('app.vendor_portal_url', config('app.url')),
            ];

            // Send email
            Mail::send('emails.vendor.counter-offer-rejected', $emailData, function ($message) use ($vendorEmail, $vendorName, $quoteNumber) {
                $message->to($vendorEmail, $vendorName)
                    ->subject("Counter Offer Rejected - {$quoteNumber}");
            });

            Log::info('[QuoteNotificationService] Vendor rejection email sent', [
                'quote_id' => $quote->uuid,
                'vendor_email' => $vendorEmail,
                'quote_number' => $quoteNumber,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('[QuoteNotificationService] Failed to send vendor rejection email', [
                'quote_id' => $quote->uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return false;
        }
    }

    /**
     * Send acceptance notification to vendor
     * 
     * @param OrderVendorNegotiation $quote
     * @return bool
     */
    public function sendVendorAcceptanceEmail(OrderVendorNegotiation $quote): bool
    {
        try {
            // Validate vendor has email
            if (!$quote->vendor || !$quote->vendor->email) {
                Log::warning('[QuoteNotificationService] Vendor email not found', [
                    'quote_id' => $quote->uuid,
                    'vendor_id' => $quote->vendor_id,
                ]);
                return false;
            }

            $vendorEmail = $quote->vendor->email;
            $vendorName = $quote->vendor->name ?? $quote->vendor->company ?? 'Vendor';
            
            // Generate quote number
            $quoteNumber = $quote->created_at 
                ? sprintf('QT-%s-%05d', $quote->created_at->format('Ym'), $quote->id)
                : 'QT-DRAFT';

            // Extract counter offer details
            $quoteDetails = $quote->quote_details ?? [];
            $counterOffer = $quoteDetails['counter_offer'] ?? null;
            
            // Prepare email data
            $emailData = [
                'vendor_name' => $vendorName,
                'quote_number' => $quoteNumber,
                'quote_uuid' => $quote->uuid,
                'counter_offer' => $counterOffer,
                'accepted_amount' => $quote->latest_offer,
                'currency' => $quote->currency,
                'estimated_delivery_days' => $counterOffer['estimated_delivery_days'] ?? null,
                'admin_contact_email' => config('mail.from.address'),
                'admin_contact_name' => config('mail.from.name'),
                'portal_url' => config('app.vendor_portal_url', config('app.url')),
            ];

            // Send email
            Mail::send('emails.vendor.counter-offer-accepted', $emailData, function ($message) use ($vendorEmail, $vendorName, $quoteNumber) {
                $message->to($vendorEmail, $vendorName)
                    ->subject("Counter Offer Accepted - {$quoteNumber}");
            });

            Log::info('[QuoteNotificationService] Vendor acceptance email sent', [
                'quote_id' => $quote->uuid,
                'vendor_email' => $vendorEmail,
                'quote_number' => $quoteNumber,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('[QuoteNotificationService] Failed to send vendor acceptance email', [
                'quote_id' => $quote->uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return false;
        }
    }

    /**
     * Send admin counter offer notification to vendor
     * 
     * @param \App\Domain\Quote\Entities\Quote $quote
     * @return bool
     */
    public function sendAdminCounterOfferNotification($quote): bool
    {
        try {
            // Get vendor from database
            $vendorModel = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::find($quote->getVendorId());
            
            if (!$vendorModel || !$vendorModel->email) {
                Log::warning('[QuoteNotificationService] Vendor email not found for admin counter offer', [
                    'quote_uuid' => $quote->getUuid(),
                    'vendor_id' => $quote->getVendorId(),
                ]);
                return false;
            }

            $vendorEmail = $vendorModel->email;
            $vendorName = $vendorModel->name ?? $vendorModel->company ?? 'Vendor';
            
            // Generate quote number
            $quoteNumber = $quote->getQuoteNumber();

            // Extract counter offer details
            $quoteDetails = $quote->getQuoteDetails() ?? [];
            $adminCounterOffer = $quoteDetails['admin_counter_offer'] ?? null;
            $vendorCounterOffer = $quoteDetails['counter_offer'] ?? null;
            $adminNotes = $quoteDetails['admin_counter_notes'] ?? null;
            
            // Prepare email data
            $emailData = [
                'vendor_name' => $vendorName,
                'quote_number' => $quoteNumber,
                'quote_uuid' => $quote->getUuid(),
                'round' => $quote->getRound(),
                'admin_counter_offer' => $adminCounterOffer,
                'vendor_counter_offer' => $vendorCounterOffer,
                'admin_notes' => $adminNotes,
                'currency' => $quote->getCurrency(),
                'admin_contact_email' => config('mail.from.address'),
                'admin_contact_name' => config('mail.from.name'),
                'portal_url' => config('app.vendor_portal_url', config('app.url')),
            ];

            // Send email
            Mail::send('emails.vendor.admin-counter-offer', $emailData, function ($message) use ($vendorEmail, $vendorName, $quoteNumber) {
                $message->to($vendorEmail, $vendorName)
                    ->subject("Admin Memberikan Counter Offer - {$quoteNumber}");
            });

            Log::info('[QuoteNotificationService] Admin counter offer email sent', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_email' => $vendorEmail,
                'quote_number' => $quoteNumber,
                'round' => $quote->getRound(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('[QuoteNotificationService] Failed to send admin counter offer email', [
                'quote_uuid' => $quote->getUuid(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return false;
        }
    }

    /**
     * Format currency for display
     * 
     * @param int $amount Amount in cents
     * @param string $currency Currency code
     * @return string
     */
    private function formatCurrency(int $amount, string $currency = 'IDR'): string
    {
        if ($currency === 'IDR') {
            return 'Rp ' . number_format($amount, 0, ',', '.');
        }
        
        return $currency . ' ' . number_format($amount / 100, 2, '.', ',');
    }
}
