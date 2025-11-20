<?php

namespace App\Domain\Media\Services;

use App\Infrastructure\Persistence\Eloquent\Models\MediaFile;
use App\Infrastructure\Persistence\Eloquent\Models\MediaFolder;
use App\Infrastructure\Persistence\Eloquent\Models\MediaAssociation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    protected array $allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
    ];

    protected int $maxFileSize = 52428800;

    public function uploadFile(UploadedFile $file, array $options = []): MediaFile
    {
        $this->validateFile($file);

        $filename = $this->generateUniqueFilename($file);
        $path = $this->getStoragePath($options['folder_id'] ?? null);
        $fullPath = $path . '/' . $filename;

        $storedPath = Storage::disk('public')->putFileAs($path, $file, $filename);

        $mediaFile = MediaFile::create([
            'tenant_id' => app('current_tenant')->id,
            'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $storedPath,
            'file_url' => Storage::disk('public')->url($storedPath),
            'mime_type' => $file->getMimeType(),
            'file_extension' => strtolower($file->getClientOriginalExtension()),
            'file_size' => $file->getSize(),
            'storage_disk' => 'public',
            'folder_id' => $options['folder_id'] ?? null,
            'alt_text' => $options['alt_text'] ?? null,
            'description' => $options['description'] ?? null,
            'uploaded_by' => auth()->id(),
            'status' => 'processing',
        ]);

        return $mediaFile;
    }

    public function processFile(MediaFile $mediaFile): void
    {
        try {
            $metadata = $this->extractMetadata($mediaFile);

            $thumbnailUrl = null;
            if ($mediaFile->isImage()) {
                $thumbnailUrl = $this->generateThumbnails($mediaFile);
                $dimensions = $this->getImageDimensions($mediaFile);
                if ($dimensions) {
                    $metadata['dimensions'] = $dimensions;
                }
            }

            $mediaFile->update([
                'thumbnail_url' => $thumbnailUrl,
                'dimensions' => $metadata['dimensions'] ?? null,
                'metadata' => $metadata,
                'status' => 'ready',
            ]);

        } catch (\Exception $e) {
            $mediaFile->update([
                'status' => 'failed',
                'metadata' => ['error' => $e->getMessage()],
            ]);
        }
    }

    public function createFolder(array $data): MediaFolder
    {
        return MediaFolder::create([
            'tenant_id' => app('current_tenant')->id,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
            'is_public' => $data['is_public'] ?? true,
            'created_by' => auth()->id(),
        ]);
    }

    public function moveFile(MediaFile $mediaFile, ?int $folderId): MediaFile
    {
        $oldPath = $mediaFile->file_path;
        $newPath = $this->getStoragePath($folderId) . '/' . basename($oldPath);

        Storage::disk('public')->move($oldPath, $newPath);

        if ($mediaFile->thumbnail_url) {
            $oldThumbnailPath = dirname($oldPath) . '/thumbs/' . basename($oldPath);
            $newThumbnailPath = dirname($newPath) . '/thumbs/' . basename($newPath);
            if (Storage::disk('public')->exists($oldThumbnailPath)) {
                Storage::disk('public')->move($oldThumbnailPath, $newThumbnailPath);
            }
        }

        $mediaFile->update([
            'folder_id' => $folderId,
            'file_path' => $newPath,
            'file_url' => Storage::disk('public')->url($newPath),
            'thumbnail_url' => $mediaFile->thumbnail_url ? Storage::disk('public')->url($newPath) : null,
        ]);

        return $mediaFile;
    }

    public function deleteFile(MediaFile $mediaFile): bool
    {
        if (Storage::disk('public')->exists($mediaFile->file_path)) {
            Storage::disk('public')->delete($mediaFile->file_path);
        }

        if ($mediaFile->thumbnail_url) {
            $thumbnailPath = dirname($mediaFile->file_path) . '/thumbs/' . basename($mediaFile->file_path);
            if (Storage::disk('public')->exists($thumbnailPath)) {
                Storage::disk('public')->delete($thumbnailPath);
            }
        }

        return $mediaFile->delete();
    }

    public function associateWithModel($model, MediaFile $mediaFile, string $context = 'default'): MediaAssociation
    {
        $sortOrder = $model->mediaAssociations()
            ->where('context', $context)
            ->max('sort_order') + 1;

        return MediaAssociation::create([
            'tenant_id' => app('current_tenant')->id,
            'media_file_id' => $mediaFile->id,
            'associable_type' => get_class($model),
            'associable_id' => $model->id,
            'context' => $context,
            'sort_order' => $sortOrder,
        ]);
    }

    public function updateFileMetadata(MediaFile $mediaFile, array $data): MediaFile
    {
        $mediaFile->update([
            'name' => $data['name'] ?? $mediaFile->name,
            'alt_text' => $data['alt_text'] ?? $mediaFile->alt_text,
            'description' => $data['description'] ?? $mediaFile->description,
        ]);

        return $mediaFile;
    }

    public function reorderFolderContents(int $folderId, array $order): void
    {
        foreach ($order as $index => $mediaFileId) {
            MediaFile::where('id', $mediaFileId)
                ->where('folder_id', $folderId)
                ->update(['metadata->sort_order' => $index]);
        }
    }

    private function validateFile(UploadedFile $file): void
    {
        if (!in_array($file->getMimeType(), $this->allowedMimes)) {
            throw new \Exception('File type not allowed: ' . $file->getMimeType());
        }

        if ($file->getSize() > $this->maxFileSize) {
            throw new \Exception('File size exceeds maximum allowed size of 50MB');
        }
    }

    private function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        return Str::uuid() . '.' . $extension;
    }

    private function getStoragePath(?int $folderId): string
    {
        $basePath = 'tenant-' . app('current_tenant')->id;

        if ($folderId) {
            $folder = MediaFolder::find($folderId);
            if ($folder) {
                $folderPath = $folder->getFullPath();
                return $basePath . '/' . $folderPath;
            }
        }

        return $basePath . '/uploads';
    }

    private function isImage(MediaFile $mediaFile): bool
    {
        return str_starts_with($mediaFile->mime_type, 'image/');
    }

    private function generateThumbnails(MediaFile $mediaFile): ?string
    {
        if (!$this->isImage($mediaFile)) {
            return null;
        }

        try {
            $originalPath = Storage::disk('public')->path($mediaFile->file_path);
            $thumbnailPath = dirname($mediaFile->file_path) . '/thumbs/' . basename($mediaFile->file_path);
            $thumbnailFullPath = Storage::disk('public')->path($thumbnailPath);

            $thumbnailDir = dirname($thumbnailFullPath);
            if (!file_exists($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }

            if (extension_loaded('gd')) {
                $image = imagecreatefromstring(file_get_contents($originalPath));
                if ($image) {
                    $this->resizeImage($image, 300, 300, $thumbnailFullPath);
                    imagedestroy($image);
                    return Storage::disk('public')->url($thumbnailPath);
                }
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function resizeImage($image, int $maxWidth, int $maxHeight, string $savePath): void
    {
        $width = imagesx($image);
        $height = imagesy($image);

        $ratio = $width / $height;
        if ($ratio > 1) {
            $newWidth = min($maxWidth, $width);
            $newHeight = (int)($newWidth / $ratio);
        } else {
            $newHeight = min($maxHeight, $height);
            $newWidth = (int)($newHeight * $ratio);
        }

        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        imagejpeg($resized, $savePath, 85);
        imagedestroy($resized);
    }

    private function getImageDimensions(MediaFile $mediaFile): ?array
    {
        if (!$this->isImage($mediaFile)) {
            return null;
        }

        try {
            $imagePath = Storage::disk('public')->path($mediaFile->file_path);
            $dimensions = getimagesize($imagePath);

            return [
                'width' => $dimensions[0],
                'height' => $dimensions[1],
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    private function extractMetadata(MediaFile $mediaFile): array
    {
        $metadata = [];

        if ($this->isImage($mediaFile)) {
            try {
                $imagePath = Storage::disk('public')->path($mediaFile->file_path);
                $exif = @exif_read_data($imagePath);

                if ($exif) {
                    $metadata['exif'] = [
                        'camera' => $exif['Model'] ?? null,
                        'datetime' => $exif['DateTime'] ?? null,
                        'iso' => $exif['ISOSpeedRatings'] ?? null,
                    ];
                }
            } catch (\Exception $e) {
            }
        }

        return $metadata;
    }
}
