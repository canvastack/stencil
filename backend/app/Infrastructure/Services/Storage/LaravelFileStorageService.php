<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Storage;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Laravel File Storage Service
 * 
 * Implementation of FileStorageServiceInterface using Laravel Storage facade.
 * Handles file uploads with validation, tenant-scoped storage, and secure filename generation.
 * 
 * Business Rules:
 * - Max file size: 10MB
 * - Allowed MIME types: pdf, jpg, jpeg, png, doc, docx, xls, xlsx
 * - Files stored in tenant-scoped directories: tenant_{id}/{directory}/{filename}
 * - Secure filenames generated with UUID prefix
 * - All operations logged for audit trail
 */
class LaravelFileStorageService implements FileStorageServiceInterface
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    
    private const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    private const ALLOWED_EXTENSIONS = [
        'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'
    ];

    /**
     * Upload a file with validation
     * 
     * @param UploadedFile $file
     * @param int $tenantId
     * @param string $directory
     * @return array
     * @throws \InvalidArgumentException
     */
    public function uploadFile(UploadedFile $file, int $tenantId, string $directory = 'attachments'): array
    {
        // Validate file
        $this->validateFile($file);

        // Generate secure filename
        $secureFilename = $this->generateSecureFilename($file);

        // Build tenant-scoped path
        $tenantPath = "tenant_{$tenantId}/{$directory}";
        
        try {
            // Store file
            $path = Storage::disk('public')->putFileAs(
                $tenantPath,
                $file,
                $secureFilename
            );

            // Get file information
            $fileInfo = [
                'path' => $path,
                'url' => Storage::disk('public')->url($path),
                'filename' => $secureFilename,
                'original_filename' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ];

            Log::info('File uploaded successfully', [
                'tenant_id' => $tenantId,
                'path' => $path,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType()
            ]);

            return $fileInfo;

        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'tenant_id' => $tenantId,
                'directory' => $directory,
                'error' => $e->getMessage()
            ]);

            throw new \RuntimeException('Failed to upload file: ' . $e->getMessage());
        }
    }

    /**
     * Delete a file
     * 
     * @param string $path
     * @param int $tenantId
     * @return bool
     */
    public function deleteFile(string $path, int $tenantId): bool
    {
        // Security check: ensure path belongs to tenant
        if (!str_starts_with($path, "tenant_{$tenantId}/")) {
            Log::warning('Attempted to delete file from different tenant', [
                'tenant_id' => $tenantId,
                'path' => $path
            ]);
            return false;
        }

        try {
            $deleted = Storage::disk('public')->delete($path);

            if ($deleted) {
                Log::info('File deleted successfully', [
                    'tenant_id' => $tenantId,
                    'path' => $path
                ]);
            }

            return $deleted;

        } catch (\Exception $e) {
            Log::error('File deletion failed', [
                'tenant_id' => $tenantId,
                'path' => $path,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Get public URL for a file
     * 
     * @param string $path
     * @return string
     */
    public function getFileUrl(string $path): string
    {
        return Storage::disk('public')->url($path);
    }

    /**
     * Check if file exists
     * 
     * @param string $path
     * @return bool
     */
    public function fileExists(string $path): bool
    {
        return Storage::disk('public')->exists($path);
    }

    /**
     * Get file size in bytes
     * 
     * @param string $path
     * @return int
     */
    public function getFileSize(string $path): int
    {
        return Storage::disk('public')->size($path);
    }

    /**
     * Validate file before upload
     * 
     * @param UploadedFile $file
     * @return void
     * @throws \InvalidArgumentException
     */
    public function validateFile(UploadedFile $file): void
    {
        // Check if file is valid
        if (!$file->isValid()) {
            throw new \InvalidArgumentException('Invalid file upload');
        }

        // Check file size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException(
                sprintf('File size exceeds maximum allowed size of %d MB', self::MAX_FILE_SIZE / 1024 / 1024)
            );
        }

        // Check MIME type
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
            throw new \InvalidArgumentException(
                sprintf('File type "%s" is not allowed. Allowed types: %s', 
                    $mimeType, 
                    implode(', ', self::ALLOWED_EXTENSIONS)
                )
            );
        }

        // Check file extension
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
            throw new \InvalidArgumentException(
                sprintf('File extension "%s" is not allowed. Allowed extensions: %s', 
                    $extension, 
                    implode(', ', self::ALLOWED_EXTENSIONS)
                )
            );
        }
    }

    /**
     * Generate secure filename with UUID prefix
     * 
     * @param UploadedFile $file
     * @return string
     */
    private function generateSecureFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $uuid = Str::uuid()->toString();
        $timestamp = time();
        
        // Format: {uuid}_{timestamp}.{extension}
        return "{$uuid}_{$timestamp}.{$extension}";
    }
}
