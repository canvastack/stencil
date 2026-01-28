<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Pricing\Services\PricingCalculatorService;
use App\Domain\Pricing\ValueObjects\OrderComplexity;
use App\Domain\Vendor\ValueObjects\VendorQuote;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Pricing Controller
 * 
 * Handles pricing calculation requests for orders
 * Integrates with the sophisticated pricing engine
 */
class PricingController extends Controller
{
    public function __construct(
        private PricingCalculatorService $pricingCalculator,
        private CustomerRepositoryInterface $customerRepository,
        private VendorRepositoryInterface $vendorRepository
    ) {}
    
    /**
     * Calculate pricing for order
     */
    public function calculatePricing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|uuid',
            'vendor_id' => 'required|uuid',
            'vendor_price' => 'required|integer|min:0', // In cents
            'currency' => 'string|in:IDR,USD,EUR,SGD,MYR',
            'complexity' => 'required|array',
            'complexity.level' => 'required|string|in:simple,medium,high,custom',
            'complexity.material_type' => 'required|string',
            'complexity.design_complexity' => 'required|integer|min:1|max:10',
            'complexity.quantity' => 'required|integer|min:1',
            'complexity.special_requirements' => 'array'
        ]);
        
        try {
            // Get customer and vendor entities
            $customer = $this->customerRepository->findById(
                new UuidValueObject($validated['customer_id'])
            );
            
            $vendor = $this->vendorRepository->findById(
                new UuidValueObject($validated['vendor_id'])
            );
            
            if (!$customer || !$vendor) {
                return response()->json([
                    'error' => 'Customer or vendor not found'
                ], 404);
            }
            
            // Create vendor quote
            $vendorPrice = Money::fromCents(
                $validated['vendor_price'],
                $validated['currency'] ?? 'IDR'
            );
            
            $vendorQuote = VendorQuote::fromBasicPricing(
                vendorId: $vendor->getId(),
                totalPrice: $vendorPrice,
                leadTimeDays: $vendor->getLeadTime()
            );
            
            // Create order complexity
            $orderComplexity = new OrderComplexity(
                level: $validated['complexity']['level'],
                materialType: $validated['complexity']['material_type'],
                designComplexity: $validated['complexity']['design_complexity'],
                quantity: $validated['complexity']['quantity'],
                specialRequirements: $validated['complexity']['special_requirements'] ?? []
            );
            
            // Calculate pricing
            $pricingStructure = $this->pricingCalculator->calculateCustomerPricing(
                $vendorQuote,
                $customer,
                $orderComplexity
            );
            
            return response()->json([
                'success' => true,
                'data' => [
                    'pricing' => $pricingStructure->toArray(),
                    'customer' => [
                        'id' => $customer->getId()->toString(),
                        'name' => $customer->getName(),
                        'tier' => $customer->getTier()
                    ],
                    'vendor' => [
                        'id' => $vendor->getId()->toString(),
                        'name' => $vendor->getName(),
                        'rating' => $vendor->getRating()
                    ],
                    'complexity' => $orderComplexity->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to calculate pricing',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get pricing breakdown for transparency
     */
    public function getPricingBreakdown(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'base_cost' => 'required|integer|min:0',
            'currency' => 'string|in:IDR,USD,EUR,SGD,MYR',
            'customer_id' => 'required|uuid'
        ]);
        
        try {
            $customer = $this->customerRepository->findById(
                new UuidValueObject($validated['customer_id'])
            );
            
            if (!$customer) {
                return response()->json([
                    'error' => 'Customer not found'
                ], 404);
            }
            
            $baseCost = Money::fromCents(
                $validated['base_cost'],
                $validated['currency'] ?? 'IDR'
            );
            
            // Get discount breakdown
            $discountEngine = app(\App\Domain\Pricing\Services\DiscountEngine::class);
            $discountBreakdown = $discountEngine->getDiscountBreakdown($customer, $baseCost);
            
            // Get tax breakdown
            $taxCalculator = app(\App\Domain\Pricing\Services\TaxCalculatorService::class);
            $taxStructure = $taxCalculator->calculateTaxStructure($baseCost, $customer);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'base_cost' => $baseCost->toArray(),
                    'discount_breakdown' => $discountBreakdown,
                    'tax_breakdown' => $taxStructure->toArray(),
                    'customer_info' => [
                        'id' => $customer->getId()->toString(),
                        'name' => $customer->getName(),
                        'tier' => $customer->getTier(),
                        'total_orders' => $customer->getTotalOrders(),
                        'total_spent' => $customer->getTotalSpent()->toArray()
                    ]
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get pricing breakdown',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Compare pricing between multiple vendors
     */
    public function comparePricing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'required|uuid',
            'vendors' => 'required|array|min:2|max:5',
            'vendors.*.vendor_id' => 'required|uuid',
            'vendors.*.vendor_price' => 'required|integer|min:0',
            'complexity' => 'required|array',
            'complexity.level' => 'required|string|in:simple,medium,high,custom',
            'complexity.material_type' => 'required|string',
            'complexity.design_complexity' => 'required|integer|min:1|max:10',
            'complexity.quantity' => 'required|integer|min:1',
            'currency' => 'string|in:IDR,USD,EUR,SGD,MYR'
        ]);
        
        try {
            $customer = $this->customerRepository->findById(
                new UuidValueObject($validated['customer_id'])
            );
            
            if (!$customer) {
                return response()->json([
                    'error' => 'Customer not found'
                ], 404);
            }
            
            $orderComplexity = new OrderComplexity(
                level: $validated['complexity']['level'],
                materialType: $validated['complexity']['material_type'],
                designComplexity: $validated['complexity']['design_complexity'],
                quantity: $validated['complexity']['quantity']
            );
            
            $pricingComparisons = [];
            $currency = $validated['currency'] ?? 'IDR';
            
            foreach ($validated['vendors'] as $vendorData) {
                $vendor = $this->vendorRepository->findById(
                    new UuidValueObject($vendorData['vendor_id'])
                );
                
                if (!$vendor) {
                    continue;
                }
                
                $vendorPrice = Money::fromCents($vendorData['vendor_price'], $currency);
                $vendorQuote = VendorQuote::fromBasicPricing(
                    vendorId: $vendor->getId(),
                    totalPrice: $vendorPrice,
                    leadTimeDays: $vendor->getLeadTime()
                );
                
                $pricingStructure = $this->pricingCalculator->calculateCustomerPricing(
                    $vendorQuote,
                    $customer,
                    $orderComplexity
                );
                
                $pricingComparisons[] = [
                    'vendor' => [
                        'id' => $vendor->getId()->toString(),
                        'name' => $vendor->getName(),
                        'rating' => $vendor->getRating(),
                        'lead_time' => $vendor->getLeadTime()
                    ],
                    'pricing' => $pricingStructure->toArray()
                ];
            }
            
            // Sort by final price (lowest first)
            usort($pricingComparisons, function($a, $b) {
                return $a['pricing']['final_price']['amount'] <=> $b['pricing']['final_price']['amount'];
            });
            
            // Add comparison insights
            $insights = $this->generatePricingInsights($pricingComparisons);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'comparisons' => $pricingComparisons,
                    'insights' => $insights,
                    'customer' => [
                        'id' => $customer->getId()->toString(),
                        'name' => $customer->getName(),
                        'tier' => $customer->getTier()
                    ],
                    'complexity' => $orderComplexity->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to compare pricing',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Generate pricing insights from comparisons
     */
    private function generatePricingInsights(array $comparisons): array
    {
        if (empty($comparisons)) {
            return [];
        }
        
        $prices = array_column(array_column($comparisons, 'pricing'), 'final_price');
        $amounts = array_column($prices, 'amount');
        
        $minPrice = min($amounts);
        $maxPrice = max($amounts);
        $avgPrice = array_sum($amounts) / count($amounts);
        
        $insights = [
            'price_range' => [
                'min' => $minPrice,
                'max' => $maxPrice,
                'average' => round($avgPrice),
                'spread_percentage' => $maxPrice > 0 ? round((($maxPrice - $minPrice) / $maxPrice) * 100, 2) : 0
            ],
            'best_value' => $comparisons[0]['vendor']['name'] ?? 'Unknown',
            'recommendations' => []
        ];
        
        // Generate recommendations
        if (count($comparisons) >= 2) {
            $priceDiff = $amounts[1] - $amounts[0];
            $priceDiffPercentage = $amounts[0] > 0 ? ($priceDiff / $amounts[0]) * 100 : 0;
            
            if ($priceDiffPercentage > 20) {
                $insights['recommendations'][] = 'Significant price difference detected - consider negotiating with higher-priced vendors';
            }
            
            if ($priceDiffPercentage < 5) {
                $insights['recommendations'][] = 'Prices are very competitive - consider other factors like quality and delivery time';
            }
        }
        
        return $insights;
    }
}