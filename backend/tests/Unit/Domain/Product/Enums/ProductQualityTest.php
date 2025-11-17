<?php

namespace Tests\Unit\Domain\Product\Enums;

use Tests\TestCase;
use App\Domain\Product\Enums\ProductQuality;

class ProductQualityTest extends TestCase
{
    /** @test */
    public function it_has_all_expected_quality_values(): void
    {
        $expectedQualities = [
            ProductQuality::STANDARD,
            ProductQuality::TINGGI,
            ProductQuality::PREMIUM,
        ];

        $actualQualities = ProductQuality::cases();

        $this->assertCount(3, $actualQualities);
        
        foreach ($expectedQualities as $expected) {
            $this->assertContains($expected, $actualQualities);
        }
    }

    /** @test */
    public function it_returns_correct_string_values(): void
    {
        $this->assertEquals('standard', ProductQuality::STANDARD->value);
        $this->assertEquals('tinggi', ProductQuality::TINGGI->value);
        $this->assertEquals('premium', ProductQuality::PREMIUM->value);
    }

    /** @test */
    public function it_returns_correct_display_names(): void
    {
        $this->assertEquals('Standard', ProductQuality::STANDARD->getDisplayName());
        $this->assertEquals('Tinggi', ProductQuality::TINGGI->getDisplayName());
        $this->assertEquals('Premium', ProductQuality::PREMIUM->getDisplayName());
    }

    /** @test */
    public function it_returns_correct_descriptions(): void
    {
        $this->assertEquals(
            'Kualitas standar dengan presisi dasar dan finishing normal',
            ProductQuality::STANDARD->getDescription()
        );
        
        $this->assertEquals(
            'Kualitas tinggi dengan presisi lebih baik dan finishing halus',
            ProductQuality::TINGGI->getDescription()
        );
        
        $this->assertEquals(
            'Kualitas premium dengan presisi maksimal dan finishing sempurna',
            ProductQuality::PREMIUM->getDescription()
        );
    }

    /** @test */
    public function it_returns_correct_pricing_multipliers(): void
    {
        $this->assertEquals(1.0, ProductQuality::STANDARD->getPricingMultiplier());
        $this->assertEquals(1.3, ProductQuality::TINGGI->getPricingMultiplier());
        $this->assertEquals(1.7, ProductQuality::PREMIUM->getPricingMultiplier());
    }

    /** @test */
    public function it_returns_correct_precision_levels(): void
    {
        $this->assertEquals('±0.2mm', ProductQuality::STANDARD->getPrecisionLevel());
        $this->assertEquals('±0.1mm', ProductQuality::TINGGI->getPrecisionLevel());
        $this->assertEquals('±0.05mm', ProductQuality::PREMIUM->getPrecisionLevel());
    }

    /** @test */
    public function it_returns_correct_surface_finish_quality(): void
    {
        $this->assertEquals('Ra 3.2', ProductQuality::STANDARD->getSurfaceFinish());
        $this->assertEquals('Ra 1.6', ProductQuality::TINGGI->getSurfaceFinish());
        $this->assertEquals('Ra 0.8', ProductQuality::PREMIUM->getSurfaceFinish());
    }

    /** @test */
    public function it_returns_correct_inspection_levels(): void
    {
        $this->assertEquals('Visual', ProductQuality::STANDARD->getInspectionLevel());
        $this->assertEquals('Dimensional + Visual', ProductQuality::TINGGI->getInspectionLevel());
        $this->assertEquals('Full CMM + Visual + Dimensional', ProductQuality::PREMIUM->getInspectionLevel());
    }

    /** @test */
    public function it_returns_correct_lead_times(): void
    {
        $this->assertEquals(3, ProductQuality::STANDARD->getLeadTimeDays());
        $this->assertEquals(5, ProductQuality::TINGGI->getLeadTimeDays());
        $this->assertEquals(7, ProductQuality::PREMIUM->getLeadTimeDays());
    }

