<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Intervention\Image\ImageManagerStatic as Image;

/**
 * RefundEvidenceService
 * 
 * Manages evidence files for refund requests, disputes, and liability claims
 * Handles file uploads, validation, storage, and retrieval
 */
class RefundEvidenceService
{
    private array $allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    private array $allowedDocumentTypes = ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'];
    private array $allowedVideoTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    private array $allowedAudioTypes = ['mp3', 'wav', 'ogg', 'm4a'];
    
    private int $maxFileSize = 50 * 1024 * 1024; // 50MB
    private int $maxImageSize = 10 * 1024 * 1024; // 10MB for images

    /**
     * Upload evidence file for refund request
     */
    public function uploadRefundEvidence(
        PaymentRefund $refund,
        UploadedFile $file,
        string $description = '',
        User $uploadedBy = null
    ): array {
        $this->validateFile($file);
        
        $evidence = $this->processAndStoreFile($file, $refund->tenant_id, 'refund');
        $evidence['description'] = $description;
        $evidence['uploaded_by'] = $uploadedBy ? $uploadedBy->id : null;
        $evidence['uploaded_at'] = now()->toISOString();

        // Add to refund's evidence collection
        $existingEvidence = $refund->evidence_documents ?? [];
        $existingEvidence[] = $evidence;
        
        $refund->update(['evidence_documents' => $existingEvidence]);

        Log::info('Refund evidence uploaded', [
            'refund_id' => $refund->id,
            'file_type' => $evidence['type'],
            'file_size' => $evidence['file_size'],
            'uploaded_by' => $uploadedBy ? $uploadedBy->id : 'system',
        ]);

        return $evidence;
    }

    /**
     * Upload evidence file for dispute
     */
    public function uploadDisputeEvidence(
        RefundDispute $dispute,
        UploadedFile $file,
        string $evidenceType, // 'customer' or 'company'
        string $description = '',
        User $uploadedBy = null
    ): array {
        if (!in_array($evidenceType, ['customer', 'company'])) {
            throw new \InvalidArgumentException('Evidence type must be "customer" or "company"');
        }

        $this->validateFile($file);
        
        $evidence = $this->processAndStoreFile($file, $dispute->tenant_id, 'dispute');
        $evidence['description'] = $description;
        $evidence['uploaded_by'] = $uploadedBy ? $uploadedBy->id : null;
        $evidence['uploaded_at'] = now()->toISOString();

        // Add to dispute's evidence collection
        $evidenceField = $evidenceType === 'customer' ? 'evidence_customer' : 'evidence_company';
        $existingEvidence = $dispute->{$evidenceField} ?? [];
        $existingEvidence[] = $evidence;
        
        $dispute->update([$evidenceField => $existingEvidence]);

        Log::info('Dispute evidence uploaded', [
            'dispute_id' => $dispute->id,
            'evidence_type' => $evidenceType,
            'file_type' => $evidence['type'],
            'uploaded_by' => $uploadedBy ? $uploadedBy->id : 'system',
        ]);

        return $evidence;
    }

    /**
     * Upload evidence file for vendor liability
     */
    public function uploadLiabilityEvidence(
        VendorLiability $liability,
        UploadedFile $file,
        string $description = '',
        User $uploadedBy = null
    ): array {
        $this->validateFile($file);
        
        $evidence = $this->processAndStoreFile($file, $liability->tenant_id, 'liability');
        $evidence['description'] = $description;
        $evidence['uploaded_by'] = $uploadedBy ? $uploadedBy->id : null;
        $evidence['uploaded_at'] = now()->toISOString();

        // Store in recovery notes for now (could be separate field)
        $existingNotes = $liability->recovery_notes ?? '';
        $evidenceReference = "Evidence uploaded: {$evidence['file_name']} ({$evidence['type']})";
        $updatedNotes = $existingNotes ? $existingNotes . "\n" . $evidenceReference : $evidenceReference;
        
        $liability->update(['recovery_notes' => $updatedNotes]);

        Log::info('Liability evidence uploaded', [
            'liability_id' => $liability->id,
            'vendor_id' => $liability->vendor_id,
            'file_type' => $evidence['type'],
            'uploaded_by' => $uploadedBy ? $uploadedBy->id : 'system',
        ]);

        return $evidence;
    }

