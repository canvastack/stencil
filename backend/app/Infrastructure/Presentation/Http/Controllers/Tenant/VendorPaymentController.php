<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\VendorPayment;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Carbon\Carbon;

class VendorPaymentController extends Controller
{
    /**
     * Get vendor payments
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'nullable|string|in:pending,processing,paid,overdue,cancelled',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'sort_by' => 'nullable|string|in:created_at,due_date,amount,status',
                'sort_order' => 'nullable|string|in:asc,desc',
            ]);

            $query = VendorPayment::with(['vendor', 'order']);

            // Apply filters
            if (!empty($validated['status'])) {
                $query->where('status', $validated['status']);
            }

            if (!empty($validated['vendor_id'])) {
                $query->where('vendor_id', $validated['vendor_id']);
            }

            if (!empty($validated['date_from'])) {
                $query->whereDate('created_at', '>=', $validated['date_from']);
            }

            if (!empty($validated['date_to'])) {
                $query->whereDate('created_at', '<=', $validated['date_to']);
            }

            // Apply sorting
            $sortBy = $validated['sort_by'] ?? 'created_at';
            $sortOrder = $validated['sort_order'] ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $validated['per_page'] ?? 20;
            $payments = $query->paginate($perPage);

            // Transform data
            $transformedData = $payments->getCollection()->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'invoice_number' => $payment->invoice_number,
                    'vendor_id' => $payment->vendor_id,
                    'vendor_name' => $payment->vendor->name ?? 'Unknown Vendor',
                    'order_id' => $payment->order_id,
                    'order_number' => $payment->order->order_number ?? null,
                    'amount' => $payment->amount,
                    'tax_amount' => $payment->tax_amount,
                    'total_amount' => $payment->total_amount,
                    'status' => $payment->status,
                    'payment_method' => $payment->payment_method,
                    'due_date' => $payment->due_date?->toIso8601String(),
                    'paid_date' => $payment->paid_date?->toIso8601String(),
                    'description' => $payment->description,
                    'notes' => $payment->notes,
                    'bank_account' => $payment->bank_account,
                    'created_at' => $payment->created_at->toIso8601String(),
                    'updated_at' => $payment->updated_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor payments retrieved successfully',
                'data' => $transformedData,
                'meta' => [
                    'current_page' => $payments->currentPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                    'last_page' => $payments->lastPage(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor payments',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor payment statistics
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'period' => 'nullable|string|in:today,week,month,quarter,year',
            ]);

            $query = VendorPayment::query();

            // Apply filters
            if (!empty($validated['vendor_id'])) {
                $query->where('vendor_id', $validated['vendor_id']);
            }

            // Apply date filter
            if (!empty($validated['date_from']) && !empty($validated['date_to'])) {
                $query->whereBetween('created_at', [
                    $validated['date_from'],
                    $validated['date_to']
                ]);
            } elseif (!empty($validated['period'])) {
                $dateRange = $this->getDateRangeForPeriod($validated['period']);
                $query->whereBetween('created_at', $dateRange);
            }

            // Calculate statistics
            $allPayments = $query->get();

            $stats = [
                'totalPending' => $allPayments->where('status', 'pending')->sum('total_amount'),
                'totalPaid' => $allPayments->where('status', 'paid')->sum('total_amount'),
                'totalOverdue' => $allPayments->where('status', 'overdue')->sum('total_amount'),
                'totalAmount' => $allPayments->sum('total_amount'),
                'count' => [
                    'pending' => $allPayments->where('status', 'pending')->count(),
                    'paid' => $allPayments->where('status', 'paid')->count(),
                    'overdue' => $allPayments->where('status', 'overdue')->count(),
                    'total' => $allPayments->count(),
                ],
                'averageAmount' => $allPayments->count() > 0 ? 
                    round($allPayments->avg('total_amount'), 2) : 0,
                'paymentMethods' => $allPayments->groupBy('payment_method')
                    ->map(function ($payments, $method) {
                        return [
                            'method' => $method,
                            'count' => $payments->count(),
                            'total_amount' => $payments->sum('total_amount'),
                        ];
                    })->values(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Payment statistics retrieved successfully',
                'data' => $stats,
                'meta' => [
                    'period' => $validated['period'] ?? 'custom',
                    'date_range' => [
                        'from' => $validated['date_from'] ?? null,
                        'to' => $validated['date_to'] ?? null,
                    ],
                    'generated_at' => now()->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Create new vendor payment
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'required|integer|exists:vendors,id',
                'order_id' => 'nullable|integer|exists:orders,id',
                'invoice_number' => 'nullable|string|max:50|unique:vendor_payments,invoice_number',
                'amount' => 'required|numeric|min:0',
                'tax_amount' => 'nullable|numeric|min:0',
                'payment_method' => 'required|string|in:bank_transfer,cash,check,wire_transfer',
                'due_date' => 'required|date',
                'description' => 'nullable|string|max:500',
                'notes' => 'nullable|string|max:1000',
                'bank_account' => 'nullable|string|max:255',
            ]);

            // Generate invoice number if not provided
            if (empty($validated['invoice_number'])) {
                $validated['invoice_number'] = $this->generateInvoiceNumber();
            }

            // Calculate total amount
            $taxAmount = $validated['tax_amount'] ?? 0;
            $totalAmount = $validated['amount'] + $taxAmount;

            $payment = VendorPayment::create([
                'uuid' => Str::uuid(),
                'vendor_id' => $validated['vendor_id'],
                'order_id' => $validated['order_id'] ?? null,
                'invoice_number' => $validated['invoice_number'],
                'amount' => $validated['amount'],
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'status' => 'pending',
                'due_date' => $validated['due_date'],
                'description' => $validated['description'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'bank_account' => $validated['bank_account'] ?? null,
            ]);

            $payment->load('vendor', 'order');

            return response()->json([
                'success' => true,
                'message' => 'Vendor payment created successfully',
                'data' => [
                    'id' => $payment->id,
                    'uuid' => $payment->uuid,
                    'invoice_number' => $payment->invoice_number,
                    'vendor_name' => $payment->vendor->name,
                    'amount' => $payment->amount,
                    'total_amount' => $payment->total_amount,
                    'status' => $payment->status,
                    'due_date' => $payment->due_date->toIso8601String(),
                    'created_at' => $payment->created_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vendor payment',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Process vendor payment
     */
    public function process(Request $request, int $paymentId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_reference' => 'nullable|string|max:255',
                'paid_amount' => 'nullable|numeric|min:0',
                'payment_date' => 'nullable|date',
                'notes' => 'nullable|string|max:1000',
            ]);

            $payment = VendorPayment::findOrFail($paymentId);

            if ($payment->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment has already been processed',
                ], 400);
            }

            // Update payment
            $payment->update([
                'status' => 'paid',
                'paid_date' => $validated['payment_date'] ?? now(),
                'paid_amount' => $validated['paid_amount'] ?? $payment->total_amount,
                'payment_reference' => $validated['payment_reference'] ?? null,
                'notes' => $payment->notes . "\n" . ($validated['notes'] ?? ''),
            ]);

            $payment->load('vendor', 'order');

            return response()->json([
                'success' => true,
                'message' => 'Payment processed successfully',
                'data' => [
                    'id' => $payment->id,
                    'invoice_number' => $payment->invoice_number,
                    'vendor_name' => $payment->vendor->name,
                    'amount' => $payment->amount,
                    'total_amount' => $payment->total_amount,
                    'paid_amount' => $payment->paid_amount,
                    'status' => $payment->status,
                    'paid_date' => $payment->paid_date->toIso8601String(),
                    'payment_reference' => $payment->payment_reference,
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process payment',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Disburse payment to vendor
     */
    public function disburse(Request $request, int $paymentId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'disbursement_method' => 'required|string|in:bank_transfer,check,wire_transfer',
                'disbursement_reference' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
            ]);

            $payment = VendorPayment::findOrFail($paymentId);

            if ($payment->status !== 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment must be paid before disbursement',
                ], 400);
            }

            if ($payment->disbursed_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment has already been disbursed',
                ], 400);
            }

            // Update payment with disbursement information
            $payment->update([
                'disbursed_at' => now(),
                'disbursement_method' => $validated['disbursement_method'],
                'disbursement_reference' => $validated['disbursement_reference'] ?? null,
                'disbursement_notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment disbursed successfully',
                'data' => [
                    'id' => $payment->id,
                    'invoice_number' => $payment->invoice_number,
                    'disbursed_at' => $payment->disbursed_at->toIso8601String(),
                    'disbursement_method' => $payment->disbursement_method,
                    'disbursement_reference' => $payment->disbursement_reference,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to disburse payment',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Mark payment as overdue
     */
    public function markOverdue(Request $request, int $paymentId): JsonResponse
    {
        try {
            $payment = VendorPayment::findOrFail($paymentId);

            if ($payment->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot mark paid payment as overdue',
                ], 400);
            }

            $payment->update(['status' => 'overdue']);

            return response()->json([
                'success' => true,
                'message' => 'Payment marked as overdue',
                'data' => [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'due_date' => $payment->due_date->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark payment as overdue',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Generate unique invoice number
     */
    private function generateInvoiceNumber(): string
    {
        $prefix = 'VPI'; // Vendor Payment Invoice
        $year = date('Y');
        $month = date('m');
        
        // Get the latest invoice number for this month
        $latestPayment = VendorPayment::where('invoice_number', 'like', "{$prefix}-{$year}{$month}-%")
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($latestPayment) {
            $lastNumber = (int)substr($latestPayment->invoice_number, -3);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return "{$prefix}-{$year}{$month}-{$newNumber}";
    }

    /**
     * Get date range for period
     */
    private function getDateRangeForPeriod(string $period): array
    {
        $endDate = now();
        
        $startDate = match ($period) {
            'today' => $endDate->copy()->startOfDay(),
            'week' => $endDate->copy()->startOfWeek(),
            'month' => $endDate->copy()->startOfMonth(),
            'quarter' => $endDate->copy()->startOfQuarter(),
            'year' => $endDate->copy()->startOfYear(),
            default => $endDate->copy()->startOfMonth(),
        };

        return [$startDate, $endDate];
    }
}