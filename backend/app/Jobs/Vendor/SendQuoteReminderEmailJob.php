<?php

namespace App\Jobs\Vendor;

use App\Mail\Vendor\QuoteReminderEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending quote reminder emails to vendors
 * 
 * This job is queued when a quote is about to expire (3 days before expiration).
 */
class SendQuoteReminderEmailJob extends SendVendorEmailJob
{
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending quote reminder email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'attempt' => $this->attempts(),
            ]);

            Mail::to($this->recipientEmail)
                ->send(new QuoteReminderEmail($this->emailData));

            Log::info('Quote reminder email sent successfully', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send quote reminder email', [
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

