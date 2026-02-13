<?php

namespace Tests\Unit\Mail\Vendor;

use App\Mail\Vendor\QuoteResponseNotification;
use Tests\TestCase;

class QuoteResponseNotificationTest extends TestCase
{
    /** @test */
    public function it_has_correct_subject_for_accepted_quote(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
            'order_number' => 'ORD-2026-001',
            'quote_url' => 'https://portal.example.com/admin/quotes/123',
            'estimated_delivery_days' => 14,
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $envelope = $mailable->envelope();

        $this->assertEquals('Quote Accept - Q-2026-001', $envelope->subject);
    }

    /** @test */
    public function it_has_correct_subject_for_rejected_quote(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-002',
            'vendor_name' => 'Beta Industries',
            'order_number' => 'ORD-2026-002',
            'quote_url' => 'https://portal.example.com/admin/quotes/456',
            'rejection_reason' => 'Cannot meet delivery timeline',
        ];

        $mailable = new QuoteResponseNotification('reject', $quoteData);
        $envelope = $mailable->envelope();

        $this->assertEquals('Quote Reject - Q-2026-002', $envelope->subject);
    }

    /** @test */
    public function it_has_correct_subject_for_counter_offer(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-003',
            'vendor_name' => 'Gamma Manufacturing',
            'order_number' => 'ORD-2026-003',
            'quote_url' => 'https://portal.example.com/admin/quotes/789',
            'counter_offer_amount' => 1500000,
        ];

        $mailable = new QuoteResponseNotification('counter', $quoteData);
        $envelope = $mailable->envelope();

        $this->assertEquals('Quote Counter - Q-2026-003', $envelope->subject);
    }

    /** @test */
    public function it_uses_correct_view(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $content = $mailable->content();

        $this->assertEquals('emails.vendor.quote-response', $content->view);
    }

    /** @test */
    public function it_passes_correct_data_to_view_for_accepted_quote(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
            'order_number' => 'ORD-2026-001',
            'quote_url' => 'https://portal.example.com/admin/quotes/123',
            'estimated_delivery_days' => 14,
            'notes' => 'We can deliver within 2 weeks',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $content = $mailable->content();

        $this->assertEquals('accept', $content->with['responseType']);
        $this->assertEquals('Q-2026-001', $content->with['quoteNumber']);
        $this->assertEquals('Acme Corporation', $content->with['vendorName']);
        $this->assertEquals('ORD-2026-001', $content->with['orderNumber']);
        $this->assertEquals('https://portal.example.com/admin/quotes/123', $content->with['quoteUrl']);
        $this->assertEquals(14, $content->with['estimatedDeliveryDays']);
        $this->assertEquals('We can deliver within 2 weeks', $content->with['notes']);
    }

    /** @test */
    public function it_passes_correct_data_to_view_for_rejected_quote(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-002',
            'vendor_name' => 'Beta Industries',
            'order_number' => 'ORD-2026-002',
            'quote_url' => 'https://portal.example.com/admin/quotes/456',
            'rejection_reason' => 'Cannot meet delivery timeline',
        ];

        $mailable = new QuoteResponseNotification('reject', $quoteData);
        $content = $mailable->content();

        $this->assertEquals('reject', $content->with['responseType']);
        $this->assertEquals('Q-2026-002', $content->with['quoteNumber']);
        $this->assertEquals('Beta Industries', $content->with['vendorName']);
        $this->assertEquals('ORD-2026-002', $content->with['orderNumber']);
        $this->assertEquals('https://portal.example.com/admin/quotes/456', $content->with['quoteUrl']);
        $this->assertEquals('Cannot meet delivery timeline', $content->with['rejectionReason']);
    }

    /** @test */
    public function it_passes_correct_data_to_view_for_counter_offer(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-003',
            'vendor_name' => 'Gamma Manufacturing',
            'order_number' => 'ORD-2026-003',
            'quote_url' => 'https://portal.example.com/admin/quotes/789',
            'counter_offer_amount' => 1500000,
            'notes' => 'We can offer a better price with bulk order',
        ];

        $mailable = new QuoteResponseNotification('counter', $quoteData);
        $content = $mailable->content();

        $this->assertEquals('counter', $content->with['responseType']);
        $this->assertEquals('Q-2026-003', $content->with['quoteNumber']);
        $this->assertEquals('Gamma Manufacturing', $content->with['vendorName']);
        $this->assertEquals('ORD-2026-003', $content->with['orderNumber']);
        $this->assertEquals('https://portal.example.com/admin/quotes/789', $content->with['quoteUrl']);
        $this->assertEquals(1500000, $content->with['counterOfferAmount']);
        $this->assertEquals('We can offer a better price with bulk order', $content->with['notes']);
    }

    /** @test */
    public function it_renders_template_with_all_required_elements_for_accepted_quote(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
            'order_number' => 'ORD-2026-001',
            'quote_url' => 'https://portal.example.com/admin/quotes/123',
            'estimated_delivery_days' => 14,
            'notes' => 'We can deliver within 2 weeks',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $rendered = $mailable->render();

        // Check for key elements
        $this->assertStringContainsString('QUOTE ACCEPTED', $rendered);
        $this->assertStringContainsString('Q-2026-001', $rendered);
        $this->assertStringContainsString('Acme Corporation', $rendered);
        $this->assertStringContainsString('ORD-2026-001', $rendered);
        $this->assertStringContainsString('14 days', $rendered);
        $this->assertStringContainsString('We can deliver within 2 weeks', $rendered);
        $this->assertStringContainsString('View Quote Details', $rendered);
        $this->assertStringContainsString('https://portal.example.com/admin/quotes/123', $rendered);
    }

    /** @test */
    public function it_renders_template_with_all_required_elements_for_rejected_quote(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-002',
            'vendor_name' => 'Beta Industries',
            'order_number' => 'ORD-2026-002',
            'quote_url' => 'https://portal.example.com/admin/quotes/456',
            'rejection_reason' => 'Cannot meet delivery timeline',
        ];

        $mailable = new QuoteResponseNotification('reject', $quoteData);
        $rendered = $mailable->render();

        // Check for key elements
        $this->assertStringContainsString('QUOTE REJECTED', $rendered);
        $this->assertStringContainsString('Q-2026-002', $rendered);
        $this->assertStringContainsString('Beta Industries', $rendered);
        $this->assertStringContainsString('ORD-2026-002', $rendered);
        $this->assertStringContainsString('Cannot meet delivery timeline', $rendered);
        $this->assertStringContainsString('View Quote Details', $rendered);
        $this->assertStringContainsString('https://portal.example.com/admin/quotes/456', $rendered);
    }

    /** @test */
    public function it_renders_template_with_all_required_elements_for_counter_offer(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-003',
            'vendor_name' => 'Gamma Manufacturing',
            'order_number' => 'ORD-2026-003',
            'quote_url' => 'https://portal.example.com/admin/quotes/789',
            'counter_offer_amount' => 1500000,
            'notes' => 'We can offer a better price with bulk order',
        ];

        $mailable = new QuoteResponseNotification('counter', $quoteData);
        $rendered = $mailable->render();

        // Check for key elements
        $this->assertStringContainsString('COUNTER OFFER', $rendered);
        $this->assertStringContainsString('Q-2026-003', $rendered);
        $this->assertStringContainsString('Gamma Manufacturing', $rendered);
        $this->assertStringContainsString('ORD-2026-003', $rendered);
        $this->assertStringContainsString('1.500.000', $rendered); // Indonesian number format
        $this->assertStringContainsString('We can offer a better price with bulk order', $rendered);
        $this->assertStringContainsString('View Quote Details', $rendered);
        $this->assertStringContainsString('https://portal.example.com/admin/quotes/789', $rendered);
    }

    /** @test */
    public function it_displays_response_type_badge_prominently(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
        ];

        $acceptMailable = new QuoteResponseNotification('accept', $quoteData);
        $acceptRendered = $acceptMailable->render();
        $this->assertStringContainsString('QUOTE ACCEPTED', $acceptRendered);
        $this->assertStringContainsString('✅', $acceptRendered);

        $rejectMailable = new QuoteResponseNotification('reject', $quoteData);
        $rejectRendered = $rejectMailable->render();
        $this->assertStringContainsString('QUOTE REJECTED', $rejectRendered);
        $this->assertStringContainsString('❌', $rejectRendered);

        $counterMailable = new QuoteResponseNotification('counter', $quoteData);
        $counterRendered = $counterMailable->render();
        $this->assertStringContainsString('COUNTER OFFER', $counterRendered);
        $this->assertStringContainsString('💰', $counterRendered);
    }

    /** @test */
    public function it_includes_action_required_section(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $rendered = $mailable->render();

        $this->assertStringContainsString('Action Required', $rendered);
        $this->assertStringContainsString('Please review this vendor response', $rendered);
    }

    /** @test */
    public function it_includes_quick_actions_section(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $rendered = $mailable->render();

        $this->assertStringContainsString('Quick Actions', $rendered);
        $this->assertStringContainsString('Review the vendor\'s response details', $rendered);
    }

    /** @test */
    public function it_has_no_attachments(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $attachments = $mailable->attachments();

        $this->assertIsArray($attachments);
        $this->assertEmpty($attachments);
    }

    /** @test */
    public function it_handles_missing_optional_data_gracefully(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $content = $mailable->content();

        $this->assertEquals('N/A', $content->with['vendorName']);
        $this->assertEquals('N/A', $content->with['orderNumber']);
        $this->assertEquals('#', $content->with['quoteUrl']);
        $this->assertNull($content->with['estimatedDeliveryDays']);
        $this->assertNull($content->with['notes']);
    }

    /** @test */
    public function it_includes_pt_cex_branding(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-001',
            'vendor_name' => 'Acme Corporation',
        ];

        $mailable = new QuoteResponseNotification('accept', $quoteData);
        $rendered = $mailable->render();

        $this->assertStringContainsString('CanvaStencil', $rendered);
        $this->assertStringContainsString('Vendor Portal', $rendered);
        $this->assertStringContainsString('PT Custom Etching Xenial', $rendered);
    }

    /** @test */
    public function it_formats_counter_offer_amount_with_indonesian_format(): void
    {
        $quoteData = [
            'quote_number' => 'Q-2026-003',
            'vendor_name' => 'Gamma Manufacturing',
            'counter_offer_amount' => 1234567,
        ];

        $mailable = new QuoteResponseNotification('counter', $quoteData);
        $rendered = $mailable->render();

        // Check for Indonesian number format (1.234.567)
        $this->assertStringContainsString('1.234.567', $rendered);
    }
}
