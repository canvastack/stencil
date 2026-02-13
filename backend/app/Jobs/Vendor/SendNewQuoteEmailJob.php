<?php

namespace App\Jobs\Vendor;

use App\Mail\Vendor\NewQuoteNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending new quote notification emails to vendors
 * 
 * This job is queued when an admin sends a new quote to a vendor.
 */
class SendNewQuoteEmailJob extends SendVendorEmailJob
{
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending new quote notification email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
                'attempt' => $this->attempts(),
            ]);

            Mail::to($this->recipientEmail)
                ->send(new NewQuoteNotification($this->emailData));

            Log::info('New quote notification email sent successfully', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'quote_number' => $this->emailData['quote_number'] ?? 'N/A',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send new quote notification email', [
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

