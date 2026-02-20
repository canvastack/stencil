<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Mail\PaymentVerificationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;

class PaymentVerificationController extends Controller
{
    /**
     * Get pending payment verifications
     */
    public function index(Request $request)
    {
        $query = OrderPaymentTransaction::with(['order.customer', 'customer'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->where('type', 'customer_payment')
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc');

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by date
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $payments->map(function($payment) {
                $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
                
                return [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'reference' => $payment->reference,
                    'amount' => $payment->amount / 100,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'customer' => [
                        'name' => $metadata['customer_name'] ?? 'Unknown',
                        'email' => $metadata['customer_email'] ?? null,
                    ],
                    'bank_details' => [
                        'destination_bank' => $metadata['destination_bank'] ?? null,
                        'destination_account_number' => $metadata['destination_account_number'] ?? null,
                        'transfer_datetime' => $metadata['transfer_datetime'] ?? null,
                    ],
                    'quote_number' => $metadata['quote_number'] ?? null,
                    'submitted_at' => $payment->created_at,
                    'waiting_time' => $payment->created_at->diffForHumans(),
                ];
            }),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Get payment detail for verification
     */
    public function show(string $uuid)
    {
        $payment = OrderPaymentTransaction::with(['order.customer', 'customer'])
            ->where('uuid', $uuid)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->firstOrFail();

        $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;

        // Get quote details
        $quote = CustomerQuote::where('order_id', $payment->order_id)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $payment->id,
                'uuid' => $payment->uuid,
                'reference' => $payment->reference,
                'amount' => $payment->amount / 100,
                'currency' => $payment->currency,
                'status' => $payment->status,
                'method' => $payment->method,
                
                // Customer info
                'customer' => [
                    'id' => $metadata['customer_id'] ?? null,
                    'uuid' => $metadata['customer_uuid'] ?? null,
                    'name' => $metadata['customer_name'] ?? 'Unknown',
                    'email' => $metadata['customer_email'] ?? null,
                    'phone' => $metadata['customer_phone'] ?? null,
                    'address' => $metadata['customer_address'] ?? null,
                    'tax_id' => $metadata['customer_tax_id'] ?? null,
                ],
                
                // Quote & Order info
                'quote_number' => $metadata['quote_number'] ?? null,
                'order_number' => $metadata['order_number'] ?? null,
                'quote_uuid' => $metadata['quote_uuid'] ?? null,
                
                // Bank transfer details
                'bank_details' => [
                    'destination_bank' => $metadata['destination_bank'] ?? null,
                    'destination_account_number' => $metadata['destination_account_number'] ?? null,
                    'destination_account_holder' => $metadata['destination_account_holder'] ?? null,
                    'transfer_datetime' => $metadata['transfer_datetime'] ?? null,
                ],
                
                // Financial breakdown
                'financial' => [
                    'subtotal' => ($metadata['subtotal'] ?? 0) / 100,
                    'tax_rate' => (float) ($metadata['tax_rate'] ?? 0),
                    'tax_amount' => ($metadata['tax_amount'] ?? 0) / 100,
                    'shipping_cost' => ($metadata['shipping_cost'] ?? 0) / 100,
                    'handling_fee' => ($metadata['handling_fee'] ?? 0) / 100,
                    'grand_total' => ($metadata['grand_total'] ?? 0) / 100,
                    'vendor_cost' => ($metadata['vendor_cost'] ?? 0) / 100,
                    'profit_amount' => ($metadata['profit_amount'] ?? 0) / 100,
                    'profit_percentage' => (float) ($metadata['profit_percentage'] ?? 0),
                ],
                
                // Payment proof - use base64 encoded data URL for inline display
                'payment_proof_url' => $metadata['payment_proof_path'] 
                    ? $this->getImageDataUrl($metadata['payment_proof_path'])
                    : null,
                'payment_proof_download_url' => $metadata['payment_proof_path']
                    ? url('/api/v1/tenant/admin/payment-verification/' . $payment->uuid . '/download-proof')
                    : null,
                'payment_notes' => $metadata['payment_notes'] ?? null,
                
                // Submission info
                'submitted_at' => $payment->created_at,
                'submitted_from_ip' => $metadata['submitted_from_ip'] ?? null,
                'waiting_time' => $payment->created_at->diffForHumans(),
                'waiting_minutes' => $payment->created_at->diffInMinutes(now()),
            ],
        ]);
    }

