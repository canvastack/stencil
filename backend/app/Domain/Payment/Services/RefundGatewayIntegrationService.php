<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Domain\Payment\Events\RefundCompleted;
use App\Domain\Payment\Events\RefundFailed;
use App\Domain\Payment\Events\RefundProcessed;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class RefundGatewayIntegrationService
{
    public function __construct(
        private PaymentGatewayService $gatewayService,
        private RefundService $refundService
    ) {}

    /**
     * Process refund through appropriate gateway with enhanced error handling
     */
    public function processRefundWithGateway(PaymentRefund $refund, int $processedBy): array
    {
        return DB::transaction(function () use ($refund, $processedBy) {
            try {
                // Mark as processing
                $refund->update([
                    'status' => 'processing',
                    'processed_by' => $processedBy,
                    'processed_at' => now(),
                ]);

                Log::info('Starting refund processing', [
                    'refund_id' => $refund->id,
                    'refund_reference' => $refund->refund_reference,
                    'method' => $refund->refund_method,
                    'amount' => $refund->refund_amount,
                    'processed_by' => $processedBy,
                ]);

                // Process through gateway
                $gatewayResponse = $this->gatewayService->processRefund($refund);

                if ($gatewayResponse['success']) {
                    return $this->handleSuccessfulRefund($refund, $gatewayResponse, $processedBy);
                } else {
                    return $this->handleFailedRefund($refund, $gatewayResponse, $processedBy);
                }

            } catch (\Exception $e) {
                return $this->handleRefundException($refund, $e, $processedBy);
            }
        });
    }

    /**
     * Handle successful refund processing
     */
    private function handleSuccessfulRefund(
        PaymentRefund $refund, 
        array $gatewayResponse, 
        int $processedBy
    ): array {
        $gatewayData = $gatewayResponse['data'];

        // Update refund record
        $refund->update([
            'status' => 'completed',
            'completed_at' => now(),
            'gateway_refund_id' => $gatewayData['refund_id'] ?? null,
            'gateway_response' => $gatewayData,
            'final_amount' => $refund->refund_amount - $refund->fee_amount,
        ]);

        // Update order payment status if applicable
        $this->updateOrderPaymentStatus($refund);

        // Fire events
        event(new RefundProcessed($refund, $gatewayData));
        event(new RefundCompleted($refund, $gatewayData));

        Log::info('Refund completed successfully', [
            'refund_id' => $refund->id,
            'gateway_refund_id' => $gatewayData['refund_id'] ?? null,
            'final_amount' => $refund->final_amount,
            'processing_time' => now()->diffInSeconds($refund->processed_at),
        ]);

        return [
            'success' => true,
            'message' => 'Refund processed successfully',
            'data' => [
                'refund_id' => $refund->id,
                'refund_reference' => $refund->refund_reference,
                'final_amount' => $refund->final_amount,
                'gateway_refund_id' => $gatewayData['refund_id'] ?? null,
                'completed_at' => $refund->completed_at->toISOString(),
                'gateway_data' => $gatewayData,
            ]
        ];
    }

    /**
     * Handle failed refund processing
     */
    private function handleFailedRefund(
        PaymentRefund $refund, 
        array $gatewayResponse, 
        int $processedBy
    ): array {
        // Update refund record
        $refund->update([
            'status' => 'failed',
            'failure_reason' => $gatewayResponse['error_message'],
            'gateway_error_code' => $gatewayResponse['error_code'],
            'gateway_response' => $gatewayResponse['data'] ?? [],
            'failed_at' => now(),
        ]);

        // Fire event
        event(new RefundFailed(
            $refund,
            $gatewayResponse['error_code'],
            $gatewayResponse['error_message'],
            $gatewayResponse['data'] ?? []
        ));

        Log::error('Refund processing failed', [
            'refund_id' => $refund->id,
            'error_code' => $gatewayResponse['error_code'],
            'error_message' => $gatewayResponse['error_message'],
            'gateway_data' => $gatewayResponse['data'] ?? [],
        ]);

        return [
            'success' => false,
            'message' => $gatewayResponse['error_message'],
            'error_code' => $gatewayResponse['error_code'],
            'data' => [
                'refund_id' => $refund->id,
                'refund_reference' => $refund->refund_reference,
                'failure_reason' => $gatewayResponse['error_message'],
                'gateway_error_code' => $gatewayResponse['error_code'],
                'failed_at' => $refund->failed_at->toISOString(),
                'retry_available' => $this->canRetryRefund($refund),
            ]
        ];
    }

    /**
     * Handle refund processing exceptions
     */
    private function handleRefundException(
        PaymentRefund $refund, 
        \Exception $e, 
        int $processedBy
    ): array {
        // Update refund record
        $refund->update([
            'status' => 'failed',
            'failure_reason' => 'System error: ' . $e->getMessage(),
            'gateway_error_code' => 'SYSTEM_ERROR',
            'gateway_response' => [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ],
            'failed_at' => now(),
        ]);

        // Fire event
        event(new RefundFailed(
            $refund,
            'SYSTEM_ERROR',
            'System error: ' . $e->getMessage()
        ));

        Log::error('Refund processing exception', [
            'refund_id' => $refund->id,
            'exception' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        return [
            'success' => false,
            'message' => 'System error occurred while processing refund',
            'error_code' => 'SYSTEM_ERROR',
            'data' => [
                'refund_id' => $refund->id,
                'refund_reference' => $refund->refund_reference,
                'failure_reason' => 'System error: ' . $e->getMessage(),
                'failed_at' => $refund->failed_at->toISOString(),
                'retry_available' => true,
            ]
        ];
    }

    /**
     * Retry failed refund processing
     */
    public function retryRefundProcessing(PaymentRefund $refund, int $processedBy): array
    {
        if (!$this->canRetryRefund($refund)) {
            return [
                'success' => false,
                'message' => 'This refund cannot be retried',
                'error_code' => 'RETRY_NOT_ALLOWED',
            ];
        }

        // Reset failure state
        $refund->update([
            'status' => 'approved', // Reset to approved state for retry
            'failure_reason' => null,
            'gateway_error_code' => null,
            'failed_at' => null,
        ]);

        Log::info('Retrying refund processing', [
            'refund_id' => $refund->id,
            'retry_by' => $processedBy,
            'original_failure' => $refund->gateway_response,
        ]);

        // Process again
        return $this->processRefundWithGateway($refund, $processedBy);
    }

    /**
     * Check if refund can be retried
     */
    public function canRetryRefund(PaymentRefund $refund): bool
    {
        // Can only retry failed refunds
        if ($refund->status !== 'failed') {
            return false;
        }

        // Check retry limit (max 3 attempts)
        $retryCount = DB::table('refund_processing_logs')
            ->where('refund_id', $refund->id)
            ->where('action', 'retry')
            ->count();

        if ($retryCount >= 3) {
            return false;
        }

        // Some errors are not retryable
        $nonRetryableErrors = [
            'INSUFFICIENT_FUNDS',
            'INVALID_ACCOUNT',
            'ACCOUNT_CLOSED',
            'INVALID_REFUND_AMOUNT',
        ];

        if (in_array($refund->gateway_error_code, $nonRetryableErrors)) {
            return false;
        }

        return true;
    }

    /**
     * Get refund status from gateway
     */
    public function checkRefundStatus(PaymentRefund $refund): array
    {
        try {
            $gatewayResponse = $this->gatewayService->checkRefundStatus($refund);
            
            Log::info('Refund status checked', [
                'refund_id' => $refund->id,
                'gateway_status' => $gatewayResponse['status'],
            ]);

            return [
                'success' => true,
                'data' => $gatewayResponse,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to check refund status', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to check status: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Process manual refund (outside gateway)
     */
    public function processManualRefund(
        PaymentRefund $refund, 
        int $processedBy, 
        array $manualData
    ): array {
        return DB::transaction(function () use ($refund, $processedBy, $manualData) {
            $refund->update([
                'status' => 'completed',
                'refund_method' => 'manual',
                'processed_by' => $processedBy,
                'processed_at' => now(),
                'completed_at' => now(),
                'gateway_response' => [
                    'manual_processing' => true,
                    'processed_by_user' => $processedBy,
                    'manual_reference' => $manualData['reference'] ?? 'MANUAL_' . time(),
                    'notes' => $manualData['notes'] ?? 'Processed manually',
                ],
                'final_amount' => $refund->refund_amount, // No fees for manual processing
            ]);

            // Update order payment status
            $this->updateOrderPaymentStatus($refund);

            // Fire events
            event(new RefundCompleted($refund, $refund->gateway_response));

            Log::info('Manual refund processed', [
                'refund_id' => $refund->id,
                'processed_by' => $processedBy,
                'manual_data' => $manualData,
            ]);

            return [
                'success' => true,
                'message' => 'Manual refund processed successfully',
                'data' => [
                    'refund_id' => $refund->id,
                    'refund_reference' => $refund->refund_reference,
                    'final_amount' => $refund->final_amount,
                    'manual_reference' => $refund->gateway_response['manual_reference'],
                    'completed_at' => $refund->completed_at->toISOString(),
                ]
            ];
        });
    }

    /**
     * Update order payment status based on refunds
     */
    private function updateOrderPaymentStatus(PaymentRefund $refund): void
    {
        $refundSummary = $this->refundService->getOrderRefundSummary($refund->order_id);
        
        if ($refundSummary['is_fully_refunded']) {
            // Mark order as refunded
            DB::table('orders')
                ->where('id', $refund->order_id)
                ->update([
                    'payment_status' => 'refunded',
                    'updated_at' => now(),
                ]);

            Log::info('Order marked as fully refunded', [
                'order_id' => $refund->order_id,
                'total_refunded' => $refundSummary['total_refunded'],
            ]);
        } elseif ($refundSummary['total_refunded'] > 0) {
            // Mark order as partially refunded
            DB::table('orders')
                ->where('id', $refund->order_id)
                ->update([
                    'payment_status' => 'partially_refunded',
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Bulk process multiple approved refunds
     */
    public function processBulkRefunds(array $refundIds, int $processedBy): array
    {
        $results = [];
        $successCount = 0;
        $failureCount = 0;

        foreach ($refundIds as $refundId) {
            try {
                $refund = PaymentRefund::findOrFail($refundId);
                
                if ($refund->status !== 'approved') {
                    $results[] = [
                        'refund_id' => $refundId,
                        'success' => false,
                        'message' => 'Refund not in approved status',
                    ];
                    $failureCount++;
                    continue;
                }

                $result = $this->processRefundWithGateway($refund, $processedBy);
                $results[] = array_merge(['refund_id' => $refundId], $result);
                
                if ($result['success']) {
                    $successCount++;
                } else {
                    $failureCount++;
                }

            } catch (\Exception $e) {
                $results[] = [
                    'refund_id' => $refundId,
                    'success' => false,
                    'message' => $e->getMessage(),
                ];
                $failureCount++;
            }
        }

        Log::info('Bulk refund processing completed', [
            'processed_by' => $processedBy,
            'total_refunds' => count($refundIds),
            'successful' => $successCount,
            'failed' => $failureCount,
        ]);

        return [
            'total_processed' => count($refundIds),
            'successful' => $successCount,
            'failed' => $failureCount,
            'results' => $results,
        ];
    }
}