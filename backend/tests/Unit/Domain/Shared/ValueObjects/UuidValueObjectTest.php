<?php

namespace Tests\Unit\Domain\Shared\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class UuidValueObjectTest extends TestCase
{
    /** @test */
    public function it_can_create_uuid_from_valid_string()
    {
        $uuidString = '550e8400-e29b-41d4-a716-446655440000';
        $uuid = new UuidValueObject($uuidString);
        
        $this->assertEquals($uuidString, $uuid->getValue());
    }

    /** @test */
    public function it_can_generate_new_uuid()
    {
        $uuid = UuidValueObject::generate();
        
        $this->assertNotEmpty($uuid->getValue());
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            $uuid->getValue()
        );
    }

    /** @test */
    public function it_normalizes_uuid_to_lowercase()
    {
        $uuidString = '550E8400-E29B-41D4-A716-446655440000';
        $uuid = new UuidValueObject($uuidString);
        
        $this->assertEquals(strtolower($uuidString), $uuid->getValue());
    }

    /** @test */
    public function it_throws_exception_for_empty_uuid()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('UUID cannot be empty');
        
        new UuidValueObject('');
    }

    /** @test */
    public function it_throws_exception_for_invalid_uuid_format()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid UUID format');
        
        new UuidValueObject('invalid-uuid');
    }

    /** @test */
    public function it_can_compare_uuids_for_equality()
    {
        $uuidString = '550e8400-e29b-41d4-a716-446655440000';
        $uuid1 = new UuidValueObject($uuidString);
        $uuid2 = new UuidValueObject($uuidString);
        $uuid3 = UuidValueObject::generate();
        
        $this->assertTrue($uuid1->equals($uuid2));
        $this->assertFalse($uuid1->equals($uuid3));
    }

    /** @test */
    public function it_can_convert_to_string()
    {
        $uuidString = '550e8400-e29b-41d4-a716-446655440000';
        $uuid = new UuidValueObject($uuidString);
        
        $this->assertEquals($uuidString, (string) $uuid);
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $uuidString = '550e8400-e29b-41d4-a716-446655440000';
        $uuid = new UuidValueObject($uuidString);
        
        $expected = ['uuid' => $uuidString];
        $this->assertEquals($expected, $uuid->toArray());
    }

    /** @test */
    public function it_can_create_from_string_factory_method()
    {
        $uuidString = '550e8400-e29b-41d4-a716-446655440000';
        $uuid = UuidValueObject::fromString($uuidString);
        
        $this->assertEquals($uuidString, $uuid->getValue());
    }

    /** @test */
    public function generated_uuids_are_unique()
    {
        $uuid1 = UuidValueObject::generate();
        $uuid2 = UuidValueObject::generate();
        
        $this->assertNotEquals($uuid1->getValue(), $uuid2->getValue());
    }
}