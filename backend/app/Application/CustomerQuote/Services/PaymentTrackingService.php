<?php

namespace App\Application\CustomerQuote\Services;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PaymentTrackingService
{
    /**
     * Create payment transaction record for down payment
     */
    public function createDownPaymentTransaction(CustomerQuote $quote): OrderPaymentTransaction
    {
        $order = $quote->order;
        $dpAmount = $order->down_payment_amount;
        $dueDate = $order->down_payment_due_at;

        return OrderPaymentTransaction::create([
            'tenant_id' => $quote->tenant_id,
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'pending',
            'amount' => $dpAmount,
            'currency' => $quote->currency,
            'method' => null, // Will be set when payment is made
            'reference' => "DP-{$quote->quote_number}",
            'due_at' => $dueDate,
            'metadata' => [
                'customer_quote_id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'payment_type' => 'down_payment',
                'percentage' => 50,
            ],
        ]);
    }

    /**
     * Create payment transaction record for balance payment
     */
    public function createBalancePaymentTransaction(CustomerQuote $quote): OrderPaymentTransaction
    {
        $order = $quote->order;
        $balanceAmount = $quote->grand_total - $order->down_payment_amount;

        return OrderPaymentTransaction::create([
            'tenant_id' => $quote->tenant_id,
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'direction' => 'incoming',
            'type' => 'customer_payment_balance',
            'status' => 'pending',
            'amount' => $balanceAmount,
            'currency' => $quote->currency,
            'method' => null, // Will be set when payment is made
            'reference' => "BAL-{$quote->quote_number}",
            'due_at' => null, // Will be set after DP is paid
            'metadata' => [
                'customer_quote_id' => $quote->id,
                'quote_number' => $quote->quote_number,
                'payment_type' => 'balance_payment',
                'percentage' => 50,
            ],
        ]);
    }

    /**
     * Initialize payment tracking for accepted quote
     */
    public function initializePaymentTracking(CustomerQuote $quote): array
    {
        // Create DP payment transaction
        $dpTransaction = $this->createDownPaymentTransaction($quote);

        // Create balance payment transaction
        $balanceTransaction = $this->createBalancePaymentTransaction($quote);

        // Add to quote history
        $history = is_array($quote->history) ? $quote->history : [];
        $history[] = [
            'action' => 'payment_tracking_initialized',
            'actor_type' => 'system',
            'timestamp' => now()->toIso8601String(),
            'details' => [
                'dp_transaction_id' => $dpTransaction->id,
                'dp_transaction_uuid' => $dpTransaction->uuid,
                'balance_transaction_id' => $balanceTransaction->id,
                'balance_transaction_uuid' => $balanceTransaction->uuid,
                'dp_amount' => $dpTransaction->amount,
                'balance_amount' => $balanceTransaction->amount,
            ],
        ];
        $quote->update(['history' => $history]);

        return [
            'dp_transaction' => $dpTransaction,
            'balance_transaction' => $balanceTransaction,
        ];
    }

    /**
     * Record payment for a transaction
     */
    public function recordPayment(
        OrderPaymentTransaction $transaction,
        string $method,
        ?string $reference = null,
        ?array $metadata = null
    ): OrderPaymentTransaction {
        return DB::transaction(function () use ($transaction, $method, $reference, $metadata) {
            $transaction->update([
                'status' => 'completed',
                'method' => $method,
                'reference' => $reference ?? $transaction->reference,
                'paid_at' => now(),
                'metadata' => array_merge($transaction->metadata ?? [], $metadata ?? []),
            ]);

            // Update order payment schedule
            $order = $transaction->order;
            $paymentSchedule = $order->payment_schedule ?? [];

            foreach ($paymentSchedule as &$schedule) {
                if ($transaction->type === 'customer_payment_dp' && $schedule['type'] === 'dp_50') {
                    $schedule['status'] = 'paid';
                    $schedule['paid_at'] = now()->toDateString();
                    $schedule['payment_method'] = $method;
                } elseif ($transaction->type === 'customer_payment_balance' && $schedule['type'] === 'balance_50') {
                    $schedule['status'] = 'paid';
                    $schedule['paid_at'] = now()->toDateString();
                    $schedule['payment_method'] = $method;
                }
            }

            $order->update(['payment_schedule' => $paymentSchedule]);

            // Update order payment status
            $this->updateOrderPaymentStatus($order);

            // Update quote history
            $this->addPaymentHistoryToQuote($transaction);

            // Automatically generate and send PO to vendor after DP payment
            if ($transaction->type === 'customer_payment_dp') {
                $this->autoGenerateAndSendPurchaseOrder($transaction);
            }

            return $transaction->fresh();
        });
    }

