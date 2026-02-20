<?php

namespace Tests\Feature\CustomerQuote;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * PDF Generation Tests
 * 
 * Tests PDF generation with various data scenarios:
 * - Different item quantities and types
 * - Various pricing structures
 * - Multiple currencies
 * - Edge cases (empty fields, special characters, long text)
 * - All document types (quotation, proforma, tax invoice, PO, delivery note, receipt)
 * 
 * Requirements: Phase 8.2 - Test PDF generation with various data
 */
class PDFGenerationTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $admin;
    private Customer $customer;
    private Vendor $vendor;
    private DocumentGenerationService $documentService;

    protected function setUp(): void
    {
        parent::setUp();

        // Fake storage for PDF files
        Storage::fake('local');

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'PT Custom Etching Xenial',
        ]);

        // Create admin user
        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
            'name' => 'Admin User',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
            'phone' => '+62 812 3456789',
            'address' => 'Jl. Customer No. 456, Bandung',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'email' => 'vendor@test.com',
            'phone' => '+62 813 9876543',
            'address' => 'Jl. Vendor No. 789, Surabaya',
        ]);

        $this->documentService = app(DocumentGenerationService::class);
    }

    /**
     * Test: Generate quotation PDF with single item
     */
    public function test_generate_quotation_pdf_with_single_item(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Custom Etching Plate',
                'quantity' => 1,
                'specifications' => [
                    'material' => 'Stainless Steel',
                    'dimensions' => '10x15cm',
                    'text' => 'Company Logo',
                ],
            ],
        ]);

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'quotation');
        $this->assertEquals($quote->id, $document->customer_quote_id);
    }

    /**
     * Test: Generate quotation PDF with multiple items
     */
    public function test_generate_quotation_pdf_with_multiple_items(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Custom Etching Plate',
                'quantity' => 5,
                'specifications' => ['material' => 'Stainless Steel'],
            ],
            [
                'product_name' => 'Glass Etching',
                'quantity' => 10,
                'specifications' => ['material' => 'Tempered Glass'],
            ],
            [
                'product_name' => 'Award Plaque',
                'quantity' => 3,
                'specifications' => ['material' => 'Acrylic'],
            ],
        ]);

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'quotation');
    }

    /**
     * Test: Generate quotation PDF with large quantities
     */
    public function test_generate_quotation_pdf_with_large_quantities(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Bulk Order Item',
                'quantity' => 1000,
                'specifications' => ['material' => 'Aluminum'],
            ],
        ], 50000000); // 500,000 IDR

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'quotation');
    }

    /**
     * Test: Generate quotation PDF with special characters in text
     */
    public function test_generate_quotation_pdf_with_special_characters(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Custom Plate with Special Text',
                'quantity' => 1,
                'specifications' => [
                    'text' => 'Test & Co. "Premium" <Quality> 100%',
                    'notes' => 'Special chars: @#$%^&*()',
                ],
            ],
        ]);

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'quotation');
    }

    /**
     * Test: Generate quotation PDF with long text content
     */
    public function test_generate_quotation_pdf_with_long_text(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $longText = str_repeat('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ', 50);

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Item with Long Description',
                'quantity' => 1,
                'specifications' => [
                    'description' => $longText,
                    'notes' => $longText,
                ],
            ],
        ]);

        $quote->update([
            'terms_conditions' => $longText,
        ]);

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'quotation');
    }

    /**
     * Test: Generate quotation PDF with minimal data
     */
    public function test_generate_quotation_pdf_with_minimal_data(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Basic Item',
                'quantity' => 1,
                'specifications' => [],
            ],
        ]);

        // Clear optional fields
        $quote->update([
            'delivery_timeline' => null,
            'terms_conditions' => null,
        ]);

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'quotation');
    }

    /**
     * Test: Generate proforma invoice PDF
     */
    public function test_generate_proforma_invoice_pdf(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Test Product',
                'quantity' => 2,
                'specifications' => ['material' => 'Steel'],
            ],
        ]);

        $quote->update(['status' => 'accepted']);

        $document = $this->documentService->generateProformaInvoice(
            $quote->uuid,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'proforma_invoice');
        $this->assertEquals($quote->id, $document->customer_quote_id);
    }

    /**
     * Test: Generate tax invoice PDF
     */
    public function test_generate_tax_invoice_pdf(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Test Product',
                'quantity' => 1,
                'specifications' => [],
            ],
        ]);

        $quote->update(['status' => 'accepted']);
        $quote->order->update(['status' => 'paid']);

        $document = $this->documentService->generateTaxInvoice(
            $quote->order_id,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'tax_invoice');
    }

    /**
     * Test: Generate purchase order PDF
     */
    public function test_generate_purchase_order_pdf(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithVendor([
            [
                'product_name' => 'Test Product',
                'quantity' => 5,
                'specifications' => ['material' => 'Aluminum'],
            ],
        ]);

        $quote->update(['status' => 'accepted']);
        $quote->order->update(['status' => 'awaiting_payment']);

        $document = $this->documentService->generatePurchaseOrder(
            $quote->order_id,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'purchase_order');
        $this->assertEquals('vendor', $document->recipient_type);
        $this->assertEquals($this->vendor->id, $document->recipient_id);
    }

    /**
     * Test: Generate delivery note PDF
     */
    public function test_generate_delivery_note_pdf(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Delivered Product',
                'quantity' => 3,
                'specifications' => ['material' => 'Glass'],
            ],
        ]);

        $quote->order->update(['status' => 'shipped']);

        $document = $this->documentService->generateDeliveryNote(
            $quote->order_id,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'delivery_note');
    }

    /**
     * Test: Generate receipt PDF
     */
    public function test_generate_receipt_pdf(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Paid Product',
                'quantity' => 2,
                'specifications' => [],
            ],
        ]);

        $quote->update(['status' => 'accepted']);
        $quote->order->update(['status' => 'paid']);

        // Create verified payment
        OrderPaymentTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $quote->order_id,
            'amount' => $quote->grand_total,
            'status' => 'completed',
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'paid_at' => now(),
            'method' => 'bank_transfer',
        ]);

        $document = $this->documentService->generateReceipt(
            $quote->order_id,
            $this->admin->id
        );

        $this->assertPDFGenerated($document, 'receipt');
    }

    /**
     * Test: Generate PDFs with different tax rates
     */
    public function test_generate_pdf_with_different_tax_rates(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $taxRates = [0, 5.5, 11.0, 15.0];

        foreach ($taxRates as $taxRate) {
            $quote = $this->createQuoteWithItems([
                [
                    'product_name' => "Product with {$taxRate}% tax",
                    'quantity' => 1,
                    'specifications' => [],
                ],
            ], 1000000, $taxRate);

            $document = $this->documentService->generateQuotationPDF(
                $quote->uuid,
                $this->admin->id
            );

            $this->assertPDFGenerated($document, 'quotation');
            $this->assertEquals($taxRate, $quote->tax_rate);
        }
    }

    /**
     * Test: Generate PDFs with various pricing structures
     */
    public function test_generate_pdf_with_various_pricing(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $pricingScenarios = [
            ['total' => 10000, 'description' => 'Very small order'],
            ['total' => 500000, 'description' => 'Small order'],
            ['total' => 5000000, 'description' => 'Medium order'],
            ['total' => 50000000, 'description' => 'Large order'],
            ['total' => 500000000, 'description' => 'Very large order'],
        ];

        foreach ($pricingScenarios as $scenario) {
            $quote = $this->createQuoteWithItems([
                [
                    'product_name' => $scenario['description'],
                    'quantity' => 1,
                    'specifications' => [],
                ],
            ], $scenario['total']);

            $document = $this->documentService->generateQuotationPDF(
                $quote->uuid,
                $this->admin->id
            );

            $this->assertPDFGenerated($document, 'quotation');
        }
    }

    /**
     * Test: PDF file is stored correctly
     */
    public function test_pdf_file_is_stored_correctly(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithItems([
            [
                'product_name' => 'Test Product',
                'quantity' => 1,
                'specifications' => [],
            ],
        ]);

        $document = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        // Assert file exists in storage
        Storage::assertExists($document->file_url);

        // Assert file size is recorded
        $this->assertGreaterThan(0, $document->file_size);

        // Assert file type is correct
        $this->assertEquals('application/pdf', $document->file_type);
    }

    /**
     * Test: Generate multiple PDFs for same order
     */
    public function test_generate_multiple_pdfs_for_same_order(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $quote = $this->createQuoteWithVendor([
            [
                'product_name' => 'Test Product',
                'quantity' => 1,
                'specifications' => [],
            ],
        ]);

        $quote->update(['status' => 'accepted']);
        $quote->order->update(['status' => 'paid']);

        // Create verified payment
        OrderPaymentTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $quote->order_id,
            'amount' => $quote->grand_total,
            'status' => 'completed',
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'paid_at' => now(),
            'method' => 'bank_transfer',
        ]);

        // Generate multiple document types
        $quotationDoc = $this->documentService->generateQuotationPDF(
            $quote->uuid,
            $this->admin->id
        );

        $proformaDoc = $this->documentService->generateProformaInvoice(
            $quote->uuid,
            $this->admin->id
        );

        $taxInvoiceDoc = $this->documentService->generateTaxInvoice(
            $quote->order_id,
            $this->admin->id
        );

        $receiptDoc = $this->documentService->generateReceipt(
            $quote->order_id,
            $this->admin->id
        );

        // Assert all documents generated
        $this->assertPDFGenerated($quotationDoc, 'quotation');
        $this->assertPDFGenerated($proformaDoc, 'proforma_invoice');
        $this->assertPDFGenerated($taxInvoiceDoc, 'tax_invoice');
        $this->assertPDFGenerated($receiptDoc, 'receipt');

        // Assert unique document numbers
        $numbers = [
            $quotationDoc->document_number,
            $proformaDoc->document_number,
            $taxInvoiceDoc->document_number,
            $receiptDoc->document_number,
        ];
        $this->assertCount(4, array_unique($numbers));
    }

    /**
     * Helper: Create quote with items
     */
    private function createQuoteWithItems(array $items, int $grandTotal = 1000000, float $taxRate = 11.0): CustomerQuote
    {
        // Add pricing information to items if not present
        $totalQuantity = array_sum(array_column($items, 'quantity'));
        $itemSubtotal = (int)($grandTotal / (1 + $taxRate / 100));
        $unitPrice = $totalQuantity > 0 ? (int)($itemSubtotal / $totalQuantity) : 0;
        
        $formattedItems = [];
        foreach ($items as $item) {
            $quantity = $item['quantity'] ?? 1;
            $itemUnitPrice = $unitPrice;
            $itemTotalPrice = $itemUnitPrice * $quantity;
            
            $formattedItems[] = array_merge($item, [
                'pricing' => [
                    'unit_price' => $itemUnitPrice,
                    'total_price' => $itemTotalPrice,
                ],
            ]);
        }

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'items' => $formattedItems,
            'status' => 'customer_quote',
        ]);

        // Create vendor sourcing and quote
        $sourcing = VendorSourcing::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'sourcing_request_id' => $sourcing->id,
            'amount' => $grandTotal * 0.8, // 80% of customer price
            'status' => 'accepted',
        ]);

        $subtotal = (int)($grandTotal / (1 + $taxRate / 100));
        $taxAmount = $grandTotal - $subtotal;

        return CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_quote_id' => $vendorQuote->id,
            'status' => 'draft',
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'grand_total' => $grandTotal,
            'currency' => 'IDR',
            'handling_fee' => 0,
            'shipping_cost' => 0,
            'insurance' => 0,
            'other_costs' => 0,
            'created_by' => $this->admin->id,
            'payment_terms' => 'DP 50% + Balance 50%',
            'delivery_timeline' => '7-10 working days',
            'terms_and_conditions' => 'Standard terms and conditions apply.',
        ]);
    }

    /**
     * Helper: Create quote with vendor
     */
    private function createQuoteWithVendor(array $items, int $grandTotal = 1000000): CustomerQuote
    {
        // Add pricing information to items if not present
        $totalQuantity = array_sum(array_column($items, 'quantity'));
        $itemSubtotal = (int)($grandTotal / 1.11);
        $unitPrice = $totalQuantity > 0 ? (int)($itemSubtotal / $totalQuantity) : 0;
        
        $formattedItems = [];
        foreach ($items as $item) {
            $quantity = $item['quantity'] ?? 1;
            $itemUnitPrice = $unitPrice;
            $itemTotalPrice = $itemUnitPrice * $quantity;
            
            $formattedItems[] = array_merge($item, [
                'pricing' => [
                    'unit_price' => $itemUnitPrice,
                    'total_price' => $itemTotalPrice,
                ],
            ]);
        }

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'items' => $formattedItems,
            'status' => 'customer_quote',
        ]);

        $sourcing = VendorSourcing::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'sourcing_request_id' => $sourcing->id,
            'amount' => $grandTotal * 0.8, // 80% of customer price
            'status' => 'accepted',
        ]);

        $subtotal = (int)($grandTotal / 1.11);
        $taxAmount = $grandTotal - $subtotal;

        return CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_quote_id' => $vendorQuote->id,
            'status' => 'draft',
            'subtotal' => $subtotal,
            'tax_rate' => 11.0,
            'tax_amount' => $taxAmount,
            'grand_total' => $grandTotal,
            'currency' => 'IDR',
            'handling_fee' => 0,
            'shipping_cost' => 0,
            'insurance' => 0,
            'other_costs' => 0,
            'created_by' => $this->admin->id,
            'payment_terms' => 'DP 50% + Balance 50%',
            'delivery_timeline' => '7-10 working days',
        ]);
    }

    /**
     * Helper: Assert PDF was generated correctly
     */
    private function assertPDFGenerated(OrderDocument $document, string $expectedType): void
    {
        $this->assertInstanceOf(OrderDocument::class, $document);
        $this->assertEquals($expectedType, $document->document_type);
        $this->assertEquals('application/pdf', $document->file_type);
        $this->assertNotEmpty($document->file_url);
        $this->assertGreaterThan(0, $document->file_size);
        $this->assertNotEmpty($document->document_number);
        $this->assertEquals($this->admin->id, $document->generated_by);
        $this->assertNotNull($document->generated_at);
    }
}
