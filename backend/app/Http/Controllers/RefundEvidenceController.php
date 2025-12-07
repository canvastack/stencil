<?php

namespace App\Http\Controllers;

use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Domain\Payment\Services\RefundEvidenceService;
use App\Http\Requests\UploadEvidenceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * RefundEvidenceController
 * 
 * Manages evidence file uploads, downloads, and management
 * Handles file operations for refunds, disputes, and vendor liabilities
 */
class RefundEvidenceController extends Controller
{
    public function __construct(
        private RefundEvidenceService $evidenceService
    ) {}

    /**
     * Upload evidence for refund request
     */
    public function uploadRefundEvidence(UploadEvidenceRequest $request, PaymentRefund $refund): JsonResponse
    {
        // Ensure tenant access
        if ($refund->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $evidence = $this->evidenceService->uploadRefundEvidence(
                $refund,
                $request->file('file'),
                $request->get('description', ''),
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Evidence uploaded successfully',
                'data' => $evidence,
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload evidence for dispute
     */
    public function uploadDisputeEvidence(UploadEvidenceRequest $request, RefundDispute $dispute): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $evidenceType = $request->get('evidence_type', 'company');

        try {
            $evidence = $this->evidenceService->uploadDisputeEvidence(
                $dispute,
                $request->file('file'),
                $evidenceType,
                $request->get('description', ''),
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Evidence uploaded successfully',
                'data' => $evidence,
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload evidence for vendor liability
     */
    public function uploadLiabilityEvidence(UploadEvidenceRequest $request, VendorLiability $liability): JsonResponse
    {
        // Ensure tenant access
        if ($liability->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $evidence = $this->evidenceService->uploadLiabilityEvidence(
                $liability,
                $request->file('file'),
                $request->get('description', ''),
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Evidence uploaded successfully',
                'data' => $evidence,
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get evidence files for refund
     */
    public function getRefundEvidence(PaymentRefund $refund): JsonResponse
    {
        // Ensure tenant access
        if ($refund->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $evidence = $this->evidenceService->getRefundEvidence($refund);

        return response()->json([
            'success' => true,
            'data' => $evidence,
        ]);
    }

    /**
     * Get evidence files for dispute
     */
    public function getDisputeEvidence(RefundDispute $dispute, Request $request): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $evidenceType = $request->get('type');
        $evidence = $this->evidenceService->getDisputeEvidence($dispute, $evidenceType);

        return response()->json([
            'success' => true,
            'data' => $evidence,
        ]);
    }

    /**
     * Download evidence file
     */
    public function downloadEvidence(Request $request, string $fileId): Response
    {
        $tenantId = auth()->user()->tenant_id;
        
        // Find file path by ID across all evidence types
        $filePath = $this->findFilePathById($fileId, $tenantId);
        
        if (!$filePath) {
            abort(404, 'Evidence file not found');
        }

        // Security check - ensure file belongs to tenant
        if (!str_contains($filePath, "tenant_{$tenantId}")) {
            abort(403, 'Unauthorized access to file');
        }

        if (!Storage::disk('private')->exists($filePath)) {
            abort(404, 'File not found on storage');
        }

        $fileContent = Storage::disk('private')->get($filePath);
        $fileName = basename($filePath);
        $mimeType = Storage::disk('private')->mimeType($filePath);

        return response($fileContent, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    /**
     * Get thumbnail for image evidence
     */
    public function getThumbnail(Request $request, string $fileId): Response
    {
        $tenantId = auth()->user()->tenant_id;
        
        // Find thumbnail path by ID
        $thumbnailPath = $this->findThumbnailPathById($fileId, $tenantId);
        
        if (!$thumbnailPath) {
            abort(404, 'Thumbnail not found');
        }

        if (!Storage::disk('private')->exists($thumbnailPath)) {
            abort(404, 'Thumbnail file not found on storage');
        }

        $thumbnailContent = Storage::disk('private')->get($thumbnailPath);

        return response($thumbnailContent, 200, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    /**
     * Delete evidence file
     */
    public function deleteEvidence(Request $request, string $fileId): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        // Find file path by ID
        $filePath = $this->findFilePathById($fileId, $tenantId);
        
        if (!$filePath) {
            return response()->json([
                'success' => false,
                'message' => 'Evidence file not found',
            ], 404);
        }

        try {
            $deleted = $this->evidenceService->deleteEvidence($filePath, $tenantId);

            if ($deleted) {
                // Also remove from database records
                $this->removeEvidenceFromRecords($fileId, $tenantId);

                return response()->json([
                    'success' => true,
                    'message' => 'Evidence deleted successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete evidence file',
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting evidence: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get evidence summary report
     */
    public function evidenceSummary(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $summary = $this->evidenceService->generateEvidenceSummary($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get allowed file types and limits
     */
    public function getUploadConfiguration(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'allowed_types' => [
                    'images' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
                    'documents' => ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls'],
                    'videos' => ['mp4', 'mov', 'avi', 'mkv', 'webm'],
                    'audio' => ['mp3', 'wav', 'ogg', 'm4a'],
                ],
                'max_file_sizes' => [
                    'image' => '10MB',
                    'document' => '50MB',
                    'video' => '50MB',
                    'audio' => '50MB',
                ],
                'supported_features' => [
                    'thumbnail_generation' => true,
                    'batch_upload' => false,
                    'drag_drop' => true,
                    'progress_tracking' => true,
                ],
            ],
        ]);
    }

    /**
     * Find file path by ID across all evidence collections
     */
    private function findFilePathById(string $fileId, int $tenantId): ?string
    {
        // Search in refund evidence
        $refunds = PaymentRefund::where('tenant_id', $tenantId)
            ->whereNotNull('evidence_documents')
            ->get();

        foreach ($refunds as $refund) {
            $evidence = $refund->evidence_documents ?? [];
            foreach ($evidence as $item) {
                if (($item['id'] ?? '') === $fileId) {
                    return $item['file_path'];
                }
            }
        }

        // Search in dispute evidence
        $disputes = RefundDispute::where('tenant_id', $tenantId)
            ->where(function ($query) {
                $query->whereNotNull('evidence_customer')
                      ->orWhereNotNull('evidence_company');
            })
            ->get();

        foreach ($disputes as $dispute) {
            $customerEvidence = $dispute->evidence_customer ?? [];
            $companyEvidence = $dispute->evidence_company ?? [];
            
            foreach (array_merge($customerEvidence, $companyEvidence) as $item) {
                if (($item['id'] ?? '') === $fileId) {
                    return $item['file_path'];
                }
            }
        }

        return null;
    }

    /**
     * Find thumbnail path by ID
     */
    private function findThumbnailPathById(string $fileId, int $tenantId): ?string
    {
        // Similar logic to findFilePathById but for thumbnails
        $refunds = PaymentRefund::where('tenant_id', $tenantId)
            ->whereNotNull('evidence_documents')
            ->get();

        foreach ($refunds as $refund) {
            $evidence = $refund->evidence_documents ?? [];
            foreach ($evidence as $item) {
                if (($item['id'] ?? '') === $fileId && isset($item['thumbnail_path'])) {
                    return $item['thumbnail_path'];
                }
            }
        }

        $disputes = RefundDispute::where('tenant_id', $tenantId)
            ->where(function ($query) {
                $query->whereNotNull('evidence_customer')
                      ->orWhereNotNull('evidence_company');
            })
            ->get();

        foreach ($disputes as $dispute) {
            $customerEvidence = $dispute->evidence_customer ?? [];
            $companyEvidence = $dispute->evidence_company ?? [];
            
            foreach (array_merge($customerEvidence, $companyEvidence) as $item) {
                if (($item['id'] ?? '') === $fileId && isset($item['thumbnail_path'])) {
                    return $item['thumbnail_path'];
                }
            }
        }

        return null;
    }

    /**
     * Remove evidence reference from database records
     */
    private function removeEvidenceFromRecords(string $fileId, int $tenantId): void
    {
        // Remove from refund evidence
        $refunds = PaymentRefund::where('tenant_id', $tenantId)
            ->whereNotNull('evidence_documents')
            ->get();

        foreach ($refunds as $refund) {
            $evidence = $refund->evidence_documents ?? [];
            $filteredEvidence = array_filter($evidence, function ($item) use ($fileId) {
                return ($item['id'] ?? '') !== $fileId;
            });
            
            if (count($filteredEvidence) !== count($evidence)) {
                $refund->update(['evidence_documents' => array_values($filteredEvidence)]);
            }
        }

        // Remove from dispute evidence
        $disputes = RefundDispute::where('tenant_id', $tenantId)
            ->where(function ($query) {
                $query->whereNotNull('evidence_customer')
                      ->orWhereNotNull('evidence_company');
            })
            ->get();

        foreach ($disputes as $dispute) {
            $customerEvidence = $dispute->evidence_customer ?? [];
            $companyEvidence = $dispute->evidence_company ?? [];
            
            $filteredCustomer = array_filter($customerEvidence, function ($item) use ($fileId) {
                return ($item['id'] ?? '') !== $fileId;
            });
            
            $filteredCompany = array_filter($companyEvidence, function ($item) use ($fileId) {
                return ($item['id'] ?? '') !== $fileId;
            });
            
            if (count($filteredCustomer) !== count($customerEvidence) ||
                count($filteredCompany) !== count($companyEvidence)) {
                $dispute->update([
                    'evidence_customer' => array_values($filteredCustomer),
                    'evidence_company' => array_values($filteredCompany),
                ]);
            }
        }
    }
}