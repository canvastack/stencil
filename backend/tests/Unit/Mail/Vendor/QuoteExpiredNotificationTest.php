<?php

namespace Tests\Unit\Mail\Vendor;

use App\Mail\Vendor\QuoteExpiredNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteExpiredNotificationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_vendor_notification_with_correct_data(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'vendor_name' => 'ABC Manufacturing',
            'expires_at' => '2026-02-15 10:00:00',
            'portal_url' => 'https://example.com/vendor/dashboard',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('vendor', $quoteData);

        // Assert
        $this->assertEquals('vendor', $mailable->recipient);
        $this->assertEquals($quoteData, $mailable->quoteData);
    }

    /** @test */
    public function it_creates_admin_notification_with_correct_data(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-002',
            'order_number' => 'ORD-2026-002',
            'customer_name' => 'Jane Smith',
            'product_name' => 'Metal Engraving',
            'vendor_name' => 'XYZ Suppliers',
            'expires_at' => '2026-02-16 15:30:00',
            'quote_url' => 'https://example.com/admin/quotes/123',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('admin', $quoteData);

        // Assert
        $this->assertEquals('admin', $mailable->recipient);
        $this->assertEquals($quoteData, $mailable->quoteData);
    }

    /** @test */
    public function it_has_correct_subject_for_vendor(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-003',
            'order_number' => 'ORD-2026-003',
            'customer_name' => 'Test Customer',
            'product_name' => 'Test Product',
            'vendor_name' => 'Test Vendor',
            'expires_at' => '2026-02-17 12:00:00',
            'portal_url' => 'https://example.com/vendor/dashboard',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('vendor', $quoteData);
        $envelope = $mailable->envelope();

        // Assert
        $this->assertEquals('Quote Expired - Q-2026-003', $envelope->subject);
    }

    /** @test */
    public function it_has_correct_subject_for_admin(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-004',
            'order_number' => 'ORD-2026-004',
            'customer_name' => 'Another Customer',
            'product_name' => 'Another Product',
            'vendor_name' => 'Another Vendor',
            'expires_at' => '2026-02-18 09:00:00',
            'quote_url' => 'https://example.com/admin/quotes/456',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('admin', $quoteData);
        $envelope = $mailable->envelope();

        // Assert
        $this->assertEquals('Quote Expired - Q-2026-004', $envelope->subject);
    }

    /** @test */
    public function it_uses_vendor_template_for_vendor_recipient(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-005',
            'order_number' => 'ORD-2026-005',
            'customer_name' => 'Vendor Test',
            'product_name' => 'Vendor Product',
            'vendor_name' => 'Vendor Company',
            'expires_at' => '2026-02-19 14:00:00',
            'portal_url' => 'https://example.com/vendor/dashboard',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('vendor', $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('emails.vendor.quote-expired-vendor', $content->view);
    }

    /** @test */
    public function it_uses_admin_template_for_admin_recipient(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-006',
            'order_number' => 'ORD-2026-006',
            'customer_name' => 'Admin Test',
            'product_name' => 'Admin Product',
            'vendor_name' => 'Admin Vendor',
            'expires_at' => '2026-02-20 11:00:00',
            'quote_url' => 'https://example.com/admin/quotes/789',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('admin', $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('emails.vendor.quote-expired-admin', $content->view);
    }

    /** @test */
    public function it_passes_correct_data_to_vendor_view(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-007',
            'order_number' => 'ORD-2026-007',
            'customer_name' => 'View Test Customer',
            'product_name' => 'View Test Product',
            'vendor_name' => 'View Test Vendor',
            'expires_at' => '2026-02-21 16:00:00',
            'portal_url' => 'https://example.com/vendor/dashboard',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('vendor', $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertArrayHasKey('quoteNumber', $content->with);
        $this->assertArrayHasKey('orderNumber', $content->with);
        $this->assertArrayHasKey('customerName', $content->with);
        $this->assertArrayHasKey('productName', $content->with);
        $this->assertArrayHasKey('vendorName', $content->with);
        $this->assertArrayHasKey('expiresAt', $content->with);
        $this->assertArrayHasKey('portalUrl', $content->with);
        
        $this->assertEquals('Q-2026-007', $content->with['quoteNumber']);
        $this->assertEquals('ORD-2026-007', $content->with['orderNumber']);
        $this->assertEquals('View Test Customer', $content->with['customerName']);
        $this->assertEquals('View Test Product', $content->with['productName']);
        $this->assertEquals('View Test Vendor', $content->with['vendorName']);
        $this->assertEquals('2026-02-21 16:00:00', $content->with['expiresAt']);
        $this->assertEquals('https://example.com/vendor/dashboard', $content->with['portalUrl']);
    }

    /** @test */
    public function it_passes_correct_data_to_admin_view(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-008',
            'order_number' => 'ORD-2026-008',
            'customer_name' => 'Admin View Customer',
            'product_name' => 'Admin View Product',
            'vendor_name' => 'Admin View Vendor',
            'expires_at' => '2026-02-22 13:00:00',
            'quote_url' => 'https://example.com/admin/quotes/999',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('admin', $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertArrayHasKey('quoteNumber', $content->with);
        $this->assertArrayHasKey('orderNumber', $content->with);
        $this->assertArrayHasKey('customerName', $content->with);
        $this->assertArrayHasKey('productName', $content->with);
        $this->assertArrayHasKey('vendorName', $content->with);
        $this->assertArrayHasKey('expiresAt', $content->with);
        $this->assertArrayHasKey('quoteUrl', $content->with);
        
        $this->assertEquals('Q-2026-008', $content->with['quoteNumber']);
        $this->assertEquals('ORD-2026-008', $content->with['orderNumber']);
        $this->assertEquals('Admin View Customer', $content->with['customerName']);
        $this->assertEquals('Admin View Product', $content->with['productName']);
        $this->assertEquals('Admin View Vendor', $content->with['vendorName']);
        $this->assertEquals('2026-02-22 13:00:00', $content->with['expiresAt']);
        $this->assertEquals('https://example.com/admin/quotes/999', $content->with['quoteUrl']);
    }

    /** @test */
    public function it_handles_missing_quote_data_gracefully(): void
    {
        // Arrange
        $quoteData = []; // Empty data

        // Act
        $mailable = new QuoteExpiredNotification('vendor', $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('N/A', $content->with['quoteNumber']);
        $this->assertEquals('N/A', $content->with['orderNumber']);
        $this->assertEquals('N/A', $content->with['customerName']);
        $this->assertEquals('N/A', $content->with['productName']);
        $this->assertEquals('N/A', $content->with['vendorName']);
        $this->assertNull($content->with['expiresAt']);
    }

    /** @test */
    public function it_has_no_attachments(): void
    {
        // Arrange
        $quoteData = [
            'quote_number' => 'Q-2026-009',
            'order_number' => 'ORD-2026-009',
            'customer_name' => 'Attachment Test',
            'product_name' => 'Attachment Product',
            'vendor_name' => 'Attachment Vendor',
            'expires_at' => '2026-02-23 10:00:00',
            'portal_url' => 'https://example.com/vendor/dashboard',
        ];

        // Act
        $mailable = new QuoteExpiredNotification('vendor', $quoteData);
        $attachments = $mailable->attachments();

        // Assert
        $this->assertIsArray($attachments);
        $this->assertEmpty($attachments);
    }
}
