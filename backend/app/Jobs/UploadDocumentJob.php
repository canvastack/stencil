<?php

namespace App\Jobs;

use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Services\StorageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to upload document to storage
 * 
 * Queued job to handle document upload asynchronously
 */
class UploadDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;
    public int $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $documentId,
        public string $content,
        public string $filename
    ) {}

    /**
     * Execute the job.
     */
    public function handle(StorageService $storageService): void
    {
        try {
            $document = OrderDocument::findOrFail($this->documentId);

            Log::info('Starting document upload', [
                'document_id' => $this->documentId,
                'document_number' => $document->document_number,
                'filename' => $this->filename,
            ]);

            // Store document
            $result = $storageService->storeDocument(
                content: $this->content,
                filename: $this->filename,
                tenantId: $document->tenant_id,
                documentType: $document->document_type
            );

            // Update document record with storage info
            $document->update([
                'file_path' => $result['path'],
                'file_url' => $result['url'],
                'file_size' => $result['size'],
            ]);

            Log::info('Document uploaded successfully', [
                'document_id' => $this->documentId,
                'file_path' => $result['path'],
                'file_size' => $result['size'],
            ]);
        } catch (\Exception $e) {
            Log::error('Document upload failed', [
                'document_id' => $this->documentId,
                'filename' => $this->filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Document upload job failed permanently', [
            'document_id' => $this->documentId,
            'filename' => $this->filename,
            'error' => $exception->getMessage(),
        ]);

        // Mark document as failed
        try {
            $document = OrderDocument::find($this->documentId);
            if ($document) {
                $document->update([
                    'status' => 'failed',
                    'metadata' => array_merge($document->metadata ?? [], [
                        'upload_error' => $exception->getMessage(),
                        'failed_at' => now()->toIso8601String(),
                    ]),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update document status', [
                'document_id' => $this->documentId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
