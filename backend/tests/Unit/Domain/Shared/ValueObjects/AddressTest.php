<?php

namespace Tests\Unit\Domain\Shared\ValueObjects;

use App\Domain\Shared\ValueObjects\Address;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class AddressTest extends TestCase
{
    /** @test */
    public function it_can_create_basic_address()
    {
        $address = Address::fromBasic(
            'Jl. Sudirman No. 123',
            'Jakarta',
            'DKI Jakarta',
            '12345'
        );
        
        $this->assertEquals('Jl. Sudirman No. 123', $address->getStreet());
        $this->assertEquals('Jakarta', $address->getCity());
        $this->assertEquals('DKI Jakarta', $address->getState());
        $this->assertEquals('12345', $address->getPostalCode());
        $this->assertEquals('ID', $address->getCountry());
    }

    /** @test */
    public function it_can_create_indonesian_address_with_districts()
    {
        $address = Address::indonesian(
            'Jl. Thamrin No. 456',
            'Jakarta Pusat',
            'DKI Jakarta',
            '10230',
            'Menteng',
            'Gondangdia',
            'Near Plaza Indonesia'
        );
        
        $this->assertEquals('Jl. Thamrin No. 456', $address->getStreet());
        $this->assertEquals('Jakarta Pusat', $address->getCity());
        $this->assertEquals('DKI Jakarta', $address->getState());
        $this->assertEquals('10230', $address->getPostalCode());
        $this->assertEquals('ID', $address->getCountry());
        $this->assertEquals('Menteng', $address->getDistrict());
        $this->assertEquals('Gondangdia', $address->getSubDistrict());
        $this->assertEquals('Near Plaza Indonesia', $address->getLandmark());
    }

    /** @test */
    public function it_can_create_from_array()
    {
        $data = [
            'street' => 'Jl. Gatot Subroto No. 789',
            'city' => 'Jakarta Selatan',
            'state' => 'DKI Jakarta',
            'postal_code' => '12950',
            'country' => 'ID',
            'district' => 'Setiabudi',
            'sub_district' => 'Kuningan',
            'landmark' => 'Near Kuningan City Mall',
            'coordinates' => ['lat' => -6.2088, 'lng' => 106.8456]
        ];
        
        $address = Address::fromArray($data);
        
        $this->assertEquals('Jl. Gatot Subroto No. 789', $address->getStreet());
        $this->assertEquals('Jakarta Selatan', $address->getCity());
        $this->assertEquals('Setiabudi', $address->getDistrict());
        $this->assertEquals('Kuningan', $address->getSubDistrict());
        $this->assertEquals('Near Kuningan City Mall', $address->getLandmark());
        $this->assertTrue($address->hasCoordinates());
    }

    /** @test */
    public function it_can_check_if_indonesian()
    {
        $indonesianAddress = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345', 'ID');
        $foreignAddress = Address::fromBasic('123 Main St', 'New York', 'NY', '10001', 'US');
        
        $this->assertTrue($indonesianAddress->isIndonesian());
        $this->assertFalse($foreignAddress->isIndonesian());
    }

    /** @test */
    public function it_can_format_address_for_display()
    {
        $address = Address::indonesian(
            'Jl. Sudirman No. 123',
            'Jakarta',
            'DKI Jakarta',
            '12345',
            'Tanah Abang',
            'Bendungan Hilir'
        );
        
        $formatted = $address->getFormattedAddress();
        
        $this->assertStringContainsString('Jl. Sudirman No. 123', $formatted);
        $this->assertStringContainsString('Bendungan Hilir', $formatted);
        $this->assertStringContainsString('Tanah Abang', $formatted);
        $this->assertStringContainsString('Jakarta', $formatted);
        $this->assertStringContainsString('DKI Jakarta', $formatted);
        $this->assertStringContainsString('12345', $formatted);
    }

    /** @test */
    public function it_can_format_shipping_label()
    {
        $address = Address::indonesian(
            'Jl. Sudirman No. 123',
            'Jakarta',
            'DKI Jakarta',
            '12345',
            'Tanah Abang',
            'Bendungan Hilir',
            'Near Grand Indonesia Mall'
        );
        
        $label = $address->getShippingLabel();
        
        $this->assertStringContainsString('Jl. Sudirman No. 123', $label);
        $this->assertStringContainsString('Bendungan Hilir', $label);
        $this->assertStringContainsString('Tanah Abang', $label);
        $this->assertStringContainsString('Jakarta, DKI Jakarta 12345', $label);
        $this->assertStringContainsString('(Near: Near Grand Indonesia Mall)', $label);
    }

    /** @test */
    public function it_can_get_single_line_address()
    {
        $address = Address::fromBasic(
            'Jl. Sudirman No. 123',
            'Jakarta',
            'DKI Jakarta',
            '12345'
        );
        
        $singleLine = $address->getSingleLine();
        
        $this->assertStringNotContainsString("\n", $singleLine);
        $this->assertStringContainsString('Jl. Sudirman No. 123', $singleLine);
        $this->assertStringContainsString('Jakarta', $singleLine);
    }

    /** @test */
    public function it_can_get_country_name()
    {
        $indonesianAddress = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345', 'ID');
        $usAddress = Address::fromBasic('123 Main St', 'New York', 'NY', '10001', 'US');
        $unknownAddress = Address::fromBasic('Test St', 'Test City', 'Test State', '12345', 'XX');
        
        $this->assertEquals('Indonesia', $indonesianAddress->getCountryName());
        $this->assertEquals('United States', $usAddress->getCountryName());
        $this->assertEquals('XX', $unknownAddress->getCountryName());
    }

    /** @test */
    public function it_can_calculate_indonesian_shipping_zones()
    {
        $jakartaAddress = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345');
        $javaAddress = Address::fromBasic('Jl. Test', 'Bandung', 'Jawa Barat', '40123');
        $sumatraAddress = Address::fromBasic('Jl. Test', 'Medan', 'Sumatera Utara', '20123');
        $kalimantanAddress = Address::fromBasic('Jl. Test', 'Pontianak', 'Kalimantan Barat', '78123');
        $sulawesiAddress = Address::fromBasic('Jl. Test', 'Makassar', 'Sulawesi Selatan', '90123');
        $easternAddress = Address::fromBasic('Jl. Test', 'Jayapura', 'Papua', '99123');
        $internationalAddress = Address::fromBasic('123 Main St', 'New York', 'NY', '10001', 'US');
        
        $this->assertEquals('jabodetabek', $jakartaAddress->getIndonesianShippingZone());
        $this->assertEquals('java', $javaAddress->getIndonesianShippingZone());
        $this->assertEquals('sumatra', $sumatraAddress->getIndonesianShippingZone());
        $this->assertEquals('kalimantan', $kalimantanAddress->getIndonesianShippingZone());
        $this->assertEquals('sulawesi', $sulawesiAddress->getIndonesianShippingZone());
        $this->assertEquals('eastern_indonesia', $easternAddress->getIndonesianShippingZone());
        $this->assertEquals('international', $internationalAddress->getIndonesianShippingZone());
    }

    /** @test */
    public function it_can_update_with_coordinates()
    {
        $original = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345');
        $updated = $original->withCoordinates(-6.2088, 106.8456);
        
        $this->assertFalse($original->hasCoordinates());
        $this->assertTrue($updated->hasCoordinates());
        
        $coordinates = $updated->getCoordinates();
        $this->assertEquals(-6.2088, $coordinates['lat']);
        $this->assertEquals(106.8456, $coordinates['lng']);
    }

    /** @test */
    public function it_can_update_with_landmark()
    {
        $original = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345');
        $updated = $original->withLandmark('Near Shopping Mall');
        
        $this->assertNull($original->getLandmark());
        $this->assertEquals('Near Shopping Mall', $updated->getLandmark());
    }

    /** @test */
    public function it_can_check_equality()
    {
        $address1 = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345');
        $address2 = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345');
        $address3 = Address::fromBasic('Jl. Different', 'Jakarta', 'DKI Jakarta', '12345');
        
        $this->assertTrue($address1->equals($address2));
        $this->assertFalse($address1->equals($address3));
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $address = Address::indonesian(
            'Jl. Sudirman No. 123',
            'Jakarta',
            'DKI Jakarta',
            '12345',
            'Tanah Abang',
            'Bendungan Hilir',
            'Near Mall'
        );
        
        $array = $address->toArray();
        
        $this->assertArrayHasKey('street', $array);
        $this->assertArrayHasKey('city', $array);
        $this->assertArrayHasKey('state', $array);
        $this->assertArrayHasKey('postal_code', $array);
        $this->assertArrayHasKey('country', $array);
        $this->assertArrayHasKey('district', $array);
        $this->assertArrayHasKey('sub_district', $array);
        $this->assertArrayHasKey('landmark', $array);
        $this->assertArrayHasKey('formatted_address', $array);
        $this->assertArrayHasKey('single_line', $array);
        $this->assertArrayHasKey('country_name', $array);
        $this->assertArrayHasKey('shipping_zone', $array);
        
        $this->assertEquals('Jl. Sudirman No. 123', $array['street']);
        $this->assertEquals('Indonesia', $array['country_name']);
        $this->assertEquals('jabodetabek', $array['shipping_zone']);
    }

    /** @test */
    public function it_converts_to_string_correctly()
    {
        $address = Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345');
        
        $string = (string) $address;
        
        $this->assertEquals($address->getFormattedAddress(), $string);
    }

    /** @test */
    public function it_throws_exception_for_empty_street()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Street address cannot be empty');
        
        Address::fromBasic('', 'Jakarta', 'DKI Jakarta', '12345');
    }

    /** @test */
    public function it_throws_exception_for_empty_city()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('City cannot be empty');
        
        Address::fromBasic('Jl. Test', '', 'DKI Jakarta', '12345');
    }

    /** @test */
    public function it_throws_exception_for_empty_state()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('State/Province cannot be empty');
        
        Address::fromBasic('Jl. Test', 'Jakarta', '', '12345');
    }

    /** @test */
    public function it_throws_exception_for_empty_postal_code()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Postal code cannot be empty');
        
        Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '');
    }

    /** @test */
    public function it_throws_exception_for_invalid_indonesian_postal_code()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Indonesian postal code must be 5 digits');
        
        Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '123', 'ID');
    }

    /** @test */
    public function it_throws_exception_for_invalid_country_code()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Country code must be 2 characters');
        
        Address::fromBasic('Jl. Test', 'Jakarta', 'DKI Jakarta', '12345', 'IDN');
    }

    /** @test */
    public function it_throws_exception_for_invalid_coordinates()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Coordinates must have lat and lng keys');
        
        new Address(
            'Jl. Test',
            'Jakarta',
            'DKI Jakarta',
            '12345',
            'ID',
            null,
            null,
            null,
            ['latitude' => -6.2088] // Wrong key names
        );
    }

    /** @test */
    public function it_throws_exception_for_out_of_range_coordinates()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Latitude must be between -90 and 90');
        
        new Address(
            'Jl. Test',
            'Jakarta',
            'DKI Jakarta',
            '12345',
            'ID',
            null,
            null,
            null,
            ['lat' => 95.0, 'lng' => 106.8456] // Invalid latitude
        );
    }
}