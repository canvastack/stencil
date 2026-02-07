<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Entities;

use App\Domain\Quote\Entities\Message;
use App\Domain\Quote\Events\MessageSent;
use Tests\TestCase;

/**
 * Property 28: Messages Store Complete Metadata
 * 
 * Validates: Requirements 9.2
 * 
 * For any message sent in a quote thread, the message should be stored with 
 * content, sender_id, timestamp, and attachments array.
 * 
 * Feature: quote-workflow-fixes
 * Property: 28
 */
class MessageStoragePropertyTest extends TestCase
{
    /**
     * @test
     * Property 28: Messages store complete metadata
     * 
     * This property verifies that when a message is created, all required
     * metadata is properly stored and accessible.
     */
    public function property_messages_store_complete_metadata(): void
    {
        // Run property test with multiple iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random but valid message data
            $tenantId = fake()->numberBetween(1, 1000);
            $quoteId = fake()->numberBetween(1, 10000);
            $senderId = fake()->numberBetween(1, 1000);
            $messageContent = fake()->sentence(10);
            
            // Generate random attachments (0-3 attachments)
            $attachmentCount = fake()->numberBetween(0, 3);
            $attachments = [];
            for ($j = 0; $j < $attachmentCount; $j++) {
                $attachments[] = [
                    'name' => fake()->word() . '.pdf',
                    'path' => 'attachments/' . fake()->uuid() . '.pdf',
                    'size' => fake()->numberBetween(1000, 5 * 1024 * 1024), // 1KB to 5MB
                    'mime_type' => 'application/pdf'
                ];
            }

            // Create message
            $message = Message::create(
                tenantId: $tenantId,
                quoteId: $quoteId,
                senderId: $senderId,
                message: $messageContent,
                attachments: $attachments
            );

            // Property: Message stores tenant_id
            $this->assertEquals(
                $tenantId,
                $message->getTenantId(),
                "Message should store tenant_id (iteration {$i})"
            );

            // Property: Message stores quote_id
            $this->assertEquals(
                $quoteId,
                $message->getQuoteId(),
                "Message should store quote_id (iteration {$i})"
            );

            // Property: Message stores sender_id
            $this->assertEquals(
                $senderId,
                $message->getSenderId(),
                "Message should store sender_id (iteration {$i})"
            );

            // Property: Message stores content
            $this->assertEquals(
                $messageContent,
                $message->getMessage(),
                "Message should store message content (iteration {$i})"
            );

            // Property: Message stores attachments array
            $this->assertEquals(
                $attachments,
                $message->getAttachments(),
                "Message should store attachments array (iteration {$i})"
            );

            // Property: Message has UUID
            $this->assertNotEmpty(
                $message->getUuid(),
                "Message should have UUID (iteration {$i})"
            );
            $this->assertMatchesRegularExpression(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                $message->getUuid(),
                "Message UUID should be valid format (iteration {$i})"
            );

            // Property: Message has created_at timestamp
            $this->assertInstanceOf(
                \DateTimeImmutable::class,
                $message->getCreatedAt(),
                "Message should have created_at timestamp (iteration {$i})"
            );

            // Property: Message has updated_at timestamp
            $this->assertInstanceOf(
                \DateTimeImmutable::class,
                $message->getUpdatedAt(),
                "Message should have updated_at timestamp (iteration {$i})"
            );

            // Property: Message is initially unread
            $this->assertNull(
                $message->getReadAt(),
                "Message should be initially unread (iteration {$i})"
            );
            $this->assertFalse(
                $message->isRead(),
                "Message isRead() should return false initially (iteration {$i})"
            );

            // Property: Message attachment count matches
            $this->assertEquals(
                $attachmentCount,
                $message->getAttachmentCount(),
                "Message attachment count should match (iteration {$i})"
            );

            // Property: Message hasAttachments() is correct
            $expectedHasAttachments = $attachmentCount > 0;
            $this->assertEquals(
                $expectedHasAttachments,
                $message->hasAttachments(),
                "Message hasAttachments() should return correct value (iteration {$i})"
            );

            // Property: Message emits MessageSent domain event
            $events = $message->getDomainEvents();
            $this->assertCount(
                1,
                $events,
                "Message should emit exactly one domain event (iteration {$i})"
            );
            $this->assertInstanceOf(
                MessageSent::class,
                $events[0],
                "Message should emit MessageSent event (iteration {$i})"
            );
        }
    }

    /**
     * @test
     * Property 28: Message metadata persists through reconstitution
     * 
     * This property verifies that when a message is reconstituted from
     * persistence data, all metadata is preserved correctly.
     */
    public function property_message_metadata_persists_through_reconstitution(): void
    {
        // Run property test with multiple iterations
        for ($i = 0; $i < 50; $i++) {
            // Generate random message data
            $id = fake()->numberBetween(1, 100000);
            $uuid = fake()->uuid();
            $tenantId = fake()->numberBetween(1, 1000);
            $quoteId = fake()->numberBetween(1, 10000);
            $senderId = fake()->numberBetween(1, 1000);
            $messageContent = fake()->sentence(10);
            
            // Generate random attachments
            $attachmentCount = fake()->numberBetween(0, 3);
            $attachments = [];
            for ($j = 0; $j < $attachmentCount; $j++) {
                $attachments[] = [
                    'name' => fake()->word() . '.pdf',
                    'path' => 'attachments/' . fake()->uuid() . '.pdf',
                    'size' => fake()->numberBetween(1000, 5 * 1024 * 1024),
                    'mime_type' => 'application/pdf'
                ];
            }

            // Random read status
            $readAt = fake()->boolean() 
                ? new \DateTimeImmutable(fake()->dateTimeBetween('-1 week', 'now')->format('Y-m-d H:i:s'))
                : null;

            $createdAt = new \DateTimeImmutable(fake()->dateTimeBetween('-1 month', '-1 day')->format('Y-m-d H:i:s'));
            $updatedAt = new \DateTimeImmutable(fake()->dateTimeBetween($createdAt->format('Y-m-d H:i:s'), 'now')->format('Y-m-d H:i:s'));

            // Reconstitute message
            $message = Message::reconstitute(
                id: $id,
                uuid: $uuid,
                tenantId: $tenantId,
                quoteId: $quoteId,
                senderId: $senderId,
                message: $messageContent,
                attachments: $attachments,
                readAt: $readAt,
                createdAt: $createdAt,
                updatedAt: $updatedAt
            );

            // Property: All metadata is preserved
            $this->assertEquals($id, $message->getId(), "ID should be preserved (iteration {$i})");
            $this->assertEquals($uuid, $message->getUuid(), "UUID should be preserved (iteration {$i})");
            $this->assertEquals($tenantId, $message->getTenantId(), "Tenant ID should be preserved (iteration {$i})");
            $this->assertEquals($quoteId, $message->getQuoteId(), "Quote ID should be preserved (iteration {$i})");
            $this->assertEquals($senderId, $message->getSenderId(), "Sender ID should be preserved (iteration {$i})");
            $this->assertEquals($messageContent, $message->getMessage(), "Message content should be preserved (iteration {$i})");
            $this->assertEquals($attachments, $message->getAttachments(), "Attachments should be preserved (iteration {$i})");
            $this->assertEquals($readAt, $message->getReadAt(), "Read timestamp should be preserved (iteration {$i})");
            $this->assertEquals($createdAt, $message->getCreatedAt(), "Created timestamp should be preserved (iteration {$i})");
            $this->assertEquals($updatedAt, $message->getUpdatedAt(), "Updated timestamp should be preserved (iteration {$i})");

            // Property: Read status is correct
            $expectedIsRead = $readAt !== null;
            $this->assertEquals(
                $expectedIsRead,
                $message->isRead(),
                "Read status should match readAt presence (iteration {$i})"
            );

            // Property: Reconstituted messages don't emit domain events
            $this->assertEmpty(
                $message->getDomainEvents(),
                "Reconstituted message should not have domain events (iteration {$i})"
            );
        }
    }

    /**
     * @test
     * Property 28: Message with empty content is rejected
     * 
     * This property verifies that messages with empty or whitespace-only
     * content are rejected.
     */
    public function property_message_with_empty_content_is_rejected(): void
    {
        $emptyStrings = [
            '',
            ' ',
            '  ',
            "\t",
            "\n",
            "   \t\n   "
        ];

        foreach ($emptyStrings as $index => $emptyString) {
            $this->expectException(\InvalidArgumentException::class);
            $this->expectExceptionMessage('Message content cannot be empty');

            try {
                Message::create(
                    tenantId: 1,
                    quoteId: 1,
                    senderId: 1,
                    message: $emptyString,
                    attachments: []
                );
            } catch (\InvalidArgumentException $e) {
                // Verify exception message
                $this->assertEquals(
                    'Message content cannot be empty',
                    $e->getMessage(),
                    "Empty string at index {$index} should be rejected with correct message"
                );
                throw $e; // Re-throw for expectException
            }
        }
    }

    /**
     * @test
     * Property 28: Message content is trimmed
     * 
     * This property verifies that message content is trimmed of leading
     * and trailing whitespace.
     */
    public function property_message_content_is_trimmed(): void
    {
        for ($i = 0; $i < 20; $i++) {
            $coreContent = fake()->sentence(5);
            $whitespace = str_repeat(' ', fake()->numberBetween(1, 5));
            
            // Add random whitespace before and after
            $messageWithWhitespace = $whitespace . $coreContent . $whitespace;

            $message = Message::create(
                tenantId: 1,
                quoteId: 1,
                senderId: 1,
                message: $messageWithWhitespace,
                attachments: []
            );

            // Property: Content should be trimmed
            $this->assertEquals(
                $coreContent,
                $message->getMessage(),
                "Message content should be trimmed (iteration {$i})"
            );
        }
    }
}

