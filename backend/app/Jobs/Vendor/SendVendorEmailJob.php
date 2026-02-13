<?php

namespace App\Jobs\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Spatie\Multitenancy\Jobs\TenantAware;

/**
 * Base job class for sending vendor portal emails
 * 
 * Features:
 * - Automatic retry logic (3 attempts)
 * - Exponential backoff between retries
 * - Comprehensive error logging
 * - Tenant-aware processing
 * - Queue isolation for vendor emails
 */
abstract class SendVendorEmailJob implements ShouldQueue, TenantAware
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array
     */
    public $backoff = [60, 300, 900]; // 1 min, 5 min, 15 min

    /**
     * The maximum number of seconds the job can run.
     *
     * @var int
     */
    public $timeout = 120;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected string $tenantId,
        protected string $recipientEmail,
        protected array $emailData
    ) {
        $this->onConnection('database');
        $this->onQueue('vendor-emails');
    }

    /**
     * Execute the job.
     */
    abstract public function handle(): void;

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Vendor email job failed', [
            'job_class' => static::class,
            'tenant_id' => $this->tenantId,
            'recipient' => $this->recipientEmail,
            'attempts' => $this->attempts(),
            'exception' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);

        // Optionally notify admins about email failure
        $this->notifyAdminsOfFailure($exception);
    }

    /**
     * Notify administrators about email failure
     */
    protected function notifyAdminsOfFailure(\Throwable $exception): void
    {
        // This can be implemented to send notifications to admins
        // For now, we just log it
        Log::critical('Vendor email failed after all retries', [
            'job_class' => static::class,
            'tenant_id' => $this->tenantId,
            'recipient' => $this->recipientEmail,
            'exception' => $exception->getMessage(),
        ]);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array<int, string>
     */
    public function tags(): array
    {
        return [
            'vendor-email',
            'tenant:' . $this->tenantId,
            'recipient:' . $this->recipientEmail,
        ];
    }

    /**
     * Determine the time at which the job should timeout.
     */
    public function retryUntil(): \DateTime
    {
        return now()->addHours(2);
    }
}

