<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckPluginExpiry implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $approvalService = app(\App\Services\PluginApprovalService::class);

        \Illuminate\Support\Facades\Log::info('Starting plugin expiry check');

        try {
            $approvalService->checkExpiry();

            \Illuminate\Support\Facades\Log::info('Plugin expiry check completed successfully');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Plugin expiry check failed', [
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
