<?php

namespace Tests\Feature\CustomerQuote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Application\CustomerQuote\Services\PaymentTrackingService;

class PaymentDocumentLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected User $user;
    protected Customer $customer;
    protected Order $order;
    protected CustomerQuote $quote;
    protected PaymentTrackingService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        // Create user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 1000000, // 10,000 IDR
            'down_payment_amount' => 500000, // 5,000 IDR (50%)
            'down_payment_due_at' => now()->addDays(7),
        ]);

        // Create vendor for vendor quote
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor quote (required for customer quote)
        $vendorQuote = \App\Infrastructure\Persistence\Eloquent\Models\VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'amount' => 800.00,
            'status' => 'accepted',
        ]);

        // Create customer quote
        $this->quote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $vendorQuote->id,
            'created_by' => $this->user->id,
            'grand_total' => 1000000,
            'status' => 'accepted',
        ]);

        $this->service = app(PaymentTrackingService::class);
    }

    /** @test */
    public function it_can_generate_proforma_invoice_for_payment_transaction()
    {
        // Create payment transaction
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'pending',
            'amount' => 500000,
            'currency' => 'IDR',
            'reference' => "DP-{$this->quote->quote_number}",
            'due_at' => now()->addDays(7),
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
                'quote_number' => $this->quote->quote_number,
                'payment_type' => 'down_payment',
                'percentage' => 50,
            ],
        ]);

        // Generate proforma invoice
        $document = $this->service->generateProformaInvoice($transaction, $this->user->id);

        // Assert document created
        $this->assertInstanceOf(OrderDocument::class, $document);
        $this->assertEquals('proforma_invoice', $document->document_type);
        $this->assertEquals($this->order->id, $document->order_id);
        $this->assertEquals($this->quote->id, $document->customer_quote_id);
        $this->assertEquals($transaction->id, $document->payment_id);
        $this->assertStringStartsWith('PI-', $document->document_number);
        $this->assertEquals('draft', $document->status);
        $this->assertEquals($this->user->id, $document->generated_by);
        $this->assertEquals('customer', $document->recipient_type);
        $this->assertEquals($this->customer->id, $document->recipient_id);

        // Assert metadata
        $this->assertEquals('down_payment', $document->metadata['payment_type']);
        $this->assertEquals(500000, $document->metadata['payment_amount']);
        $this->assertEquals(50, $document->metadata['payment_percentage']);
        $this->assertEquals($this->quote->quote_number, $document->metadata['quote_number']);

        // Assert transaction metadata updated
        $transaction->refresh();
        $this->assertArrayHasKey('proforma_invoice_id', $transaction->metadata);
        $this->assertEquals($document->id, $transaction->metadata['proforma_invoice_id']);
        $this->assertEquals($document->uuid, $transaction->metadata['proforma_invoice_uuid']);

        // Assert quote history updated
        $this->quote->refresh();
        $history = $this->quote->history;
        $lastHistory = end($history);
        $this->assertEquals('proforma_invoice_generated', $lastHistory['action']);
        $this->assertEquals($document->id, $lastHistory['details']['document_id']);
    }

    /** @test */
    public function it_can_generate_receipt_for_completed_payment()
    {
        // Create completed payment transaction
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'completed',
            'amount' => 500000,
            'currency' => 'IDR',
            'method' => 'bank_transfer',
            'reference' => "DP-{$this->quote->quote_number}",
            'paid_at' => now(),
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
                'quote_number' => $this->quote->quote_number,
                'payment_type' => 'down_payment',
            ],
        ]);

        // Generate receipt
        $document = $this->service->generateReceipt($transaction, $this->user->id);

        // Assert document created
        $this->assertInstanceOf(OrderDocument::class, $document);
        $this->assertEquals('receipt', $document->document_type);
        $this->assertEquals($this->order->id, $document->order_id);
        $this->assertEquals($this->quote->id, $document->customer_quote_id);
        $this->assertEquals($transaction->id, $document->payment_id);
        $this->assertStringStartsWith('RCP-', $document->document_number);
        $this->assertEquals('draft', $document->status);

        // Assert metadata
        $this->assertEquals('down_payment', $document->metadata['payment_type']);
        $this->assertEquals(500000, $document->metadata['payment_amount']);
        $this->assertEquals('bank_transfer', $document->metadata['payment_method']);
        $this->assertEquals($transaction->reference, $document->metadata['payment_reference']);

        // Assert transaction metadata updated
        $transaction->refresh();
        $this->assertArrayHasKey('receipt_id', $transaction->metadata);
        $this->assertEquals($document->id, $transaction->metadata['receipt_id']);
    }

    /** @test */
    public function it_cannot_generate_receipt_for_pending_payment()
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Can only generate receipt for completed payments');

        // Create pending payment transaction
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'pending',
            'amount' => 500000,
            'currency' => 'IDR',
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
            ],
        ]);

        // Try to generate receipt - should fail
        $this->service->generateReceipt($transaction, $this->user->id);
    }

    /** @test */
    public function it_can_get_payment_documents()
    {
        // Create payment transaction
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'completed',
            'amount' => 500000,
            'currency' => 'IDR',
            'method' => 'bank_transfer',
            'paid_at' => now(),
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
            ],
        ]);

        // Generate proforma invoice
        $invoice = $this->service->generateProformaInvoice($transaction, $this->user->id);

        // Generate receipt
        $receipt = $this->service->generateReceipt($transaction, $this->user->id);

        // Get payment documents
        $documents = $this->service->getPaymentDocuments($transaction);

        // Assert documents returned
        $this->assertCount(2, $documents);
        
        // Check that both document types exist
        $documentTypes = array_column($documents, 'document_type');
        $this->assertContains('receipt', $documentTypes);
        $this->assertContains('proforma_invoice', $documentTypes);
        
        $this->assertArrayHasKey('uuid', $documents[0]);
        $this->assertArrayHasKey('document_number', $documents[0]);
        $this->assertArrayHasKey('status', $documents[0]);
    }

    /** @test */
    public function it_can_link_existing_document_to_payment()
    {
        // Create payment transaction
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'pending',
            'amount' => 500000,
            'currency' => 'IDR',
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
            ],
        ]);

        // Create existing document without payment link
        $document = OrderDocument::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_quote_id' => $this->quote->id,
            'document_type' => 'quotation',
            'document_number' => 'QT-2026-0001',
            'document_date' => now(),
            'title' => 'Test Quotation',
            'file_url' => 'https://example.com/quote.pdf',
            'file_size' => 1024,
            'file_type' => 'application/pdf',
            'status' => 'sent',
            'generated_by' => $this->user->id,
        ]);

        // Link document to payment
        $linkedDocument = $this->service->linkDocumentToPayment($document, $transaction);

        // Assert document linked
        $this->assertEquals($transaction->id, $linkedDocument->payment_id);

        // Assert transaction metadata updated
        $transaction->refresh();
        $this->assertArrayHasKey('linked_documents', $transaction->metadata);
        $this->assertCount(1, $transaction->metadata['linked_documents']);
        $this->assertEquals($document->id, $transaction->metadata['linked_documents'][0]['document_id']);
        $this->assertEquals('quotation', $transaction->metadata['linked_documents'][0]['document_type']);
    }

    /** @test */
    public function it_cannot_link_document_from_different_order()
    {
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Document and payment transaction must belong to same order');

        // Create another order
        $anotherOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        // Create payment transaction for first order
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'pending',
            'amount' => 500000,
            'currency' => 'IDR',
        ]);

        // Create document for different order
        $document = OrderDocument::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $anotherOrder->id,
            'document_type' => 'quotation',
            'document_number' => 'QT-2026-0001',
            'document_date' => now(),
            'title' => 'Test Quotation',
            'file_url' => 'https://example.com/quote.pdf',
            'file_size' => 1024,
            'file_type' => 'application/pdf',
            'status' => 'sent',
            'generated_by' => $this->user->id,
        ]);

        // Try to link - should fail
        $this->service->linkDocumentToPayment($document, $transaction);
    }

    /** @test */
    public function it_generates_unique_document_numbers_per_type()
    {
        // Create payment transaction
        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'completed',
            'amount' => 500000,
            'currency' => 'IDR',
            'method' => 'bank_transfer',
            'paid_at' => now(),
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
            ],
        ]);

        // Generate multiple documents
        $invoice1 = $this->service->generateProformaInvoice($transaction, $this->user->id);
        $receipt1 = $this->service->generateReceipt($transaction, $this->user->id);

        // Create another transaction
        $transaction2 = OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_balance',
            'status' => 'completed',
            'amount' => 500000,
            'currency' => 'IDR',
            'method' => 'bank_transfer',
            'paid_at' => now(),
            'metadata' => [
                'customer_quote_id' => $this->quote->id,
            ],
        ]);

        $invoice2 = $this->service->generateProformaInvoice($transaction2, $this->user->id);
        $receipt2 = $this->service->generateReceipt($transaction2, $this->user->id);

        // Assert unique numbers per type
        $this->assertNotEquals($invoice1->document_number, $invoice2->document_number);
        $this->assertNotEquals($receipt1->document_number, $receipt2->document_number);

        // Assert sequential numbering
        $this->assertStringEndsWith('0001', $invoice1->document_number);
        $this->assertStringEndsWith('0002', $invoice2->document_number);
        $this->assertStringEndsWith('0001', $receipt1->document_number);
        $this->assertStringEndsWith('0002', $receipt2->document_number);
    }
}
