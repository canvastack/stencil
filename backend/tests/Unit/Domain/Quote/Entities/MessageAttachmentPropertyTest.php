<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\Entities;

use App\Domain\Quote\Entities\Message;
use App\Domain\Quote\Exceptions\InvalidAttachmentException;
use Tests\TestCase;

/**
 * Property 31: File Attachments Validate Size
 * 
 * Feature: quote-workflow-fixes
 * Task: 9.3 Write property test for file size validation
 * 
 * Validates: Requirements 9.7
 * 
 * Property: For any file attachment on a message, if the file size exceeds 10MB,
 * the system should return a validation error and prevent the upload.
 */
class MessageAttachmentPropertyTest extends TestCase
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    /**
     * Property 31: File Attachments Validate Size
     * 
     * Test that attachments exceeding 10MB are rejected.
     */
    public function test_property_31_file_attachments_validate_size(): void
    {
        $iterations = 20;
        
        for ($i = 0; $i < $iterations; $i++) {
            $tenantId = rand(1, 1000);
            $quoteId = rand(1, 1000);
            $senderId = rand(1, 1000);
            $message = "Test message {$i}";

            // Test: File exactly at 10MB limit should pass
            $validAttachment = [
                'name' => 'document.pdf',
                'path' => 'attachments/document.pdf',
                'size' => self::MAX_FILE_SIZE,
                'mime_type' => 'application/pdf'
            ];

            $messageEntity = Message::create(
                tenantId: $tenantId,
                quoteId: $quoteId,
                senderId: $senderId,
                message: $message,
                attachments: [$validAttachment]
            );

            $this->assertNotNull($messageEntity);
            $this->assertCount(1, $messageEntity->getAttachments());

            // Test: File exceeding 10MB should fail
            $oversizedAttachment = [
                'name' => 'large_file.pdf',
                'path' => 'attachments/large_file.pdf',
                'size' => self::MAX_FILE_SIZE + 1, // 1 byte over limit
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$oversizedAttachment]
                );
                
                $this->fail('Expected InvalidAttachmentException for oversized file');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('10MB', $e->getMessage());
                $this->assertStringContainsString('large_file.pdf', $e->getMessage());
            }

            // Test: Multiple files with total size over limit but each under limit should pass
            $multipleValidAttachments = [
                [
                    'name' => 'file1.pdf',
                    'path' => 'attachments/file1.pdf',
                    'size' => 5 * 1024 * 1024, // 5MB
                    'mime_type' => 'application/pdf'
                ],
                [
                    'name' => 'file2.pdf',
                    'path' => 'attachments/file2.pdf',
                    'size' => 5 * 1024 * 1024, // 5MB
                    'mime_type' => 'application/pdf'
                ]
            ];

            $messageWithMultiple = Message::create(
                tenantId: $tenantId,
                quoteId: $quoteId,
                senderId: $senderId,
                message: $message,
                attachments: $multipleValidAttachments
            );

            $this->assertCount(2, $messageWithMultiple->getAttachments());

            // Test: One valid file and one oversized file should fail
            $mixedAttachments = [
                [
                    'name' => 'valid.pdf',
                    'path' => 'attachments/valid.pdf',
                    'size' => 1 * 1024 * 1024, // 1MB
                    'mime_type' => 'application/pdf'
                ],
                [
                    'name' => 'oversized.pdf',
                    'path' => 'attachments/oversized.pdf',
                    'size' => self::MAX_FILE_SIZE + 1000, // Over limit
                    'mime_type' => 'application/pdf'
                ]
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: $mixedAttachments
                );
                
                $this->fail('Expected InvalidAttachmentException for mixed attachments with oversized file');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('oversized.pdf', $e->getMessage());
            }
        }
    }

    /**
     * Property 31b: Attachment Metadata Validation
     * 
     * Test that attachments with missing or invalid metadata are rejected.
     */
    public function test_property_31b_attachment_metadata_validation(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            $tenantId = rand(1, 1000);
            $quoteId = rand(1, 1000);
            $senderId = rand(1, 1000);
            $message = "Test message {$i}";

            // Test: Missing 'name' field
            $missingName = [
                'path' => 'attachments/file.pdf',
                'size' => 1024,
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$missingName]
                );
                
                $this->fail('Expected InvalidAttachmentException for missing name field');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('name', $e->getMessage());
            }

            // Test: Missing 'path' field
            $missingPath = [
                'name' => 'file.pdf',
                'size' => 1024,
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$missingPath]
                );
                
                $this->fail('Expected InvalidAttachmentException for missing path field');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('path', $e->getMessage());
            }

            // Test: Missing 'size' field
            $missingSize = [
                'name' => 'file.pdf',
                'path' => 'attachments/file.pdf',
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$missingSize]
                );
                
                $this->fail('Expected InvalidAttachmentException for missing size field');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('size', $e->getMessage());
            }

            // Test: Missing 'mime_type' field
            $missingMimeType = [
                'name' => 'file.pdf',
                'path' => 'attachments/file.pdf',
                'size' => 1024
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$missingMimeType]
                );
                
                $this->fail('Expected InvalidAttachmentException for missing mime_type field');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('mime_type', $e->getMessage());
            }

            // Test: Invalid size (negative)
            $invalidSize = [
                'name' => 'file.pdf',
                'path' => 'attachments/file.pdf',
                'size' => -1,
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$invalidSize]
                );
                
                $this->fail('Expected InvalidAttachmentException for invalid size');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('size', $e->getMessage());
            }

            // Test: Invalid size (zero)
            $zeroSize = [
                'name' => 'file.pdf',
                'path' => 'attachments/file.pdf',
                'size' => 0,
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$zeroSize]
                );
                
                $this->fail('Expected InvalidAttachmentException for zero size');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('size', $e->getMessage());
            }

            // Test: Empty name
            $emptyName = [
                'name' => '',
                'path' => 'attachments/file.pdf',
                'size' => 1024,
                'mime_type' => 'application/pdf'
            ];

            try {
                Message::create(
                    tenantId: $tenantId,
                    quoteId: $quoteId,
                    senderId: $senderId,
                    message: $message,
                    attachments: [$emptyName]
                );
                
                $this->fail('Expected InvalidAttachmentException for empty name');
            } catch (InvalidAttachmentException $e) {
                $this->assertStringContainsString('name', $e->getMessage());
            }
        }
    }

    /**
     * Property 31c: Valid Attachments Are Stored
     * 
     * Test that valid attachments are properly stored with all metadata.
     */
    public function test_property_31c_valid_attachments_are_stored(): void
    {
        $iterations = 10;
        
        for ($i = 0; $i < $iterations; $i++) {
            $tenantId = rand(1, 1000);
            $quoteId = rand(1, 1000);
            $senderId = rand(1, 1000);
            $message = "Test message {$i}";

            $validAttachments = [
                [
                    'name' => 'document.pdf',
                    'path' => 'attachments/document.pdf',
                    'size' => 2 * 1024 * 1024, // 2MB
                    'mime_type' => 'application/pdf'
                ],
                [
                    'name' => 'image.jpg',
                    'path' => 'attachments/image.jpg',
                    'size' => 500 * 1024, // 500KB
                    'mime_type' => 'image/jpeg'
                ],
                [
                    'name' => 'spreadsheet.xlsx',
                    'path' => 'attachments/spreadsheet.xlsx',
                    'size' => 1 * 1024 * 1024, // 1MB
                    'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]
            ];

            $messageEntity = Message::create(
                tenantId: $tenantId,
                quoteId: $quoteId,
                senderId: $senderId,
                message: $message,
                attachments: $validAttachments
            );

            $this->assertCount(3, $messageEntity->getAttachments());
            $this->assertTrue($messageEntity->hasAttachments());
            $this->assertEquals(3, $messageEntity->getAttachmentCount());

            $storedAttachments = $messageEntity->getAttachments();
            
            // Verify all attachments are stored with complete metadata
            foreach ($validAttachments as $index => $expected) {
                $this->assertEquals($expected['name'], $storedAttachments[$index]['name']);
                $this->assertEquals($expected['path'], $storedAttachments[$index]['path']);
                $this->assertEquals($expected['size'], $storedAttachments[$index]['size']);
                $this->assertEquals($expected['mime_type'], $storedAttachments[$index]['mime_type']);
            }
        }
    }
}
