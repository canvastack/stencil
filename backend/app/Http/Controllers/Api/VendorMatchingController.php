<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Vendor\Services\VendorMatchingService;
use App\Domain\Vendor\ValueObjects\OrderRequirements;
use App\Domain\Shared\ValueObjects\Timeline;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Vendor Matching Controller
 * 
 * Handles vendor matching and recommendation requests
 * Integrates with the intelligent vendor matching system
 */
class VendorMatchingController extends Controller
{
    public function __construct(
        private VendorMatchingService $vendorMatchingService
    ) {}
    
    /**
     * Find best vendors for order requirements
     */
    public function findBestVendors(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'material' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'specifications' => 'required|array',
            'timeline' => 'required|array',
            'timeline.start_date' => 'required|date',
            'timeline.end_date' => 'required|date|after:timeline.start_date',
            'quality_requirements' => 'array',
            'delivery_requirements' => 'array',
            'complexity' => 'string|in:simple,medium,high,custom',
            'max_vendors' => 'integer|min:1|max:10'
        ]);
        
        try {
            // Create timeline
            $timeline = new Timeline(
                startDate: new \DateTimeImmutable($validated['timeline']['start_date']),
                endDate: new \DateTimeImmutable($validated['timeline']['end_date'])
            );
            
            // Create order requirements
            $requirements = new OrderRequirements(
                material: $validated['material'],
                quantity: $validated['quantity'],
                specifications: $validated['specifications'],
                timeline: $timeline,
                qualityRequirements: $validated['quality_requirements'] ?? [],
                deliveryRequirements: $validated['delivery_requirements'] ?? [],
                complexity: $validated['complexity'] ?? 'medium'
            );
            
            // Find best vendors
            $matches = $this->vendorMatchingService->findBestVendorsForOrder(
                $requirements,
                $validated['max_vendors'] ?? 5
            );
            
            return response()->json([
                'success' => true,
                'data' => $matches->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to find vendors',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get vendor recommendation
     */
    public function getRecommendation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'material' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'specifications' => 'required|array',
            'timeline' => 'required|array',
            'timeline.start_date' => 'required|date',
            'timeline.end_date' => 'required|date|after:timeline.start_date',
            'quality_requirements' => 'array',
            'delivery_requirements' => 'array',
            'complexity' => 'string|in:simple,medium,high,custom'
        ]);
        
        try {
            // Create timeline
            $timeline = new Timeline(
                startDate: new \DateTimeImmutable($validated['timeline']['start_date']),
                endDate: new \DateTimeImmutable($validated['timeline']['end_date'])
            );
            
            // Create order requirements
            $requirements = new OrderRequirements(
                material: $validated['material'],
                quantity: $validated['quantity'],
                specifications: $validated['specifications'],
                timeline: $timeline,
                qualityRequirements: $validated['quality_requirements'] ?? [],
                deliveryRequirements: $validated['delivery_requirements'] ?? [],
                complexity: $validated['complexity'] ?? 'medium'
            );
            
            // Find matches and get recommendation
            $matches = $this->vendorMatchingService->findBestVendorsForOrder($requirements);
            
            if (!$matches->hasQualifiedVendors()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No qualified vendors found for the specified requirements',
                    'data' => [
                        'requirements' => $requirements->toArray(),
                        'suggestions' => [
                            'Consider relaxing quality requirements',
                            'Extend timeline for better vendor availability',
                            'Consider alternative materials',
                            'Reduce quantity for faster turnaround'
                        ]
                    ]
                ], 404);
            }
            
            $recommendation = $this->vendorMatchingService->recommendOptimalVendor($matches);
            
            return response()->json([
                'success' => true,
                'data' => $recommendation->toArray()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get recommendation',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Find vendors by material specialization
     */
    public function findByMaterial(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'material' => 'required|string',
            'limit' => 'integer|min:1|max:20'
        ]);
        
        try {
            $vendors = $this->vendorMatchingService->findVendorsByMaterial(
                $validated['material'],
                $validated['limit'] ?? 10
            );
            
            $vendorData = array_map(function($vendor) {
                return [
                    'id' => $vendor->getId()->toString(),
                    'name' => $vendor->getName(),
                    'company' => $vendor->getCompany(),
                    'rating' => $vendor->getRating(),
                    'specializations' => $vendor->getSpecializations(),
                    'supported_materials' => $vendor->getSupportedMaterials(),
                    'lead_time' => $vendor->getLeadTime(),
                    'capacity_utilization' => $vendor->getCurrentCapacityUtilization()
                ];
            }, $vendors);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'material' => $validated['material'],
                    'vendors' => $vendorData,
                    'total_found' => count($vendorData)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to find vendors by material',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Find vendors by equipment capability
     */
    public function findByEquipment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'equipment' => 'required|array|min:1',
            'equipment.*' => 'string',
            'limit' => 'integer|min:1|max:20'
        ]);
        
        try {
            $vendors = $this->vendorMatchingService->findVendorsByEquipment(
                $validated['equipment'],
                $validated['limit'] ?? 10
            );
            
            $vendorData = array_map(function($vendor) use ($validated) {
                $vendorEquipment = $vendor->getAvailableEquipment();
                $matchCount = count(array_intersect($validated['equipment'], $vendorEquipment));
                
                return [
                    'id' => $vendor->getId()->toString(),
                    'name' => $vendor->getName(),
                    'company' => $vendor->getCompany(),
                    'rating' => $vendor->getRating(),
                    'available_equipment' => $vendorEquipment,
                    'equipment_match_count' => $matchCount,
                    'equipment_match_percentage' => round(($matchCount / count($validated['equipment'])) * 100, 2),
                    'lead_time' => $vendor->getLeadTime(),
                    'capacity_utilization' => $vendor->getCurrentCapacityUtilization()
                ];
            }, $vendors);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'required_equipment' => $validated['equipment'],
                    'vendors' => $vendorData,
                    'total_found' => count($vendorData)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to find vendors by equipment',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get vendor compatibility score
     */
    public function getCompatibilityScore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vendor_id' => 'required|uuid',
            'material' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'specifications' => 'required|array',
            'timeline' => 'required|array',
            'timeline.start_date' => 'required|date',
            'timeline.end_date' => 'required|date|after:timeline.start_date',
            'complexity' => 'string|in:simple,medium,high,custom'
        ]);
        
        try {
            // Get vendor
            $vendorRepository = app(\App\Domain\Vendor\Repositories\VendorRepositoryInterface::class);
            $vendor = $vendorRepository->findById(
                new \App\Domain\Shared\ValueObjects\UuidValueObject($validated['vendor_id'])
            );
            
            if (!$vendor) {
                return response()->json([
                    'error' => 'Vendor not found'
                ], 404);
            }
            
            // Create timeline and requirements
            $timeline = new Timeline(
                startDate: new \DateTimeImmutable($validated['timeline']['start_date']),
                endDate: new \DateTimeImmutable($validated['timeline']['end_date'])
            );
            
            $requirements = new OrderRequirements(
                material: $validated['material'],
                quantity: $validated['quantity'],
                specifications: $validated['specifications'],
                timeline: $timeline,
                complexity: $validated['complexity'] ?? 'medium'
            );
            
            // Get compatibility score
            $score = $this->vendorMatchingService->getCompatibilityScore($vendor, $requirements);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'vendor' => [
                        'id' => $vendor->getId()->toString(),
                        'name' => $vendor->getName(),
                        'company' => $vendor->getCompany(),
                        'rating' => $vendor->getRating()
                    ],
                    'compatibility_score' => $score,
                    'compatibility_grade' => $this->getScoreGrade($score),
                    'requirements' => $requirements->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get compatibility score',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get capability analysis for requirements
     */
    public function analyzeCapabilities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'material' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'specifications' => 'required|array',
            'timeline' => 'required|array',
            'timeline.start_date' => 'required|date',
            'timeline.end_date' => 'required|date|after:timeline.start_date',
            'quality_requirements' => 'array',
            'complexity' => 'string|in:simple,medium,high,custom'
        ]);
        
        try {
            // Create timeline and requirements
            $timeline = new Timeline(
                startDate: new \DateTimeImmutable($validated['timeline']['start_date']),
                endDate: new \DateTimeImmutable($validated['timeline']['end_date'])
            );
            
            $requirements = new OrderRequirements(
                material: $validated['material'],
                quantity: $validated['quantity'],
                specifications: $validated['specifications'],
                timeline: $timeline,
                qualityRequirements: $validated['quality_requirements'] ?? [],
                complexity: $validated['complexity'] ?? 'medium'
            );
            
            // Get capability analyzer
            $capabilityAnalyzer = app(\App\Domain\Vendor\Services\VendorCapabilityAnalyzer::class);
            $analysis = $capabilityAnalyzer->analyzeCapabilityGaps($requirements);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'requirements' => $requirements->toArray(),
                    'analysis' => $analysis
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to analyze capabilities',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Convert score to grade
     */
    private function getScoreGrade(float $score): string
    {
        return match(true) {
            $score >= 90 => 'A',
            $score >= 80 => 'B',
            $score >= 70 => 'C',
            $score >= 60 => 'D',
            default => 'F'
        };
    }
}