    /**
     * Update order payment status based on transactions
     */
    protected function updateOrderPaymentStatus(Order $order): void
    {
        $totalPaid = OrderPaymentTransaction::where('order_id', $order->id)
            ->where('direction', 'incoming')
            ->where('status', 'completed')
            ->sum('amount');

        $order->update(['total_paid_amount' => $totalPaid]);

        if ($totalPaid >= $order->total_amount) {
            $order->update([
                'payment_status' => 'paid',
                'payment_date' => now(),
            ]);
        } elseif ($totalPaid > 0) {
            $order->update(['payment_status' => 'partial']);
        }
    }

    /**
     * Add payment history to related quote
     */
    protected function addPaymentHistoryToQuote(OrderPaymentTransaction $transaction): void
    {
        $quoteId = $transaction->metadata['customer_quote_id'] ?? null;
        
        if (!$quoteId) {
            return;
        }

        $quote = CustomerQuote::find($quoteId);
        
        if (!$quote) {
            return;
        }

        $history = is_array($quote->history) ? $quote->history : [];
        $history[] = [
            'action' => 'payment_received',
            'actor_type' => 'customer',
            'actor_id' => $transaction->customer_id,
            'timestamp' => now()->toIso8601String(),
            'details' => [
                'transaction_id' => $transaction->id,
                'transaction_uuid' => $transaction->uuid,
                'payment_type' => $transaction->metadata['payment_type'] ?? 'unknown',
                'amount' => $transaction->amount,
                'method' => $transaction->method,
                'reference' => $transaction->reference,
            ],
        ];
        $quote->update(['history' => $history]);
    }

