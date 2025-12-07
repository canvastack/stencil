<?php

namespace App\Http\Controllers;

use App\Models\PaymentRefund;
use App\Domain\Payment\Services\ExtendedPaymentGatewayService;
use App\Domain\Payment\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EnhancedRefundGatewayController
 * 
 * Handles enhanced refund processing with expanded payment method support
 * Includes digital wallets, enhanced bank transfers, and alternative payment methods
 */
class EnhancedRefundGatewayController extends Controller
{
    public function __construct(
        private ExtendedPaymentGatewayService $enhancedGatewayService,
        private RefundService $refundService
    ) {}

    /**
     * Get supported refund methods with details
     */
    public function getSupportedMethods(): JsonResponse
    {
        $methods = $this->enhancedGatewayService->getSupportedRefundMethods();

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    /**
     * Validate refund method for specific refund
     */
    public function validateRefundMethod(Request $request, PaymentRefund $refund): JsonResponse
    {
        // Ensure tenant access
        if ($refund->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'refund_method' => 'required|string',
        ]);

        $validation = $this->enhancedGatewayService->validateRefundMethodCompatibility(
            $refund,
            $request->refund_method
        );

        return response()->json([
            'success' => true,
            'data' => $validation,
        ]);
    }

    /**
     * Process refund with enhanced payment methods
     */
    public function processEnhancedRefund(Request $request, PaymentRefund $refund): JsonResponse
    {
        // Ensure tenant access
        if ($refund->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'refund_method' => 'required|string',
            'customer_phone' => 'sometimes|string|max:20',
            'bank_account_number' => 'sometimes|string|max:20',
            'bank_account_name' => 'sometimes|string|max:100',
            'preferred_bank' => 'sometimes|string|max:10',
        ]);

        // Validate refund can be processed
        if (!in_array($refund->status, ['approved', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Refund is not in a processable state',
            ], 400);
        }

