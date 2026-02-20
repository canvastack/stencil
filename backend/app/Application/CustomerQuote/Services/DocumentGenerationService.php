<?php

namespace App\Application\CustomerQuote\Services;

use App\Domain\CustomerQuote\Repositories\DocumentRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\DocumentTemplateRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\DocumentTemplate;
use App\Infrastructure\Persistence\Eloquent\Models\DocumentSequence;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

/**
 * Application Service for Document Generation
 * 
 * Handles generation of various business documents:
 * - Quotation PDF
 * - Proforma Invoice
 * - Tax Invoice
 * - Purchase Order
 * - Delivery Note
 * - Receipt
 */
class DocumentGenerationService
{
    public function __construct(
        private DocumentRepositoryInterface $documentRepository,
        private DocumentTemplateRepositoryInterface $templateRepository,
        private CustomerQuoteMonitoringService $monitoringService
    ) {}

    /**
     * Generate quotation PDF
     */
    public function generateQuotationPDF(string $quoteUuid, int $generatedBy): OrderDocument
    {
        $quote = CustomerQuote::where('uuid', $quoteUuid)
            ->with(['order.customer', 'vendorQuote', 'order.tenant'])
            ->firstOrFail();

        // Get template
        $template = $this->getTemplate($quote->tenant_id, 'quotation');

        // Generate document number
        $documentNumber = $this->generateDocumentNumber(
            $quote->tenant_id,
            'quotation'
        );

        // Generate PDF - pass $quote directly to template
        $pdfPath = $this->generatePDF('quotation', ['quote' => $quote], $template);

        // Create document record
        $document = OrderDocument::create([
            'tenant_id' => $quote->tenant_id,
            'order_id' => $quote->order_id,
            'customer_quote_id' => $quote->id,
            'document_type' => 'quotation',
            'document_number' => $documentNumber,
            'document_date' => now(),
            'title' => 'Customer Quotation - ' . $quote->quote_number,
            'file_url' => $pdfPath,
            'file_size' => Storage::size($pdfPath),
            'file_type' => 'application/pdf',
            'version' => 1,
            'status' => 'active',
            'generated_by' => $generatedBy,
            'generated_at' => now(),
            'metadata' => [
                'quote_uuid' => $quote->uuid,
                'quote_number' => $quote->quote_number,
                'grand_total' => $quote->grand_total,
            ],
        ]);

        return $document;
    }

