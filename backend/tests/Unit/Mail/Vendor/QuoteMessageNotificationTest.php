<?php

namespace Tests\Unit\Mail\Vendor;

use App\Mail\Vendor\QuoteMessageNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteMessageNotificationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_mailable_with_admin_recipient_type(): void
    {
        // Arrange
        $messageData = [
            'recipient_name' => 'Admin User',
            'sender_name' => 'Vendor Company',
            'sender_type' => 'vendor',
            'quote_number' => 'Q-2026-001',
            'order_number' => 'ORD-2026-001',
            'message_preview' => 'I have a question about...',
            'message_content' => 'I have a question about the specifications for this order.',
            'has_attachments' => false,
            'attachment_count' => 0,
            'quote_url' => 'https://example.com/admin/quotes/123',
            'sent_at' => '2026-02-11 10:00:00',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);

        // Assert
        $this->assertEquals('admin', $mailable->recipientType);
        $this->assertEquals($messageData, $mailable->messageData);
    }

    /** @test */
    public function it_creates_mailable_with_vendor_recipient_type(): void
    {
        // Arrange
        $messageData = [
            'recipient_name' => 'Vendor Company',
            'sender_name' => 'Admin User',
            'sender_type' => 'admin',
            'quote_number' => 'Q-2026-002',
            'order_number' => 'ORD-2026-002',
            'message_preview' => 'Please provide additional...',
            'message_content' => 'Please provide additional details about your delivery timeline.',
            'has_attachments' => true,
            'attachment_count' => 2,
            'quote_url' => 'https://example.com/vendor/quotes/456',
            'sent_at' => '2026-02-11 11:00:00',
        ];

        // Act
        $mailable = new QuoteMessageNotification('vendor', $messageData);

        // Assert
        $this->assertEquals('vendor', $mailable->recipientType);
        $this->assertEquals($messageData, $mailable->messageData);
    }

    /** @test */
    public function it_generates_correct_subject_line(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Vendor Company',
            'quote_number' => 'Q-2026-003',
            'order_number' => 'ORD-2026-003',
            'message_content' => 'Test message',
            'quote_url' => 'https://example.com/quotes/789',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $envelope = $mailable->envelope();

        // Assert
        $this->assertEquals('New Message on Quote Q-2026-003 from Vendor Company', $envelope->subject);
    }

    /** @test */
    public function it_generates_subject_with_default_values_when_data_missing(): void
    {
        // Arrange
        $messageData = [
            'message_content' => 'Test message',
            'quote_url' => 'https://example.com/quotes/789',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $envelope = $mailable->envelope();

        // Assert
        $this->assertEquals('New Message on Quote N/A from Unknown', $envelope->subject);
    }

    /** @test */
    public function it_uses_correct_blade_template(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-004',
            'message_content' => 'Test message',
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('emails.vendor.quote-message', $content->view);
    }

    /** @test */
    public function it_passes_all_required_data_to_view(): void
    {
        // Arrange
        $messageData = [
            'recipient_name' => 'John Admin',
            'sender_name' => 'Vendor ABC',
            'sender_type' => 'vendor',
            'quote_number' => 'Q-2026-005',
            'order_number' => 'ORD-2026-005',
            'message_preview' => 'Short preview',
            'message_content' => 'Full message content here',
            'has_attachments' => true,
            'attachment_count' => 3,
            'quote_url' => 'https://example.com/quotes/test',
            'sent_at' => '2026-02-11 12:00:00',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('admin', $content->with['recipientType']);
        $this->assertEquals('John Admin', $content->with['recipientName']);
        $this->assertEquals('Vendor ABC', $content->with['senderName']);
        $this->assertEquals('vendor', $content->with['senderType']);
        $this->assertEquals('Q-2026-005', $content->with['quoteNumber']);
        $this->assertEquals('ORD-2026-005', $content->with['orderNumber']);
        $this->assertEquals('Short preview', $content->with['messagePreview']);
        $this->assertEquals('Full message content here', $content->with['messageContent']);
        $this->assertTrue($content->with['hasAttachments']);
        $this->assertEquals(3, $content->with['attachmentCount']);
        $this->assertEquals('https://example.com/quotes/test', $content->with['quoteUrl']);
        $this->assertEquals('2026-02-11 12:00:00', $content->with['sentAt']);
    }

    /** @test */
    public function it_provides_default_values_for_missing_data(): void
    {
        // Arrange
        $messageData = []; // Empty data

        // Act
        $mailable = new QuoteMessageNotification('vendor', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('vendor', $content->with['recipientType']);
        $this->assertEquals('User', $content->with['recipientName']);
        $this->assertEquals('Unknown', $content->with['senderName']);
        $this->assertEquals('unknown', $content->with['senderType']);
        $this->assertEquals('N/A', $content->with['quoteNumber']);
        $this->assertEquals('N/A', $content->with['orderNumber']);
        $this->assertEquals('', $content->with['messagePreview']);
        $this->assertEquals('', $content->with['messageContent']);
        $this->assertFalse($content->with['hasAttachments']);
        $this->assertEquals(0, $content->with['attachmentCount']);
        $this->assertEquals('#', $content->with['quoteUrl']);
        $this->assertNotNull($content->with['sentAt']);
    }

    /** @test */
    public function it_handles_message_without_attachments(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-006',
            'message_content' => 'Message without attachments',
            'has_attachments' => false,
            'attachment_count' => 0,
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertFalse($content->with['hasAttachments']);
        $this->assertEquals(0, $content->with['attachmentCount']);
    }

    /** @test */
    public function it_handles_message_with_single_attachment(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-007',
            'message_content' => 'Message with one attachment',
            'has_attachments' => true,
            'attachment_count' => 1,
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('vendor', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertTrue($content->with['hasAttachments']);
        $this->assertEquals(1, $content->with['attachmentCount']);
    }

    /** @test */
    public function it_handles_message_with_multiple_attachments(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-008',
            'message_content' => 'Message with multiple attachments',
            'has_attachments' => true,
            'attachment_count' => 5,
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertTrue($content->with['hasAttachments']);
        $this->assertEquals(5, $content->with['attachmentCount']);
    }

    /** @test */
    public function it_returns_empty_attachments_array(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-009',
            'message_content' => 'Test message',
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $attachments = $mailable->attachments();

        // Assert
        $this->assertIsArray($attachments);
        $this->assertEmpty($attachments);
    }

    /** @test */
    public function it_can_be_queued(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-010',
            'message_content' => 'Test message',
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);

        // Assert - Check that Queueable trait is used
        $this->assertContains('Illuminate\Bus\Queueable', class_uses($mailable));
    }

    /** @test */
    public function it_serializes_models(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-011',
            'message_content' => 'Test message',
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('vendor', $messageData);

        // Assert - Check that SerializesModels trait is used
        $this->assertContains('Illuminate\Queue\SerializesModels', class_uses($mailable));
    }

    /** @test */
    public function it_handles_admin_sender_type(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Admin User',
            'sender_type' => 'admin',
            'quote_number' => 'Q-2026-012',
            'message_content' => 'Admin message',
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('vendor', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('admin', $content->with['senderType']);
    }

    /** @test */
    public function it_handles_vendor_sender_type(): void
    {
        // Arrange
        $messageData = [
            'sender_name' => 'Vendor Company',
            'sender_type' => 'vendor',
            'quote_number' => 'Q-2026-013',
            'message_content' => 'Vendor message',
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('vendor', $content->with['senderType']);
    }

    /** @test */
    public function it_handles_long_message_content(): void
    {
        // Arrange
        $longMessage = str_repeat('This is a very long message content. ', 100);
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-014',
            'message_content' => $longMessage,
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals($longMessage, $content->with['messageContent']);
    }

    /** @test */
    public function it_handles_special_characters_in_message(): void
    {
        // Arrange
        $messageWithSpecialChars = 'Message with special chars: <>&"\'';
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-015',
            'message_content' => $messageWithSpecialChars,
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('vendor', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals($messageWithSpecialChars, $content->with['messageContent']);
    }

    /** @test */
    public function it_handles_multiline_message_content(): void
    {
        // Arrange
        $multilineMessage = "Line 1\nLine 2\nLine 3";
        $messageData = [
            'sender_name' => 'Test Sender',
            'quote_number' => 'Q-2026-016',
            'message_content' => $multilineMessage,
            'quote_url' => 'https://example.com/quotes/test',
        ];

        // Act
        $mailable = new QuoteMessageNotification('admin', $messageData);
        $content = $mailable->content();

        // Assert
        $this->assertEquals($multilineMessage, $content->with['messageContent']);
    }
}
