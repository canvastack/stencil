<?php

namespace Tests\Unit\Domain\Product\Enums;

use Tests\TestCase;
use App\Domain\Product\Enums\ProductMaterial;

class ProductMaterialTest extends TestCase
{
    /** @test */
    public function it_has_all_expected_material_values(): void
    {
        $expectedMaterials = [
            ProductMaterial::AKRILIK,
            ProductMaterial::KUNINGAN,
            ProductMaterial::TEMBAGA,
            ProductMaterial::STAINLESS_STEEL,
            ProductMaterial::ALUMINUM,
        ];

        $actualMaterials = ProductMaterial::cases();

        $this->assertCount(5, $actualMaterials);
        
        foreach ($expectedMaterials as $expected) {
            $this->assertContains($expected, $actualMaterials);
        }
    }

    /** @test */
    public function it_returns_correct_string_values(): void
    {
        $this->assertEquals('akrilik', ProductMaterial::AKRILIK->value);
        $this->assertEquals('kuningan', ProductMaterial::KUNINGAN->value);
        $this->assertEquals('tembaga', ProductMaterial::TEMBAGA->value);
        $this->assertEquals('stainless_steel', ProductMaterial::STAINLESS_STEEL->value);
        $this->assertEquals('aluminum', ProductMaterial::ALUMINUM->value);
    }

    /** @test */
    public function it_returns_correct_display_names(): void
    {
        $this->assertEquals('Akrilik', ProductMaterial::AKRILIK->getDisplayName());
        $this->assertEquals('Kuningan', ProductMaterial::KUNINGAN->getDisplayName());
        $this->assertEquals('Tembaga', ProductMaterial::TEMBAGA->getDisplayName());
        $this->assertEquals('Stainless Steel', ProductMaterial::STAINLESS_STEEL->getDisplayName());
        $this->assertEquals('Aluminum', ProductMaterial::ALUMINUM->getDisplayName());
    }

    /** @test */
    public function it_returns_correct_descriptions(): void
    {
        $this->assertEquals(
            'Bahan plastik akrilik berkualitas tinggi, tahan lama dan mudah dibentuk',
            ProductMaterial::AKRILIK->getDescription()
        );
        
        $this->assertEquals(
            'Logam kuningan dengan daya tahan tinggi dan tampilan elegan',
            ProductMaterial::KUNINGAN->getDescription()
        );
        
        $this->assertEquals(
            'Logam tembaga murni dengan konduktivitas tinggi',
            ProductMaterial::TEMBAGA->getDescription()
        );
        
        $this->assertEquals(
            'Stainless steel anti karat dengan kekuatan maksimal',
            ProductMaterial::STAINLESS_STEEL->getDescription()
        );
        
        $this->assertEquals(
            'Aluminum ringan dan tahan korosi untuk berbagai aplikasi',
            ProductMaterial::ALUMINUM->getDescription()
        );
    }

    /** @test */
    public function it_returns_correct_pricing_multipliers(): void
    {
        $this->assertEquals(1.0, ProductMaterial::AKRILIK->getPricingMultiplier());
        $this->assertEquals(1.8, ProductMaterial::KUNINGAN->getPricingMultiplier());
        $this->assertEquals(2.2, ProductMaterial::TEMBAGA->getPricingMultiplier());
        $this->assertEquals(2.5, ProductMaterial::STAINLESS_STEEL->getPricingMultiplier());
        $this->assertEquals(1.5, ProductMaterial::ALUMINUM->getPricingMultiplier());
    }

    /** @test */
    public function it_identifies_metal_materials_correctly(): void
    {
        $this->assertFalse(ProductMaterial::AKRILIK->isMetal());
        $this->assertTrue(ProductMaterial::KUNINGAN->isMetal());
        $this->assertTrue(ProductMaterial::TEMBAGA->isMetal());
        $this->assertTrue(ProductMaterial::STAINLESS_STEEL->isMetal());
        $this->assertTrue(ProductMaterial::ALUMINUM->isMetal());
    }

