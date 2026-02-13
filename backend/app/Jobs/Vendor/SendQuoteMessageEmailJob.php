<?php

namespace App\Jobs\Vendor;

use App\Mail\Vendor\QuoteMessageNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending quote message notification emails
 * 
 * This job is queued when a message is sent in a quote thread.
 */
class SendQuoteMessageEmailJob extends SendVendorEmailJob
{
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending quote message notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'sender_type' => $this->emailData['sender_type'] ?? 'N/A',
                'attempt' => $this->attempts(),
            ]);

            Mail::to($this->recipientEmail)
                ->send(new QuoteMessageNotification($this->emailData));

            Log::info('Quote message notification email sent successfully', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'sender_type' => $this->emailData['sender_type'] ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send quote message notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'sender_type' => $this->emailData['sender_type'] ?? 'N/A',
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry logic
        }
    }
}

