<?php

namespace Tests\Unit\Mail\Vendor;

use Tests\TestCase;
use App\Mail\Vendor\NewQuoteNotification;

/**
 * Test NewQuoteNotification Mailable
 * 
 * Requirements: 7.4, 7.5, 7.6, 7.7
 */
class NewQuoteNotificationTest extends TestCase
{
    /** @test */
    public function it_has_correct_subject_with_quote_number(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $envelope = $mailable->envelope();

        // Assert
        $this->assertStringContainsString('New Quote Request', $envelope->subject);
        $this->assertStringContainsString('Q-2026-001', $envelope->subject);
    }

    /** @test */
    public function it_uses_correct_view(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('emails.vendor.new-quote', $content->view);
    }

    /** @test */
    public function it_passes_correct_data_to_view(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $content = $mailable->content();

        // Assert
        $this->assertArrayHasKey('vendorName', $content->with);
        $this->assertArrayHasKey('quoteNumber', $content->with);
        $this->assertArrayHasKey('orderNumber', $content->with);
        $this->assertArrayHasKey('customerName', $content->with);
        $this->assertArrayHasKey('productName', $content->with);
        $this->assertArrayHasKey('expiresAt', $content->with);
        $this->assertArrayHasKey('quoteUrl', $content->with);
        
        $this->assertEquals($vendorName, $content->with['vendorName']);
        $this->assertEquals('Q-2026-001', $content->with['quoteNumber']);
        $this->assertEquals('ORD-2026-001', $content->with['orderNumber']);
        $this->assertEquals('John Doe', $content->with['customerName']);
        $this->assertEquals('Custom Etching Plate', $content->with['productName']);
        $this->assertEquals('2026-02-20 17:00:00', $content->with['expiresAt']);
        $this->assertEquals('https://portal.example.com/vendor/quotes/123', $content->with['quoteUrl']);
    }

    /** @test */
    public function it_renders_template_with_all_required_elements(): void
    {
        // Arrange
        $vendorName = 'Test Vendor Company';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $rendered = $mailable->render();

        // Assert - Check for PT CEX branding
        $this->assertStringContainsString('CanvaStencil', $rendered);
        $this->assertStringContainsString('Vendor Portal', $rendered);
        
        // Assert - Check for quote details
        $this->assertStringContainsString('Q-2026-001', $rendered);
        $this->assertStringContainsString('ORD-2026-001', $rendered);
        $this->assertStringContainsString('John Doe', $rendered);
        $this->assertStringContainsString('Custom Etching Plate', $rendered);
        
        // Assert - Check for expiration date prominently displayed
        $this->assertStringContainsString('Expiration Date', $rendered);
        $this->assertStringContainsString('February', $rendered); // Date should be formatted
        
        // Assert - Check for direct link to quote
        $this->assertStringContainsString('https://portal.example.com/vendor/quotes/123', $rendered);
        $this->assertStringContainsString('View Quote Request', $rendered);
        
        // Assert - Check for action required section
        $this->assertStringContainsString('Action Required', $rendered);
        $this->assertStringContainsString('Accept', $rendered);
        $this->assertStringContainsString('Reject', $rendered);
        $this->assertStringContainsString('Counter Offer', $rendered);
    }

    /** @test */
    public function it_includes_vendor_name_in_greeting(): void
    {
        // Arrange
        $vendorName = 'Acme Corporation';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $rendered = $mailable->render();

        // Assert
        $this->assertStringContainsString($vendorName, $rendered);
        $this->assertStringContainsString('Dear', $rendered);
    }

    /** @test */
    public function it_displays_expiration_warning_prominently(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $rendered = $mailable->render();

        // Assert - Check for prominent expiration warning
        $this->assertStringContainsString('Expiration Date', $rendered);
        $this->assertStringContainsString('respond before this date', $rendered);
        
        // Assert - Check for warning styling (yellow background)
        $this->assertStringContainsString('#fef3c7', $rendered); // Yellow background color
        $this->assertStringContainsString('#f59e0b', $rendered); // Orange border color
    }

    /** @test */
    public function it_includes_quick_tips_section(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $rendered = $mailable->render();

        // Assert
        $this->assertStringContainsString('Quick Tips', $rendered);
        $this->assertStringContainsString('product specifications', $rendered);
        $this->assertStringContainsString('message thread', $rendered);
        $this->assertStringContainsString('performance rating', $rendered);
    }

    /** @test */
    public function it_has_no_attachments(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'John Doe',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-20 17:00:00',
            'quote_url' => 'https://portal.example.com/vendor/quotes/123',
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $attachments = $mailable->attachments();

        // Assert
        $this->assertIsArray($attachments);
        $this->assertEmpty($attachments);
    }

    /** @test */
    public function it_handles_missing_optional_data_gracefully(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            // Missing optional fields
        ];

        // Act
        $mailable = new NewQuoteNotification($vendorName, $quoteData);
        $content = $mailable->content();

        // Assert - Should use default values
        $this->assertEquals('N/A', $content->with['orderNumber']);
        $this->assertEquals('N/A', $content->with['customerName']);
        $this->assertEquals('N/A', $content->with['productName']);
        $this->assertNull($content->with['expiresAt']);
        $this->assertEquals('#', $content->with['quoteUrl']);
    }
}
