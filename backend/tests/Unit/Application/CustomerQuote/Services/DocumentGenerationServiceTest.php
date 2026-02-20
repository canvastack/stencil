<?php

namespace Tests\Unit\Application\CustomerQuote\Services;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Domain\CustomerQuote\Repositories\DocumentRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\DocumentTemplateRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    private DocumentGenerationService $service;
    private TenantEloquentModel $tenant;
    private Customer $customer;
    private Order $order;
    private Vendor $vendor;
    private VendorQuote $vendorQuote;
    private CustomerQuote $customerQuote;
    private \App\Infrastructure\Persistence\Eloquent\Models\User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock repositories
        $documentRepository = $this->createMock(DocumentRepositoryInterface::class);
        $templateRepository = $this->createMock(DocumentTemplateRepositoryInterface::class);

        $this->service = new DocumentGenerationService(
            $documentRepository,
            $templateRepository
        );

        // Setup test data
        $this->setupTestData();

        // Mock storage
        Storage::fake('local');
    }

    private function setupTestData(): void
    {
        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'domain' => 'test-tenant',
        ]);

        // Create user
        $this->user = \App\Infrastructure\Persistence\Eloquent\Models\User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'email' => 'vendor@test.com',
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'ORD-2026-0001',
            'status' => 'customer_quote',
            'items' => [
                [
                    'product_name' => 'Test Product',
                    'quantity' => 2,
                    'specifications' => ['material' => 'steel'],
                ]
            ],
        ]);

        // Create vendor quote
        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'amount' => 100.00,
            'status' => 'accepted',
        ]);

        // Create customer quote
        $this->customerQuote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'quote_number' => 'CQ-2026-0001',
            'status' => 'accepted',
            'vendor_total_cost' => 10000000,
            'base_profit_amount' => 2000000,
            'base_profit_percentage' => 20.0,
            'subtotal' => 12000000,
            'tax_rate' => 11.0,
            'tax_amount' => 1320000,
            'grand_total' => 13320000,
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'DP 50% + Balance 50%',
            'created_by' => $this->user->id,
        ]);
    }

    /** @test */
    public function it_generates_unique_document_numbers_for_quotations(): void
    {
        // Act - Generate multiple quotation documents
        $doc1 = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);
        
        // Create another customer quote
        $customerQuote2 = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'quote_number' => 'CQ-2026-0002',
            'status' => 'accepted',
            'vendor_total_cost' => 10000000,
            'base_profit_amount' => 2000000,
            'base_profit_percentage' => 20.0,
            'subtotal' => 12000000,
            'tax_rate' => 11.0,
            'tax_amount' => 1320000,
            'grand_total' => 13320000,
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'DP 50% + Balance 50%',
            'created_by' => $this->user->id,
        ]);
        
        $doc2 = $this->service->generateQuotationPDF($customerQuote2->uuid, $this->user->id);

        // Assert - Document numbers should be unique
        $this->assertNotEquals($doc1->document_number, $doc2->document_number);
        $this->assertStringStartsWith('QUO-', $doc1->document_number);
        $this->assertStringStartsWith('QUO-', $doc2->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_correct_prefix_for_quotation(): void
    {
        // Act
        $document = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);

        // Assert
        $this->assertStringStartsWith('QUO-', $document->document_number);
        $this->assertMatchesRegularExpression('/^QUO-\d{4}-\d+$/', $document->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_correct_prefix_for_proforma_invoice(): void
    {
        // Act
        $document = $this->service->generateProformaInvoice($this->customerQuote->uuid, $this->user->id);

        // Assert
        $this->assertStringStartsWith('PI-', $document->document_number);
        $this->assertMatchesRegularExpression('/^PI-\d{4}-\d+$/', $document->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_correct_prefix_for_tax_invoice(): void
    {
        // Arrange - Update order status to paid
        $this->order->update(['status' => 'paid']);

        // Act
        $document = $this->service->generateTaxInvoice($this->order->id, $this->user->id);

        // Assert
        $this->assertStringStartsWith('INV-', $document->document_number);
        $this->assertMatchesRegularExpression('/^INV-\d{4}-\d+$/', $document->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_correct_prefix_for_purchase_order(): void
    {
        // Arrange - Update order status to awaiting_payment
        $this->order->update(['status' => 'awaiting_payment']);

        // Act
        $document = $this->service->generatePurchaseOrder($this->order->id, $this->user->id);

        // Assert
        $this->assertStringStartsWith('PO-', $document->document_number);
        $this->assertMatchesRegularExpression('/^PO-\d{4}-\d+$/', $document->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_correct_prefix_for_delivery_note(): void
    {
        // Arrange - Update order status to shipped
        $this->order->update(['status' => 'shipped']);

        // Act
        $document = $this->service->generateDeliveryNote($this->order->id, $this->user->id);

        // Assert
        $this->assertStringStartsWith('DN-', $document->document_number);
        $this->assertMatchesRegularExpression('/^DN-\d{4}-\d+$/', $document->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_correct_prefix_for_receipt(): void
    {
        // Arrange - Update order status to paid and create payment
        $this->order->update(['status' => 'paid']);
        
        \App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'amount' => 13320000,
            'status' => 'completed',
            'direction' => 'incoming',
            'payment_method' => 'bank_transfer',
        ]);

        // Act
        $document = $this->service->generateReceipt($this->order->id, $this->user->id);

        // Assert
        $this->assertStringStartsWith('RCP-', $document->document_number);
        $this->assertMatchesRegularExpression('/^RCP-\d{4}-\d+$/', $document->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_current_year(): void
    {
        // Act
        $document = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);

        // Assert
        $currentYear = date('Y');
        $this->assertStringContainsString("-{$currentYear}-", $document->document_number);
    }

    /** @test */
    public function it_generates_unique_document_numbers_for_different_document_types(): void
    {
        // Arrange - Update order status
        $this->order->update(['status' => 'paid']);
        
        \App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'amount' => 13320000,
            'status' => 'completed',
            'direction' => 'incoming',
            'payment_method' => 'bank_transfer',
        ]);

        // Act - Generate different document types
        $quotation = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);
        $proforma = $this->service->generateProformaInvoice($this->customerQuote->uuid, $this->user->id);
        $taxInvoice = $this->service->generateTaxInvoice($this->order->id, $this->user->id);
        $receipt = $this->service->generateReceipt($this->order->id, $this->user->id);

        // Assert - All document numbers should be unique
        $numbers = [
            $quotation->document_number,
            $proforma->document_number,
            $taxInvoice->document_number,
            $receipt->document_number,
        ];

        $this->assertCount(4, array_unique($numbers), 'All document numbers should be unique');
        
        // Assert - Each has correct prefix
        $this->assertStringStartsWith('QUO-', $quotation->document_number);
        $this->assertStringStartsWith('PI-', $proforma->document_number);
        $this->assertStringStartsWith('INV-', $taxInvoice->document_number);
        $this->assertStringStartsWith('RCP-', $receipt->document_number);
    }

    /** @test */
    public function it_generates_document_numbers_with_valid_format(): void
    {
        // Act
        $document = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);

        // Assert - Format should be PREFIX-YYYY-UNIQUEID
        $parts = explode('-', $document->document_number);
        
        $this->assertCount(3, $parts, 'Document number should have 3 parts separated by hyphens');
        $this->assertEquals('QUO', $parts[0], 'First part should be prefix');
        $this->assertEquals(4, strlen($parts[1]), 'Second part should be 4-digit year');
        $this->assertIsNumeric($parts[1], 'Year should be numeric');
        $this->assertGreaterThan(0, strlen($parts[2]), 'Third part should be unique ID');
        $this->assertIsNumeric($parts[2]);
    }

    /** @test */
    public function it_generates_multiple_documents_rapidly_with_unique_numbers(): void
    {
        // Act - Generate multiple documents in quick succession
        $documents = [];
        for ($i = 0; $i < 5; $i++) {
            $customerQuote = CustomerQuote::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $this->order->id,
                'vendor_quote_id' => $this->vendorQuote->id,
                'quote_number' => "CQ-2026-000{$i}",
                'status' => 'accepted',
                'vendor_total_cost' => 10000000,
                'base_profit_amount' => 2000000,
                'base_profit_percentage' => 20.0,
                'subtotal' => 12000000,
                'tax_rate' => 11.0,
                'tax_amount' => 1320000,
                'grand_total' => 13320000,
                'valid_until' => now()->addDays(7),
                'payment_terms' => 'DP 50% + Balance 50%',
                'created_by' => $this->user->id,
            ]);
            
            $documents[] = $this->service->generateQuotationPDF($customerQuote->uuid, $this->user->id);
        }

        // Assert - All document numbers should be unique
        $documentNumbers = array_map(fn($doc) => $doc->document_number, $documents);
        $uniqueNumbers = array_unique($documentNumbers);
        
        $this->assertCount(5, $uniqueNumbers, 'All 5 document numbers should be unique');
    }

    /** @test */
    public function it_stores_document_number_in_database(): void
    {
        // Act
        $document = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);

        // Assert
        $this->assertDatabaseHas('order_documents', [
            'id' => $document->id,
            'document_number' => $document->document_number,
            'document_type' => 'quotation',
        ]);
    }

    /** @test */
    public function it_generates_document_numbers_scoped_to_tenant(): void
    {
        // Arrange - Create another tenant with its own data
        $tenant2 = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant 2',
            'domain' => 'test-tenant-2',
        ]);

        $customer2 = Customer::factory()->create([
            'tenant_id' => $tenant2->id,
            'name' => 'Test Customer 2',
            'email' => 'customer2@test.com',
        ]);

        $vendor2 = Vendor::factory()->create([
            'tenant_id' => $tenant2->id,
            'name' => 'Test Vendor 2',
            'email' => 'vendor2@test.com',
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $tenant2->id,
            'customer_id' => $customer2->id,
            'order_number' => 'ORD-2026-0002',
            'status' => 'customer_quote',
        ]);

        $vendorQuote2 = VendorQuote::factory()->create([
            'tenant_id' => $tenant2->id,
            'vendor_id' => $vendor2->id,
            'amount' => 100.00,
            'status' => 'accepted',
        ]);

        $user2 = \App\Infrastructure\Persistence\Eloquent\Models\User::factory()->create([
            'tenant_id' => $tenant2->id,
        ]);

        $customerQuote2 = CustomerQuote::factory()->create([
            'tenant_id' => $tenant2->id,
            'order_id' => $order2->id,
            'vendor_quote_id' => $vendorQuote2->id,
            'quote_number' => 'CQ-2026-0002',
            'status' => 'accepted',
            'vendor_total_cost' => 10000000,
            'base_profit_amount' => 2000000,
            'base_profit_percentage' => 20.0,
            'subtotal' => 12000000,
            'tax_rate' => 11.0,
            'tax_amount' => 1320000,
            'grand_total' => 13320000,
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'DP 50% + Balance 50%',
            'created_by' => $user2->id,
        ]);

        // Act - Generate documents for both tenants
        $doc1 = $this->service->generateQuotationPDF($this->customerQuote->uuid, $this->user->id);
        $doc2 = $this->service->generateQuotationPDF($customerQuote2->uuid, $this->user->id);

        // Assert - Both documents should have unique numbers
        $this->assertNotEquals($doc1->document_number, $doc2->document_number);
        
        // Assert - Both documents are properly scoped to their tenants
        $this->assertEquals($this->tenant->id, $doc1->tenant_id);
        $this->assertEquals($tenant2->id, $doc2->tenant_id);
    }
}

