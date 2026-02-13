<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\ValueObjects;

use PHPUnit\Framework\TestCase;
use App\Domain\Quote\ValueObjects\MessageAttachment;
use InvalidArgumentException;

/**
 * MessageAttachment Value Object Tests
 * 
 * Tests the MessageAttachment value object for file attachments.
 * Covers: file validation (size, MIME type), helper methods, serialization.
 * 
 * Requirements: 13.7, 13.8, 23.1
 */
class MessageAttachmentTest extends TestCase
{
    /** @test */
    public function it_creates_valid_attachment(): void
    {
        // Arrange & Act
        $attachment = new MessageAttachment(
            filename: 'document.pdf',
            url: '/storage/attachments/document.pdf',
            size: 1024000, // 1MB
            mimeType: 'application/pdf'
        );
        
        // Assert
        $this->assertEquals('document.pdf', $attachment->filename());
        $this->assertEquals('/storage/attachments/document.pdf', $attachment->url());
        $this->assertEquals(1024000, $attachment->size());
        $this->assertEquals('application/pdf', $attachment->mimeType());
    }

    /** @test */
    public function it_throws_exception_for_file_size_exceeding_10mb(): void
    {
        // Arrange
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('File size cannot exceed');
        
        // Act
        new MessageAttachment(
            filename: 'large-file.pdf',
            url: '/storage/attachments/large-file.pdf',
            size: 11 * 1024 * 1024, // 11MB
            mimeType: 'application/pdf'
        );
    }

    /** @test */
    public function it_throws_exception_for_invalid_mime_type(): void
    {
        // Arrange
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid MIME type');
        
        // Act
        new MessageAttachment(
            filename: 'script.exe',
            url: '/storage/attachments/script.exe',
            size: 1024,
            mimeType: 'application/x-msdownload'
        );
    }

    /** @test */
    public function it_accepts_pdf_mime_type(): void
    {
        // Arrange & Act
        $attachment = new MessageAttachment(
            filename: 'document.pdf',
            url: '/storage/attachments/document.pdf',
            size: 1024,
            mimeType: 'application/pdf'
        );
        
        // Assert
        $this->assertTrue($attachment->isPdf());
        $this->assertFalse($attachment->isImage());
        $this->assertFalse($attachment->isDocument());
        $this->assertFalse($attachment->isSpreadsheet());
    }

    /** @test */
    public function it_accepts_image_mime_types(): void
    {
        // Arrange & Act
        $jpg = new MessageAttachment('image.jpg', '/storage/image.jpg', 1024, 'image/jpeg');
        $png = new MessageAttachment('image.png', '/storage/image.png', 1024, 'image/png');
        
        // Assert
        $this->assertTrue($jpg->isImage());
        $this->assertTrue($png->isImage());
        $this->assertFalse($jpg->isPdf());
        $this->assertFalse($png->isPdf());
    }

    /** @test */
    public function it_accepts_document_mime_types(): void
    {
        // Arrange & Act
        $doc = new MessageAttachment('document.doc', '/storage/document.doc', 1024, 'application/msword');
        $docx = new MessageAttachment('document.docx', '/storage/document.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        
        // Assert
        $this->assertTrue($doc->isDocument());
        $this->assertTrue($docx->isDocument());
        $this->assertFalse($doc->isPdf());
        $this->assertFalse($docx->isImage());
    }

    /** @test */
    public function it_accepts_spreadsheet_mime_types(): void
    {
        // Arrange & Act
        $xls = new MessageAttachment('spreadsheet.xls', '/storage/spreadsheet.xls', 1024, 'application/vnd.ms-excel');
        $xlsx = new MessageAttachment('spreadsheet.xlsx', '/storage/spreadsheet.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        // Assert
        $this->assertTrue($xls->isSpreadsheet());
        $this->assertTrue($xlsx->isSpreadsheet());
        $this->assertFalse($xls->isPdf());
        $this->assertFalse($xlsx->isImage());
    }

    /** @test */
    public function it_converts_size_to_megabytes(): void
    {
        // Arrange
        $attachment = new MessageAttachment(
            filename: 'document.pdf',
            url: '/storage/document.pdf',
            size: 5242880, // 5MB in bytes
            mimeType: 'application/pdf'
        );
        
        // Act & Assert
        $this->assertEquals(5.0, $attachment->sizeInMB());
    }

    /** @test */
    public function it_serializes_to_array(): void
    {
        // Arrange
        $attachment = new MessageAttachment(
            filename: 'document.pdf',
            url: '/storage/attachments/document.pdf',
            size: 1024000,
            mimeType: 'application/pdf'
        );
        
        // Act
        $array = $attachment->toArray();
        
        // Assert
        $this->assertIsArray($array);
        $this->assertEquals('document.pdf', $array['filename']);
        $this->assertEquals('/storage/attachments/document.pdf', $array['url']);
        $this->assertEquals(1024000, $array['size']);
        $this->assertEquals('application/pdf', $array['mime_type']);
    }

    /** @test */
    public function it_deserializes_from_array(): void
    {
        // Arrange
        $data = [
            'filename' => 'document.pdf',
            'url' => '/storage/attachments/document.pdf',
            'size' => 1024000,
            'mime_type' => 'application/pdf'
        ];
        
        // Act
        $attachment = MessageAttachment::fromArray($data);
        
        // Assert
        $this->assertEquals('document.pdf', $attachment->filename());
        $this->assertEquals('/storage/attachments/document.pdf', $attachment->url());
        $this->assertEquals(1024000, $attachment->size());
        $this->assertEquals('application/pdf', $attachment->mimeType());
    }

    /** @test */
    public function it_accepts_exactly_10mb_file(): void
    {
        // Arrange & Act
        $attachment = new MessageAttachment(
            filename: 'max-size.pdf',
            url: '/storage/max-size.pdf',
            size: 10 * 1024 * 1024, // Exactly 10MB
            mimeType: 'application/pdf'
        );
        
        // Assert
        $this->assertEquals(10.0, $attachment->sizeInMB());
    }
}