    /** @test */
    public function it_identifies_plastic_materials_correctly(): void
    {
        $this->assertTrue(ProductMaterial::AKRILIK->isPlastic());
        $this->assertFalse(ProductMaterial::KUNINGAN->isPlastic());
        $this->assertFalse(ProductMaterial::TEMBAGA->isPlastic());
        $this->assertFalse(ProductMaterial::STAINLESS_STEEL->isPlastic());
        $this->assertFalse(ProductMaterial::ALUMINUM->isPlastic());
    }

    /** @test */
    public function it_returns_correct_density_values(): void
    {
        $this->assertEquals(1.18, ProductMaterial::AKRILIK->getDensity()); // g/cm³
        $this->assertEquals(8.73, ProductMaterial::KUNINGAN->getDensity());
        $this->assertEquals(8.96, ProductMaterial::TEMBAGA->getDensity());
        $this->assertEquals(7.93, ProductMaterial::STAINLESS_STEEL->getDensity());
        $this->assertEquals(2.70, ProductMaterial::ALUMINUM->getDensity());
    }

    /** @test */
    public function it_returns_correct_melting_points(): void
    {
        $this->assertEquals(160, ProductMaterial::AKRILIK->getMeltingPoint()); // °C
        $this->assertEquals(900, ProductMaterial::KUNINGAN->getMeltingPoint());
        $this->assertEquals(1085, ProductMaterial::TEMBAGA->getMeltingPoint());
        $this->assertEquals(1400, ProductMaterial::STAINLESS_STEEL->getMeltingPoint());
        $this->assertEquals(660, ProductMaterial::ALUMINUM->getMeltingPoint());
    }

    /** @test */
    public function it_returns_correct_hardness_levels(): void
    {
        $this->assertEquals('Sedang', ProductMaterial::AKRILIK->getHardnessLevel());
        $this->assertEquals('Tinggi', ProductMaterial::KUNINGAN->getHardnessLevel());
        $this->assertEquals('Sedang', ProductMaterial::TEMBAGA->getHardnessLevel());
        $this->assertEquals('Sangat Tinggi', ProductMaterial::STAINLESS_STEEL->getHardnessLevel());
        $this->assertEquals('Sedang', ProductMaterial::ALUMINUM->getHardnessLevel());
    }

    /** @test */
    public function it_returns_correct_corrosion_resistance(): void
    {
        $this->assertEquals('Baik', ProductMaterial::AKRILIK->getCorrosionResistance());
        $this->assertEquals('Baik', ProductMaterial::KUNINGAN->getCorrosionResistance());
        $this->assertEquals('Sedang', ProductMaterial::TEMBAGA->getCorrosionResistance());
        $this->assertEquals('Sangat Baik', ProductMaterial::STAINLESS_STEEL->getCorrosionResistance());
        $this->assertEquals('Baik', ProductMaterial::ALUMINUM->getCorrosionResistance());
    }

    /** @test */
    public function it_returns_correct_workability_levels(): void
    {
        $this->assertEquals('Mudah', ProductMaterial::AKRILIK->getWorkability());
        $this->assertEquals('Sedang', ProductMaterial::KUNINGAN->getWorkability());
        $this->assertEquals('Mudah', ProductMaterial::TEMBAGA->getWorkability());
        $this->assertEquals('Sulit', ProductMaterial::STAINLESS_STEEL->getWorkability());
        $this->assertEquals('Mudah', ProductMaterial::ALUMINUM->getWorkability());
    }

    /** @test */
    public function it_returns_correct_etching_suitability(): void
    {
        $this->assertEquals('Sangat Baik', ProductMaterial::AKRILIK->getEtchingSuitability());
        $this->assertEquals('Baik', ProductMaterial::KUNINGAN->getEtchingSuitability());
        $this->assertEquals('Baik', ProductMaterial::TEMBAGA->getEtchingSuitability());
        $this->assertEquals('Sedang', ProductMaterial::STAINLESS_STEEL->getEtchingSuitability());
        $this->assertEquals('Baik', ProductMaterial::ALUMINUM->getEtchingSuitability());
    }

