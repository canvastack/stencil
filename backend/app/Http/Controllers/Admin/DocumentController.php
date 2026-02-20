<?php

namespace App\Http\Controllers\Admin;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderDocumentResource;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Admin Controller for Document Management
 * 
 * Handles document generation for customer quotes
 */
class DocumentController extends Controller
{
    public function __construct(
        private DocumentGenerationService $documentService
    ) {}

    /**
     * List documents for a quote with pagination and lazy loading
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function index(string $uuid, Request $request): JsonResponse
    {
        try {
            $quote = CustomerQuote::where('uuid', $uuid)->firstOrFail();
            
            $query = OrderDocument::where('customer_quote_id', $quote->id);

            // Filter by document type
            if ($request->has('document_type')) {
                $query->where('document_type', $request->document_type);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate for lazy loading (default 10 per page)
            $perPage = min((int) $request->get('per_page', 10), 50);
            $documents = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => OrderDocumentResource::collection($documents->items()),
                'meta' => [
                    'current_page' => $documents->currentPage(),
                    'from' => $documents->firstItem(),
                    'last_page' => $documents->lastPage(),
                    'per_page' => $documents->perPage(),
                    'to' => $documents->lastItem(),
                    'total' => $documents->total(),
                ],
                'links' => [
                    'first' => $documents->url(1),
                    'last' => $documents->url($documents->lastPage()),
                    'prev' => $documents->previousPageUrl(),
                    'next' => $documents->nextPageUrl(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to list documents', [
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve documents',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate quotation document
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function generateQuotation(string $uuid, Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            
            $document = $this->documentService->generateQuotationPDF($uuid, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Quotation document generated successfully',
                'data' => new OrderDocumentResource($document),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to generate quotation', [
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate quotation document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate proforma invoice
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function generateProformaInvoice(string $uuid, Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            
            $document = $this->documentService->generateProformaInvoice($uuid, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Proforma invoice generated successfully',
                'data' => new OrderDocumentResource($document),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to generate proforma invoice', [
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate proforma invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate tax invoice
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function generateTaxInvoice(string $uuid, Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            
            $document = $this->documentService->generateTaxInvoice($uuid, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Tax invoice generated successfully',
                'data' => new OrderDocumentResource($document),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to generate tax invoice', [
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate tax invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate purchase order
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function generatePurchaseOrder(string $uuid, Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;
            
            $document = $this->documentService->generatePurchaseOrder($uuid, $userId);

            return response()->json([
                'success' => true,
                'message' => 'Purchase order generated successfully',
                'data' => new OrderDocumentResource($document),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to generate purchase order', [
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download document
     * 
     * @param int $documentId
     * @return mixed
     */
    public function download(int $documentId)
    {
        try {
            $document = OrderDocument::findOrFail($documentId);
            
            if (!Storage::exists($document->file_url)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document file not found',
                ], 404);
            }

            return Storage::download($document->file_url, $document->file_name);
        } catch (\Exception $e) {
            Log::error('Failed to download document', [
                'document_id' => $documentId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download document',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
