<?php

namespace Tests\Unit\Domain\Product\ValueObjects;

use Tests\TestCase;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use InvalidArgumentException;

class ProductCategorySlugTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_slug(): void
    {
        $slug = new ProductCategorySlug('etching-products');

        $this->assertEquals('etching-products', $slug->getValue());
        $this->assertEquals('etching-products', (string) $slug);
    }

    /** @test */
    public function it_validates_minimum_length(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug must be between 2 and 100 characters');
        
        new ProductCategorySlug('a');
    }

    /** @test */
    public function it_validates_maximum_length(): void
    {
        $longSlug = str_repeat('a', 101);
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug must be between 2 and 100 characters');
        
        new ProductCategorySlug($longSlug);
    }

    /** @test */
    public function it_rejects_empty_slug(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug cannot be empty');
        
        new ProductCategorySlug('');
    }

    /** @test */
    public function it_rejects_slug_with_spaces(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug can only contain lowercase letters, numbers, and hyphens');
        
        new ProductCategorySlug('etching products');
    }

    /** @test */
    public function it_rejects_slug_with_uppercase_letters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug can only contain lowercase letters, numbers, and hyphens');
        
        new ProductCategorySlug('Etching-Products');
    }

    /** @test */
    public function it_rejects_slug_with_special_characters(): void
    {
        $invalidSlugs = [
            'etching@products',
            'etching#products',
            'etching$products',
            'etching%products',
            'etching^products',
            'etching*products',
            'etching+products',
            'etching=products',
            'etching[products]',
            'etching{products}',
            'etching|products',
            'etching\\products',
            'etching"products',
            'etching\'products',
            'etching`products',
            'etching~products',
            'etching?products',
            'etching!products',
            'etching.products',
            'etching,products',
            'etching:products',
            'etching;products',
            'etching<products>',
            'etching(products)',
            'etching/products',
        ];

        foreach ($invalidSlugs as $invalidSlug) {
            $this->expectException(InvalidArgumentException::class);
            $this->expectExceptionMessage('Category slug can only contain lowercase letters, numbers, and hyphens');
            
            new ProductCategorySlug($invalidSlug);
        }
    }

    /** @test */
    public function it_allows_valid_slug_formats(): void
    {
        $validSlugs = [
            'etching-products',
            'laser-etching',
            'akrilik-kuningan',
            'products-123',
            'category-a1-b2-c3',
            'simple',
            'a-very-long-category-name-with-multiple-words-and-numbers-123',
            '123-numeric-start',
            'end-with-123',
        ];

        foreach ($validSlugs as $validSlug) {
            $slug = new ProductCategorySlug($validSlug);
            $this->assertEquals($validSlug, $slug->getValue());
        }
    }

    /** @test */
    public function it_rejects_slug_starting_with_hyphen(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug cannot start or end with hyphen');
        
        new ProductCategorySlug('-etching-products');
    }

    /** @test */
    public function it_rejects_slug_ending_with_hyphen(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug cannot start or end with hyphen');
        
        new ProductCategorySlug('etching-products-');
    }

    /** @test */
    public function it_rejects_slug_with_consecutive_hyphens(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category slug cannot contain consecutive hyphens');
        
        new ProductCategorySlug('etching--products');
    }

    /** @test */
    public function it_can_check_equality(): void
    {
        $slug1 = new ProductCategorySlug('etching-products');
        $slug2 = new ProductCategorySlug('etching-products');
        $slug3 = new ProductCategorySlug('different-slug');

        $this->assertTrue($slug1->equals($slug2));
        $this->assertFalse($slug1->equals($slug3));
    }

    /** @test */
    public function it_can_generate_from_name(): void
    {
        $testCases = [
            'Etching Products' => 'etching-products',
            'Akrilik & Kuningan' => 'akrilik-kuningan',
            'Products - Special Edition' => 'products-special-edition',
            'Custom (Premium)' => 'custom-premium',
            'Type A/B Products' => 'type-a-b-products',
            'Products: Metal Works' => 'products-metal-works',
            'Laser   Etching' => 'laser-etching', // multiple spaces
            'Etching Products!!!' => 'etching-products', // special chars removed
            '123 Numeric Category' => '123-numeric-category',
        ];

        foreach ($testCases as $input => $expected) {
            $slug = ProductCategorySlug::fromName($input);
            $this->assertEquals($expected, $slug->getValue());
        }
    }

    /** @test */
    public function it_handles_unicode_characters_in_generation(): void
    {
        $testCases = [
            'Produk Etching' => 'produk-etching',
            'Café Products' => 'cafe-products',
            'Résumé Category' => 'resume-category',
        ];

        foreach ($testCases as $input => $expected) {
            $slug = ProductCategorySlug::fromName($input);
            $this->assertEquals($expected, $slug->getValue());
        }
    }

    /** @test */
    public function it_removes_stopwords_when_generating_from_name(): void
    {
        $testCases = [
            'The Etching Products' => 'etching-products',
            'A Product Category' => 'product-category',
            'An Important Category' => 'important-category',
            'Products and Services' => 'products-services',
            'Category of Products' => 'category-products',
            'Products in the Shop' => 'products-shop',
        ];

        foreach ($testCases as $input => $expected) {
            $slug = ProductCategorySlug::fromName($input);
            $this->assertEquals($expected, $slug->getValue());
        }
    }

    /** @test */
    public function it_can_get_parent_slug_from_path(): void
    {
        $testCases = [
            'parent-category/child-category' => 'parent-category',
            'root/level1/level2' => 'root/level1',
            'single-level' => null,
        ];

        foreach ($testCases as $input => $expected) {
            $slug = new ProductCategorySlug($input);
            
            if ($expected) {
                $this->assertEquals($expected, $slug->getParentSlug());
            } else {
                $this->assertNull($slug->getParentSlug());
            }
        }
    }

    /** @test */
    public function it_can_check_if_etching_related(): void
    {
        $etchingSlugs = [
            new ProductCategorySlug('etching-products'),
            new ProductCategorySlug('laser-etching'),
            new ProductCategorySlug('chemical-etching'),
            new ProductCategorySlug('engraving-etching'),
            new ProductCategorySlug('etching-services'),
        ];

        $nonEtchingSlugs = [
            new ProductCategorySlug('printing-services'),
            new ProductCategorySlug('wood-products'),
            new ProductCategorySlug('general-manufacturing'),
            new ProductCategorySlug('plastic-molding'),
        ];

        foreach ($etchingSlugs as $slug) {
            $this->assertTrue($slug->isEtchingRelated());
        }

        foreach ($nonEtchingSlugs as $slug) {
            $this->assertFalse($slug->isEtchingRelated());
        }
    }

    /** @test */
    public function it_can_check_if_material_related(): void
    {
        $materialSlugs = [
            new ProductCategorySlug('akrilik-products'),
            new ProductCategorySlug('kuningan-items'),
            new ProductCategorySlug('stainless-steel'),
            new ProductCategorySlug('tembaga-category'),
            new ProductCategorySlug('aluminum-products'),
        ];

        $nonMaterialSlugs = [
            new ProductCategorySlug('services-category'),
            new ProductCategorySlug('general-products'),
            new ProductCategorySlug('custom-items'),
        ];

        foreach ($materialSlugs as $slug) {
            $this->assertTrue($slug->isMaterialRelated());
        }

        foreach ($nonMaterialSlugs as $slug) {
            $this->assertFalse($slug->isMaterialRelated());
        }
    }

    /** @test */
    public function it_can_get_slug_depth(): void
    {
        $testCases = [
            'simple' => 0,
            'parent-child' => 0, // Single level slug
            // Note: This test assumes slug doesn't contain path separators
            // Path depth would be handled by path strings, not the slug itself
        ];

        foreach ($testCases as $input => $expectedDepth) {
            $slug = new ProductCategorySlug($input);
            $this->assertEquals($expectedDepth, $slug->getDepth());
        }
    }

    /** @test */
    public function it_can_append_suffix(): void
    {
        $slug = new ProductCategorySlug('etching-products');
        
        $newSlug = $slug->appendSuffix('v2');
        
        $this->assertEquals('etching-products-v2', $newSlug->getValue());
        $this->assertEquals('etching-products', $slug->getValue()); // Original unchanged
    }

    /** @test */
    public function it_validates_suffix_format(): void
    {
        $slug = new ProductCategorySlug('etching-products');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Suffix must be valid slug format');
        
        $slug->appendSuffix('Invalid Suffix!');
    }

    /** @test */
    public function it_can_prepend_prefix(): void
    {
        $slug = new ProductCategorySlug('etching-products');
        
        $newSlug = $slug->prependPrefix('premium');
        
        $this->assertEquals('premium-etching-products', $newSlug->getValue());
        $this->assertEquals('etching-products', $slug->getValue()); // Original unchanged
    }

    /** @test */
    public function it_validates_prefix_format(): void
    {
        $slug = new ProductCategorySlug('etching-products');

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Prefix must be valid slug format');
        
        $slug->prependPrefix('Invalid Prefix!');
    }

    /** @test */
    public function it_can_check_if_contains_word(): void
    {
        $slug = new ProductCategorySlug('custom-etching-products');

        $this->assertTrue($slug->containsWord('etching'));
        $this->assertTrue($slug->containsWord('custom'));
        $this->assertTrue($slug->containsWord('products'));
        $this->assertFalse($slug->containsWord('laser'));
        $this->assertFalse($slug->containsWord('service'));
    }

    /** @test */
    public function it_generates_unique_variation(): void
    {
        $originalSlug = new ProductCategorySlug('etching-products');
        $existingSlugs = ['etching-products', 'etching-products-2', 'etching-products-3'];
        
        $uniqueSlug = $originalSlug->generateUniqueVariation($existingSlugs);
        
        $this->assertEquals('etching-products-4', $uniqueSlug->getValue());
    }

    /** @test */
    public function it_returns_original_if_no_conflicts(): void
    {
        $originalSlug = new ProductCategorySlug('etching-products');
        $existingSlugs = ['other-category', 'different-slug'];
        
        $uniqueSlug = $originalSlug->generateUniqueVariation($existingSlugs);
        
        $this->assertEquals('etching-products', $uniqueSlug->getValue());
    }
}