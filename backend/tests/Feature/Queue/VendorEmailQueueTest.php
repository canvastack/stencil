<?php

namespace Tests\Feature\Queue;

use App\Jobs\Vendor\SendVendorWelcomeEmailJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class VendorEmailQueueTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that vendor email jobs can be dispatched to the queue
     */
    public function test_vendor_email_job_can_be_dispatched(): void
    {
        Queue::fake();

        $tenantId = 'test-tenant-id';
        $recipientEmail = 'vendor@example.com';
        $emailData = [
            'vendor_name' => 'Test Vendor',
            'email' => 'vendor@example.com',
            'temporary_password' => 'TempPass123!',
            'login_url' => 'https://example.com/vendor/login',
        ];

        SendVendorWelcomeEmailJob::dispatch($tenantId, $recipientEmail, $emailData);

        Queue::assertPushed(SendVendorWelcomeEmailJob::class, function ($job) use ($tenantId, $recipientEmail) {
            return $job->queue === 'vendor-emails';
        });
    }

    /**
     * Test that vendor email jobs have correct retry configuration
     */
    public function test_vendor_email_job_has_retry_configuration(): void
    {
        $tenantId = 'test-tenant-id';
        $recipientEmail = 'vendor@example.com';
        $emailData = [
            'vendor_name' => 'Test Vendor',
            'email' => 'vendor@example.com',
            'temporary_password' => 'TempPass123!',
            'login_url' => 'https://example.com/vendor/login',
        ];

        $job = new SendVendorWelcomeEmailJob($tenantId, $recipientEmail, $emailData);

        $this->assertEquals(3, $job->tries);
        $this->assertEquals([60, 300, 900], $job->backoff);
        $this->assertEquals(120, $job->timeout);
        $this->assertEquals('vendor-emails', $job->queue);
    }

    /**
     * Test that queue connection is configured correctly
     * 
     * Note: In testing environment, queue may be set to 'sync' for immediate execution.
     * In production, it should be 'database' or 'redis'.
     */
    public function test_queue_connection_is_configured(): void
    {
        $connection = config('queue.default');
        
        $this->assertContains($connection, ['sync', 'database', 'redis'], 
            'Queue connection should be one of: sync, database, or redis');
    }

    /**
     * Test that vendor-emails queue is configured
     */
    public function test_vendor_emails_queue_is_configured(): void
    {
        $config = config('queue.connections.vendor-emails');

        $this->assertNotNull($config);
        $this->assertEquals('database', $config['driver']);
        $this->assertEquals('vendor-emails', $config['queue']);
        $this->assertEquals(180, $config['retry_after']);
    }

    /**
     * Test that jobs table exists
     */
    public function test_jobs_table_exists(): void
    {
        $this->assertTrue(\Schema::hasTable('jobs'));
    }

    /**
     * Test that failed_jobs table exists
     */
    public function test_failed_jobs_table_exists(): void
    {
        $this->assertTrue(\Schema::hasTable('failed_jobs'));
    }
}