    /** @test */
    public function it_returns_available_thickness_options(): void
    {
        $this->assertEquals(['1mm', '2mm', '3mm', '5mm', '6mm'], ProductMaterial::AKRILIK->getAvailableThicknesses());
        $this->assertEquals(['1mm', '2mm', '3mm'], ProductMaterial::KUNINGAN->getAvailableThicknesses());
        $this->assertEquals(['1mm', '2mm', '3mm'], ProductMaterial::TEMBAGA->getAvailableThicknesses());
        $this->assertEquals(['1mm', '2mm', '3mm', '5mm'], ProductMaterial::STAINLESS_STEEL->getAvailableThicknesses());
        $this->assertEquals(['1mm', '2mm', '3mm', '5mm'], ProductMaterial::ALUMINUM->getAvailableThicknesses());
    }

    /** @test */
    public function it_returns_available_finishes(): void
    {
        $this->assertEquals(['glossy', 'matte', 'frosted'], ProductMaterial::AKRILIK->getAvailableFinishes());
        $this->assertEquals(['polished', 'brushed', 'antique'], ProductMaterial::KUNINGAN->getAvailableFinishes());
        $this->assertEquals(['polished', 'brushed', 'oxidized'], ProductMaterial::TEMBAGA->getAvailableFinishes());
        $this->assertEquals(['brushed', 'mirror', 'satin'], ProductMaterial::STAINLESS_STEEL->getAvailableFinishes());
        $this->assertEquals(['natural', 'anodized', 'brushed'], ProductMaterial::ALUMINUM->getAvailableFinishes());
    }

    /** @test */
    public function it_calculates_weight_correctly(): void
    {
        // Test weight calculation: density × volume (length × width × thickness)
        // Example: Akrilik 10cm × 10cm × 2mm = 100cm² × 0.2cm = 20cm³ × 1.18g/cm³ = 23.6g
        
        $this->assertEquals(23.6, ProductMaterial::AKRILIK->calculateWeight(10.0, 10.0, 2.0)); // 23.6g
        $this->assertEquals(174.6, ProductMaterial::KUNINGAN->calculateWeight(10.0, 10.0, 2.0)); // 174.6g
        $this->assertEquals(179.2, ProductMaterial::TEMBAGA->calculateWeight(10.0, 10.0, 2.0)); // 179.2g
        $this->assertEquals(158.6, ProductMaterial::STAINLESS_STEEL->calculateWeight(10.0, 10.0, 2.0)); // 158.6g
        $this->assertEquals(54.0, ProductMaterial::ALUMINUM->calculateWeight(10.0, 10.0, 2.0)); // 54.0g
    }

    /** @test */
    public function it_can_be_created_from_string(): void
    {
        $this->assertEquals(ProductMaterial::AKRILIK, ProductMaterial::fromString('akrilik'));
        $this->assertEquals(ProductMaterial::KUNINGAN, ProductMaterial::fromString('kuningan'));
        $this->assertEquals(ProductMaterial::TEMBAGA, ProductMaterial::fromString('tembaga'));
        $this->assertEquals(ProductMaterial::STAINLESS_STEEL, ProductMaterial::fromString('stainless_steel'));
        $this->assertEquals(ProductMaterial::ALUMINUM, ProductMaterial::fromString('aluminum'));
    }

    /** @test */
    public function it_throws_exception_for_invalid_string(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid material: invalid_material');
        
        ProductMaterial::fromString('invalid_material');
    }

    /** @test */
    public function it_returns_all_materials_as_options(): void
    {
        $options = ProductMaterial::getOptions();
        
        $this->assertIsArray($options);
        $this->assertCount(5, $options);
        $this->assertEquals('Akrilik', $options['akrilik']);
        $this->assertEquals('Kuningan', $options['kuningan']);
        $this->assertEquals('Tembaga', $options['tembaga']);
        $this->assertEquals('Stainless Steel', $options['stainless_steel']);
        $this->assertEquals('Aluminum', $options['aluminum']);
    }

