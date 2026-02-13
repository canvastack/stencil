<?php

declare(strict_types=1);

namespace Tests\Integration\Infrastructure\Services;

use App\Infrastructure\Services\Storage\FileStorageServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * File Storage Service Integration Tests
 * 
 * Tests the LaravelFileStorageService implementation with real file system operations.
 * 
 * Target: 5 tests
 * - Test file upload with valid file
 * - Test file type validation
 * - Test file size validation
 * - Test secure filename generation
 * - Test tenant-scoped directory creation
 */
class FileStorageServiceTest extends TestCase
{
    use RefreshDatabase;

    private FileStorageServiceInterface $fileStorageService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fileStorageService = app(FileStorageServiceInterface::class);

        // Fake Storage to prevent actual file system writes
        Storage::fake('public');
    }

    /** @test */
    public function it_uploads_file_with_valid_file(): void
    {
        // Arrange
        $tenantId = 1;
        $directory = 'quote-attachments';
        $file = UploadedFile::fake()->create('document.pdf', 1000); // 1MB PDF

        // Act
        $result = $this->fileStorageService->uploadFile($file, $tenantId, $directory);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('filename', $result);
        $this->assertArrayHasKey('original_filename', $result);
        $this->assertArrayHasKey('size', $result);
        $this->assertArrayHasKey('mime_type', $result);

        // Verify path structure
        $this->assertStringStartsWith("tenant_{$tenantId}/{$directory}/", $result['path']);
        
        // Verify original filename is preserved
        $this->assertEquals('document.pdf', $result['original_filename']);
        
        // Verify file size
        $this->assertEquals(1000 * 1024, $result['size']); // 1MB in bytes
        
        // Verify MIME type
        $this->assertEquals('application/pdf', $result['mime_type']);

        // Verify file was actually stored
        Storage::disk('public')->assertExists($result['path']);
    }

    /** @test */
    public function it_validates_file_type_and_rejects_invalid_types(): void
    {
        // Arrange
        $tenantId = 1;
        $directory = 'attachments';
        $invalidFile = UploadedFile::fake()->create('script.exe', 100); // Invalid file type

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('File type');

        $this->fileStorageService->uploadFile($invalidFile, $tenantId, $directory);
    }

    /** @test */
    public function it_validates_file_size_and_rejects_oversized_files(): void
    {
        // Arrange
        $tenantId = 1;
        $directory = 'attachments';
        $largeFile = UploadedFile::fake()->create('large-document.pdf', 11000); // 11MB (exceeds 10MB limit)

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('File size exceeds maximum allowed size');

        $this->fileStorageService->uploadFile($largeFile, $tenantId, $directory);
    }

    /** @test */
    public function it_generates_secure_filename_with_uuid_prefix(): void
    {
        // Arrange
        $tenantId = 1;
        $directory = 'attachments';
        $file = UploadedFile::fake()->create('my-document.pdf', 500);

        // Act
        $result = $this->fileStorageService->uploadFile($file, $tenantId, $directory);

        // Assert
        $filename = $result['filename'];
        
        // Verify filename format: {uuid}_{timestamp}.{extension}
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d+\.pdf$/',
            $filename,
            'Filename should follow UUID_timestamp.extension format'
        );

        // Verify filename is different from original
        $this->assertNotEquals('my-document.pdf', $filename);
        
        // Verify extension is preserved
        $this->assertStringEndsWith('.pdf', $filename);
    }

    /** @test */
    public function it_creates_tenant_scoped_directory_structure(): void
    {
        // Arrange
        $tenantId = 42;
        $directory = 'quote-attachments';
        $file = UploadedFile::fake()->image('photo.jpg', 100, 100); // 100x100 JPG

        // Act
        $result = $this->fileStorageService->uploadFile($file, $tenantId, $directory);

        // Assert
        $expectedPathPrefix = "tenant_{$tenantId}/{$directory}/";
        $this->assertStringStartsWith($expectedPathPrefix, $result['path']);

        // Verify file exists in the correct tenant-scoped directory
        Storage::disk('public')->assertExists($result['path']);
        
        // Verify the path structure is correct
        $pathParts = explode('/', $result['path']);
        $this->assertEquals("tenant_{$tenantId}", $pathParts[0]);
        $this->assertEquals($directory, $pathParts[1]);
        
        // Verify filename is in the third position
        $this->assertCount(3, $pathParts);
    }
}

