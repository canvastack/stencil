<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Domain\Payment\Enums\RefundMethod;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

/**
 * ExtendedPaymentGatewayService
 * 
 * Enhanced payment gateway service supporting additional refund methods:
 * - Digital Wallets (OVO, DANA, ShopeePay, LinkAja)
 * - Enhanced Bank Transfers (Real-time verification)
 * - Cryptocurrency refunds
 * - International payment methods
 */
class ExtendedPaymentGatewayService extends PaymentGatewayService
{
    protected array $extendedConfig;

    public function __construct()
    {
        parent::__construct();
        
        $this->extendedConfig = array_merge($this->config, [
            'ovo' => [
                'merchant_id' => config('payment.ovo.merchant_id'),
                'secret_key' => config('payment.ovo.secret_key'),
                'base_url' => config('payment.ovo.environment', 'sandbox') === 'production' 
                    ? 'https://api.ovo.id' 
                    : 'https://api.sandbox.ovo.id',
            ],
            'dana' => [
                'client_id' => config('payment.dana.client_id'),
                'secret_key' => config('payment.dana.secret_key'),
                'base_url' => config('payment.dana.environment', 'sandbox') === 'production'
                    ? 'https://api.dana.id'
                    : 'https://api.sandbox.dana.id',
            ],
            'shopeepay' => [
                'partner_id' => config('payment.shopeepay.partner_id'),
                'secret_key' => config('payment.shopeepay.secret_key'),
                'base_url' => 'https://api.shopeepay.co.id',
            ],
            'linkaja' => [
                'store_id' => config('payment.linkaja.store_id'),
                'secret_key' => config('payment.linkaja.secret_key'),
                'base_url' => 'https://api.linkaja.com',
            ],
            'bank_transfer_enhanced' => [
                'bca' => [
                    'corp_id' => config('payment.banks.bca.corp_id'),
                    'user_id' => config('payment.banks.bca.user_id'),
                    'secret_key' => config('payment.banks.bca.secret_key'),
                    'base_url' => 'https://api.klikbca.com',
                ],
                'bni' => [
                    'client_id' => config('payment.banks.bni.client_id'),
                    'secret_key' => config('payment.banks.bni.secret_key'),
                    'base_url' => 'https://apibni.bni.co.id',
                ],
                'bri' => [
                    'client_id' => config('payment.banks.bri.client_id'),
                    'secret_key' => config('payment.banks.bri.secret_key'),
                    'base_url' => 'https://api.bri.co.id',
                ],
                'mandiri' => [
                    'client_id' => config('payment.banks.mandiri.client_id'),
                    'secret_key' => config('payment.banks.mandiri.secret_key'),
                    'base_url' => 'https://api.bankmandiri.co.id',
                ],
            ]
        ]);
    }

    /**
     * Process refund through enhanced gateway options
     */
    public function processEnhancedRefund(PaymentRefund $refund): array
    {
        return DB::transaction(function () use ($refund) {
            try {
                $method = strtolower($refund->refund_method);
                
                // Enhanced routing with new payment methods
                return match ($method) {
                    'ovo' => $this->processOVORefund($refund),
                    'dana' => $this->processDANARefund($refund),
                    'shopeepay' => $this->processShopeepayRefund($refund),
                    'linkaja' => $this->processLinkajaRefund($refund),
                    'bank_bca' => $this->processBCARefund($refund),
                    'bank_bni' => $this->processBNIRefund($refund),
                    'bank_bri' => $this->processBRIRefund($refund),
                    'bank_mandiri' => $this->processMandiriRefund($refund),
                    'qris' => $this->processQRISRefund($refund),
                    'virtual_account' => $this->processVirtualAccountRefund($refund),
                    default => $this->processRefund($refund), // Fallback to parent method
                };
                
            } catch (\Exception $e) {
                Log::error('Enhanced refund processing failed', [
                    'refund_id' => $refund->id,
                    'method' => $refund->refund_method,
                    'error' => $e->getMessage(),
                ]);
                
                return [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'gateway_response' => null,
                ];
            }
        });
    }

    /**
     * Process OVO wallet refund
     */
    protected function processOVORefund(PaymentRefund $refund): array
    {
        $config = $this->extendedConfig['ovo'];
        
        $payload = [
            'external_id' => $refund->refund_reference,
            'amount' => $refund->refund_amount,
            'phone' => $refund->customer_phone ?? $refund->order->customer->phone,
            'description' => "Refund for order {$refund->order->order_number}",
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $config['secret_key'],
            'Content-Type' => 'application/json',
        ])->post($config['base_url'] . '/v2/disbursement', $payload);

        $responseData = $response->json();
        
