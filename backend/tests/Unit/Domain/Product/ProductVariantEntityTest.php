<?php

namespace Tests\Unit\Domain\Product;

use Tests\TestCase;
use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use DateTime;
use InvalidArgumentException;

class ProductVariantEntityTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_data(): void
    {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $categoryId = new Uuid('456e7890-e12b-34c5-d678-901234567890');
        $material = ProductMaterial::AKRILIK;
        $quality = ProductQuality::STANDARD;

        $variant = new ProductVariant($id, $tenantId, $categoryId, $material, $quality);

        $this->assertEquals($id, $variant->getId());
        $this->assertEquals($tenantId, $variant->getTenantId());
        $this->assertEquals($categoryId, $variant->getCategoryId());
        $this->assertEquals($material, $variant->getMaterial());
        $this->assertEquals($quality, $variant->getQuality());
        $this->assertTrue($variant->isActive());
        $this->assertEquals(0, $variant->getStockQuantity());
        $this->assertNull($variant->getBasePrice());
        $this->assertEquals('akrilik-standard', $variant->getSku());
    }

    /** @test */
    public function it_generates_sku_automatically(): void
    {
        $variant1 = $this->createVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant2 = $this->createVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $variant3 = $this->createVariant(ProductMaterial::STAINLESS_STEEL, ProductQuality::PREMIUM);

        $this->assertEquals('akrilik-standard', $variant1->getSku());
        $this->assertEquals('kuningan-tinggi', $variant2->getSku());
        $this->assertEquals('stainless-steel-premium', $variant3->getSku());
    }

    /** @test */
    public function it_can_update_pricing_information(): void
    {
        $variant = $this->createVariant();
        
        $variant->updatePricing(100000.00, 125000.00, 150000.00);
        
        $this->assertEquals(100000.00, $variant->getBasePrice());
        $this->assertEquals(125000.00, $variant->getSellingPrice());
        $this->assertEquals(150000.00, $variant->getRetailPrice());
        $this->assertEquals(25.00, $variant->getProfitMarginPercentage());
    }

    /** @test */
    public function it_calculates_profit_margin_correctly(): void
    {
        $variant = $this->createVariant();
        
        // 25% margin: base 100k, selling 125k
        $variant->updatePricing(100000.00, 125000.00, 150000.00);
        $this->assertEquals(25.00, $variant->getProfitMarginPercentage());
        
        // 50% margin: base 100k, selling 150k
        $variant->updatePricing(100000.00, 150000.00, 175000.00);
        $this->assertEquals(50.00, $variant->getProfitMarginPercentage());
    }

    /** @test */
    public function it_handles_zero_base_price_for_profit_margin(): void
    {
        $variant = $this->createVariant();
        
        $variant->updatePricing(0.00, 100000.00, 125000.00);
        
        $this->assertEquals(0.00, $variant->getProfitMarginPercentage());
    }

    /** @test */
    public function it_can_update_stock_quantity(): void
    {
        $variant = $this->createVariant();
        
        $variant->updateStock(100);
        
        $this->assertEquals(100, $variant->getStockQuantity());
        $this->assertTrue($variant->hasStock());
        $this->assertFalse($variant->isOutOfStock());
    }

    /** @test */
    public function it_can_increase_stock(): void
    {
        $variant = $this->createVariant();
        $variant->updateStock(50);
        
        $variant->increaseStock(30);
        
        $this->assertEquals(80, $variant->getStockQuantity());
    }

    /** @test */
    public function it_can_decrease_stock(): void
    {
        $variant = $this->createVariant();
        $variant->updateStock(50);
        
        $variant->decreaseStock(20);
        
        $this->assertEquals(30, $variant->getStockQuantity());
    }

    /** @test */
    public function it_prevents_negative_stock_decrease(): void
    {
        $variant = $this->createVariant();
        $variant->updateStock(10);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot decrease stock below zero');
        
        $variant->decreaseStock(20);
    }

    /** @test */
    public function it_can_set_low_stock_threshold(): void
    {
        $variant = $this->createVariant();
        
        $variant->setLowStockThreshold(10);
        $variant->updateStock(5);
        
        $this->assertEquals(10, $variant->getLowStockThreshold());
        $this->assertTrue($variant->isLowStock());
    }

    /** @test */
    public function it_can_check_stock_status(): void
    {
        $variant = $this->createVariant();
        $variant->setLowStockThreshold(10);
        
        // Out of stock
        $variant->updateStock(0);
        $this->assertTrue($variant->isOutOfStock());
        $this->assertFalse($variant->hasStock());
        $this->assertFalse($variant->isLowStock());
        
        // Low stock
        $variant->updateStock(5);
        $this->assertFalse($variant->isOutOfStock());
        $this->assertTrue($variant->hasStock());
        $this->assertTrue($variant->isLowStock());
        
        // Normal stock
        $variant->updateStock(20);
        $this->assertFalse($variant->isOutOfStock());
        $this->assertTrue($variant->hasStock());
        $this->assertFalse($variant->isLowStock());
    }

    /** @test */
    public function it_can_set_dimensions(): void
    {
        $variant = $this->createVariant();
        
        $variant->setDimensions(10.5, 15.2, 2.0);
        
        $this->assertEquals(10.5, $variant->getLength());
        $this->assertEquals(15.2, $variant->getWidth());
        $this->assertEquals(2.0, $variant->getThickness());
        $this->assertEquals(319.2, $variant->getArea()); // 10.5 * 15.2
        $this->assertEquals(638.4, $variant->getVolume()); // 10.5 * 15.2 * 2.0
    }

    /** @test */
    public function it_validates_positive_dimensions(): void
    {
        $variant = $this->createVariant();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Dimensions must be positive numbers');
        
        $variant->setDimensions(-1.0, 10.0, 2.0);
    }

    /** @test */
    public function it_can_set_weight(): void
    {
        $variant = $this->createVariant();
        
        $variant->setWeight(250.5);
        
        $this->assertEquals(250.5, $variant->getWeight());
    }

    /** @test */
    public function it_validates_positive_weight(): void
    {
        $variant = $this->createVariant();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Weight must be a positive number');
        
        $variant->setWeight(-10.0);
    }

    /** @test */
    public function it_can_be_activated_and_deactivated(): void
    {
        $variant = $this->createVariant();
        
        $variant->deactivate();
        $this->assertFalse($variant->isActive());
        
        $variant->activate();
        $this->assertTrue($variant->isActive());
    }

    /** @test */
    public function it_can_set_custom_sku(): void
    {
        $variant = $this->createVariant();
        
        $variant->setCustomSku('CUSTOM-SKU-001');
        
        $this->assertEquals('CUSTOM-SKU-001', $variant->getSku());
    }

    /** @test */
    public function it_validates_unique_sku_format(): void
    {
        $variant = $this->createVariant();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('SKU must be unique and contain only alphanumeric characters and hyphens');
        
        $variant->setCustomSku('invalid sku with spaces!');
    }

    /** @test */
    public function it_can_set_etching_specifications(): void
    {
        $variant = $this->createVariant();
        
        $specs = [
            'finish' => 'glossy',
            'edge_treatment' => 'polished',
            'engraving_depth' => '0.5mm',
            'color_fill' => 'black'
        ];
        
        $variant->setEtchingSpecifications($specs);
        
        $this->assertEquals($specs, $variant->getEtchingSpecifications());
        $this->assertEquals('glossy', $variant->getEtchingSpecification('finish'));
        $this->assertNull($variant->getEtchingSpecification('non_existent'));
    }

    /** @test */
    public function it_can_check_material_properties(): void
    {
        $akrlikVariant = $this->createVariant(ProductMaterial::AKRILIK);
        $kuninganVariant = $this->createVariant(ProductMaterial::KUNINGAN);
        $stainlessVariant = $this->createVariant(ProductMaterial::STAINLESS_STEEL);
        
        $this->assertTrue($akrlikVariant->isMaterial(ProductMaterial::AKRILIK));
        $this->assertFalse($akrlikVariant->isMaterial(ProductMaterial::KUNINGAN));
        
        $this->assertTrue($akrlikVariant->isPlasticMaterial());
        $this->assertTrue($kuninganVariant->isMetalMaterial());
        $this->assertTrue($stainlessVariant->isMetalMaterial());
        
        $this->assertFalse($akrlikVariant->isMetalMaterial());
        $this->assertFalse($kuninganVariant->isPlasticMaterial());
    }

    /** @test */
    public function it_can_check_quality_level(): void
    {
        $standardVariant = $this->createVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $premiumVariant = $this->createVariant(ProductMaterial::AKRILIK, ProductQuality::PREMIUM);
        
        $this->assertTrue($standardVariant->isQuality(ProductQuality::STANDARD));
        $this->assertFalse($standardVariant->isQuality(ProductQuality::PREMIUM));
        
        $this->assertTrue($standardVariant->isStandardQuality());
        $this->assertTrue($premiumVariant->isPremiumQuality());
        
        $this->assertFalse($standardVariant->isPremiumQuality());
        $this->assertFalse($premiumVariant->isStandardQuality());
    }

    /** @test */
    public function it_applies_material_and_quality_pricing_multipliers(): void
    {
        $variant = $this->createVariant(ProductMaterial::KUNINGAN, ProductQuality::PREMIUM);
        $basePrice = 100000.00;
        
        $calculatedPrice = $variant->calculatePriceWithMultipliers($basePrice);
        
        // Kuningan multiplier (1.8) * Premium multiplier (1.7) * base price
        $expectedPrice = $basePrice * 1.8 * 1.7; // 306,000
        $this->assertEquals($expectedPrice, $calculatedPrice);
    }

    /** @test */
    public function it_can_convert_to_array(): void
    {
        $variant = $this->createVariant();
        $variant->updatePricing(100000.00, 125000.00, 150000.00);
        $variant->updateStock(50);
        $variant->setDimensions(10.0, 15.0, 2.0);
        
        $array = $variant->toArray();
        
        $this->assertIsArray($array);
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('tenant_id', $array);
        $this->assertArrayHasKey('category_id', $array);
        $this->assertArrayHasKey('material', $array);
        $this->assertArrayHasKey('quality', $array);
        $this->assertArrayHasKey('sku', $array);
        $this->assertArrayHasKey('base_price', $array);
        $this->assertArrayHasKey('selling_price', $array);
        $this->assertArrayHasKey('stock_quantity', $array);
        $this->assertArrayHasKey('length', $array);
        $this->assertArrayHasKey('width', $array);
        $this->assertArrayHasKey('thickness', $array);
        $this->assertEquals('akrilik', $array['material']);
        $this->assertEquals('standard', $array['quality']);
        $this->assertEquals(100000.00, $array['base_price']);
        $this->assertEquals(50, $array['stock_quantity']);
    }

    /** @test */
    public function it_generates_variant_display_name(): void
    {
        $variant = $this->createVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        
        $displayName = $variant->getDisplayName();
        
        $this->assertEquals('Kuningan - Tinggi', $displayName);
    }

    private function createVariant(
        ProductMaterial $material = ProductMaterial::AKRILIK,
        ProductQuality $quality = ProductQuality::STANDARD
    ): ProductVariant {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $categoryId = new Uuid('456e7890-e12b-34c5-d678-901234567890');

        return new ProductVariant($id, $tenantId, $categoryId, $material, $quality);
    }
}