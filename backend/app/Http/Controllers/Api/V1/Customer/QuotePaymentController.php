<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class QuotePaymentController extends Controller
{
    /**
     * Submit bank transfer payment proof
     * 
     * Stores complete financial data for:
     * - Payment verification
     * - Invoice generation
     * - Tax reporting
     * - Audit trail
     */
    public function submitBankTransfer(Request $request)
    {
        $validated = $request->validate([
            'quote_uuid' => 'required|uuid|exists:customer_quotes,uuid',
            'payment_method' => 'required|in:bank_transfer',
            'transfer_proof' => 'required|image|max:5120', // 5MB max
            'notes' => 'nullable|string|max:500',
            'amount' => 'required|numeric|min:0',
            
            // Bank transfer details
            'destination_bank' => 'required|string|max:100',
            'destination_account_number' => 'required|string|max:50',
            'destination_account_holder' => 'required|string|max:255',
            'transfer_date' => 'required|date|before_or_equal:today',
            'transfer_time' => 'required|date_format:H:i',
        ]);

        try {
            DB::beginTransaction();

            // Get quote with order details
            $quote = CustomerQuote::with(['order.customer'])->where('uuid', $validated['quote_uuid'])->firstOrFail();

            // Verify quote is accepted
            if ($quote->status !== 'accepted') {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote must be accepted before payment',
                ], 400);
            }

            // Store transfer proof with organized path
            $proofPath = $request->file('transfer_proof')->store(
                'payment-proofs/' . $quote->tenant_id . '/' . date('Y/m'),
                'public'
            );

            // Combine transfer date and time
            $transferDateTime = $validated['transfer_date'] . ' ' . $validated['transfer_time'];

            // Get customer details for invoice
            $customer = $quote->order->customer;

            // Create payment transaction record with complete financial data
            $payment = OrderPaymentTransaction::create([
                'tenant_id' => $quote->tenant_id,
                'order_id' => $quote->order_id,
                'customer_id' => $customer->id ?? null,
                'vendor_id' => null,
                'direction' => 'incoming', // Payment from customer
                'type' => 'customer_payment',
                'status' => 'pending', // Will be 'completed' after verification
                'amount' => (int)($validated['amount'] * 100), // Convert to cents
                'currency' => $quote->currency,
                'method' => 'bank_transfer',
                'reference' => 'PAY-' . strtoupper(Str::random(10)),
                'paid_at' => null, // Will be set after verification
                'metadata' => json_encode([
                    // Quote reference
                    'quote_uuid' => $quote->uuid,
                    'quote_number' => $quote->quote_number,
                    'order_number' => $quote->order->order_number ?? null,
                    
                    // Payment proof
                    'payment_proof_path' => $proofPath,
                    'payment_notes' => $validated['notes'] ?? null,
                    
                    // Customer information (for invoice)
                    'customer_id' => $customer->id ?? null,
                    'customer_uuid' => $customer->uuid ?? null,
                    'customer_name' => $customer->name ?? 'Unknown',
                    'customer_email' => $customer->email ?? null,
                    'customer_phone' => $customer->phone ?? null,
                    'customer_address' => $customer->address ?? null,
                    'customer_tax_id' => $customer->tax_id ?? null, // NPWP for Indonesia
                    
                    // Bank transfer details
                    'destination_bank' => $validated['destination_bank'],
                    'destination_account_number' => $validated['destination_account_number'],
                    'destination_account_holder' => $validated['destination_account_holder'],
                    'transfer_datetime' => $transferDateTime,
                    
                    // Financial breakdown (for invoice & tax reporting)
                    'subtotal' => $quote->subtotal, // Amount before tax
                    'tax_rate' => $quote->tax_rate, // e.g., 11.00 for 11% VAT
                    'tax_amount' => $quote->tax_amount, // Calculated tax
                    'shipping_cost' => $quote->shipping_cost ?? 0,
                    'handling_fee' => $quote->handling_fee ?? 0,
                    'insurance' => $quote->insurance ?? 0,
                    'other_costs' => $quote->other_costs ?? 0,
                    'grand_total' => $quote->grand_total,
                    
                    // Payment terms
                    'payment_type' => 'full_payment', // or 'down_payment', 'installment_1', etc.
                    'payment_terms' => $quote->payment_terms ?? null,
                    
                    // Profit tracking (for internal reporting)
                    'vendor_cost' => $quote->vendor_total_cost ?? 0,
                    'profit_amount' => $quote->total_profit_amount ?? 0,
                    'profit_percentage' => $quote->total_profit_percentage ?? 0,
                    
                    // Audit trail
                    'submitted_at' => now()->toIso8601String(),
                    'submitted_by_user_id' => auth('sanctum')->id(),
                    'submitted_from_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    
                    // Document generation flags
                    'invoice_generated' => false,
                    'tax_invoice_generated' => false,
                    'receipt_generated' => false,
                ]),
            ]);

            // Update quote metadata
            $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
            $quoteMetadata['payment_submitted'] = true;
            $quoteMetadata['payment_transaction_id'] = $payment->id;
            $quoteMetadata['payment_transaction_uuid'] = $payment->uuid;
            $quoteMetadata['payment_reference'] = $payment->reference;
            $quoteMetadata['payment_submitted_at'] = now()->toIso8601String();
            $quoteMetadata['awaiting_verification'] = true;
            $quote->metadata = $quoteMetadata;
            $quote->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment proof submitted successfully. We will verify within 1-2 hours.',
                'data' => [
                    'transaction_number' => $payment->reference,
                    'transaction_uuid' => $payment->uuid,
                    'status' => $payment->status,
                    'submitted_at' => $payment->created_at,
                    'destination_bank' => $validated['destination_bank'],
                    'amount' => $validated['amount'],
                    'currency' => $quote->currency,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Delete uploaded file if exists
            if (isset($proofPath)) {
                Storage::disk('public')->delete($proofPath);
            }

            \Log::error('Bank transfer submission failed', [
                'error' => $e->getMessage(),
                'quote_uuid' => $validated['quote_uuid'] ?? null,
                'user_id' => auth('sanctum')->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit payment proof: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment status and history for a quote
     */
    public function getPaymentStatus(Request $request, string $quoteUuid)
    {
        $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

        // Get payment transactions for this quote's order
        $payments = OrderPaymentTransaction::where('order_id', $quote->order_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
                
                return [
                    'transaction_number' => $payment->transaction_number,
                    'payment_method' => $payment->payment_method,
                    'amount' => $payment->amount / 100, // Convert from cents
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'submitted_at' => $payment->created_at,
                    'verified_at' => $payment->verified_at,
                    'notes' => $payment->notes,
                    'destination_bank' => $metadata['destination_bank'] ?? null,
                    'transfer_datetime' => $metadata['transfer_datetime'] ?? null,
                    'payment_proof_url' => $payment->payment_proof_path 
                        ? Storage::url($payment->payment_proof_path) 
                        : null,
                ];
            });

        $totalPaid = $payments->where('status', 'completed')->sum('amount');
        $pendingVerification = $payments->where('status', 'pending_verification')->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'quote_uuid' => $quote->uuid,
                'quote_number' => $quote->quote_number,
                'total_amount' => $quote->grand_total / 100,
                'currency' => $quote->currency,
                'payments' => $payments,
                'summary' => [
                    'total_paid' => $totalPaid,
                    'pending_verification' => $pendingVerification,
                    'remaining' => ($quote->grand_total / 100) - $totalPaid,
                    'payment_complete' => $totalPaid >= ($quote->grand_total / 100),
                ],
            ],
        ]);
    }

    /**
     * Verify payment (Admin only - will be called from admin panel)
     */
    public function verifyPayment(Request $request, string $transactionNumber)
    {
        $validated = $request->validate([
            'status' => 'required|in:completed,rejected',
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $payment = OrderPaymentTransaction::where('transaction_number', $transactionNumber)->firstOrFail();

            if ($payment->status !== 'pending_verification') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment is not pending verification',
                ], 400);
            }

            $payment->status = $validated['status'];
            $payment->verified_at = now();
            $payment->verified_by = auth()->id();
            
            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $metadata['verification_notes'] = $validated['verification_notes'] ?? null;
            $metadata['verified_at'] = now()->toIso8601String();
            $metadata['verified_by_user_id'] = auth()->id();
            $payment->metadata = json_encode($metadata);
            
            $payment->save();

            // If completed, update quote status
            if ($validated['status'] === 'completed') {
                $quote = CustomerQuote::where('order_id', $payment->order_id)->first();
                if ($quote) {
                    $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
                    $quoteMetadata['payment_verified'] = true;
                    $quoteMetadata['payment_verified_at'] = now()->toIso8601String();
                    $quote->metadata = $quoteMetadata;
                    $quote->save();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment ' . $validated['status'] . ' successfully',
                'data' => [
                    'transaction_number' => $payment->transaction_number,
                    'status' => $payment->status,
                    'verified_at' => $payment->verified_at,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify payment: ' . $e->getMessage(),
            ], 500);
        }
    }
}
