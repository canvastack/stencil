<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\PaymentRefund;
use App\Domain\Payment\Services\RefundGatewayIntegrationService;
use App\Domain\Payment\Services\PaymentGatewayService;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Mockery;

class RefundGatewayIntegrationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected RefundGatewayIntegrationService $service;
    protected PaymentGatewayService $mockGatewayService;
    protected User $user;
    protected PaymentRefund $refund;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test user
        $this->user = User::factory()->create([
            'tenant_id' => 'test-tenant-123'
        ]);
        
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => 'test-tenant-123']);
        $order = Order::factory()->create([
            'tenant_id' => 'test-tenant-123',
            'customer_id' => $customer->id,
            'total_amount' => 100000
        ]);
        $transaction = OrderPaymentTransaction::factory()->create([
            'order_id' => $order->id,
            'amount' => 100000,
            'status' => 'completed'
        ]);
        
        // Create refund
        $this->refund = PaymentRefund::factory()->create([
            'tenant_id' => 'test-tenant-123',
            'order_id' => $order->id,
            'original_transaction_id' => $transaction->id,
            'customer_id' => $customer->id,
            'status' => 'approved',
            'refund_amount' => 50000
        ]);

        // Mock gateway service
        $this->mockGatewayService = Mockery::mock(PaymentGatewayService::class);
        $this->app->instance(PaymentGatewayService::class, $this->mockGatewayService);
        
        // Initialize service
        $this->service = app(RefundGatewayIntegrationService::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_can_process_successful_refund_through_gateway()
    {
        // Arrange
        $gatewayResponse = [
            'success' => true,
            'data' => [
                'refund_id' => 'REF_12345',
                'status' => 'completed',
                'amount' => 50000,
                'gateway' => 'midtrans',
                'processed_at' => now()->toISOString(),
            ]
        ];

        $this->mockGatewayService
            ->shouldReceive('processRefund')
            ->once()
            ->with($this->refund)
            ->andReturn($gatewayResponse);

        // Act
        $result = $this->service->processRefundWithGateway($this->refund, $this->user->id);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('Refund processed successfully', $result['message']);
        $this->assertArrayHasKey('data', $result);
        $this->assertEquals($this->refund->id, $result['data']['refund_id']);

        // Check database
        $this->refund->refresh();
        $this->assertEquals('completed', $this->refund->status);
        $this->assertEquals('REF_12345', $this->refund->gateway_refund_id);
        $this->assertNotNull($this->refund->completed_at);
    }

    /** @test */
    public function it_handles_failed_refund_processing()
    {
        // Arrange
        $gatewayResponse = [
            'success' => false,
            'error_code' => 'INSUFFICIENT_FUNDS',
            'error_message' => 'Insufficient funds for refund',
            'data' => []
        ];

        $this->mockGatewayService
            ->shouldReceive('processRefund')
            ->once()
            ->with($this->refund)
            ->andReturn($gatewayResponse);

        // Act
        $result = $this->service->processRefundWithGateway($this->refund, $this->user->id);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('Insufficient funds for refund', $result['message']);
        $this->assertEquals('INSUFFICIENT_FUNDS', $result['error_code']);

        // Check database
        $this->refund->refresh();
        $this->assertEquals('failed', $this->refund->status);
        $this->assertEquals('INSUFFICIENT_FUNDS', $this->refund->gateway_error_code);
        $this->assertEquals('Insufficient funds for refund', $this->refund->failure_reason);
        $this->assertNotNull($this->refund->failed_at);
    }

    /** @test */
    public function it_handles_exceptions_during_processing()
    {
        // Arrange
        $this->mockGatewayService
            ->shouldReceive('processRefund')
            ->once()
            ->with($this->refund)
            ->andThrow(new \Exception('Gateway connection error'));

        // Act
        $result = $this->service->processRefundWithGateway($this->refund, $this->user->id);

        // Assert
        $this->assertFalse($result['success']);
        $this->assertEquals('System error occurred while processing refund', $result['message']);
        $this->assertEquals('SYSTEM_ERROR', $result['error_code']);

        // Check database
        $this->refund->refresh();
        $this->assertEquals('failed', $this->refund->status);
        $this->assertEquals('SYSTEM_ERROR', $this->refund->gateway_error_code);
        $this->assertStringContains('Gateway connection error', $this->refund->failure_reason);
    }

    /** @test */
    public function it_can_retry_failed_refunds()
    {
        // Arrange - Set refund as failed
        $this->refund->update([
            'status' => 'failed',
            'gateway_error_code' => 'TEMPORARY_ERROR',
            'failure_reason' => 'Temporary gateway error'
        ]);

        $retryGatewayResponse = [
            'success' => true,
            'data' => [
                'refund_id' => 'REF_RETRY_12345',
                'status' => 'completed',
                'amount' => 50000,
                'gateway' => 'midtrans',
                'processed_at' => now()->toISOString(),
            ]
        ];

        $this->mockGatewayService
            ->shouldReceive('processRefund')
            ->once()
            ->with($this->refund)
            ->andReturn($retryGatewayResponse);

        // Act
        $result = $this->service->retryRefundProcessing($this->refund, $this->user->id);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('Refund processed successfully', $result['message']);

        // Check database
        $this->refund->refresh();
        $this->assertEquals('completed', $this->refund->status);
        $this->assertEquals('REF_RETRY_12345', $this->refund->gateway_refund_id);
        $this->assertNotNull($this->refund->completed_at);
        $this->assertNull($this->refund->failure_reason);
    }

    /** @test */
    public function it_prevents_retry_of_non_retryable_errors()
    {
        // Arrange - Set refund as failed with non-retryable error
        $this->refund->update([
            'status' => 'failed',
            'gateway_error_code' => 'INSUFFICIENT_FUNDS',
            'failure_reason' => 'Insufficient funds'
        ]);

        // Act
        $canRetry = $this->service->canRetryRefund($this->refund);
        
        // Assert
        $this->assertFalse($canRetry);

        // Test actual retry attempt
        $result = $this->service->retryRefundProcessing($this->refund, $this->user->id);
        $this->assertFalse($result['success']);
        $this->assertEquals('This refund cannot be retried', $result['message']);
    }

    /** @test */
    public function it_can_process_manual_refunds()
    {
        // Arrange
        $manualData = [
            'reference' => 'MANUAL_REF_123',
            'notes' => 'Processed manually due to gateway issues'
        ];

        // Act
        $result = $this->service->processManualRefund($this->refund, $this->user->id, $manualData);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals('Manual refund processed successfully', $result['message']);
        $this->assertEquals($manualData['reference'], $result['data']['manual_reference']);

        // Check database
        $this->refund->refresh();
        $this->assertEquals('completed', $this->refund->status);
        $this->assertEquals('manual', $this->refund->refund_method);
        $this->assertEquals(50000, $this->refund->final_amount); // No fees for manual processing
        $this->assertTrue($this->refund->gateway_response['manual_processing']);
    }

    /** @test */
    public function it_can_check_refund_status_from_gateway()
    {
        // Arrange
        $this->refund->update([
            'gateway_refund_id' => 'REF_12345',
            'status' => 'processing'
        ]);

        $statusResponse = [
            'status' => 'completed',
            'message' => 'Refund completed successfully'
        ];

        $this->mockGatewayService
            ->shouldReceive('checkRefundStatus')
            ->once()
            ->with($this->refund)
            ->andReturn($statusResponse);

        // Act
        $result = $this->service->checkRefundStatus($this->refund);

        // Assert
        $this->assertTrue($result['success']);
        $this->assertEquals($statusResponse, $result['data']);
    }

    /** @test */
    public function it_can_process_bulk_refunds()
    {
        // Arrange - Create additional refunds
        $refund2 = PaymentRefund::factory()->create([
            'tenant_id' => 'test-tenant-123',
            'status' => 'approved',
            'refund_amount' => 25000
        ]);

        $refund3 = PaymentRefund::factory()->create([
            'tenant_id' => 'test-tenant-123', 
            'status' => 'approved',
            'refund_amount' => 75000
        ]);

        // Mock successful responses for all refunds
        $this->mockGatewayService
            ->shouldReceive('processRefund')
            ->times(3)
            ->andReturn([
                'success' => true,
                'data' => [
                    'refund_id' => 'BULK_REF_' . rand(1000, 9999),
                    'status' => 'completed',
                    'gateway' => 'midtrans',
                    'processed_at' => now()->toISOString(),
                ]
            ]);

        // Act
        $result = $this->service->processBulkRefunds(
            [$this->refund->id, $refund2->id, $refund3->id],
            $this->user->id
        );

        // Assert
        $this->assertEquals(3, $result['total_processed']);
        $this->assertEquals(3, $result['successful']);
        $this->assertEquals(0, $result['failed']);
        $this->assertCount(3, $result['results']);

        // Check all refunds are completed
        $this->refund->refresh();
        $refund2->refresh();
        $refund3->refresh();

        $this->assertEquals('completed', $this->refund->status);
        $this->assertEquals('completed', $refund2->status);
        $this->assertEquals('completed', $refund3->status);
    }

    /** @test */
    public function it_handles_mixed_results_in_bulk_processing()
    {
        // Arrange - Create additional refunds
        $refund2 = PaymentRefund::factory()->create([
            'tenant_id' => 'test-tenant-123',
            'status' => 'approved',
            'refund_amount' => 25000
        ]);

        $refund3 = PaymentRefund::factory()->create([
            'tenant_id' => 'test-tenant-123',
            'status' => 'pending', // This one should fail due to wrong status
            'refund_amount' => 75000
        ]);

        // Mock responses - success and failure
        $this->mockGatewayService
            ->shouldReceive('processRefund')
            ->times(2)
            ->andReturnValues([
                [
                    'success' => true,
                    'data' => [
                        'refund_id' => 'BULK_SUCCESS_1',
                        'status' => 'completed',
                        'gateway' => 'midtrans',
                    ]
                ],
                [
                    'success' => false,
                    'error_code' => 'PROCESSING_ERROR',
                    'error_message' => 'Gateway processing failed',
                    'data' => []
                ]
            ]);

        // Act
        $result = $this->service->processBulkRefunds(
            [$this->refund->id, $refund2->id, $refund3->id],
            $this->user->id
        );

        // Assert
        $this->assertEquals(3, $result['total_processed']);
        $this->assertEquals(1, $result['successful']); // Only first one succeeds
        $this->assertEquals(2, $result['failed']); // Second fails from gateway, third fails from status check
        $this->assertCount(3, $result['results']);

        // Check specific results
        $this->assertTrue($result['results'][0]['success']); // First refund succeeds
        $this->assertFalse($result['results'][1]['success']); // Second refund fails from gateway
        $this->assertFalse($result['results'][2]['success']); // Third refund fails from status check
        $this->assertEquals('Refund not in approved status', $result['results'][2]['message']);
    }
}