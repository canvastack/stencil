<?php

namespace Tests\Unit\Mail\Vendor;

use App\Mail\Vendor\QuoteReminderNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteReminderNotificationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test mailable can be instantiated with required data.
     */
    public function test_mailable_can_be_instantiated(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);

        $this->assertInstanceOf(QuoteReminderNotification::class, $mailable);
        $this->assertEquals($vendorName, $mailable->vendorName);
        $this->assertEquals($quoteData, $mailable->quoteData);
        $this->assertEquals($daysRemaining, $mailable->daysRemaining);
    }

    /**
     * Test mailable has correct subject line.
     */
    public function test_mailable_has_correct_subject(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $envelope = $mailable->envelope();

        $this->assertEquals('Reminder: Quote Expiring Soon - Q-2026-001', $envelope->subject);
    }

    /**
     * Test mailable uses correct view template.
     */
    public function test_mailable_uses_correct_view(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $content = $mailable->content();

        $this->assertEquals('emails.vendor.quote-reminder', $content->view);
    }

    /**
     * Test mailable passes correct data to view.
     */
    public function test_mailable_passes_correct_data_to_view(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $content = $mailable->content();

        $this->assertArrayHasKey('vendorName', $content->with);
        $this->assertArrayHasKey('quoteNumber', $content->with);
        $this->assertArrayHasKey('orderNumber', $content->with);
        $this->assertArrayHasKey('customerName', $content->with);
        $this->assertArrayHasKey('productName', $content->with);
        $this->assertArrayHasKey('expiresAt', $content->with);
        $this->assertArrayHasKey('quoteUrl', $content->with);
        $this->assertArrayHasKey('daysRemaining', $content->with);

        $this->assertEquals('Test Vendor Co.', $content->with['vendorName']);
        $this->assertEquals('Q-2026-001', $content->with['quoteNumber']);
        $this->assertEquals('ORD-2026-001', $content->with['orderNumber']);
        $this->assertEquals('Test Customer', $content->with['customerName']);
        $this->assertEquals('Custom Etching Plate', $content->with['productName']);
        $this->assertEquals('2026-02-15 23:59:59', $content->with['expiresAt']);
        $this->assertEquals('https://example.com/vendor/quotes/uuid-123', $content->with['quoteUrl']);
        $this->assertEquals(3, $content->with['daysRemaining']);
    }

    /**
     * Test mailable handles missing quote data gracefully.
     */
    public function test_mailable_handles_missing_quote_data(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = []; // Empty quote data
        $daysRemaining = 1;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $content = $mailable->content();

        $this->assertEquals('N/A', $content->with['quoteNumber']);
        $this->assertEquals('N/A', $content->with['orderNumber']);
        $this->assertEquals('N/A', $content->with['customerName']);
        $this->assertEquals('N/A', $content->with['productName']);
        $this->assertNull($content->with['expiresAt']);
        $this->assertEquals('#', $content->with['quoteUrl']);
    }

    /**
     * Test mailable has no attachments.
     */
    public function test_mailable_has_no_attachments(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $attachments = $mailable->attachments();

        $this->assertIsArray($attachments);
        $this->assertEmpty($attachments);
    }

    /**
     * Test mailable can be rendered without errors.
     */
    public function test_mailable_can_be_rendered(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $rendered = $mailable->render();

        $this->assertIsString($rendered);
        $this->assertStringContainsString('Test Vendor Co.', $rendered);
        $this->assertStringContainsString('Q-2026-001', $rendered);
        $this->assertStringContainsString('3', $rendered);
        $this->assertStringContainsString('Days Remaining', $rendered);
    }

    /**
     * Test mailable renders correctly for 1 day remaining.
     */
    public function test_mailable_renders_correctly_for_one_day_remaining(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-12 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 1;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $rendered = $mailable->render();

        $this->assertStringContainsString('1', $rendered);
        $this->assertStringContainsString('Day Remaining', $rendered);
        $this->assertStringContainsString('This quote will expire in <strong>1 day</strong>', $rendered);
    }

    /**
     * Test mailable renders correctly for multiple days remaining.
     */
    public function test_mailable_renders_correctly_for_multiple_days_remaining(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 5;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $rendered = $mailable->render();

        $this->assertStringContainsString('5', $rendered);
        $this->assertStringContainsString('Days Remaining', $rendered);
        $this->assertStringContainsString('This quote will expire in <strong>5 days</strong>', $rendered);
    }

    /**
     * Test mailable contains all required sections.
     */
    public function test_mailable_contains_all_required_sections(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);
        $rendered = $mailable->render();

        // Check for header
        $this->assertStringContainsString('CanvaStencil', $rendered);
        $this->assertStringContainsString('Vendor Portal', $rendered);

        // Check for main heading
        $this->assertStringContainsString('Quote Expiring Soon', $rendered);

        // Check for days remaining alert
        $this->assertStringContainsString('Days Remaining', $rendered);

        // Check for quote details
        $this->assertStringContainsString('Quote Details', $rendered);
        $this->assertStringContainsString('Quote Number:', $rendered);
        $this->assertStringContainsString('Order Number:', $rendered);
        $this->assertStringContainsString('Customer:', $rendered);
        $this->assertStringContainsString('Product:', $rendered);

        // Check for urgency notice
        $this->assertStringContainsString('Urgent Action Required', $rendered);

        // Check for response options
        $this->assertStringContainsString('Response Options', $rendered);
        $this->assertStringContainsString('Accept:', $rendered);
        $this->assertStringContainsString('Reject:', $rendered);
        $this->assertStringContainsString('Counter Offer:', $rendered);

        // Check for CTA button
        $this->assertStringContainsString('Respond Now', $rendered);
        $this->assertStringContainsString($quoteData['quote_url'], $rendered);

        // Check for expiration consequences
        $this->assertStringContainsString('What Happens if the Quote Expires?', $rendered);

        // Check for extension option
        $this->assertStringContainsString('Need More Time?', $rendered);

        // Check for performance reminder
        $this->assertStringContainsString('Performance Reminder', $rendered);

        // Check for footer
        $this->assertStringContainsString('This is an automated reminder', $rendered);
        $this->assertStringContainsString('CanvaStencil Team', $rendered);
    }

    /**
     * Test mailable uses queueable trait.
     */
    public function test_mailable_uses_queueable_trait(): void
    {
        $vendorName = 'Test Vendor Co.';
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'customer_name' => 'Test Customer',
            'product_name' => 'Custom Etching Plate',
            'expires_at' => '2026-02-15 23:59:59',
            'quote_url' => 'https://example.com/vendor/quotes/uuid-123',
        ];
        $daysRemaining = 3;

        $mailable = new QuoteReminderNotification($vendorName, $quoteData, $daysRemaining);

        $this->assertObjectHasProperty('connection', $mailable);
        $this->assertObjectHasProperty('queue', $mailable);
    }
}