    /** @test */
    public function it_returns_correct_minimum_order_quantities(): void
    {
        $this->assertEquals(1, ProductQuality::STANDARD->getMinimumOrderQuantity());
        $this->assertEquals(1, ProductQuality::TINGGI->getMinimumOrderQuantity());
        $this->assertEquals(5, ProductQuality::PREMIUM->getMinimumOrderQuantity());
    }

    /** @test */
    public function it_returns_available_finishes_per_quality(): void
    {
        $this->assertEquals(
            ['basic', 'standard'],
            ProductQuality::STANDARD->getAvailableFinishes()
        );
        
        $this->assertEquals(
            ['standard', 'fine', 'smooth'],
            ProductQuality::TINGGI->getAvailableFinishes()
        );
        
        $this->assertEquals(
            ['smooth', 'mirror', 'polished', 'custom'],
            ProductQuality::PREMIUM->getAvailableFinishes()
        );
    }

    /** @test */
    public function it_returns_correct_quality_certifications(): void
    {
        $this->assertEquals(
            ['Basic QC'],
            ProductQuality::STANDARD->getCertifications()
        );
        
        $this->assertEquals(
            ['ISO 9001', 'Dimensional Report'],
            ProductQuality::TINGGI->getCertifications()
        );
        
        $this->assertEquals(
            ['ISO 9001', 'AS9100', 'CMM Report', 'Material Certificate'],
            ProductQuality::PREMIUM->getCertifications()
        );
    }

    /** @test */
    public function it_checks_if_requires_special_tooling(): void
    {
        $this->assertFalse(ProductQuality::STANDARD->requiresSpecialTooling());
        $this->assertFalse(ProductQuality::TINGGI->requiresSpecialTooling());
        $this->assertTrue(ProductQuality::PREMIUM->requiresSpecialTooling());
    }

    /** @test */
    public function it_checks_if_requires_quality_approval(): void
    {
        $this->assertFalse(ProductQuality::STANDARD->requiresQualityApproval());
        $this->assertTrue(ProductQuality::TINGGI->requiresQualityApproval());
        $this->assertTrue(ProductQuality::PREMIUM->requiresQualityApproval());
    }

    /** @test */
    public function it_checks_if_includes_documentation(): void
    {
        $this->assertFalse(ProductQuality::STANDARD->includesDocumentation());
        $this->assertTrue(ProductQuality::TINGGI->includesDocumentation());
        $this->assertTrue(ProductQuality::PREMIUM->includesDocumentation());
    }

    /** @test */
    public function it_returns_correct_etching_depth_precision(): void
    {
        $this->assertEquals('±0.05mm', ProductQuality::STANDARD->getEtchingDepthPrecision());
        $this->assertEquals('±0.02mm', ProductQuality::TINGGI->getEtchingDepthPrecision());
        $this->assertEquals('±0.01mm', ProductQuality::PREMIUM->getEtchingDepthPrecision());
    }

    /** @test */
    public function it_returns_correct_edge_quality_levels(): void
    {
        $this->assertEquals('Standard', ProductQuality::STANDARD->getEdgeQuality());
        $this->assertEquals('Deburred', ProductQuality::TINGGI->getEdgeQuality());
        $this->assertEquals('Polished', ProductQuality::PREMIUM->getEdgeQuality());
    }

    /** @test */
    public function it_calculates_price_with_multiplier(): void
    {
        $basePrice = 100000.00;
        
        $this->assertEquals(100000.00, ProductQuality::STANDARD->calculatePrice($basePrice));
        $this->assertEquals(130000.00, ProductQuality::TINGGI->calculatePrice($basePrice));
        $this->assertEquals(170000.00, ProductQuality::PREMIUM->calculatePrice($basePrice));
    }

    /** @test */
    public function it_can_be_created_from_string(): void
    {
        $this->assertEquals(ProductQuality::STANDARD, ProductQuality::fromString('standard'));
        $this->assertEquals(ProductQuality::TINGGI, ProductQuality::fromString('tinggi'));
        $this->assertEquals(ProductQuality::PREMIUM, ProductQuality::fromString('premium'));
    }

