<?php

namespace App\Application\VendorProduction\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;

/**
 * Production Photo Service
 * 
 * Handles photo upload, thumbnail generation, and storage for production updates.
 */
class ProductionPhotoService
{
    private string $disk;
    private string $basePath = 'production-updates';
    private int $maxFileSize = 5120; // 5MB in KB
    private array $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    private int $thumbnailWidth = 300;
    private int $thumbnailHeight = 300;

    public function __construct()
    {
        $this->disk = config('filesystems.default', 'local');
    }

    /**
     * Upload and process a photo
     * 
     * @param UploadedFile $file
     * @param int $tenantId
     * @param string|null $caption
     * @return array Photo data
     * @throws \Exception
     */
    public function uploadPhoto(UploadedFile $file, int $tenantId, ?string $caption = null): array
    {
        try {
            // Validate file
            $this->validateFile($file);

            // Generate unique filename
            $photoId = Str::uuid()->toString();
            $extension = $file->getClientOriginalExtension();
            $filename = "{$photoId}.{$extension}";
            $thumbnailFilename = "thumb-{$photoId}.{$extension}";

            // Define paths
            $tenantPath = "{$this->basePath}/tenant-{$tenantId}";
            $photoPath = "{$tenantPath}/{$filename}";
            $thumbnailPath = "{$tenantPath}/{$thumbnailFilename}";

            // Store original photo
            $file->storeAs($tenantPath, $filename, $this->disk);

            // Generate and store thumbnail
            $this->generateThumbnail($file, $tenantPath, $thumbnailFilename);

            Log::info('[ProductionPhotoService] Photo uploaded', [
                'photo_id' => $photoId,
                'tenant_id' => $tenantId,
                'size' => $file->getSize(),
            ]);

            return [
                'id' => $photoId,
                'url' => Storage::disk($this->disk)->url($photoPath),
                'thumbnail_url' => Storage::disk($this->disk)->url($thumbnailPath),
                'caption' => $caption,
                'uploaded_at' => now()->toISOString(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ];
        } catch (\Exception $e) {
            Log::error('[ProductionPhotoService] Upload failed', [
                'error' => $e->getMessage(),
                'tenant_id' => $tenantId,
            ]);
            throw $e;
        }
    }

    /**
     * Upload multiple photos
     * 
     * @param array $files Array of UploadedFile
     * @param int $tenantId
     * @param array $captions Optional captions indexed by file key
     * @return array Array of photo data
     */
    public function uploadMultiplePhotos(array $files, int $tenantId, array $captions = []): array
    {
        $photos = [];

        foreach ($files as $key => $file) {
            if ($file instanceof UploadedFile) {
                $caption = $captions[$key] ?? null;
                $photos[] = $this->uploadPhoto($file, $tenantId, $caption);
            }
        }

        return $photos;
    }

    /**
     * Delete a photo
     * 
     * @param string $photoId
     * @param int $tenantId
     * @return bool
     */
    public function deletePhoto(string $photoId, int $tenantId): bool
    {
        try {
            $tenantPath = "{$this->basePath}/tenant-{$tenantId}";
            
            // Find files with this photo ID
            $files = Storage::disk($this->disk)->files($tenantPath);
            $deleted = false;

            foreach ($files as $file) {
                if (str_contains($file, $photoId)) {
                    Storage::disk($this->disk)->delete($file);
                    $deleted = true;
                }
            }

            if ($deleted) {
                Log::info('[ProductionPhotoService] Photo deleted', [
                    'photo_id' => $photoId,
                    'tenant_id' => $tenantId,
                ]);
            }

            return $deleted;
        } catch (\Exception $e) {
            Log::error('[ProductionPhotoService] Delete failed', [
                'error' => $e->getMessage(),
                'photo_id' => $photoId,
            ]);
            return false;
        }
    }

    /**
     * Delete multiple photos
     * 
     * @param array $photoIds
     * @param int $tenantId
     * @return int Number of photos deleted
     */
    public function deleteMultiplePhotos(array $photoIds, int $tenantId): int
    {
        $count = 0;

        foreach ($photoIds as $photoId) {
            if ($this->deletePhoto($photoId, $tenantId)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Validate uploaded file
     * 
     * @param UploadedFile $file
     * @throws \Exception
     */
    private function validateFile(UploadedFile $file): void
    {
        // Check file size
        if ($file->getSize() > ($this->maxFileSize * 1024)) {
            throw new \Exception("File size exceeds maximum allowed size of {$this->maxFileSize}KB");
        }

        // Check mime type
        if (!in_array($file->getMimeType(), $this->allowedMimes)) {
            throw new \Exception('Invalid file type. Only JPEG and PNG images are allowed');
        }

        // Check if file is valid image
        if (!@getimagesize($file->getRealPath())) {
            throw new \Exception('File is not a valid image');
        }
    }

    /**
     * Generate thumbnail for photo
     * 
     * @param UploadedFile $file
     * @param string $path
     * @param string $filename
     */
    private function generateThumbnail(UploadedFile $file, string $path, string $filename): void
    {
        try {
            // Check if Intervention Image is available
            if (!class_exists(Image::class)) {
                Log::warning('[ProductionPhotoService] Intervention Image not available, skipping thumbnail');
                return;
            }

            $image = Image::make($file->getRealPath());
            
            // Resize maintaining aspect ratio
            $image->fit($this->thumbnailWidth, $this->thumbnailHeight, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            // Save thumbnail
            $thumbnailPath = storage_path("app/{$this->disk}/{$path}/{$filename}");
            $image->save($thumbnailPath, 80); // 80% quality

        } catch (\Exception $e) {
            Log::warning('[ProductionPhotoService] Thumbnail generation failed', [
                'error' => $e->getMessage(),
            ]);
            // Don't throw - thumbnail is optional
        }
    }

    /**
     * Get photo URL
     * 
     * @param string $photoId
     * @param int $tenantId
     * @param bool $thumbnail
     * @return string|null
     */
    public function getPhotoUrl(string $photoId, int $tenantId, bool $thumbnail = false): ?string
    {
        $tenantPath = "{$this->basePath}/tenant-{$tenantId}";
        $prefix = $thumbnail ? 'thumb-' : '';
        
        $files = Storage::disk($this->disk)->files($tenantPath);
        
        foreach ($files as $file) {
            if (str_contains($file, "{$prefix}{$photoId}")) {
                return Storage::disk($this->disk)->url($file);
            }
        }

        return null;
    }
}
