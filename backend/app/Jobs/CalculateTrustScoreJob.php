<?php

namespace App\Jobs;

use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to calculate customer trust score
 * 
 * Queued job to handle trust score calculation asynchronously
 */
class CalculateTrustScoreJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 60;
    public int $backoff = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $customerId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TrustScoreCalculator $trustScoreCalculator): void
    {
        try {
            $customer = Customer::findOrFail($this->customerId);

            Log::info('Starting trust score calculation', [
                'customer_id' => $this->customerId,
                'customer_email' => $customer->email,
            ]);

            // Calculate trust score
            $trustScore = $trustScoreCalculator->calculate(
                emailVerified: !is_null($customer->email_verified_at),
                successfulOrders: $this->getSuccessfulOrdersCount($customer),
                paymentSuccessRate: $this->getPaymentSuccessRate($customer),
                accountAge: $this->getAccountAgeDays($customer)
            );

            // Store trust score in customer metadata
            $metadata = $customer->metadata ?? [];
            $metadata['trust_score'] = $trustScore;
            $metadata['trust_score_calculated_at'] = now()->toIso8601String();

            $customer->update(['metadata' => $metadata]);

            Log::info('Trust score calculated successfully', [
                'customer_id' => $this->customerId,
                'trust_score' => $trustScore,
            ]);
        } catch (\Exception $e) {
            Log::error('Trust score calculation failed', [
                'customer_id' => $this->customerId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Get successful orders count for customer
     */
    private function getSuccessfulOrdersCount(Customer $customer): int
    {
        return $customer->orders()
            ->whereIn('status', ['completed', 'delivered'])
            ->count();
    }

    /**
     * Get payment success rate for customer
     */
    private function getPaymentSuccessRate(Customer $customer): float
    {
        $totalOrders = $customer->orders()->count();
        
        if ($totalOrders === 0) {
            return 0.0;
        }

        $paidOrders = $customer->orders()
            ->whereHas('payments', function ($query) {
                $query->where('status', 'verified');
            })
            ->count();

        return ($paidOrders / $totalOrders) * 100;
    }

    /**
     * Get account age in days
     */
    private function getAccountAgeDays(Customer $customer): int
    {
        return $customer->created_at->diffInDays(now());
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Trust score calculation job failed permanently', [
            'customer_id' => $this->customerId,
            'error' => $exception->getMessage(),
        ]);
    }
}
