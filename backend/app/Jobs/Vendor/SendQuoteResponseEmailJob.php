<?php

namespace App\Jobs\Vendor;

use App\Mail\Vendor\QuoteResponseNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending quote response notification emails to admins
 * 
 * This job is queued when a vendor responds to a quote (accept/reject/counter).
 */
class SendQuoteResponseEmailJob extends SendVendorEmailJob
{
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending quote response notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'response_type' => $this->emailData['response_type'] ?? 'N/A',
                'attempt' => $this->attempts(),
            ]);

            Mail::to($this->recipientEmail)
                ->send(new QuoteResponseNotification($this->emailData));

            Log::info('Quote response notification email sent successfully', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'response_type' => $this->emailData['response_type'] ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send quote response notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'response_type' => $this->emailData['response_type'] ?? 'N/A',
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry logic
        }
    }
}

