<?php

namespace App\Jobs;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to send customer quote email
 * 
 * Queued job to handle email sending asynchronously
 */
class SendQuoteEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;
    public int $backoff = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $quoteId,
        public string $emailType = 'customer_quote'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(EmailService $emailService): void
    {
        try {
            $quote = CustomerQuote::with(['order.customer'])->findOrFail($this->quoteId);

            Log::info('Starting email sending', [
                'quote_id' => $this->quoteId,
                'quote_number' => $quote->quote_number,
                'email_type' => $this->emailType,
            ]);

            // Send appropriate email based on type
            $success = match ($this->emailType) {
                'customer_quote' => $emailService->sendCustomerQuote($quote),
                'counter_offer_notification' => $emailService->sendCounterOfferNotification($quote),
                'counter_offer_accepted' => $emailService->sendCounterOfferAccepted($quote),
                'counter_offer_rejected' => $emailService->sendCounterOfferRejected($quote, $quote->rejection_reason ?? ''),
                'admin_counter_offer' => $emailService->sendAdminCounterOffer($quote),
                'quote_approved' => $emailService->sendQuoteApproved($quote),
                'quote_expired' => $emailService->sendQuoteExpired($quote),
                'pending_approval' => $emailService->sendPendingApprovalNotification($quote, $quote->approval_reason ?? ''),
                default => throw new \InvalidArgumentException("Invalid email type: {$this->emailType}"),
            };

            if ($success) {
                Log::info('Email sent successfully', [
                    'quote_id' => $this->quoteId,
                    'email_type' => $this->emailType,
                ]);
            } else {
                Log::warning('Email sending returned false', [
                    'quote_id' => $this->quoteId,
                    'email_type' => $this->emailType,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Email sending failed', [
                'quote_id' => $this->quoteId,
                'email_type' => $this->emailType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Email sending job failed permanently', [
            'quote_id' => $this->quoteId,
            'email_type' => $this->emailType,
            'error' => $exception->getMessage(),
        ]);

        // TODO: Notify admin about failed email
        // dispatch(new NotifyAdminJob('Email sending failed', [...]));
    }
}
