<?php

namespace Tests\Unit\Domain\Product\ValueObjects;

use Tests\TestCase;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use InvalidArgumentException;

class ProductCategoryNameTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_name(): void
    {
        $name = new ProductCategoryName('Etching Products');

        $this->assertEquals('Etching Products', $name->getValue());
        $this->assertEquals('Etching Products', (string) $name);
    }

    /** @test */
    public function it_trims_whitespace_from_name(): void
    {
        $name = new ProductCategoryName('  Etching Products  ');

        $this->assertEquals('Etching Products', $name->getValue());
    }

    /** @test */
    public function it_validates_minimum_length(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category name must be between 2 and 100 characters');
        
        new ProductCategoryName('A');
    }

    /** @test */
    public function it_validates_maximum_length(): void
    {
        $longName = str_repeat('A', 101);
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category name must be between 2 and 100 characters');
        
        new ProductCategoryName($longName);
    }

    /** @test */
    public function it_rejects_empty_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category name cannot be empty');
        
        new ProductCategoryName('');
    }

    /** @test */
    public function it_rejects_only_whitespace_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Category name cannot be empty');
        
        new ProductCategoryName('   ');
    }

    /** @test */
    public function it_allows_valid_special_characters(): void
    {
        $validNames = [
            'Akrilik & Kuningan',
            'Products - Etching',
            'Custom (Premium)',
            'Type A/B Products',
            'Products: Special Edition',
        ];

        foreach ($validNames as $validName) {
            $name = new ProductCategoryName($validName);
            $this->assertEquals($validName, $name->getValue());
        }
    }

    /** @test */
    public function it_rejects_invalid_special_characters(): void
    {
        $invalidNames = [
            'Products@Email',
            'Hash#Products',
            'Products$Money',
            'Percent%Products',
            'Products^Power',
            'Products*Star',
            'Plus+Products',
            'Products=Equal',
            'Bracket[Products]',
            'Curly{Products}',
            'Pipe|Products',
            'Backslash\\Products',
            'Quote"Products',
            'Tick`Products',
            'Tilde~Products',
            'Question?Products',
        ];

        foreach ($invalidNames as $invalidName) {
            $this->expectException(InvalidArgumentException::class);
            $this->expectExceptionMessage('Category name contains invalid characters');
            
            new ProductCategoryName($invalidName);
        }
    }

    /** @test */
    public function it_allows_unicode_characters(): void
    {
        $unicodeNames = [
            'Produk Etching',
            'Акрил Products',
            '製品カテゴリ',
            'Productos Españoles',
        ];

        foreach ($unicodeNames as $unicodeName) {
            $name = new ProductCategoryName($unicodeName);
            $this->assertEquals($unicodeName, $name->getValue());
        }
    }

    /** @test */
    public function it_handles_mixed_case_properly(): void
    {
        $name = new ProductCategoryName('eTcHiNg PrOdUcTs');

        $this->assertEquals('eTcHiNg PrOdUcTs', $name->getValue());
    }

    /** @test */
    public function it_can_check_equality(): void
    {
        $name1 = new ProductCategoryName('Etching Products');
        $name2 = new ProductCategoryName('Etching Products');
        $name3 = new ProductCategoryName('Different Name');

        $this->assertTrue($name1->equals($name2));
        $this->assertFalse($name1->equals($name3));
    }

    /** @test */
    public function it_is_case_sensitive_for_equality(): void
    {
        $name1 = new ProductCategoryName('Etching Products');
        $name2 = new ProductCategoryName('etching products');

        $this->assertFalse($name1->equals($name2));
    }

    /** @test */
    public function it_can_generate_slug_suggestion(): void
    {
        $testCases = [
            'Etching Products' => 'etching-products',
            'Akrilik & Kuningan' => 'akrilik-kuningan',
            'Products - Special Edition' => 'products-special-edition',
            'Custom (Premium)' => 'custom-premium',
            'Type A/B Products' => 'type-a-b-products',
            'Products: Metal Works' => 'products-metal-works',
        ];

        foreach ($testCases as $input => $expected) {
            $name = new ProductCategoryName($input);
            $this->assertEquals($expected, $name->generateSlug());
        }
    }

    /** @test */
    public function it_handles_unicode_in_slug_generation(): void
    {
        $name = new ProductCategoryName('Produk Etching');
        $slug = $name->generateSlug();
        
        $this->assertEquals('produk-etching', $slug);
    }

    /** @test */
    public function it_can_check_if_contains_etching_keywords(): void
    {
        $etchingNames = [
            new ProductCategoryName('Etching Products'),
            new ProductCategoryName('Laser Etching Services'),
            new ProductCategoryName('Chemical Etching'),
            new ProductCategoryName('Engraving & Etching'),
        ];

        $nonEtchingNames = [
            new ProductCategoryName('Digital Printing'),
            new ProductCategoryName('Wood Products'),
            new ProductCategoryName('General Manufacturing'),
        ];

        foreach ($etchingNames as $name) {
            $this->assertTrue($name->containsEtchingKeywords());
        }

        foreach ($nonEtchingNames as $name) {
            $this->assertFalse($name->containsEtchingKeywords());
        }
    }

    /** @test */
    public function it_can_get_character_count(): void
    {
        $name = new ProductCategoryName('Etching Products');

        $this->assertEquals(16, $name->getLength());
    }

    /** @test */
    public function it_can_get_word_count(): void
    {
        $testCases = [
            'Etching' => 1,
            'Etching Products' => 2,
            'Custom Etching Products Service' => 4,
            'A & B Products' => 4,
        ];

        foreach ($testCases as $input => $expectedCount) {
            $name = new ProductCategoryName($input);
            $this->assertEquals($expectedCount, $name->getWordCount());
        }
    }

    /** @test */
    public function it_can_convert_to_title_case(): void
    {
        $testCases = [
            'etching products' => 'Etching Products',
            'LASER ETCHING' => 'Laser Etching',
            'custom etching & engraving' => 'Custom Etching & Engraving',
        ];

        foreach ($testCases as $input => $expected) {
            $name = new ProductCategoryName($input);
            $this->assertEquals($expected, $name->toTitleCase());
        }
    }

    /** @test */
    public function it_can_truncate_with_ellipsis(): void
    {
        $longName = new ProductCategoryName('This is a very long category name for testing');
        
        $truncated = $longName->truncate(20);
        
        $this->assertEquals('This is a very lo...', $truncated);
        $this->assertEquals(20, strlen($truncated));
    }

    /** @test */
    public function it_does_not_truncate_short_names(): void
    {
        $shortName = new ProductCategoryName('Short Name');
        
        $result = $shortName->truncate(50);
        
        $this->assertEquals('Short Name', $result);
    }

    /** @test */
    public function it_can_check_if_contains_word(): void
    {
        $name = new ProductCategoryName('Custom Etching Products');

        $this->assertTrue($name->containsWord('Etching'));
        $this->assertTrue($name->containsWord('etching')); // case insensitive
        $this->assertTrue($name->containsWord('Custom'));
        $this->assertTrue($name->containsWord('Products'));
        $this->assertFalse($name->containsWord('Laser'));
        $this->assertFalse($name->containsWord('Service'));
    }
}