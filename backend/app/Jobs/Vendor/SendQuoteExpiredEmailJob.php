<?php

namespace App\Jobs\Vendor;

use App\Mail\Vendor\QuoteExpiredVendorEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending quote expired notification emails to vendors
 * 
 * This job is queued when a quote expires without a response.
 */
class SendQuoteExpiredEmailJob extends SendVendorEmailJob
{
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending quote expired notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'attempt' => $this->attempts(),
            ]);

            Mail::to($this->recipientEmail)
                ->send(new QuoteExpiredVendorEmail($this->emailData));

            Log::info('Quote expired notification email sent successfully', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send quote expired notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry logic
        }
    }
}

