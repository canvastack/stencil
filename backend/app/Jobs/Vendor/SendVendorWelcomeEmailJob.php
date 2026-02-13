<?php

namespace App\Jobs\Vendor;

use App\Mail\Vendor\VendorWelcomeEmail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending vendor welcome emails
 * 
 * This job is queued when a new vendor is onboarded to the portal.
 * It includes login credentials and getting started information.
 */
class SendVendorWelcomeEmailJob extends SendVendorEmailJob
{
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Sending vendor welcome email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'attempt' => $this->attempts(),
            ]);

            Mail::to($this->recipientEmail)
                ->send(new VendorWelcomeEmail($this->emailData));

            Log::info('Vendor welcome email sent successfully', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send vendor welcome email', [
                'tenant_id' => $this->tenantId,
                'recipient' => $this->recipientEmail,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            throw $e; // Re-throw to trigger retry logic
        }
    }
}