    /** @test */
    public function it_returns_metal_materials_only(): void
    {
        $metalMaterials = ProductMaterial::getMetalMaterials();
        
        $this->assertCount(4, $metalMaterials);
        $this->assertContains(ProductMaterial::KUNINGAN, $metalMaterials);
        $this->assertContains(ProductMaterial::TEMBAGA, $metalMaterials);
        $this->assertContains(ProductMaterial::STAINLESS_STEEL, $metalMaterials);
        $this->assertContains(ProductMaterial::ALUMINUM, $metalMaterials);
        $this->assertNotContains(ProductMaterial::AKRILIK, $metalMaterials);
    }

    /** @test */
    public function it_returns_plastic_materials_only(): void
    {
        $plasticMaterials = ProductMaterial::getPlasticMaterials();
        
        $this->assertCount(1, $plasticMaterials);
        $this->assertContains(ProductMaterial::AKRILIK, $plasticMaterials);
        $this->assertNotContains(ProductMaterial::KUNINGAN, $plasticMaterials);
    }

    /** @test */
    public function it_returns_materials_suitable_for_etching(): void
    {
        $suitableMaterials = ProductMaterial::getEtchingSuitableMaterials();
        
        // Materials with 'Baik' or 'Sangat Baik' etching suitability
        $this->assertContains(ProductMaterial::AKRILIK, $suitableMaterials); // Sangat Baik
        $this->assertContains(ProductMaterial::KUNINGAN, $suitableMaterials); // Baik
        $this->assertContains(ProductMaterial::TEMBAGA, $suitableMaterials); // Baik
        $this->assertContains(ProductMaterial::ALUMINUM, $suitableMaterials); // Baik
        // Note: Stainless Steel has 'Sedang' suitability, might be excluded depending on implementation
    }

    /** @test */
    public function it_can_compare_materials_by_price(): void
    {
        $materials = [
            ProductMaterial::AKRILIK,
            ProductMaterial::KUNINGAN,
            ProductMaterial::STAINLESS_STEEL,
            ProductMaterial::ALUMINUM,
        ];

        $sortedByPrice = ProductMaterial::sortByPrice($materials);
        
        // Should be sorted by pricing multiplier: Akrilik (1.0), Aluminum (1.5), Kuningan (1.8), Stainless (2.5)
        $this->assertEquals(ProductMaterial::AKRILIK, $sortedByPrice[0]);
        $this->assertEquals(ProductMaterial::ALUMINUM, $sortedByPrice[1]);
        $this->assertEquals(ProductMaterial::KUNINGAN, $sortedByPrice[2]);
        $this->assertEquals(ProductMaterial::STAINLESS_STEEL, $sortedByPrice[3]);
    }

    /** @test */
    public function it_can_get_compatible_finishes_for_material(): void
    {
        $akrlikFinishes = ProductMaterial::AKRILIK->getAvailableFinishes();
        $this->assertContains('glossy', $akrlikFinishes);
        $this->assertContains('matte', $akrlikFinishes);
        
        $kuninganFinishes = ProductMaterial::KUNINGAN->getAvailableFinishes();
        $this->assertContains('polished', $kuninganFinishes);
        $this->assertContains('brushed', $kuninganFinishes);
    }

    /** @test */
    public function it_validates_thickness_availability(): void
    {
        $this->assertTrue(ProductMaterial::AKRILIK->isThicknessAvailable('2mm'));
        $this->assertTrue(ProductMaterial::AKRILIK->isThicknessAvailable('5mm'));
        $this->assertFalse(ProductMaterial::AKRILIK->isThicknessAvailable('10mm'));
        
        $this->assertTrue(ProductMaterial::KUNINGAN->isThicknessAvailable('1mm'));
        $this->assertFalse(ProductMaterial::KUNINGAN->isThicknessAvailable('6mm'));
    }

    /** @test */
    public function it_validates_finish_availability(): void
    {
        $this->assertTrue(ProductMaterial::AKRILIK->isFinishAvailable('glossy'));
        $this->assertTrue(ProductMaterial::AKRILIK->isFinishAvailable('matte'));
        $this->assertFalse(ProductMaterial::AKRILIK->isFinishAvailable('polished'));
        
        $this->assertTrue(ProductMaterial::KUNINGAN->isFinishAvailable('polished'));
        $this->assertFalse(ProductMaterial::KUNINGAN->isFinishAvailable('glossy'));
    }
}