    /** @test */
    public function it_throws_exception_for_invalid_string(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid quality: invalid_quality');
        
        ProductQuality::fromString('invalid_quality');
    }

    /** @test */
    public function it_returns_all_qualities_as_options(): void
    {
        $options = ProductQuality::getOptions();
        
        $this->assertIsArray($options);
        $this->assertCount(3, $options);
        $this->assertEquals('Standard', $options['standard']);
        $this->assertEquals('Tinggi', $options['tinggi']);
        $this->assertEquals('Premium', $options['premium']);
    }

    /** @test */
    public function it_can_compare_quality_levels(): void
    {
        $this->assertTrue(ProductQuality::TINGGI->isHigherThan(ProductQuality::STANDARD));
        $this->assertTrue(ProductQuality::PREMIUM->isHigherThan(ProductQuality::STANDARD));
        $this->assertTrue(ProductQuality::PREMIUM->isHigherThan(ProductQuality::TINGGI));
        
        $this->assertFalse(ProductQuality::STANDARD->isHigherThan(ProductQuality::TINGGI));
        $this->assertFalse(ProductQuality::TINGGI->isHigherThan(ProductQuality::PREMIUM));
    }

    /** @test */
    public function it_can_check_if_is_lower_quality(): void
    {
        $this->assertTrue(ProductQuality::STANDARD->isLowerThan(ProductQuality::TINGGI));
        $this->assertTrue(ProductQuality::STANDARD->isLowerThan(ProductQuality::PREMIUM));
        $this->assertTrue(ProductQuality::TINGGI->isLowerThan(ProductQuality::PREMIUM));
        
        $this->assertFalse(ProductQuality::TINGGI->isLowerThan(ProductQuality::STANDARD));
        $this->assertFalse(ProductQuality::PREMIUM->isLowerThan(ProductQuality::TINGGI));
    }

    /** @test */
    public function it_returns_quality_level_numeric_value(): void
    {
        $this->assertEquals(1, ProductQuality::STANDARD->getLevel());
        $this->assertEquals(2, ProductQuality::TINGGI->getLevel());
        $this->assertEquals(3, ProductQuality::PREMIUM->getLevel());
    }

    /** @test */
    public function it_can_sort_qualities_by_level(): void
    {
        $qualities = [
            ProductQuality::PREMIUM,
            ProductQuality::STANDARD,
            ProductQuality::TINGGI,
        ];

        $sorted = ProductQuality::sortByLevel($qualities);
        
        $this->assertEquals(ProductQuality::STANDARD, $sorted[0]);
        $this->assertEquals(ProductQuality::TINGGI, $sorted[1]);
        $this->assertEquals(ProductQuality::PREMIUM, $sorted[2]);
    }

    /** @test */
    public function it_returns_qualities_above_level(): void
    {
        $aboveStandard = ProductQuality::getQualitiesAbove(ProductQuality::STANDARD);
        
        $this->assertCount(2, $aboveStandard);
        $this->assertContains(ProductQuality::TINGGI, $aboveStandard);
        $this->assertContains(ProductQuality::PREMIUM, $aboveStandard);
        $this->assertNotContains(ProductQuality::STANDARD, $aboveStandard);
        
        $aboveTinggi = ProductQuality::getQualitiesAbove(ProductQuality::TINGGI);
        
        $this->assertCount(1, $aboveTinggi);
        $this->assertContains(ProductQuality::PREMIUM, $aboveTinggi);
        $this->assertNotContains(ProductQuality::TINGGI, $aboveTinggi);
        $this->assertNotContains(ProductQuality::STANDARD, $aboveTinggi);
    }