    /**
     * Get payment summary for a quote
     */
    public function getPaymentSummary(CustomerQuote $quote): array
    {
        $order = $quote->order;
        $transactions = $quote->paymentTransactions;

        $dpTransaction = $transactions->firstWhere('type', 'customer_payment_dp');
        $balanceTransaction = $transactions->firstWhere('type', 'customer_payment_balance');

        return [
            'quote_total' => $quote->grand_total,
            'total_paid' => $quote->getTotalPaidAmount(),
            'remaining' => $quote->getRemainingPaymentAmount(),
            'payment_status' => $quote->getPaymentStatus(),
            'down_payment' => [
                'amount' => $order->down_payment_amount,
                'status' => $dpTransaction?->status ?? 'pending',
                'due_date' => $order->down_payment_due_at?->toDateString(),
                'paid_at' => $dpTransaction?->paid_at?->toDateString(),
                'method' => $dpTransaction?->method,
                'reference' => $dpTransaction?->reference,
            ],
            'balance_payment' => [
                'amount' => $quote->grand_total - $order->down_payment_amount,
                'status' => $balanceTransaction?->status ?? 'pending',
                'due_date' => $balanceTransaction?->due_at?->toDateString(),
                'paid_at' => $balanceTransaction?->paid_at?->toDateString(),
                'method' => $balanceTransaction?->method,
                'reference' => $balanceTransaction?->reference,
            ],
            'transactions' => $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'uuid' => $transaction->uuid,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'status' => $transaction->status,
                    'method' => $transaction->method,
                    'reference' => $transaction->reference,
                    'due_at' => $transaction->due_at?->toDateString(),
                    'paid_at' => $transaction->paid_at?->toDateString(),
                ];
            })->toArray(),
        ];
    }

    /**
     * Check if payment is overdue
     */
    public function isPaymentOverdue(OrderPaymentTransaction $transaction): bool
    {
        if ($transaction->status === 'completed') {
            return false;
        }

        if (!$transaction->due_at) {
            return false;
        }

        return $transaction->due_at->isPast();
    }

    /**
     * Get overdue payments for a quote
     */
    public function getOverduePayments(CustomerQuote $quote): array
    {
        return $quote->paymentTransactions()
            ->where('status', 'pending')
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->get()
            ->toArray();
    }

    /**
     * Generate proforma invoice for payment transaction
     */
    public function generateProformaInvoice(
        OrderPaymentTransaction $transaction,
        int $generatedBy
    ): OrderDocument {
        $order = $transaction->order;
        $quote = CustomerQuote::where('id', $transaction->metadata['customer_quote_id'] ?? null)->first();

        if (!$quote) {
            throw new \DomainException('Customer quote not found for payment transaction');
        }

        // Generate invoice number
        $invoiceNumber = $this->generateDocumentNumber($order->tenant_id, 'proforma_invoice');

        // Determine due date based on payment type
        $dueDate = $transaction->due_at ?? now()->addDays(7);
        
        // Get payment type safely
        $paymentType = $transaction->metadata['payment_type'] ?? 'payment';

        // Create proforma invoice document
        $document = OrderDocument::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'customer_quote_id' => $quote->id,
            'payment_id' => $transaction->id,
            'document_type' => 'proforma_invoice',
            'document_number' => $invoiceNumber,
            'document_date' => now(),
            'title' => "Proforma Invoice {$invoiceNumber}",
            'description' => "Proforma invoice for {$paymentType} - {$quote->quote_number}",
            'file_url' => '', // Will be set after PDF generation
            'file_size' => 0,
            'file_type' => 'application/pdf',
            'status' => 'draft',
            'generated_by' => $generatedBy,
            'recipient_type' => 'customer',
            'recipient_id' => $order->customer_id,
            'recipient_email' => $order->customer->email ?? null,
            'metadata' => [
                'payment_type' => $transaction->metadata['payment_type'] ?? 'unknown',
                'payment_amount' => $transaction->amount,
                'payment_percentage' => $transaction->metadata['percentage'] ?? null,
                'due_date' => $dueDate->toDateString(),
                'quote_number' => $quote->quote_number,
                'order_number' => $order->order_number,
            ],
        ]);

        // Add to transaction metadata
        $transactionMetadata = $transaction->metadata ?? [];
        $transactionMetadata['proforma_invoice_id'] = $document->id;
        $transactionMetadata['proforma_invoice_uuid'] = $document->uuid;
        $transactionMetadata['proforma_invoice_number'] = $invoiceNumber;
        $transaction->update(['metadata' => $transactionMetadata]);

        // Add to quote history
        $history = is_array($quote->history) ? $quote->history : [];
        $history[] = [
            'action' => 'proforma_invoice_generated',
            'actor_type' => 'admin',
            'actor_id' => $generatedBy,
            'timestamp' => now()->toIso8601String(),
            'details' => [
                'document_id' => $document->id,
                'document_uuid' => $document->uuid,
                'document_number' => $invoiceNumber,
                'payment_transaction_id' => $transaction->id,
                'payment_type' => $transaction->metadata['payment_type'] ?? 'unknown',
            ],
        ];
        $quote->update(['history' => $history]);

        return $document;
    }

    /**
     * Generate receipt for completed payment
     */
    public function generateReceipt(
        OrderPaymentTransaction $transaction,
        int $generatedBy
    ): OrderDocument {
        if ($transaction->status !== 'completed') {
            throw new \DomainException('Can only generate receipt for completed payments');
        }

        $order = $transaction->order;
        $quote = CustomerQuote::where('id', $transaction->metadata['customer_quote_id'] ?? null)->first();

        // Generate receipt number
        $receiptNumber = $this->generateDocumentNumber($order->tenant_id, 'receipt');
        
        // Get payment type safely
        $paymentType = $transaction->metadata['payment_type'] ?? 'payment';

        // Create receipt document
        $document = OrderDocument::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'customer_quote_id' => $quote?->id,
            'payment_id' => $transaction->id,
            'document_type' => 'receipt',
            'document_number' => $receiptNumber,
            'document_date' => now(),
            'title' => "Receipt {$receiptNumber}",
            'description' => "Payment receipt for {$paymentType} - {$transaction->reference}",
            'file_url' => '', // Will be set after PDF generation
            'file_size' => 0,
            'file_type' => 'application/pdf',
            'status' => 'draft',
            'generated_by' => $generatedBy,
            'recipient_type' => 'customer',
            'recipient_id' => $order->customer_id,
            'recipient_email' => $order->customer->email ?? null,
            'metadata' => [
                'payment_type' => $transaction->metadata['payment_type'] ?? 'unknown',
                'payment_amount' => $transaction->amount,
                'payment_method' => $transaction->method,
                'payment_reference' => $transaction->reference,
                'paid_at' => $transaction->paid_at?->toDateString(),
                'quote_number' => $quote?->quote_number,
                'order_number' => $order->order_number,
            ],
        ]);

        // Add to transaction metadata
        $transactionMetadata = $transaction->metadata ?? [];
        $transactionMetadata['receipt_id'] = $document->id;
        $transactionMetadata['receipt_uuid'] = $document->uuid;
        $transactionMetadata['receipt_number'] = $receiptNumber;
        $transaction->update(['metadata' => $transactionMetadata]);

        // Add to quote history if quote exists
        if ($quote) {
            $history = is_array($quote->history) ? $quote->history : [];
            $history[] = [
                'action' => 'receipt_generated',
                'actor_type' => 'admin',
                'actor_id' => $generatedBy,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'document_id' => $document->id,
                    'document_uuid' => $document->uuid,
                    'document_number' => $receiptNumber,
                    'payment_transaction_id' => $transaction->id,
                    'payment_type' => $transaction->metadata['payment_type'] ?? 'unknown',
                    'payment_amount' => $transaction->amount,
                ],
            ];
            $quote->update(['history' => $history]);
        }

        return $document;
    }

    /**
     * Get documents linked to payment transaction
     */
    public function getPaymentDocuments(OrderPaymentTransaction $transaction): array
    {
        $documents = OrderDocument::where('payment_id', $transaction->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return $documents->map(function ($doc) {
            return [
                'id' => $doc->id,
                'uuid' => $doc->uuid,
                'document_type' => $doc->document_type,
                'document_number' => $doc->document_number,
                'document_date' => $doc->document_date->toDateString(),
                'title' => $doc->title,
                'status' => $doc->status,
                'file_url' => $doc->file_url,
                'generated_at' => $doc->generated_at->toDateString(),
                'sent_at' => $doc->sent_at?->toDateString(),
            ];
        })->toArray();
    }

    /**
     * Link existing document to payment transaction
     */
    public function linkDocumentToPayment(
        OrderDocument $document,
        OrderPaymentTransaction $transaction
    ): OrderDocument {
        // Validate that document and transaction belong to same order
        if ($document->order_id !== $transaction->order_id) {
            throw new \DomainException('Document and payment transaction must belong to same order');
        }

        // Update document with payment_id
        $document->update(['payment_id' => $transaction->id]);

        // Add to transaction metadata
        $transactionMetadata = $transaction->metadata ?? [];
        $transactionMetadata['linked_documents'] = $transactionMetadata['linked_documents'] ?? [];
        $transactionMetadata['linked_documents'][] = [
            'document_id' => $document->id,
            'document_uuid' => $document->uuid,
            'document_type' => $document->document_type,
            'document_number' => $document->document_number,
            'linked_at' => now()->toIso8601String(),
        ];
        $transaction->update(['metadata' => $transactionMetadata]);

        return $document->fresh();
    }

    /**
     * Generate document number with sequence
     */
    protected function generateDocumentNumber(int $tenantId, string $documentType): string
    {
        $year = date('Y');
        $prefix = match ($documentType) {
            'proforma_invoice' => 'PI',
            'tax_invoice' => 'TI',
            'receipt' => 'RCP',
            'purchase_order' => 'PO',
            'delivery_note' => 'DN',
            default => 'DOC',
        };

        // Get next sequence number for this document type
        $lastDocument = OrderDocument::where('tenant_id', $tenantId)
            ->where('document_type', $documentType)
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastDocument ? (int) substr($lastDocument->document_number, -4) + 1 : 1;

        return sprintf('%s-%s-%04d', $prefix, $year, $sequence);
    }

    /**
     * Automatically generate and send purchase order to vendor after DP payment
     * 
     * Requirements: 9.4 - Generate vendor PO after customer acceptance
     */
    protected function autoGenerateAndSendPurchaseOrder(OrderPaymentTransaction $transaction): void
    {
        try {
            $order = $transaction->order;
            
            // Load customer quote relationship
            $order->load('customerQuote.vendorQuote.vendor');
            
            // Check if order has customer quote with vendor quote
            $customerQuote = $order->customerQuote;
            if (!$customerQuote || !$customerQuote->vendorQuote) {
                \Log::info("Skipping PO generation - no customer quote or vendor quote for order {$order->id}");
                return;
            }

            // Check if PO already exists for this order
            $existingPO = OrderDocument::where('order_id', $order->id)
                ->where('document_type', 'purchase_order')
                ->first();

            if ($existingPO) {
                \Log::info("PO already exists for order {$order->id}, skipping generation");
                
                // If PO exists but not sent, send it now
                if ($existingPO->status === 'draft') {
                    $this->sendExistingPurchaseOrder($existingPO);
                }
                return;
            }

            // Generate PO using DocumentGenerationService
            $documentService = app(\App\Application\CustomerQuote\Services\DocumentGenerationService::class);
            
            // Use system user ID (1) for automatic generation
            $systemUserId = 1;
            
            $purchaseOrder = $documentService->generatePurchaseOrder(
                $order->id,
                $systemUserId
            );

            \Log::info("Generated PO {$purchaseOrder->document_number} for order {$order->id}");

            // Automatically send PO to vendor
            $sentPO = $documentService->sendPurchaseOrderToVendor(
                $purchaseOrder->uuid,
                $systemUserId
            );

            \Log::info("Sent PO {$sentPO->document_number} to vendor {$sentPO->recipient_email}");

            // Add to transaction metadata
            $transactionMetadata = $transaction->metadata ?? [];
            $transactionMetadata['purchase_order_generated'] = true;
            $transactionMetadata['purchase_order_id'] = $purchaseOrder->id;
            $transactionMetadata['purchase_order_uuid'] = $purchaseOrder->uuid;
            $transactionMetadata['purchase_order_number'] = $purchaseOrder->document_number;
            $transactionMetadata['purchase_order_sent_at'] = $sentPO->sent_at->toIso8601String();
            $transaction->update(['metadata' => $transactionMetadata]);

            // Add to quote history
            if ($customerQuote) {
                $history = is_array($customerQuote->history) ? $customerQuote->history : [];
                $history[] = [
                    'action' => 'purchase_order_auto_generated',
                    'actor_type' => 'system',
                    'timestamp' => now()->toIso8601String(),
                    'details' => [
                        'document_id' => $purchaseOrder->id,
                        'document_uuid' => $purchaseOrder->uuid,
                        'document_number' => $purchaseOrder->document_number,
                        'vendor_email' => $sentPO->recipient_email,
                        'sent_at' => $sentPO->sent_at->toIso8601String(),
                        'trigger' => 'dp_payment_verified',
                        'payment_transaction_id' => $transaction->id,
                    ],
                ];
                $customerQuote->update(['history' => $history]);
            }

        } catch (\Exception $e) {
            // Log error but don't fail the payment transaction
            \Log::error("Failed to auto-generate/send PO for order {$transaction->order_id}: {$e->getMessage()}", [
                'exception' => $e,
                'transaction_id' => $transaction->id,
                'order_id' => $transaction->order_id,
            ]);
        }
    }

    /**
     * Send existing purchase order to vendor
     */
    protected function sendExistingPurchaseOrder(OrderDocument $purchaseOrder): void
    {
        try {
            $documentService = app(\App\Application\CustomerQuote\Services\DocumentGenerationService::class);
            $systemUserId = 1;

            $sentPO = $documentService->sendPurchaseOrderToVendor(
                $purchaseOrder->uuid,
                $systemUserId
            );

            \Log::info("Sent existing PO {$sentPO->document_number} to vendor {$sentPO->recipient_email}");

        } catch (\Exception $e) {
            \Log::error("Failed to send existing PO {$purchaseOrder->document_number}: {$e->getMessage()}", [
                'exception' => $e,
                'purchase_order_id' => $purchaseOrder->id,
            ]);
        }
    }
}

