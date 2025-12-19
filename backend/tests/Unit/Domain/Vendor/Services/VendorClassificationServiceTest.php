<?php

namespace Tests\Unit\Domain\Vendor\Services;

use App\Domain\Vendor\Services\VendorClassificationService;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use PHPUnit\Framework\TestCase;

class VendorClassificationServiceTest extends TestCase
{
    private VendorClassificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new VendorClassificationService();
    }
    
    private function createVendorMock(array $attributes)
    {
        return new class($attributes) extends Vendor {
            private array $attrs;
            
            public function __construct(array $attributes)
            {
                $this->attrs = $attributes;
            }
            
            public function __get($key)
            {
                return $this->attrs[$key] ?? null;
            }
            
            public function __isset($key)
            {
                return isset($this->attrs[$key]);
            }
        };
    }

    public function test_classifies_vendor_as_small_with_low_orders(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 5]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('small', $size);
    }

    public function test_classifies_vendor_as_medium_with_moderate_orders(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 50]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('medium', $size);
    }

    public function test_classifies_vendor_as_large_with_high_orders(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 150]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('large', $size);
    }

    public function test_classifies_vendor_as_small_when_total_orders_is_null(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => null]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('small', $size);
    }

    public function test_uses_custom_thresholds(): void
    {
        $service = new VendorClassificationService(['large' => 200, 'medium' => 50]);
        $vendor = $this->createVendorMock(['total_orders' => 150]);
        
        $size = $service->calculateCompanySize($vendor);
        
        $this->assertEquals('medium', $size);
    }

    public function test_boundary_case_medium_threshold(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 20]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('medium', $size);
    }

    public function test_boundary_case_large_threshold(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 100]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('large', $size);
    }

    public function test_just_below_medium_threshold(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 19]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('small', $size);
    }

    public function test_just_below_large_threshold(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 99]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('medium', $size);
    }

    public function test_get_default_thresholds(): void
    {
        $thresholds = $this->service->getCompanySizeThresholds();
        
        $this->assertEquals(['large' => 100, 'medium' => 20], $thresholds);
    }

    public function test_set_and_get_custom_thresholds(): void
    {
        $customThresholds = ['large' => 150, 'medium' => 30];
        $this->service->setThresholds($customThresholds);
        
        $thresholds = $this->service->getCompanySizeThresholds();
        
        $this->assertEquals(['large' => 150, 'medium' => 30], $thresholds);
    }

    public function test_classify_multiple_vendors(): void
    {
        $vendors = [
            $this->createVendorMock(['id' => 1, 'total_orders' => 5]),
            $this->createVendorMock(['id' => 2, 'total_orders' => 50]),
            $this->createVendorMock(['id' => 3, 'total_orders' => 150]),
        ];
        
        $results = $this->service->classifyMultipleVendors($vendors);
        
        $this->assertCount(3, $results);
        $this->assertEquals('small', $results[1]['company_size']);
        $this->assertEquals('medium', $results[2]['company_size']);
        $this->assertEquals('large', $results[3]['company_size']);
    }

    public function test_get_classification_stats(): void
    {
        $vendors = [
            $this->createVendorMock(['total_orders' => 5]),
            $this->createVendorMock(['total_orders' => 10]),
            $this->createVendorMock(['total_orders' => 50]),
            $this->createVendorMock(['total_orders' => 70]),
            $this->createVendorMock(['total_orders' => 150]),
        ];
        
        $stats = $this->service->getClassificationStats($vendors);
        
        $this->assertEquals(5, $stats['total']);
        $this->assertEquals(2, $stats['small']);
        $this->assertEquals(2, $stats['medium']);
        $this->assertEquals(1, $stats['large']);
        $this->assertEquals(40.0, $stats['percentages']['small']);
        $this->assertEquals(40.0, $stats['percentages']['medium']);
        $this->assertEquals(20.0, $stats['percentages']['large']);
    }

    public function test_classification_stats_with_empty_vendors(): void
    {
        $stats = $this->service->getClassificationStats([]);
        
        $this->assertEquals(0, $stats['total']);
        $this->assertEquals(0.0, $stats['percentages']['small']);
        $this->assertEquals(0.0, $stats['percentages']['medium']);
        $this->assertEquals(0.0, $stats['percentages']['large']);
    }

    public function test_edge_case_zero_orders(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 0]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('small', $size);
    }

    public function test_edge_case_negative_orders_treated_as_small(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => -10]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('small', $size);
    }

    public function test_edge_case_very_large_order_count(): void
    {
        $vendor = $this->createVendorMock(['total_orders' => 999999]);
        
        $size = $this->service->calculateCompanySize($vendor);
        
        $this->assertEquals('large', $size);
    }

    public function test_custom_threshold_overrides_only_specified_values(): void
    {
        $service = new VendorClassificationService(['large' => 150]);
        
        $thresholds = $service->getCompanySizeThresholds();
        
        $this->assertEquals(150, $thresholds['large']);
        $this->assertEquals(20, $thresholds['medium']);
    }

    public function test_set_thresholds_persists_across_multiple_calls(): void
    {
        $this->service->setThresholds(['large' => 300, 'medium' => 60]);
        
        $vendor1 = $this->createVendorMock(['total_orders' => 100]);
        $vendor2 = $this->createVendorMock(['total_orders' => 250]);
        
        $this->assertEquals('medium', $this->service->calculateCompanySize($vendor1));
        $this->assertEquals('medium', $this->service->calculateCompanySize($vendor2));
    }

    public function test_classify_multiple_vendors_includes_threshold_info(): void
    {
        $vendors = [
            $this->createVendorMock(['id' => 1, 'total_orders' => 50]),
        ];
        
        $results = $this->service->classifyMultipleVendors($vendors);
        
        $this->assertArrayHasKey('thresholds_used', $results[1]);
        $this->assertEquals(['large' => 100, 'medium' => 20], $results[1]['thresholds_used']);
    }

    public function test_classification_stats_calculates_correct_percentages_with_uneven_distribution(): void
    {
        $vendors = [
            $this->createVendorMock(['total_orders' => 150]),
            $this->createVendorMock(['total_orders' => 120]),
            $this->createVendorMock(['total_orders' => 110]),
            $this->createVendorMock(['total_orders' => 50]),
            $this->createVendorMock(['total_orders' => 5]),
            $this->createVendorMock(['total_orders' => 3]),
        ];
        
        $stats = $this->service->getClassificationStats($vendors);
        
        $this->assertEquals(6, $stats['total']);
        $this->assertEquals(3, $stats['large']);
        $this->assertEquals(1, $stats['medium']);
        $this->assertEquals(2, $stats['small']);
        $this->assertEquals(50.0, $stats['percentages']['large']);
        $this->assertEquals(16.67, $stats['percentages']['medium']);
        $this->assertEquals(33.33, $stats['percentages']['small']);
    }

    public function test_multiple_vendors_with_same_order_count(): void
    {
        $vendors = [
            $this->createVendorMock(['id' => 1, 'total_orders' => 100]),
            $this->createVendorMock(['id' => 2, 'total_orders' => 100]),
            $this->createVendorMock(['id' => 3, 'total_orders' => 100]),
        ];
        
        $results = $this->service->classifyMultipleVendors($vendors);
        
        foreach ($results as $result) {
            $this->assertEquals('large', $result['company_size']);
            $this->assertEquals(100, $result['total_orders']);
        }
    }
}