    /**
     * Approve payment
     */
    public function approve(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $payment = OrderPaymentTransaction::where('uuid', $uuid)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->where('status', 'pending')
                ->firstOrFail();

            // Update payment status
            $payment->status = 'completed';
            $payment->paid_at = now();
            
            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $metadata['verified_at'] = now()->toIso8601String();
            $metadata['verified_by_user_id'] = auth()->id();
            $metadata['verified_by_name'] = auth()->user()->name;
            $metadata['verification_notes'] = $validated['verification_notes'] ?? null;
            $payment->metadata = json_encode($metadata);
            
            $payment->save();

            // Update quote metadata
            $quote = CustomerQuote::where('order_id', $payment->order_id)->first();
            if ($quote) {
                $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
                $quoteMetadata['payment_verified'] = true;
                $quoteMetadata['payment_verified_at'] = now()->toIso8601String();
                $quoteMetadata['awaiting_verification'] = false;
                $quote->metadata = $quoteMetadata;
                $quote->save();
            }

            DB::commit();

            // Send email notification to customer
            $customerEmail = $metadata['customer_email'] ?? null;
            
            if ($customerEmail) {
                try {
                    Mail::to($customerEmail)->send(
                        new PaymentVerificationMail($payment, 'approved', $validated['verification_notes'] ?? null)
                    );
                } catch (\Exception $e) {
                    \Log::error('Failed to send payment approval email: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment approved successfully',
                'data' => [
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                    'verified_at' => $payment->paid_at,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject payment
     */
    public function reject(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $payment = OrderPaymentTransaction::where('uuid', $uuid)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->where('status', 'pending')
                ->firstOrFail();

            // Update payment status
            $payment->status = 'failed';
            
            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $metadata['rejected_at'] = now()->toIso8601String();
            $metadata['rejected_by_user_id'] = auth()->id();
            $metadata['rejected_by_name'] = auth()->user()->name;
            $metadata['rejection_reason'] = $validated['rejection_reason'];
            $payment->metadata = json_encode($metadata);
            
            $payment->save();

            // Update quote metadata
            $quote = CustomerQuote::where('order_id', $payment->order_id)->first();
            if ($quote) {
                $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
                $quoteMetadata['payment_rejected'] = true;
                $quoteMetadata['payment_rejected_at'] = now()->toIso8601String();
                $quoteMetadata['payment_rejection_reason'] = $validated['rejection_reason'];
                $quoteMetadata['awaiting_verification'] = false;
                $quote->metadata = $quoteMetadata;
                $quote->save();
            }

            DB::commit();

            // Send email notification to customer
            $customerEmail = $metadata['customer_email'] ?? null;
            
            if ($customerEmail) {
                try {
                    Mail::to($customerEmail)->send(
                        new PaymentVerificationMail($payment, 'rejected', null, $validated['rejection_reason'])
                    );
                } catch (\Exception $e) {
                    \Log::error('Failed to send payment rejection email: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment rejected successfully',
                'data' => [
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                    'rejected_at' => now(),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get dashboard statistics
     */
    public function statistics()
    {
        $tenantId = auth()->user()->tenant_id;

        $pending = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'pending')
            ->count();

        $verifiedToday = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'completed')
            ->whereDate('paid_at', today())
            ->count();

        $rejectedToday = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'failed')
            ->whereDate('updated_at', today())
            ->count();

        $revenueToday = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'completed')
            ->whereDate('paid_at', today())
            ->sum('amount');

        $pendingAmount = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'pending')
            ->sum('amount');

        $oldestPending = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'pending_count' => $pending,
                'verified_today' => $verifiedToday,
                'rejected_today' => $rejectedToday,
                'revenue_today' => $revenueToday / 100,
                'pending_amount' => $pendingAmount / 100,
                'oldest_pending_time' => $oldestPending ? $oldestPending->created_at->diffForHumans() : null,
            ],
        ]);
    }

    /**
     * Bulk approve payments
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'payment_uuids' => 'required|array|min:1',
            'payment_uuids.*' => 'required|string',
            'verification_notes' => 'nullable|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $successCount = 0;
            $failedCount = 0;
            $errors = [];

            foreach ($validated['payment_uuids'] as $uuid) {
                try {
                    $payment = OrderPaymentTransaction::where('uuid', $uuid)
                        ->where('tenant_id', auth()->user()->tenant_id)
                        ->where('status', 'pending')
                        ->first();

                    if (!$payment) {
                        $failedCount++;
                        $errors[] = "Payment {$uuid} not found or already processed";
                        continue;
                    }

                    // Update payment status
                    $payment->status = 'completed';
                    $payment->paid_at = now();
                    
                    $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
                    $metadata['verified_at'] = now()->toIso8601String();
                    $metadata['verified_by_user_id'] = auth()->id();
                    $metadata['verified_by_name'] = auth()->user()->name;
                    $metadata['verification_notes'] = $validated['verification_notes'] ?? null;
                    $metadata['bulk_approved'] = true;
                    $payment->metadata = json_encode($metadata);
                    
                    $payment->save();

                    // Update quote metadata
                    $quote = CustomerQuote::where('order_id', $payment->order_id)->first();
                    if ($quote) {
                        $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
                        $quoteMetadata['payment_verified'] = true;
                        $quoteMetadata['payment_verified_at'] = now()->toIso8601String();
                        $quoteMetadata['awaiting_verification'] = false;
                        $quote->metadata = $quoteMetadata;
                        $quote->save();
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $failedCount++;
                    $errors[] = "Payment {$uuid}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Bulk approval completed: {$successCount} succeeded, {$failedCount} failed",
                'data' => [
                    'success_count' => $successCount,
                    'failed_count' => $failedCount,
                    'errors' => $errors,
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk approve payments: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download payment proof
     */
    public function downloadProof(string $uuid)
    {
        $payment = OrderPaymentTransaction::where('uuid', $uuid)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->firstOrFail();

        $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
        $proofPath = $metadata['payment_proof_path'] ?? null;

        if (!$proofPath || !Storage::disk('public')->exists($proofPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Payment proof not found',
            ], 404);
        }

        // Get file extension from path
        $extension = pathinfo($proofPath, PATHINFO_EXTENSION);
        $filename = "payment-proof-{$payment->reference}.{$extension}";

        return Storage::disk('public')->download($proofPath, $filename);
    }

    /**
     * Serve payment proof image
     */
    public function serveProofImage(string $uuid)
    {
        $payment = OrderPaymentTransaction::where('uuid', $uuid)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->firstOrFail();

        $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
        $proofPath = $metadata['payment_proof_path'] ?? null;

        if (!$proofPath || !Storage::disk('public')->exists($proofPath)) {
            abort(404, 'Payment proof not found');
        }

        $file = Storage::disk('public')->get($proofPath);
        $mimeType = Storage::disk('public')->mimeType($proofPath);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Cache-Control', 'public, max-age=3600')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    /**
     * Convert image to base64 data URL for inline display
     */
    private function getImageDataUrl(string $path): ?string
    {
        try {
            if (!Storage::disk('public')->exists($path)) {
                return null;
            }

            $file = Storage::disk('public')->get($path);
            $mimeType = Storage::disk('public')->mimeType($path);
            $base64 = base64_encode($file);

            return "data:{$mimeType};base64,{$base64}";
        } catch (\Exception $e) {
            \Log::error('Failed to generate image data URL: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Assign payment to admin
     */
    public function assign(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'assigned_to_user_id' => 'required|integer|exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $payment = OrderPaymentTransaction::where('uuid', $uuid)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->where('status', 'pending')
                ->firstOrFail();

            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $metadata['assigned_to_user_id'] = $validated['assigned_to_user_id'];
            $metadata['assigned_by_user_id'] = auth()->id();
            $metadata['assigned_at'] = now()->toIso8601String();
            $metadata['assignment_notes'] = $validated['notes'] ?? null;
            $payment->metadata = json_encode($metadata);
            
            $payment->save();

            return response()->json([
                'success' => true,
                'message' => 'Payment assigned successfully',
                'data' => [
                    'reference' => $payment->reference,
                    'assigned_to_user_id' => $validated['assigned_to_user_id'],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment history (all verified/rejected payments)
     */
    public function history(Request $request)
    {
        $query = OrderPaymentTransaction::with(['order.customer', 'customer'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->where('type', 'customer_payment')
            ->whereIn('status', ['completed', 'failed'])
            ->orderBy('created_at', 'desc');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhere('metadata->quote_number', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $payments = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $payments->map(function($payment) {
                $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
                
                return [
                    'uuid' => $payment->uuid,
                    'reference' => $payment->reference,
                    'amount' => $payment->amount / 100,
                    'currency' => $payment->currency,
                    'status' => $payment->status,
                    'customer' => [
                        'name' => $metadata['customer_name'] ?? 'Unknown',
                        'email' => $metadata['customer_email'] ?? null,
                    ],
                    'quote_number' => $metadata['quote_number'] ?? null,
                    'submitted_at' => $payment->created_at,
                    'verified_at' => $payment->paid_at,
                    'verified_by_name' => $metadata['verified_by_name'] ?? null,
                ];
            }),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Get payment history statistics
     */
    public function historyStats()
    {
        $tenantId = auth()->user()->tenant_id;

        $totalVerified = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'completed')
            ->count();

        $totalRejected = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'failed')
            ->count();

        $totalAmountVerified = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'completed')
            ->sum('amount');

        $totalAmountRejected = OrderPaymentTransaction::where('tenant_id', $tenantId)
            ->where('type', 'customer_payment')
            ->where('status', 'failed')
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_verified' => $totalVerified,
                'total_rejected' => $totalRejected,
                'total_amount_verified' => $totalAmountVerified / 100,
                'total_amount_rejected' => $totalAmountRejected / 100,
            ],
        ]);
    }

    /**
     * Refund payment
     */
    public function refund(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'reason' => 'required|string|max:1000',
            'refund_method' => 'nullable|string|in:original,bank_transfer,cash',
        ]);

        try {
            DB::beginTransaction();

            $payment = OrderPaymentTransaction::where('uuid', $uuid)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->where('status', 'completed')
                ->firstOrFail();

            $refundAmount = $validated['amount'] ?? $payment->amount;
            
            if ($refundAmount > $payment->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Refund amount cannot exceed payment amount',
                ], 400);
            }

            // Update payment status
            $isPartialRefund = $refundAmount < $payment->amount;
            $payment->status = $isPartialRefund ? 'partial_refunded' : 'refunded';
            
            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $metadata['refunded_at'] = now()->toIso8601String();
            $metadata['refunded_by_user_id'] = auth()->id();
            $metadata['refunded_by_name'] = auth()->user()->name;
            $metadata['refund_amount'] = $refundAmount;
            $metadata['refund_reason'] = $validated['reason'];
            $metadata['refund_method'] = $validated['refund_method'] ?? 'original';
            $payment->metadata = json_encode($metadata);
            
            $payment->save();

            // Update quote metadata
            $quote = CustomerQuote::where('order_id', $payment->order_id)->first();
            if ($quote) {
                $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
                $quoteMetadata['payment_refunded'] = true;
                $quoteMetadata['payment_refunded_at'] = now()->toIso8601String();
                $quoteMetadata['refund_amount'] = $refundAmount / 100;
                $quote->metadata = $quoteMetadata;
                $quote->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment refunded successfully',
                'data' => [
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                    'refund_amount' => $refundAmount / 100,
                    'refunded_at' => now(),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to refund payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel payment
     */
    public function cancel(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            DB::beginTransaction();

            $payment = OrderPaymentTransaction::where('uuid', $uuid)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->whereIn('status', ['pending', 'processing'])
                ->firstOrFail();

            // Update payment status
            $payment->status = 'cancelled';
            
            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $metadata['cancelled_at'] = now()->toIso8601String();
            $metadata['cancelled_by_user_id'] = auth()->id();
            $metadata['cancelled_by_name'] = auth()->user()->name;
            $metadata['cancellation_reason'] = $validated['reason'];
            $payment->metadata = json_encode($metadata);
            
            $payment->save();

            // Update quote metadata
            $quote = CustomerQuote::where('order_id', $payment->order_id)->first();
            if ($quote) {
                $quoteMetadata = is_array($quote->metadata) ? $quote->metadata : [];
                $quoteMetadata['payment_cancelled'] = true;
                $quoteMetadata['payment_cancelled_at'] = now()->toIso8601String();
                $quoteMetadata['awaiting_verification'] = false;
                $quote->metadata = $quoteMetadata;
                $quote->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment cancelled successfully',
                'data' => [
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                    'cancelled_at' => now(),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send payment receipt
     */
    public function sendReceipt(Request $request, string $uuid)
    {
        $validated = $request->validate([
            'email' => 'nullable|email',
            'include_proof' => 'nullable|boolean',
        ]);

        try {
            $payment = OrderPaymentTransaction::where('uuid', $uuid)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->firstOrFail();

            $metadata = is_string($payment->metadata) ? json_decode($payment->metadata, true) : $payment->metadata;
            $customerEmail = $validated['email'] ?? $metadata['customer_email'] ?? null;

            if (!$customerEmail) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer email not found',
                ], 400);
            }

            // Send receipt email
            try {
                Mail::to($customerEmail)->send(
                    new PaymentVerificationMail($payment, 'receipt', null, null, $validated['include_proof'] ?? false)
                );

                // Update metadata
                $metadata['receipt_sent_at'] = now()->toIso8601String();
                $metadata['receipt_sent_by_user_id'] = auth()->id();
                $metadata['receipt_sent_to'] = $customerEmail;
                $payment->metadata = json_encode($metadata);
                $payment->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Payment receipt sent successfully',
                    'data' => [
                        'reference' => $payment->reference,
                        'sent_to' => $customerEmail,
                        'sent_at' => now(),
                    ],
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to send payment receipt: ' . $e->getMessage());
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send receipt email: ' . $e->getMessage(),
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send receipt: ' . $e->getMessage(),
            ], 500);
        }
    }
}