        try {
            // Update refund method and additional details if provided
            $updateData = [
                'refund_method' => $request->refund_method,
                'status' => 'processing',
            ];

            if ($request->has('customer_phone')) {
                $updateData['customer_phone'] = $request->customer_phone;
            }

            if ($request->has('bank_account_number')) {
                $updateData['bank_account_number'] = $request->bank_account_number;
            }

            if ($request->has('bank_account_name')) {
                $updateData['bank_account_name'] = $request->bank_account_name;
            }

            if ($request->has('preferred_bank')) {
                $updateData['preferred_bank'] = $request->preferred_bank;
            }

            $refund->update($updateData);

            // Validate method compatibility
            $validation = $this->enhancedGatewayService->validateRefundMethodCompatibility(
                $refund->fresh(),
                $request->refund_method
            );

            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid refund method configuration',
                    'errors' => $validation['errors'],
                ], 400);
            }

            // Process the refund
            $result = $this->enhancedGatewayService->processEnhancedRefund($refund->fresh());

            if ($result['success']) {
                // Update refund status
                $refund->update([
                    'status' => 'completed',
                    'processed_at' => now(),
                    'gateway_response' => $result['gateway_response'],
                    'processing_fee' => $result['processing_fee'] ?? 0,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Refund processed successfully',
                    'data' => [
                        'refund_id' => $refund->id,
                        'transaction_id' => $result['transaction_id'] ?? null,
                        'processing_fee' => $result['processing_fee'] ?? 0,
                        'estimated_arrival' => $result['estimated_arrival'] ?? 'Unknown',
                        'additional_info' => $this->getAdditionalInfo($request->refund_method, $result),
                    ],
                ]);
            } else {
                // Update refund status to failed
                $refund->update([
                    'status' => 'failed',
                    'gateway_response' => $result['gateway_response'],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Refund processing failed',
                    'error' => $result['error'] ?? 'Unknown error',
                ], 500);
            }

        } catch (\Exception $e) {
            // Mark refund as failed
            $refund->update([
                'status' => 'failed',
                'gateway_response' => ['error' => $e->getMessage()],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Refund processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate QR code for QRIS refund
     */
    public function generateQRISRefund(Request $request, PaymentRefund $refund): JsonResponse
    {
        // Ensure tenant access
        if ($refund->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($refund->refund_method !== 'qris') {
            return response()->json([
                'success' => false,
                'message' => 'Refund method must be QRIS',
            ], 400);
        }

        try {
            $result = $this->enhancedGatewayService->processEnhancedRefund($refund);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'qr_string' => $result['qr_string'],
                        'qr_code_url' => $result['qr_code_url'],
                        'expiry_date' => $result['expiry_date'],
                        'amount' => $refund->refund_amount,
                        'instructions' => [
                            'Scan QR code with any QRIS-compatible payment app',
                            'Confirm payment amount',
                            'Refund will be processed instantly',
                        ],
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QRIS code',
                'error' => $result['error'],
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QRIS generation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create virtual account for refund
     */
    public function createVirtualAccount(Request $request, PaymentRefund $refund): JsonResponse
    {
        // Ensure tenant access
        if ($refund->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'bank_code' => 'sometimes|string|in:BCA,BNI,BRI,MANDIRI',
        ]);

        if ($refund->refund_method !== 'virtual_account') {
            return response()->json([
                'success' => false,
                'message' => 'Refund method must be Virtual Account',
            ], 400);
        }

        try {
            // Update preferred bank if provided
            if ($request->has('bank_code')) {
                $refund->update(['preferred_bank' => $request->bank_code]);
            }

            $result = $this->enhancedGatewayService->processEnhancedRefund($refund->fresh());

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'virtual_account_number' => $result['virtual_account_number'],
                        'bank_code' => $result['bank_code'],
                        'amount' => $refund->refund_amount,
                        'expiry_date' => $result['expiry_date'],
                        'instructions' => $result['instructions'],
                        'processing_fee' => $result['processing_fee'],
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create virtual account',
                'error' => $result['error'],
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Virtual account creation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check refund method fees
     */
    public function checkRefundFees(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'method' => 'required|string',
        ]);

        $amount = $request->amount;
        $method = $request->method;

        $methods = $this->enhancedGatewayService->getSupportedRefundMethods();
        
        // Find method configuration
        $methodConfig = null;
        foreach ($methods as $category => $categoryMethods) {
            if (isset($categoryMethods[$method])) {
                $methodConfig = $categoryMethods[$method];
                break;
            }
        }

        if (!$methodConfig) {
            return response()->json([
                'success' => false,
                'message' => 'Unsupported refund method',
            ], 400);
        }

        // Calculate fee
        $fee = 0;
        if (isset($methodConfig['fee_flat'])) {
            $fee = $methodConfig['fee_flat'];
        } elseif (isset($methodConfig['fee_percentage'])) {
            $fee = $amount * ($methodConfig['fee_percentage'] / 100);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'method' => $method,
                'method_name' => $methodConfig['name'],
                'amount' => $amount,
                'fee' => $fee,
                'net_amount' => $amount - $fee,
                'processing_time' => $methodConfig['processing_time'] ?? 'Unknown',
            ],
        ]);
    }

    /**
     * Get refund method recommendations based on amount and customer preferences
     */
    public function getMethodRecommendations(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1000',
            'customer_preference' => 'sometimes|string|in:speed,cost,convenience',
        ]);

        $amount = $request->amount;
        $preference = $request->get('customer_preference', 'speed');

        $methods = $this->enhancedGatewayService->getSupportedRefundMethods();
        $recommendations = [];

        foreach ($methods as $category => $categoryMethods) {
            foreach ($categoryMethods as $methodKey => $methodConfig) {
                // Check if amount is within limits
                if ($amount >= ($methodConfig['min_amount'] ?? 0) && 
                    $amount <= ($methodConfig['max_amount'] ?? PHP_INT_MAX)) {
                    
                    $fee = 0;
                    if (isset($methodConfig['fee_flat'])) {
                        $fee = $methodConfig['fee_flat'];
                    } elseif (isset($methodConfig['fee_percentage'])) {
                        $fee = $amount * ($methodConfig['fee_percentage'] / 100);
                    }

                    $recommendations[] = [
                        'method_key' => $methodKey,
                        'method_name' => $methodConfig['name'],
                        'category' => $category,
                        'fee' => $fee,
                        'fee_percentage' => round(($fee / $amount) * 100, 2),
                        'processing_time' => $methodConfig['processing_time'],
                        'score' => $this->calculateMethodScore($methodConfig, $preference, $fee, $amount),
                    ];
                }
            }
        }

        // Sort by score (higher is better)
        usort($recommendations, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'amount' => $amount,
                'preference' => $preference,
                'recommendations' => array_slice($recommendations, 0, 5), // Top 5 recommendations
            ],
        ]);
    }

    /**
     * Get additional information based on refund method and result
     */
    private function getAdditionalInfo(string $method, array $result): array
    {
        $info = [];

        switch ($method) {
            case 'qris':
                $info['qr_code_url'] = $result['qr_code_url'] ?? null;
                $info['expiry_date'] = $result['expiry_date'] ?? null;
                break;
                
            case 'virtual_account':
                $info['virtual_account_number'] = $result['virtual_account_number'] ?? null;
                $info['bank_code'] = $result['bank_code'] ?? null;
                $info['instructions'] = $result['instructions'] ?? [];
                break;
                
            case 'ovo':
            case 'dana':
            case 'shopeepay':
            case 'linkaja':
                $info['wallet_type'] = strtoupper($method);
                break;
                
            default:
                // For bank transfers
                if (str_starts_with($method, 'bank_')) {
                    $info['bank_name'] = strtoupper(substr($method, 5));
                }
        }

        return $info;
    }

    /**
     * Calculate recommendation score for a payment method
     */
    private function calculateMethodScore(array $methodConfig, string $preference, float $fee, float $amount): float
    {
        $score = 50; // Base score

        // Adjust based on preference
        switch ($preference) {
            case 'speed':
                if (str_contains(strtolower($methodConfig['processing_time']), 'instant')) {
                    $score += 30;
                } elseif (str_contains(strtolower($methodConfig['processing_time']), 'real-time')) {
                    $score += 20;
                }
                break;
                
            case 'cost':
                $feePercentage = ($fee / $amount) * 100;
                $score += (5 - $feePercentage) * 5; // Lower fees = higher score
                break;
                
            case 'convenience':
                // Digital wallets are generally more convenient
                if (in_array($methodConfig['name'] ?? '', ['OVO', 'DANA', 'ShopeePay', 'LinkAja'])) {
                    $score += 20;
                }
                break;
        }

        return max(0, min(100, $score)); // Clamp between 0-100
    }
}