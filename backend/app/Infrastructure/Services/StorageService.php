<?php

namespace App\Infrastructure\Services;

use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Storage Service for Document Management
 * 
 * Handles file storage for customer quote documents
 * Supports local storage and cloud storage (S3/DigitalOcean Spaces)
 */
class StorageService
{
    private string $disk;
    private string $basePath;

    public function __construct()
    {
        // Use 'public' disk for local development, 's3' for production
        $this->disk = config('filesystems.default', 'public');
        $this->basePath = 'documents/customer-quotes';
    }

    /**
     * Store document file
     */
    public function storeDocument(
        string $content,
        string $filename,
        int $tenantId,
        string $documentType
    ): array {
        try {
            // Generate unique filename
            $uniqueFilename = $this->generateUniqueFilename($filename, $tenantId, $documentType);
            
            // Build full path
            $path = "{$this->basePath}/{$tenantId}/{$documentType}/{$uniqueFilename}";
            
            // Store file
            Storage::disk($this->disk)->put($path, $content);
            
            // Get file size
            $fileSize = Storage::disk($this->disk)->size($path);
            
            // Get public URL
            $url = $this->getPublicUrl($path);
            
            Log::info('Document stored successfully', [
                'tenant_id' => $tenantId,
                'document_type' => $documentType,
                'filename' => $uniqueFilename,
                'path' => $path,
                'size' => $fileSize,
            ]);

            return [
                'path' => $path,
                'url' => $url,
                'filename' => $uniqueFilename,
                'size' => $fileSize,
                'disk' => $this->disk,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to store document', [
                'tenant_id' => $tenantId,
                'document_type' => $documentType,
                'filename' => $filename,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get document content
     */
    public function getDocument(string $path): string
    {
        try {
            if (!Storage::disk($this->disk)->exists($path)) {
                throw new \Exception("Document not found: {$path}");
            }

            return Storage::disk($this->disk)->get($path);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve document', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete document
     */
    public function deleteDocument(string $path): bool
    {
        try {
            if (!Storage::disk($this->disk)->exists($path)) {
                Log::warning('Document not found for deletion', ['path' => $path]);
                return false;
            }

            Storage::disk($this->disk)->delete($path);
            
            Log::info('Document deleted successfully', ['path' => $path]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete document', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Check if document exists
     */
    public function documentExists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }

    /**
     * Get document size
     */
    public function getDocumentSize(string $path): int
    {
        try {
            if (!Storage::disk($this->disk)->exists($path)) {
                throw new \Exception("Document not found: {$path}");
            }

            return Storage::disk($this->disk)->size($path);
        } catch (\Exception $e) {
            Log::error('Failed to get document size', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Get public URL for document
     */
    public function getPublicUrl(string $path): string
    {
        if ($this->disk === 's3' || $this->disk === 'spaces') {
            // For cloud storage, use the URL method
            return Storage::disk($this->disk)->url($path);
        }

        // For local storage, generate URL
        return url(Storage::disk($this->disk)->url($path));
    }

    /**
     * Generate temporary signed URL (for private documents)
     */
    public function getTemporaryUrl(string $path, int $expirationMinutes = 60): string
    {
        try {
            if ($this->disk === 's3' || $this->disk === 'spaces') {
                return Storage::disk($this->disk)->temporaryUrl(
                    $path,
                    now()->addMinutes($expirationMinutes)
                );
            }

            // For local storage, return regular URL
            return $this->getPublicUrl($path);
        } catch (\Exception $e) {
            Log::error('Failed to generate temporary URL', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Copy document to new location
     */
    public function copyDocument(string $sourcePath, string $destinationPath): bool
    {
        try {
            if (!Storage::disk($this->disk)->exists($sourcePath)) {
                throw new \Exception("Source document not found: {$sourcePath}");
            }

            Storage::disk($this->disk)->copy($sourcePath, $destinationPath);
            
            Log::info('Document copied successfully', [
                'source' => $sourcePath,
                'destination' => $destinationPath,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to copy document', [
                'source' => $sourcePath,
                'destination' => $destinationPath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Move document to new location
     */
    public function moveDocument(string $sourcePath, string $destinationPath): bool
    {
        try {
            if (!Storage::disk($this->disk)->exists($sourcePath)) {
                throw new \Exception("Source document not found: {$sourcePath}");
            }

            Storage::disk($this->disk)->move($sourcePath, $destinationPath);
            
            Log::info('Document moved successfully', [
                'source' => $sourcePath,
                'destination' => $destinationPath,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to move document', [
                'source' => $sourcePath,
                'destination' => $destinationPath,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Generate unique filename
     */
    private function generateUniqueFilename(
        string $originalFilename,
        int $tenantId,
        string $documentType
    ): string {
        $extension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        $basename = pathinfo($originalFilename, PATHINFO_FILENAME);
        
        // Sanitize filename
        $basename = Str::slug($basename);
        
        // Add timestamp and random string for uniqueness
        $timestamp = now()->format('YmdHis');
        $random = Str::random(8);
        
        return "{$basename}_{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Clean up old documents (for scheduled cleanup job)
     */
    public function cleanupOldDocuments(int $daysOld = 90): int
    {
        try {
            $deletedCount = 0;
            $cutoffDate = now()->subDays($daysOld);
            
            // Get all files in the base path
            $files = Storage::disk($this->disk)->allFiles($this->basePath);
            
            foreach ($files as $file) {
                $lastModified = Storage::disk($this->disk)->lastModified($file);
                
                if ($lastModified < $cutoffDate->timestamp) {
                    Storage::disk($this->disk)->delete($file);
                    $deletedCount++;
                }
            }
            
            Log::info('Old documents cleaned up', [
                'days_old' => $daysOld,
                'deleted_count' => $deletedCount,
            ]);
            
            return $deletedCount;
        } catch (\Exception $e) {
            Log::error('Failed to cleanup old documents', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