    /**
     * Get evidence files for refund
     */
    public function getRefundEvidence(PaymentRefund $refund): array
    {
        $evidence = $refund->evidence_documents ?? [];
        
        return array_map(function ($item) {
            return $this->enrichEvidenceData($item);
        }, $evidence);
    }

    /**
     * Get evidence files for dispute
     */
    public function getDisputeEvidence(RefundDispute $dispute, string $evidenceType = null): array
    {
        if ($evidenceType && !in_array($evidenceType, ['customer', 'company'])) {
            throw new \InvalidArgumentException('Evidence type must be "customer" or "company"');
        }

        $result = [];

        if (!$evidenceType || $evidenceType === 'customer') {
            $customerEvidence = $dispute->evidence_customer ?? [];
            $result['customer'] = array_map(function ($item) {
                return $this->enrichEvidenceData($item);
            }, $customerEvidence);
        }

        if (!$evidenceType || $evidenceType === 'company') {
            $companyEvidence = $dispute->evidence_company ?? [];
            $result['company'] = array_map(function ($item) {
                return $this->enrichEvidenceData($item);
            }, $companyEvidence);
        }

        return $evidenceType ? $result[$evidenceType] : $result;
    }

    /**
     * Delete evidence file
     */
    public function deleteEvidence(string $filePath, int $tenantId): bool
    {
        try {
            // Verify file belongs to tenant
            if (!str_contains($filePath, "tenant_{$tenantId}")) {
                throw new \UnauthorizedHttpException('', 'Unauthorized access to file');
            }

            $deleted = Storage::disk('private')->delete($filePath);
            
            if ($deleted) {
                Log::info('Evidence file deleted', [
                    'file_path' => $filePath,
                    'tenant_id' => $tenantId,
                ]);
            }

            return $deleted;
        } catch (\Exception $e) {
            Log::error('Failed to delete evidence file', [
                'file_path' => $filePath,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Generate evidence summary report
     */
    public function generateEvidenceSummary(int $tenantId, int $days = 30): array
    {
        $fromDate = now()->subDays($days);

        // Count evidence by type across all entities
        $refundEvidenceCount = PaymentRefund::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->whereNotNull('evidence_documents')
            ->sum(function ($refund) {
                return count($refund->evidence_documents ?? []);
            });

        $disputeEvidenceCount = RefundDispute::where('tenant_id', $tenantId)
            ->where('created_at', '>=', $fromDate)
            ->get()
            ->sum(function ($dispute) {
                $customerCount = count($dispute->evidence_customer ?? []);
                $companyCount = count($dispute->evidence_company ?? []);
                return $customerCount + $companyCount;
            });

        // Storage usage (simplified calculation)
        $estimatedStorageUsage = ($refundEvidenceCount + $disputeEvidenceCount) * 2048; // 2KB average

        return [
            'total_evidence_files' => $refundEvidenceCount + $disputeEvidenceCount,
            'refund_evidence_files' => $refundEvidenceCount,
            'dispute_evidence_files' => $disputeEvidenceCount,
            'estimated_storage_usage_kb' => $estimatedStorageUsage,
            'period_days' => $days,
        ];
    }

    /**
     * Validate uploaded file
     */
    private function validateFile(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new \InvalidArgumentException('Invalid file upload');
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $fileSize = $file->getSize();
        
        // Check file type
        $allAllowedTypes = array_merge(
            $this->allowedImageTypes,
            $this->allowedDocumentTypes,
            $this->allowedVideoTypes,
            $this->allowedAudioTypes
        );
        
        if (!in_array($extension, $allAllowedTypes)) {
            throw new \InvalidArgumentException("File type '{$extension}' not allowed");
        }

        // Check file size
        $maxSize = in_array($extension, $this->allowedImageTypes) ? $this->maxImageSize : $this->maxFileSize;
        
        if ($fileSize > $maxSize) {
            $maxSizeMB = round($maxSize / 1024 / 1024, 1);
            throw new \InvalidArgumentException("File size exceeds maximum allowed size of {$maxSizeMB}MB");
        }

        // Additional security checks
        $mimeType = $file->getMimeType();
        $this->validateMimeType($mimeType, $extension);
    }

    /**
     * Validate MIME type against file extension
     */
    private function validateMimeType(string $mimeType, string $extension): void
    {
        $allowedMimeTypes = [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'webp' => ['image/webp'],
            'pdf' => ['application/pdf'],
            'doc' => ['application/msword'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'txt' => ['text/plain'],
            'mp4' => ['video/mp4'],
            'mov' => ['video/quicktime'],
            'mp3' => ['audio/mpeg'],
            'wav' => ['audio/wav'],
        ];

        if (isset($allowedMimeTypes[$extension]) && 
            !in_array($mimeType, $allowedMimeTypes[$extension])) {
            throw new \InvalidArgumentException("File MIME type does not match extension");
        }
    }

    /**
     * Process and store uploaded file
     */
    private function processAndStoreFile(UploadedFile $file, int $tenantId, string $context): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();
        
        // Generate unique filename
        $uniqueId = Str::uuid();
        $fileName = "{$uniqueId}.{$extension}";
        
        // Create directory path
        $directory = "tenant_{$tenantId}/evidence/{$context}/" . now()->format('Y/m');
        $filePath = "{$directory}/{$fileName}";
        
        // Store file
        $stored = $file->storeAs($directory, $fileName, 'private');
        
        if (!$stored) {
            throw new \RuntimeException('Failed to store uploaded file');
        }

        // Determine file type
        $fileType = $this->determineFileType($extension);
        
        // Generate thumbnail for images
        $thumbnailPath = null;
        if ($fileType === 'image') {
            $thumbnailPath = $this->generateThumbnail($stored, $tenantId, $context);
        }

        return [
            'id' => $uniqueId,
            'type' => $fileType,
            'file_name' => $originalName,
            'file_path' => $stored,
            'thumbnail_path' => $thumbnailPath,
            'file_size' => $fileSize,
            'mime_type' => $file->getMimeType(),
            'extension' => $extension,
        ];
    }

    /**
     * Determine file type category
     */
    private function determineFileType(string $extension): string
    {
        if (in_array($extension, $this->allowedImageTypes)) {
            return 'image';
        }
        if (in_array($extension, $this->allowedDocumentTypes)) {
            return 'document';
        }
        if (in_array($extension, $this->allowedVideoTypes)) {
            return 'video';
        }
        if (in_array($extension, $this->allowedAudioTypes)) {
            return 'audio';
        }
        return 'other';
    }

    /**
     * Generate thumbnail for image files
     */
    private function generateThumbnail(string $filePath, int $tenantId, string $context): ?string
    {
        try {
            $fullPath = Storage::disk('private')->path($filePath);
            
            if (!file_exists($fullPath)) {
                return null;
            }

            // Create thumbnail
            $thumbnail = Image::make($fullPath)
                ->fit(300, 300)
                ->encode('jpg', 80);

            // Store thumbnail
            $pathInfo = pathinfo($filePath);
            $thumbnailPath = $pathInfo['dirname'] . '/thumb_' . $pathInfo['filename'] . '.jpg';
            
            Storage::disk('private')->put($thumbnailPath, $thumbnail);
            
            return $thumbnailPath;
            
        } catch (\Exception $e) {
            Log::warning('Failed to generate thumbnail', [
                'file_path' => $filePath,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Enrich evidence data with additional information
     */
    private function enrichEvidenceData(array $evidence): array
    {
        $enriched = $evidence;
        
        // Add human-readable file size
        $enriched['file_size_human'] = $this->formatFileSize($evidence['file_size'] ?? 0);
        
        // Add download URL (would be generated by controller)
        $enriched['download_url'] = "/api/refunds/evidence/download/" . ($evidence['id'] ?? '');
        
        // Add thumbnail URL for images
        if (isset($evidence['thumbnail_path']) && $evidence['thumbnail_path']) {
            $enriched['thumbnail_url'] = "/api/refunds/evidence/thumbnail/" . ($evidence['id'] ?? '');
        }
        
        return $enriched;
    }

    /**
     * Format file size in human-readable format
     */
    private function formatFileSize(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' bytes';
    }
}