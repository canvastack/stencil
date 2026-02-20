<?php

namespace App\Jobs;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job to generate customer quote PDF document
 * 
 * Queued job to handle PDF generation asynchronously
 */
class GenerateQuotePDFJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;
    public int $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $quoteId,
        public string $documentType = 'quotation'
    ) {}

    /**
     * Execute the job.
     */
    public function handle(DocumentGenerationService $documentService): void
    {
        try {
            $quote = CustomerQuote::findOrFail($this->quoteId);

            Log::info('Starting PDF generation', [
                'quote_id' => $this->quoteId,
                'quote_number' => $quote->quote_number,
                'document_type' => $this->documentType,
            ]);

            // Generate appropriate document based on type
            $document = match ($this->documentType) {
                'quotation' => $documentService->generateQuotationPDF($quote),
                'proforma_invoice' => $documentService->generateProformaInvoice($quote),
                'tax_invoice' => $documentService->generateTaxInvoice($quote),
                'purchase_order' => $documentService->generatePurchaseOrder($quote),
                'delivery_note' => $documentService->generateDeliveryNote($quote),
                'receipt' => $documentService->generateReceipt($quote),
                default => throw new \InvalidArgumentException("Invalid document type: {$this->documentType}"),
            };

            Log::info('PDF generation completed', [
                'quote_id' => $this->quoteId,
                'document_type' => $this->documentType,
                'document_id' => $document->id,
                'document_number' => $document->document_number,
            ]);
        } catch (\Exception $e) {
            Log::error('PDF generation failed', [
                'quote_id' => $this->quoteId,
                'document_type' => $this->documentType,
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
        Log::error('PDF generation job failed permanently', [
            'quote_id' => $this->quoteId,
            'document_type' => $this->documentType,
            'error' => $exception->getMessage(),
        ]);

        // TODO: Notify admin about failed PDF generation
        // dispatch(new NotifyAdminJob('PDF generation failed', [...]));
    }
}
