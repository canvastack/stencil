<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Domain\Payment\Enums\RefundMethod;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PaymentGatewayService
{
    protected array $config;

    public function __construct()
    {
        $this->config = [
            'midtrans' => [
                'server_key' => config('payment.midtrans.server_key'),
                'client_key' => config('payment.midtrans.client_key'),
                'environment' => config('payment.midtrans.environment', 'sandbox'),
                'base_url' => config('payment.midtrans.environment', 'sandbox') === 'production' 
                    ? 'https://api.midtrans.com/v2' 
                    : 'https://api.sandbox.midtrans.com/v2',
            ],
            'xendit' => [
                'secret_key' => config('payment.xendit.secret_key'),
                'base_url' => 'https://api.xendit.co',
            ],
            'gopay' => [
                'partner_id' => config('payment.gopay.partner_id'),
                'secret_key' => config('payment.gopay.secret_key'),
                'base_url' => 'https://api.gopay.id',
            ]
        ];
    }

    /**
     * Process refund through appropriate payment gateway
     */
    public function processRefund(PaymentRefund $refund): array
    {
        try {
            $method = RefundMethod::fromString($refund->refund_method);
            
            // Route to appropriate processing method
            return match ($method) {
                RefundMethod::ORIGINAL_METHOD => $this->processOriginalMethodRefund($refund),
                RefundMethod::BANK_TRANSFER => $this->processBankTransferRefund($refund),
                RefundMethod::CASH => $this->processCashRefund($refund),
                RefundMethod::STORE_CREDIT => $this->processStoreCreditRefund($refund),
                RefundMethod::MANUAL => $this->processManualRefund($refund),
            };

        } catch (\Exception $e) {
            Log::error('Payment gateway error', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error_code' => 'GATEWAY_ERROR',
                'error_message' => $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Process refund to original payment method
     */
    protected function processOriginalMethodRefund(PaymentRefund $refund): array
    {
        $originalTransaction = $refund->originalTransaction;
        
        // Determine gateway based on original transaction
        $gateway = $this->detectGatewayFromTransaction($originalTransaction);
        
        return match ($gateway) {
            'midtrans' => $this->processMidtransRefund($refund),
            'xendit' => $this->processXenditRefund($refund),
            'gopay' => $this->processGopayRefund($refund),
            default => $this->processGenericRefund($refund),
        };
    }

    /**
     * Process Midtrans refund
     */
    protected function processMidtransRefund(PaymentRefund $refund): array
    {
        $originalTransaction = $refund->originalTransaction;
        $config = $this->config['midtrans'];

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($config['server_key'] . ':'),
            ])->post($config['base_url'] . '/' . $originalTransaction->reference . '/refund', [
                'refund_key' => $refund->refund_reference,
                'amount' => $refund->refund_amount,
                'reason' => $refund->reason,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'error_code' => null,
                    'error_message' => null,
                    'data' => [
                        'gateway' => 'midtrans',
                        'refund_id' => $data['refund_id'] ?? null,
                        'status' => $data['status'] ?? 'pending',
                        'amount' => $refund->refund_amount,
                        'gateway_response' => $data,
                        'processed_at' => now()->toISOString(),
                    ]
                ];
            } else {
                $errorData = $response->json();
                
                return [
                    'success' => false,
                    'error_code' => $errorData['error_code'] ?? 'MIDTRANS_ERROR',
                    'error_message' => $errorData['error_message'] ?? 'Refund processing failed',
                    'data' => $errorData
                ];
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error_code' => 'MIDTRANS_CONNECTION_ERROR',
                'error_message' => 'Failed to connect to Midtrans: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Process Xendit refund
     */
    protected function processXenditRefund(PaymentRefund $refund): array
    {
        $originalTransaction = $refund->originalTransaction;
        $config = $this->config['xendit'];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode($config['secret_key'] . ':'),
                'Content-Type' => 'application/json',
            ])->post($config['base_url'] . '/payment_requests/' . $originalTransaction->reference . '/refunds', [
                'amount' => $refund->refund_amount,
                'reason' => $refund->reason,
                'reference_id' => $refund->refund_reference,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'error_code' => null,
                    'error_message' => null,
                    'data' => [
                        'gateway' => 'xendit',
                        'refund_id' => $data['id'] ?? null,
                        'status' => $data['status'] ?? 'pending',
                        'amount' => $refund->refund_amount,
                        'gateway_response' => $data,
                        'processed_at' => now()->toISOString(),
                    ]
                ];
            } else {
                $errorData = $response->json();
                
                return [
                    'success' => false,
                    'error_code' => $errorData['error_code'] ?? 'XENDIT_ERROR',
                    'error_message' => $errorData['error_message'] ?? 'Refund processing failed',
                    'data' => $errorData
                ];
            }

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error_code' => 'XENDIT_CONNECTION_ERROR',
                'error_message' => 'Failed to connect to Xendit: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    /**
     * Process GoPay refund
     */
    protected function processGopayRefund(PaymentRefund $refund): array
    {
        // This is a mock implementation - actual GoPay API integration would go here
        return $this->processGenericRefund($refund, 'gopay');
    }

    /**
     * Process generic refund (fallback)
     */
    protected function processGenericRefund(PaymentRefund $refund, string $gateway = 'generic'): array
    {
        // Simulate processing delay
        sleep(1);

        // For demo purposes, randomly succeed or fail
        $success = rand(1, 100) <= 85; // 85% success rate

        if ($success) {
            return [
                'success' => true,
                'error_code' => null,
                'error_message' => null,
                'data' => [
                    'gateway' => $gateway,
                    'refund_id' => 'GENERIC_' . uniqid(),
                    'status' => 'completed',
                    'amount' => $refund->refund_amount,
                    'gateway_response' => [
                        'transaction_id' => uniqid(),
                        'status' => 'success',
                        'message' => 'Refund processed successfully',
                    ],
                    'processed_at' => now()->toISOString(),
                ]
            ];
        } else {
            return [
                'success' => false,
                'error_code' => 'PROCESSING_FAILED',
                'error_message' => 'Payment gateway processing failed',
                'data' => [
                    'gateway' => $gateway,
                    'attempted_at' => now()->toISOString(),
                ]
            ];
        }
    }

    /**
     * Process bank transfer refund
     */
    protected function processBankTransferRefund(PaymentRefund $refund): array
    {
        $refundDetails = $refund->refund_details;

        // Validate bank details
        if (!isset($refundDetails['bank_name']) || !isset($refundDetails['account_number'])) {
            return [
                'success' => false,
                'error_code' => 'INVALID_BANK_DETAILS',
                'error_message' => 'Bank transfer requires valid bank details',
                'data' => null
            ];
        }

        // Mock bank transfer processing
        // In real implementation, this would integrate with banking APIs
        return [
            'success' => true,
            'error_code' => null,
            'error_message' => null,
            'data' => [
                'gateway' => 'bank_transfer',
                'transfer_id' => 'TRF_' . uniqid(),
                'status' => 'processing', // Bank transfers take time
                'amount' => $refund->refund_amount,
                'bank_details' => $refundDetails,
                'estimated_completion' => now()->addBusinessDays(1)->toISOString(),
                'processed_at' => now()->toISOString(),
            ]
        ];
    }

    /**
     * Process cash refund
     */
    protected function processCashRefund(PaymentRefund $refund): array
    {
        // Cash refunds are handled manually at physical location
        return [
            'success' => true,
            'error_code' => null,
            'error_message' => null,
            'data' => [
                'gateway' => 'cash',
                'status' => 'pending_pickup',
                'amount' => $refund->refund_amount,
                'instructions' => 'Customer can collect cash refund at store location',
                'pickup_location' => 'Main Office',
                'valid_until' => now()->addDays(30)->toDateString(),
                'processed_at' => now()->toISOString(),
            ]
        ];
    }

    /**
     * Process store credit refund
     */
    protected function processStoreCreditRefund(PaymentRefund $refund): array
    {
        // Create store credit for customer
        $creditCode = 'SC-' . strtoupper(uniqid());

        return [
            'success' => true,
            'error_code' => null,
            'error_message' => null,
            'data' => [
                'gateway' => 'store_credit',
                'credit_code' => $creditCode,
                'status' => 'completed',
                'amount' => $refund->refund_amount,
                'valid_until' => now()->addYear()->toDateString(),
                'processed_at' => now()->toISOString(),
            ]
        ];
    }

    /**
     * Process manual refund
     */
    protected function processManualRefund(PaymentRefund $refund): array
    {
        // Manual refunds require human intervention
        return [
            'success' => true,
            'error_code' => null,
            'error_message' => null,
            'data' => [
                'gateway' => 'manual',
                'status' => 'pending_manual_processing',
                'amount' => $refund->refund_amount,
                'instructions' => 'Requires manual processing by finance team',
                'assigned_to' => 'finance_team',
                'processed_at' => now()->toISOString(),
            ]
        ];
    }

    /**
     * Detect gateway from original transaction
     */
    protected function detectGatewayFromTransaction($transaction): string
    {
        // Logic to determine which gateway was used for original transaction
        // This could be based on transaction metadata, method, or reference pattern
        
        if (isset($transaction->metadata['gateway'])) {
            return $transaction->metadata['gateway'];
        }

        if (str_starts_with($transaction->reference, 'midtrans_')) {
            return 'midtrans';
        }

        if (str_starts_with($transaction->reference, 'xendit_')) {
            return 'xendit';
        }

        if (str_starts_with($transaction->reference, 'gopay_')) {
            return 'gopay';
        }

        return 'generic';
    }

    /**
     * Check refund status from gateway
     */
    public function checkRefundStatus(PaymentRefund $refund): array
    {
        if (!$refund->gateway_refund_id) {
            return [
                'status' => 'unknown',
                'message' => 'No gateway refund ID available'
            ];
        }

        $gateway = $refund->gateway_response['gateway'] ?? 'generic';

        return match ($gateway) {
            'midtrans' => $this->checkMidtransRefundStatus($refund),
            'xendit' => $this->checkXenditRefundStatus($refund),
            'gopay' => $this->checkGopayRefundStatus($refund),
            default => $this->checkGenericRefundStatus($refund),
        };
    }

    /**
     * Check Midtrans refund status
     */
    protected function checkMidtransRefundStatus(PaymentRefund $refund): array
    {
        $config = $this->config['midtrans'];

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($config['server_key'] . ':'),
            ])->get($config['base_url'] . '/' . $refund->originalTransaction->reference . '/status');

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'status' => $data['transaction_status'] ?? 'unknown',
                    'message' => $data['status_message'] ?? 'Status check successful',
                    'data' => $data
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'Failed to check status from Midtrans'
                ];
            }

        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Connection error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check Xendit refund status
     */
    protected function checkXenditRefundStatus(PaymentRefund $refund): array
    {
        // Similar implementation for Xendit
        return [
            'status' => 'completed',
            'message' => 'Xendit status check not implemented'
        ];
    }

    /**
     * Check GoPay refund status
     */
    protected function checkGopayRefundStatus(PaymentRefund $refund): array
    {
        // Similar implementation for GoPay
        return [
            'status' => 'completed',
            'message' => 'GoPay status check not implemented'
        ];
    }

    /**
     * Check generic refund status
     */
    protected function checkGenericRefundStatus(PaymentRefund $refund): array
    {
        return [
            'status' => $refund->status,
            'message' => 'Generic refund status'
        ];
    }

    /**
     * Get supported payment methods for refunds
     */
    public function getSupportedRefundMethods(): array
    {
        return [
            RefundMethod::ORIGINAL_METHOD->value => [
                'name' => 'Original Payment Method',
                'processing_time' => '3-5 business days',
                'fee' => '2.5%',
                'automatic' => true,
            ],
            RefundMethod::BANK_TRANSFER->value => [
                'name' => 'Bank Transfer',
                'processing_time' => '1-2 business days',
                'fee' => 'IDR 5,000',
                'automatic' => false,
            ],
            RefundMethod::CASH->value => [
                'name' => 'Cash Pickup',
                'processing_time' => 'Immediate',
                'fee' => 'Free',
                'automatic' => false,
            ],
            RefundMethod::STORE_CREDIT->value => [
                'name' => 'Store Credit',
                'processing_time' => 'Immediate',
                'fee' => 'Free',
                'automatic' => true,
            ],
            RefundMethod::MANUAL->value => [
                'name' => 'Manual Processing',
                'processing_time' => '5-7 business days',
                'fee' => 'IDR 10,000',
                'automatic' => false,
            ],
        ];
    }
}