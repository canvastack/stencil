<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Storage;

use Illuminate\Http\UploadedFile;

/**
 * File Storage Service Interface
 * 
 * Defines contract for file storage operations in the vendor portal.
 * Handles file uploads, validation, and tenant-scoped storage.
 */
interface FileStorageServiceInterface
{
    /**
     * Upload a file with validation
     * 
     * @param UploadedFile $file File to upload
     * @param int $tenantId Tenant ID for scoped storage
     * @param string $directory Subdirectory within tenant storage (e.g., 'quote-attachments')
     * @return array File information ['path' => string, 'url' => string, 'filename' => string, 'size' => int, 'mime_type' => string]
     * @throws \InvalidArgumentException If file validation fails
     */
    public function uploadFile(UploadedFile $file, int $tenantId, string $directory = 'attachments'): array;

    /**
     * Delete a file
     * 
     * @param string $path File path relative to storage root
     * @param int $tenantId Tenant ID for security check
     * @return bool True if deleted successfully
     */
    public function deleteFile(string $path, int $tenantId): bool;

    /**
     * Get public URL for a file
     * 
     * @param string $path File path relative to storage root
     * @return string Public URL to access the file
     */
    public function getFileUrl(string $path): string;

    /**
     * Check if file exists
     * 
     * @param string $path File path relative to storage root
     * @return bool True if file exists
     */
    public function fileExists(string $path): bool;

    /**
     * Get file size in bytes
     * 
     * @param string $path File path relative to storage root
     * @return int File size in bytes
     */
    public function getFileSize(string $path): int;

    /**
     * Validate file before upload
     * 
     * @param UploadedFile $file File to validate
     * @return void
     * @throws \InvalidArgumentException If validation fails
     */
    public function validateFile(UploadedFile $file): void;
}