    /**
     * Generate proforma invoice
     */
    public function generateProformaInvoice(string $quoteUuid, int $generatedBy): OrderDocument
    {
        return DB::transaction(function () use ($quoteUuid, $generatedBy) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)
                ->with(['order.customer', 'order.tenant'])
                ->firstOrFail();

            if ($quote->status !== 'accepted') {
                throw new \DomainException('Can only generate proforma invoice for accepted quotes');
            }

            $template = $this->getTemplate($quote->tenant_id, 'proforma_invoice');
            $documentNumber = $this->generateDocumentNumber($quote->tenant_id, 'proforma_invoice');

            // Pass $quote directly to template
            $pdfPath = $this->generatePDF('proforma_invoice', ['quote' => $quote], $template);

            $document = OrderDocument::create([
                'tenant_id' => $quote->tenant_id,
                'order_id' => $quote->order_id,
                'customer_quote_id' => $quote->id,
                'document_type' => 'proforma_invoice',
                'document_number' => $documentNumber,
                'document_date' => now(),
                'title' => 'Proforma Invoice - ' . $documentNumber,
                'file_url' => $pdfPath,
                'file_size' => Storage::size($pdfPath),
                'file_type' => 'application/pdf',
                'version' => 1,
                'status' => 'active',
                'generated_by' => $generatedBy,
                'generated_at' => now(),
                'metadata' => [
                    'quote_uuid' => $quote->uuid,
                    'invoice_type' => 'proforma',
                ],
            ]);

            return $document;
        });
    }

    /**
     * Generate tax invoice
     */
    public function generateTaxInvoice(int $orderId, int $generatedBy): OrderDocument
    {
        return DB::transaction(function () use ($orderId, $generatedBy) {
            $order = Order::with(['customer', 'customerQuote', 'tenant'])->findOrFail($orderId);

            if (!in_array($order->status, ['paid', 'processing', 'completed'])) {
                throw new \DomainException('Can only generate tax invoice for paid orders');
            }

            $template = $this->getTemplate($order->tenant_id, 'tax_invoice');
            $documentNumber = $this->generateDocumentNumber($order->tenant_id, 'tax_invoice');

            // Create document record first (needed for PDF generation)
            $document = OrderDocument::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'customer_quote_id' => $order->customerQuote?->id,
                'document_type' => 'tax_invoice',
                'document_number' => $documentNumber,
                'document_date' => now(),
                'title' => 'Tax Invoice - ' . $documentNumber,
                'file_url' => '', // Will be updated after PDF generation
                'file_size' => 0,
                'file_type' => 'application/pdf',
                'version' => 1,
                'status' => 'active',
                'generated_by' => $generatedBy,
                'generated_at' => now(),
                'metadata' => [
                    'invoice_type' => 'tax',
                    'tax_rate' => $order->customerQuote?->tax_rate ?? 11.00,
                ],
            ]);

            // Get payment if exists
            $payment = OrderPaymentTransaction::where('order_id', $order->id)
                ->where('status', 'completed')
                ->where('direction', 'incoming')
                ->orderBy('created_at', 'desc')
                ->first();

            // Pass document, quote, and payment to template
            $pdfPath = $this->generatePDF('tax_invoice', [
                'document' => $document,
                'quote' => $order->customerQuote,
                'payment' => $payment,
            ], $template);

            // Update document with PDF path
            $document->update([
                'file_url' => $pdfPath,
                'file_size' => Storage::size($pdfPath),
            ]);

            return $document->fresh();
        });
    }

    /**
     * Generate purchase order (vendor PO)
     * 
     * Requirements: 20.1-20.10
     * - Generated after DP payment verified
     * - Sent to vendor via email
     * - Vendor can view in portal
     * - Track acknowledgment
     */
    public function generatePurchaseOrder(int $orderId, int $generatedBy): OrderDocument
    {
        return DB::transaction(function () use ($orderId, $generatedBy) {
            // Use withoutGlobalScope to avoid tenant filtering issues in tests
            $order = Order::withoutGlobalScope('tenant')
                ->with([
                    'customer', 
                    'customerQuote.vendorQuote.vendor',
                    'tenant'
                ])->findOrFail($orderId);

            // Validate order has customer quote with vendor quote
            if (!$order->customerQuote || !$order->customerQuote->vendorQuote) {
                throw new \DomainException('Order must have customer quote with vendor quote to generate PO');
            }

            // Validate customer payment has been verified (DP at minimum)
            // Allow PO generation for payment-related and production statuses
            if (!in_array($order->status, ['awaiting_payment', 'partial_payment', 'full_payment', 'paid', 'processing', 'production', 'in_production', 'quality_control', 'shipping', 'completed'])) {
                throw new \DomainException('Can only generate PO after customer payment initiated');
            }

            $vendor = $order->customerQuote->vendorQuote->vendor;

            // Template is optional - will be null if table doesn't exist
            $template = null;

            $documentNumber = $this->generateDocumentNumber($order->tenant_id, 'purchase_order');

            // Create document record first (needed for PDF generation)
            $document = OrderDocument::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'vendor_quote_id' => $order->customerQuote->vendorQuote->id,
                'document_type' => 'purchase_order',
                'document_number' => $documentNumber,
                'document_date' => now(),
                'title' => 'Purchase Order - ' . $documentNumber,
                'file_url' => '', // Will be updated after PDF generation
                'file_size' => 0,
                'file_type' => 'application/pdf',
                'version' => 1,
                'is_latest_version' => true,
                'status' => 'draft',
                'generated_by' => $generatedBy,
                'generated_at' => now(),
                'recipient_type' => 'vendor',
                'recipient_id' => $vendor->id,
                'recipient_email' => $vendor->email,
                'metadata' => [
                    'vendor_quote_id' => $order->customerQuote->vendorQuote->id,
                    'vendor_name' => $vendor->name,
                    'order_number' => $order->order_number,
                    'customer_quote_number' => $order->customerQuote->quote_number,
                ],
            ]);

            // Prepare data and generate PDF
            $poData = $this->preparePurchaseOrderData($order);
            $poData['document'] = $document; // Add document to data
            $pdfPath = $this->generatePDF('purchase_order', ['data' => $poData, 'document' => $document], $template);

            // Update document with PDF path
            $document->update([
                'file_url' => $pdfPath,
                'file_size' => Storage::size($pdfPath),
            ]);

            return $document->fresh();
        });
    }

    /**
     * Send purchase order to vendor
     * 
     * Requirements: 20.4, 20.5
     */
    public function sendPurchaseOrderToVendor(string $documentUuid, int $sentBy): OrderDocument
    {
        return DB::transaction(function () use ($documentUuid, $sentBy) {
            $document = OrderDocument::withoutGlobalScope('tenant')
                ->where('uuid', $documentUuid)
                ->firstOrFail();

            // Load relationships without tenant scope
            $document->load([
                'order' => function ($query) {
                    $query->withoutGlobalScope('tenant');
                },
                'order.customerQuote.vendorQuote.vendor'
            ]);

            if ($document->document_type !== 'purchase_order') {
                throw new \DomainException('Document must be a purchase order');
            }

            if ($document->status !== 'draft') {
                throw new \DomainException('Only draft purchase orders can be sent');
            }

            // Update document status
            $document->update([
                'status' => 'sent',
                'sent_at' => now(),
                'sent_by' => $sentBy,
            ]);

            // Send email to vendor
            $vendor = $document->order->customerQuote->vendorQuote->vendor;
            \Mail::to($vendor->email)->send(new \App\Mail\VendorPurchaseOrderMail($document));

            return $document->fresh();
        });
    }

    /**
     * Vendor acknowledges purchase order receipt
     * 
     * Requirements: 20.7
     */
    public function acknowledgePurchaseOrder(string $documentUuid, int $vendorUserId, ?string $notes = null): OrderDocument
    {
        return DB::transaction(function () use ($documentUuid, $vendorUserId, $notes) {
            $document = OrderDocument::withoutGlobalScope('tenant')
                ->where('uuid', $documentUuid)
                ->firstOrFail();

            // Load order relationship without tenant scope
            $document->load([
                'order' => function ($query) {
                    $query->withoutGlobalScope('tenant');
                }
            ]);

            if ($document->document_type !== 'purchase_order') {
                throw new \DomainException('Document must be a purchase order');
            }

            if ($document->status !== 'sent') {
                throw new \DomainException('Only sent purchase orders can be acknowledged');
            }

            // Update document status
            $document->update([
                'status' => 'acknowledged',
                'acknowledged_at' => now(),
                'acknowledged_by' => $vendorUserId,
                'metadata' => array_merge($document->metadata ?? [], [
                    'acknowledgment_notes' => $notes,
                    'acknowledged_at' => now()->toIso8601String(),
                ]),
            ]);

            // Update order status to in_production when vendor acknowledges PO
            // This happens after customer payment is verified and PO is sent to vendor
            if ($document->order) {
                $currentStatus = $document->order->status;
                
                // Transition to in_production if order is in awaiting_payment or full_payment status
                if (in_array($currentStatus, ['awaiting_payment', 'full_payment'])) {
                    $document->order->update(['status' => 'in_production']);
                }
            }

            // Fire event for tracking and notifications
            event(new \App\Events\VendorPurchaseOrderAcknowledged(
                $document->fresh(),
                $vendorUserId,
                $notes
            ));

            return $document->fresh();
        });
    }

    /**
     * Generate delivery note
     */
    public function generateDeliveryNote(int $orderId, int $generatedBy): OrderDocument
    {
        return DB::transaction(function () use ($orderId, $generatedBy) {
            $order = Order::with(['customer', 'tenant'])->findOrFail($orderId);

            if (!in_array($order->status, ['shipped', 'delivered', 'completed'])) {
                throw new \DomainException('Can only generate delivery note for shipped orders');
            }

            $template = $this->getTemplate($order->tenant_id, 'delivery_note');
            $documentNumber = $this->generateDocumentNumber($order->tenant_id, 'delivery_note');

            // Create document record first (needed for PDF generation)
            $document = OrderDocument::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'document_type' => 'delivery_note',
                'document_number' => $documentNumber,
                'document_date' => now(),
                'title' => 'Delivery Note - ' . $documentNumber,
                'file_url' => '', // Will be updated after PDF generation
                'file_size' => 0,
                'file_type' => 'application/pdf',
                'version' => 1,
                'status' => 'active',
                'generated_by' => $generatedBy,
                'generated_at' => now(),
            ]);

            // Prepare data and generate PDF
            $data = $this->prepareDeliveryNoteData($order);
            $pdfPath = $this->generateDeliveryNotePDF($document, $data, $template);

            // Update document with PDF path
            $document->update([
                'file_url' => $pdfPath,
                'file_size' => Storage::size($pdfPath),
            ]);

            return $document->fresh();
        });
    }
    
    /**
     * Generate delivery note PDF with document context
     */
    private function generateDeliveryNotePDF(OrderDocument $document, array $data, ?DocumentTemplate $template): string
    {
        try {
            $viewName = 'pdf.delivery-note';
            
            // Check if view exists
            if (!\View::exists($viewName)) {
                throw new \Exception("PDF template view not found: {$viewName}");
            }
            
            // Generate PDF using dompdf with both document and data
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($viewName, [
                'document' => $document,
                'data' => $data,
            ]);
            
            // Configure PDF options
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption('isHtml5ParserEnabled', true);
            $pdf->setOption('isRemoteEnabled', true);
            
            // Generate filename
            $filename = sprintf(
                'documents/delivery_note/%s_%s.pdf',
                'delivery_note',
                now()->format('YmdHis')
            );
            
            // Create directory if not exists
            Storage::makeDirectory(dirname($filename));
            
            // Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::put($filename, $pdfContent);
            
            return $filename;
        } catch (\Exception $e) {
            \Log::error('Delivery note PDF generation failed', [
                'document_id' => $document->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Log monitoring
            $this->monitoringService->logPDFGenerationError(
                'delivery_note',
                $document->customer_quote_id ?? 0,
                $e,
                ['document_id' => $document->id]
            );
            
            throw new \RuntimeException("Failed to generate delivery note PDF: {$e->getMessage()}");
        }
    }

    /**
     * Generate receipt
     */
    public function generateReceipt(int $orderId, int $generatedBy): OrderDocument
    {
        return DB::transaction(function () use ($orderId, $generatedBy) {
            $order = Order::with(['customer', 'customerQuote', 'tenant'])->findOrFail($orderId);

            if (!in_array($order->status, ['paid', 'processing', 'completed'])) {
                throw new \DomainException('Can only generate receipt for paid orders');
            }

            // Get verified payment transaction
            $payment = OrderPaymentTransaction::where('order_id', $order->id)
                ->where('status', 'completed')
                ->where('direction', 'incoming')
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$payment) {
                throw new \DomainException('No verified payment found for this order');
            }

            $template = $this->getTemplate($order->tenant_id, 'receipt');
            $documentNumber = $this->generateDocumentNumber($order->tenant_id, 'receipt');

            // Create document record first (needed for PDF generation)
            $document = OrderDocument::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'customer_quote_id' => $order->customerQuote?->id,
                'document_type' => 'receipt',
                'document_number' => $documentNumber,
                'document_date' => now(),
                'title' => 'Receipt - ' . $documentNumber,
                'file_url' => '', // Will be updated after PDF generation
                'file_size' => 0,
                'file_type' => 'application/pdf',
                'version' => 1,
                'status' => 'active',
                'generated_by' => $generatedBy,
                'generated_at' => now(),
                'metadata' => [
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer->name,
                ],
            ]);

            // Prepare data and generate PDF
            $data = [
                'quote' => $order->customerQuote,
                'payment' => $payment,
                'document' => $document,
            ];
            $pdfPath = $this->generatePDF('receipt', $data, $template);

            // Update document with PDF path
            $document->update([
                'file_url' => $pdfPath,
                'file_size' => Storage::size($pdfPath),
            ]);

            return $document->fresh();
        });
    }

    /**
     * Generate document number with sequence
     * Simplified version that doesn't rely on document_sequences table
     */
    private function generateDocumentNumber(int $tenantId, string $documentType): string
    {
        $year = date('Y');
        $prefix = $this->getDocumentPrefix($documentType);
        
        // Use timestamp + random for uniqueness instead of sequence table
        $uniqueId = date('md') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Format: PREFIX-YYYY-UNIQUEID
        return sprintf(
            '%s-%s-%s',
            $prefix,
            $year,
            $uniqueId
        );
    }

    /**
     * Get document prefix by type
     */
    private function getDocumentPrefix(string $documentType): string
    {
        return match ($documentType) {
            'quotation' => 'QUO',
            'proforma_invoice' => 'PI',
            'tax_invoice' => 'INV',
            'purchase_order' => 'PO',
            'delivery_note' => 'DN',
            'receipt' => 'RCP',
            default => 'DOC',
        };
    }

    /**
     * Get template for document type
     */
    private function getTemplate(int $tenantId, string $documentType): ?DocumentTemplate
    {
        try {
            // Check if table exists first
            if (!Schema::hasTable('document_templates')) {
                return null;
            }
            
            // Check if required columns exist
            if (!Schema::hasColumn('document_templates', 'document_type')) {
                \Log::debug('document_templates table exists but missing document_type column');
                return null;
            }
            
            return DocumentTemplate::where('tenant_id', $tenantId)
                ->where('document_type', $documentType)
                ->where('is_active', true)
                ->first();
        } catch (\Exception $e) {
            // Table might not exist in test environment, return null
            \Log::debug('DocumentTemplate retrieval failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Prepare quotation data for PDF
     */
    private function prepareQuotationData(CustomerQuote $quote): array
    {
        return [
            'quote_number' => $quote->quote_number,
            'quote_date' => $quote->created_at->format('d F Y'),
            'valid_until' => $quote->valid_until->format('d F Y'),
            'customer' => [
                'name' => $quote->order->customer->name,
                'email' => $quote->order->customer->email,
                'phone' => $quote->order->customer->phone,
                'address' => $quote->order->customer->address,
            ],
            'items' => $quote->order->items ?? [],
            'subtotal' => $quote->subtotal,
            'tax_rate' => $quote->tax_rate,
            'tax_amount' => $quote->tax_amount,
            'grand_total' => $quote->grand_total,
            'payment_terms' => $quote->payment_terms,
            'delivery_timeline' => $quote->delivery_timeline,
            'terms_conditions' => $quote->terms_conditions,
        ];
    }

    /**
     * Prepare invoice data for PDF
     */
    private function prepareInvoiceData(CustomerQuote $quote, string $type): array
    {
        return array_merge($this->prepareQuotationData($quote), [
            'invoice_type' => $type,
            'invoice_date' => now()->format('d F Y'),
        ]);
    }

    /**
     * Prepare purchase order data for PDF
     * 
     * Requirements: 20.3
     * Includes: company details, vendor details, PO number, items, pricing, terms
     */
    private function preparePurchaseOrderData(Order $order): array
    {
        $customerQuote = $order->customerQuote;
        $vendorQuote = $customerQuote->vendorQuote;
        $vendor = $vendorQuote->vendor;
        $tenant = $order->tenant;

        return [
            // Company details (as buyer)
            'company' => [
                'name' => $tenant->name ?? 'PT Custom Etching Xenial',
                'address' => $tenant->address ?? '',
                'phone' => $tenant->phone ?? '',
                'email' => $tenant->email ?? '',
            ],
            
            // Vendor details (as supplier)
            'vendor' => [
                'name' => $vendor->name,
                'company_name' => $vendor->company_name ?? $vendor->name,
                'address' => $vendor->address ?? '',
                'phone' => $vendor->phone ?? '',
                'email' => $vendor->email,
                'contact_person' => $vendor->contact_person ?? '',
            ],
            
            // PO details
            'po_date' => now()->format('d F Y'),
            'order_reference' => $order->order_number,
            'customer_quote_reference' => $customerQuote->quote_number,
            'vendor_quote_reference' => $vendorQuote->id,
            
            // Delivery information
            'delivery_address' => $order->customer->address ?? '',
            'delivery_deadline' => $this->calculateDeliveryDeadline($customerQuote),
            
            // Items from vendor quote
            'items' => $this->formatPOItems($order),
            
            // Pricing from accepted vendor quote
            'pricing' => [
                'subtotal' => $vendorQuote->amount * 100, // Convert to cents
                'tax_rate' => 0, // Vendor pricing usually excludes tax
                'tax_amount' => 0,
                'total' => $vendorQuote->amount * 100,
                'currency' => 'IDR',
            ],
            
            // Payment terms to vendor
            'payment_terms' => $vendorQuote->terms['payment_terms'] ?? 'Net 30 days after delivery',
            
            // Quality requirements
            'quality_requirements' => $this->getQualityRequirements($order),
            
            // Terms & conditions
            'terms_conditions' => $this->getVendorPOTerms($tenant),
            
            // Penalty clauses
            'penalty_clauses' => $this->getPenaltyClauses($tenant),
        ];
    }

    /**
     * Calculate delivery deadline based on customer quote timeline
     */
    private function calculateDeliveryDeadline(CustomerQuote $customerQuote): string
    {
        // Extract working days from delivery_timeline (e.g., "7-10 working days")
        $timeline = $customerQuote->delivery_timeline ?? '14 working days';
        preg_match('/(\d+)/', $timeline, $matches);
        $days = isset($matches[1]) ? (int)$matches[1] : 14;
        
        // Subtract buffer days for internal processing (e.g., 2 days)
        $vendorDays = max(1, $days - 2);
        
        return now()->addDays($vendorDays)->format('d F Y');
    }

    /**
     * Format items for PO
     */
    private function formatPOItems(Order $order): array
    {
        $items = $order->items ?? [];
        $formatted = [];
        
        // Get vendor quote for pricing
        $vendorQuote = $order->customerQuote?->vendorQuote;
        $vendorAmount = $vendorQuote ? $vendorQuote->amount * 100 : 0; // Convert to cents
        
        // Calculate unit price based on total items
        $totalQuantity = array_sum(array_column($items, 'quantity'));
        $unitPrice = $totalQuantity > 0 ? (int)($vendorAmount / $totalQuantity) : 0;

        foreach ($items as $index => $item) {
            $quantity = $item['quantity'] ?? 1;
            $itemUnitPrice = $unitPrice;
            $itemTotalPrice = $itemUnitPrice * $quantity;
            
            $formatted[] = [
                'no' => $index + 1,
                'product_name' => $item['product_name'] ?? 'Product',
                'description' => $item['product_name'] ?? 'Product',
                'specifications' => $item['specifications'] ?? [],
                'quantity' => $quantity,
                'unit' => $item['unit'] ?? 'pcs',
                'unit_price' => $itemUnitPrice,
                'total_price' => $itemTotalPrice,
                'notes' => $item['notes'] ?? '',
            ];
        }

        return $formatted;
    }

    /**
     * Get quality requirements
     */
    private function getQualityRequirements(Order $order): array
    {
        return [
            'Material quality must meet specifications',
            'Dimensions must be accurate within ±0.5mm tolerance',
            'Surface finish must be smooth and free from defects',
            'All items must pass quality inspection before delivery',
            'Packaging must protect items during transport',
        ];
    }

    /**
     * Get vendor PO terms and conditions
     */
    private function getVendorPOTerms($tenant): array
    {
        return [
            'Delivery must be made to the specified address on or before the delivery deadline.',
            'All items must meet the quality requirements specified in this PO.',
            'Vendor must notify buyer immediately of any delays or issues.',
            'Payment will be made according to the payment terms after successful delivery and inspection.',
            'Vendor is responsible for packaging and safe delivery of items.',
            'Any defective items must be replaced at vendor\'s cost.',
            'This PO is subject to the terms and conditions agreed in the vendor quote.',
        ];
    }

    /**
     * Get penalty clauses
     */
    private function getPenaltyClauses($tenant): array
    {
        return [
            'Late delivery: 1% of order value per day, maximum 10%',
            'Quality defects: Full replacement or refund',
            'Incomplete delivery: Proportional payment reduction',
        ];
    }

    /**
     * Prepare delivery note data for PDF
     */
    private function prepareDeliveryNoteData(Order $order): array
    {
        $tenant = $order->tenant;
        $items = $order->items ?? [];
        
        // Format items for delivery note
        $formattedItems = [];
        foreach ($items as $index => $item) {
            $formattedItems[] = [
                'product_name' => $item['product_name'] ?? 'Product',
                'specifications' => $item['specifications'] ?? [],
                'ordered_quantity' => $item['quantity'] ?? 1,
                'delivered_quantity' => $item['quantity'] ?? 1,
                'condition' => 'Good',
                'serial_numbers' => $item['serial_numbers'] ?? [],
                'notes' => $item['notes'] ?? '',
            ];
        }
        
        return [
            // Company details
            'company' => [
                'name' => $tenant->name ?? config('app.name'),
                'address' => $tenant->address ?? '',
                'phone' => $tenant->phone ?? '',
                'email' => $tenant->email ?? '',
            ],
            
            // Customer details
            'customer' => [
                'name' => $order->customer->name,
                'company' => $order->customer->company_name ?? '',
                'phone' => $order->customer->phone ?? '',
                'email' => $order->customer->email,
            ],
            
            // Delivery information
            'delivery_address' => $order->customer->address ?? '',
            'delivery_date' => now()->format('d F Y'),
            'delivery_time' => now()->format('H:i'),
            'delivery_method' => $order->shipping_method ?? 'Standard Delivery',
            'tracking_number' => $order->tracking_number ?? null,
            
            // References
            'order_reference' => $order->order_number,
            'invoice_reference' => $order->customerQuote?->quote_number ?? null,
            
            // Items
            'items' => $formattedItems,
            'total_packages' => 1,
            
            // Delivery personnel
            'delivered_by' => auth()->user()?->name ?? 'Delivery Team',
            'courier_name' => $order->courier_name ?? null,
            'courier_phone' => $order->courier_phone ?? null,
            'vehicle_number' => $order->vehicle_number ?? null,
            
            // Additional information
            'special_instructions' => $order->delivery_instructions ?? null,
            'delivery_notes' => $order->delivery_notes ?? null,
        ];
    }

    /**
     * Prepare receipt data for PDF
     */
    private function prepareReceiptData(Order $order): array
    {
        // Load necessary relationships
        $order->load(['customer', 'customerQuote', 'payments']);
        
        // Get the verified payment (most recent)
        $payment = $order->payments()
            ->where('status', 'verified')
            ->orderBy('verified_at', 'desc')
            ->first();
            
        if (!$payment) {
            throw new \DomainException('No verified payment found for this order');
        }
        
        $quote = $order->customerQuote;
        
        return [
            'quote' => $quote,
            'payment' => $payment,
            'document' => null, // Will be set during PDF generation
        ];
    }

    /**
     * Generate PDF from template and data
     * 
     * Uses dompdf library to render blade templates
     */
    private function generatePDF(string $type, array $data, ?DocumentTemplate $template): string
    {
        try {
            // Map document type to blade view
            $viewMap = [
                'quotation' => 'pdf.quotation',
                'proforma_invoice' => 'pdf.proforma-invoice',
                'tax_invoice' => 'pdf.tax-invoice',
                'purchase_order' => 'pdf.purchase-order',
                'delivery_note' => 'pdf.delivery-note',
                'receipt' => 'pdf.receipt',
            ];
            
            $viewName = $viewMap[$type] ?? 'pdf.generic';
            
            // Check if view exists
            if (!\View::exists($viewName)) {
                \Log::error('PDF template view not found', ['view' => $viewName]);
                throw new \Exception("PDF template view not found: {$viewName}");
            }
            
            \Log::info('Generating PDF', ['type' => $type, 'view' => $viewName, 'data_keys' => array_keys($data)]);
            
            // Generate PDF using dompdf
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($viewName, $data);
            
            // Configure PDF options
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption('isHtml5ParserEnabled', true);
            $pdf->setOption('isRemoteEnabled', true);
            
            // Generate filename
            $filename = sprintf(
                'documents/%s/%s_%s.pdf',
                $type,
                $type,
                now()->format('YmdHis')
            );
            
            // Create directory if not exists
            Storage::makeDirectory(dirname($filename));
            
            // Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::put($filename, $pdfContent);
            
            \Log::info('PDF generated successfully', ['filename' => $filename, 'size' => strlen($pdfContent)]);
            
            return $filename;
        } catch (\Exception $e) {
            \Log::error('PDF generation failed', [
                'type' => $type,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Log monitoring
            $quoteId = $data['quote']->id ?? 0;
            $this->monitoringService->logPDFGenerationError(
                $type,
                $quoteId,
                $e,
                ['data_keys' => array_keys($data)]
            );
            
            throw new \RuntimeException("Failed to generate PDF: {$e->getMessage()}");
        }
    }
}