    /** @test */
    public function it_returns_qualities_below_level(): void
    {
        $belowPremium = ProductQuality::getQualitiesBelow(ProductQuality::PREMIUM);
        
        $this->assertCount(2, $belowPremium);
        $this->assertContains(ProductQuality::STANDARD, $belowPremium);
        $this->assertContains(ProductQuality::TINGGI, $belowPremium);
        $this->assertNotContains(ProductQuality::PREMIUM, $belowPremium);
        
        $belowTinggi = ProductQuality::getQualitiesBelow(ProductQuality::TINGGI);
        
        $this->assertCount(1, $belowTinggi);
        $this->assertContains(ProductQuality::STANDARD, $belowTinggi);
        $this->assertNotContains(ProductQuality::TINGGI, $belowTinggi);
        $this->assertNotContains(ProductQuality::PREMIUM, $belowTinggi);
    }

    /** @test */
    public function it_calculates_quality_upgrade_cost(): void
    {
        $basePrice = 100000.00;
        
        // No upgrade cost for same quality
        $this->assertEquals(0.00, ProductQuality::STANDARD->calculateUpgradeCost($basePrice, ProductQuality::STANDARD));
        
        // Upgrade from Standard to Tinggi
        $this->assertEquals(30000.00, ProductQuality::STANDARD->calculateUpgradeCost($basePrice, ProductQuality::TINGGI));
        
        // Upgrade from Standard to Premium
        $this->assertEquals(70000.00, ProductQuality::STANDARD->calculateUpgradeCost($basePrice, ProductQuality::PREMIUM));
        
        // Upgrade from Tinggi to Premium
        $tinggiPrice = $basePrice * 1.3; // 130,000
        $premiumPrice = $basePrice * 1.7; // 170,000
        $expectedUpgrade = $premiumPrice - $tinggiPrice; // 40,000
        $this->assertEquals($expectedUpgrade, ProductQuality::TINGGI->calculateUpgradeCost($basePrice, ProductQuality::PREMIUM));
    }

    /** @test */
    public function it_returns_compatible_materials_per_quality(): void
    {
        // All qualities should be compatible with all materials, 
        // but premium might have additional requirements
        $standardMaterials = ProductQuality::STANDARD->getCompatibleMaterials();
        $tinggiMaterials = ProductQuality::TINGGI->getCompatibleMaterials();
        $premiumMaterials = ProductQuality::PREMIUM->getCompatibleMaterials();
        
        $this->assertIsArray($standardMaterials);
        $this->assertIsArray($tinggiMaterials);
        $this->assertIsArray($premiumMaterials);
        
        // All should have at least basic materials
        $this->assertGreaterThan(0, count($standardMaterials));
        $this->assertGreaterThan(0, count($tinggiMaterials));
        $this->assertGreaterThan(0, count($premiumMaterials));
    }

    /** @test */
    public function it_checks_if_quality_is_suitable_for_application(): void
    {
        $this->assertTrue(ProductQuality::STANDARD->isSuitableFor('basic_signage'));
        $this->assertTrue(ProductQuality::TINGGI->isSuitableFor('precision_parts'));
        $this->assertTrue(ProductQuality::PREMIUM->isSuitableFor('aerospace_components'));
        
        $this->assertFalse(ProductQuality::STANDARD->isSuitableFor('aerospace_components'));
        $this->assertTrue(ProductQuality::PREMIUM->isSuitableFor('basic_signage')); // Higher quality can do lower applications
    }

    /** @test */
    public function it_returns_recommended_applications(): void
    {
        $standardApps = ProductQuality::STANDARD->getRecommendedApplications();
        $tinggiApps = ProductQuality::TINGGI->getRecommendedApplications();
        $premiumApps = ProductQuality::PREMIUM->getRecommendedApplications();
        
        $this->assertIsArray($standardApps);
        $this->assertIsArray($tinggiApps);
        $this->assertIsArray($premiumApps);
        
        $this->assertContains('signage', $standardApps);
        $this->assertContains('nameplates', $tinggiApps);
        $this->assertContains('precision_instruments', $premiumApps);
    }
}