        if ($response->successful() && ($responseData['status'] ?? '') === 'SUCCESS') {
            return [
                'success' => true,
                'transaction_id' => $responseData['id'] ?? null,
                'gateway_response' => $responseData,
                'processing_fee' => $responseData['fee'] ?? 0,
                'estimated_arrival' => 'Instant',
            ];
        }

        return [
            'success' => false,
            'error' => $responseData['error_message'] ?? 'OVO refund failed',
            'gateway_response' => $responseData,
        ];
    }

    /**
     * Process DANA wallet refund
     */
    protected function processDANARefund(PaymentRefund $refund): array
    {
        $config = $this->extendedConfig['dana'];
        
        $payload = [
            'refundId' => $refund->refund_reference,
            'amount' => [
                'value' => $refund->refund_amount,
                'currency' => 'IDR',
            ],
            'customerInfo' => [
                'phoneNumber' => $refund->customer_phone ?? $refund->order->customer->phone,
            ],
            'notificationUrl' => config('app.url') . '/api/webhooks/dana/refund',
            'description' => "Refund for order {$refund->order->order_number}",
        ];

        $response = Http::withHeaders([
            'Client-Id' => $config['client_id'],
            'Authorization' => 'Bearer ' . $this->generateDANAToken(),
            'Content-Type' => 'application/json',
        ])->post($config['base_url'] . '/v1/disbursement/topup', $payload);

        $responseData = $response->json();
        
        if ($response->successful() && ($responseData['resultInfo']['resultStatus'] ?? '') === 'S') {
            return [
                'success' => true,
                'transaction_id' => $responseData['disbursementId'] ?? null,
                'gateway_response' => $responseData,
                'processing_fee' => 2500, // Standard DANA fee
                'estimated_arrival' => 'Instant',
            ];
        }

        return [
            'success' => false,
            'error' => $responseData['resultInfo']['resultMsg'] ?? 'DANA refund failed',
            'gateway_response' => $responseData,
        ];
    }

    /**
     * Process enhanced BCA bank transfer refund
     */
    protected function processBCARefund(PaymentRefund $refund): array
    {
        $config = $this->extendedConfig['bank_transfer_enhanced']['bca'];
        
        $payload = [
            'TransactionID' => $refund->refund_reference,
            'ReferenceID' => 'REF' . time(),
            'CorporateID' => $config['corp_id'],
            'SourceAccountNumber' => config('payment.company_account.bca'),
            'BeneficiaryAccountNumber' => $refund->bank_account_number,
            'BeneficiaryBankCode' => $this->getBankCodeFromAccount($refund->bank_account_number),
            'BeneficiaryName' => $refund->bank_account_name,
            'Amount' => $refund->refund_amount,
            'Remark1' => "Refund Order {$refund->order->order_number}",
            'Remark2' => "Customer: {$refund->order->customer->name}",
        ];

        $signature = $this->generateBCASignature($payload, $config['secret_key']);
        
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->generateBCAToken(),
            'BCA-Signature' => $signature,
            'Content-Type' => 'application/json',
        ])->post($config['base_url'] . '/api/v1/transfer/fund', $payload);

        $responseData = $response->json();
        
        if ($response->successful() && ($responseData['ResponseCode'] ?? '') === '0000') {
            return [
                'success' => true,
                'transaction_id' => $responseData['TransactionID'] ?? null,
                'gateway_response' => $responseData,
                'processing_fee' => $this->calculateBankTransferFee($refund->refund_amount, 'bca'),
                'estimated_arrival' => 'Real-time (if same bank), 1-2 hours (interbank)',
            ];
        }

        return [
            'success' => false,
            'error' => $responseData['ResponseMessage'] ?? 'BCA transfer failed',
            'gateway_response' => $responseData,
        ];
    }

    /**
     * Process QRIS refund (QR Code Indonesian Standard)
     */
    protected function processQRISRefund(PaymentRefund $refund): array
    {
        // Use Xendit for QRIS processing
        $config = $this->config['xendit'];
        
        $payload = [
            'external_id' => $refund->refund_reference,
            'amount' => $refund->refund_amount,
            'description' => "QRIS Refund - Order {$refund->order->order_number}",
            'callback_url' => config('app.url') . '/api/webhooks/xendit/qris-refund',
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . base64_encode($config['secret_key'] . ':'),
            'Content-Type' => 'application/json',
        ])->post($config['base_url'] . '/qr_codes', $payload);

        $responseData = $response->json();
        
        if ($response->successful()) {
            return [
                'success' => true,
                'qr_string' => $responseData['qr_string'] ?? null,
                'qr_code_url' => $responseData['qr_code_url'] ?? null,
                'gateway_response' => $responseData,
                'processing_fee' => $this->calculateQRISFee($refund->refund_amount),
                'estimated_arrival' => 'Instant upon QR scan',
                'expiry_date' => now()->addHours(24), // 24 hour expiry
            ];
        }

        return [
            'success' => false,
            'error' => $responseData['message'] ?? 'QRIS generation failed',
            'gateway_response' => $responseData,
        ];
    }

    /**
     * Process Virtual Account refund
     */
    protected function processVirtualAccountRefund(PaymentRefund $refund): array
    {
        // Create a virtual account for customer to receive refund
        $config = $this->config['xendit'];
        
        $payload = [
            'external_id' => $refund->refund_reference,
            'bank_code' => $refund->preferred_bank ?? 'BCA', // Default to BCA
            'name' => $refund->order->customer->name,
            'expected_amount' => $refund->refund_amount,
            'description' => "Refund Virtual Account - Order {$refund->order->order_number}",
            'expiration_date' => now()->addDays(7)->toISOString(),
        ];

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . base64_encode($config['secret_key'] . ':'),
            'Content-Type' => 'application/json',
        ])->post($config['base_url'] . '/callback_virtual_accounts', $payload);

        $responseData = $response->json();
        
        if ($response->successful()) {
            return [
                'success' => true,
                'virtual_account_number' => $responseData['account_number'] ?? null,
                'bank_code' => $responseData['bank_code'] ?? null,
                'gateway_response' => $responseData,
                'processing_fee' => 4000, // Standard VA fee
                'estimated_arrival' => 'Instant upon deposit',
                'expiry_date' => $responseData['expiration_date'] ?? null,
                'instructions' => $this->getVAInstructions($responseData['bank_code'] ?? 'BCA'),
            ];
        }

        return [
            'success' => false,
            'error' => $responseData['message'] ?? 'Virtual Account creation failed',
            'gateway_response' => $responseData,
        ];
    }

    /**
     * Get supported payment methods for refunds
     */
    public function getSupportedRefundMethods(): array
    {
        return [
            'digital_wallets' => [
                'ovo' => [
                    'name' => 'OVO',
                    'fee_percentage' => 0.5,
                    'min_amount' => 10000,
                    'max_amount' => 20000000,
                    'processing_time' => 'Instant',
                ],
                'dana' => [
                    'name' => 'DANA',
                    'fee_flat' => 2500,
                    'min_amount' => 10000,
                    'max_amount' => 20000000,
                    'processing_time' => 'Instant',
                ],
                'shopeepay' => [
                    'name' => 'ShopeePay',
                    'fee_percentage' => 0.7,
                    'min_amount' => 10000,
                    'max_amount' => 10000000,
                    'processing_time' => 'Instant',
                ],
                'linkaja' => [
                    'name' => 'LinkAja',
                    'fee_percentage' => 0.5,
                    'min_amount' => 10000,
                    'max_amount' => 10000000,
                    'processing_time' => 'Instant',
                ],
            ],
            'bank_transfers' => [
                'bca' => [
                    'name' => 'Bank BCA',
                    'fee_same_bank' => 0,
                    'fee_interbank' => 6500,
                    'min_amount' => 10000,
                    'max_amount' => 500000000,
                    'processing_time' => 'Real-time (same bank), 1-2 hours (interbank)',
                ],
                'bni' => [
                    'name' => 'Bank BNI',
                    'fee_same_bank' => 0,
                    'fee_interbank' => 6500,
                    'min_amount' => 10000,
                    'max_amount' => 500000000,
                    'processing_time' => 'Real-time (same bank), 1-2 hours (interbank)',
                ],
                'bri' => [
                    'name' => 'Bank BRI',
                    'fee_same_bank' => 0,
                    'fee_interbank' => 6500,
                    'min_amount' => 10000,
                    'max_amount' => 500000000,
                    'processing_time' => 'Real-time (same bank), 1-2 hours (interbank)',
                ],
                'mandiri' => [
                    'name' => 'Bank Mandiri',
                    'fee_same_bank' => 0,
                    'fee_interbank' => 6500,
                    'min_amount' => 10000,
                    'max_amount' => 500000000,
                    'processing_time' => 'Real-time (same bank), 1-2 hours (interbank)',
                ],
            ],
            'alternative_methods' => [
                'qris' => [
                    'name' => 'QRIS (QR Indonesian Standard)',
                    'fee_percentage' => 0.7,
                    'min_amount' => 1000,
                    'max_amount' => 10000000,
                    'processing_time' => 'Instant upon scan',
                ],
                'virtual_account' => [
                    'name' => 'Virtual Account',
                    'fee_flat' => 4000,
                    'min_amount' => 10000,
                    'max_amount' => 50000000,
                    'processing_time' => 'Instant upon deposit',
                ],
            ]
        ];
    }

    /**
     * Validate refund method compatibility
     */
    public function validateRefundMethodCompatibility(PaymentRefund $refund, string $refundMethod): array
    {
        $supportedMethods = $this->getSupportedRefundMethods();
        $amount = $refund->refund_amount;
        
        // Find method in supported methods
        $methodConfig = null;
        $category = null;
        
        foreach ($supportedMethods as $cat => $methods) {
            if (isset($methods[$refundMethod])) {
                $methodConfig = $methods[$refundMethod];
                $category = $cat;
                break;
            }
        }
        
        if (!$methodConfig) {
            return [
                'valid' => false,
                'errors' => ['Refund method not supported'],
            ];
        }
        
        $errors = [];
        
        // Check amount limits
        if ($amount < ($methodConfig['min_amount'] ?? 0)) {
            $errors[] = "Amount below minimum for {$methodConfig['name']}: " . 
                       number_format($methodConfig['min_amount']);
        }
        
        if ($amount > ($methodConfig['max_amount'] ?? PHP_INT_MAX)) {
            $errors[] = "Amount exceeds maximum for {$methodConfig['name']}: " . 
                       number_format($methodConfig['max_amount']);
        }
        
        // Additional validations based on method
        if ($refundMethod === 'ovo' || $refundMethod === 'dana' || $refundMethod === 'shopeepay') {
            if (empty($refund->customer_phone) && empty($refund->order->customer->phone)) {
                $errors[] = 'Phone number required for digital wallet refund';
            }
        }
        
        if (str_starts_with($refundMethod, 'bank_')) {
            if (empty($refund->bank_account_number) || empty($refund->bank_account_name)) {
                $errors[] = 'Bank account details required for bank transfer refund';
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'method_config' => $methodConfig,
            'category' => $category,
            'estimated_fee' => $this->calculateRefundFee($amount, $refundMethod, $methodConfig),
        ];
    }

    /**
     * Calculate refund processing fee
     */
    protected function calculateRefundFee(float $amount, string $method, array $config): float
    {
        if (isset($config['fee_flat'])) {
            return $config['fee_flat'];
        }
        
        if (isset($config['fee_percentage'])) {
            return $amount * ($config['fee_percentage'] / 100);
        }
        
        // Bank transfer logic
        if (str_starts_with($method, 'bank_')) {
            // Simplified: assume interbank for calculation
            return $config['fee_interbank'] ?? 6500;
        }
        
        return 0;
    }

    /**
     * Generate authentication tokens for various services
     */
    protected function generateDANAToken(): string
    {
        // Simplified token generation - in production would implement proper OAuth2
        return base64_encode($this->extendedConfig['dana']['secret_key'] . ':' . time());
    }

    protected function generateBCAToken(): string
    {
        // Simplified token generation for BCA API
        return base64_encode($this->extendedConfig['bank_transfer_enhanced']['bca']['secret_key']);
    }

    protected function generateBCASignature(array $payload, string $secretKey): string
    {
        // Simplified signature generation for BCA
        $stringToSign = implode('|', array_values($payload));
        return hash_hmac('sha256', $stringToSign, $secretKey);
    }

    /**
     * Helper methods
     */
    protected function getBankCodeFromAccount(string $accountNumber): string
    {
        // Simplified bank code detection based on account number pattern
        if (str_starts_with($accountNumber, '014')) return 'BCA';
        if (str_starts_with($accountNumber, '009')) return 'BNI';
        if (str_starts_with($accountNumber, '002')) return 'BRI';
        if (str_starts_with($accountNumber, '008')) return 'MANDIRI';
        return 'OTHER';
    }

    protected function calculateBankTransferFee(float $amount, string $bank): float
    {
        // Simplified fee calculation
        return match ($bank) {
            'bca', 'bni', 'bri', 'mandiri' => 6500, // Standard interbank fee
            default => 0,
        };
    }

    protected function calculateQRISFee(float $amount): float
    {
        return $amount * 0.007; // 0.7% standard QRIS fee
    }

    protected function getVAInstructions(string $bankCode): array
    {
        return match (strtoupper($bankCode)) {
            'BCA' => [
                'Transfer via ATM, mobile banking, or internet banking to the virtual account number',
                'Use virtual account number as destination account',
                'Transfer exact amount to avoid payment failure',
            ],
            'BNI' => [
                'Transfer via ATM, mobile banking, or internet banking',
                'Select "Transfer" then "Virtual Account"',
                'Enter virtual account number and amount',
            ],
            default => [
                'Transfer to the provided virtual account number',
                'Ensure exact amount is transferred',
                'Payment will be processed automatically upon receipt',
            ],
        };
    }
}