<?php

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

/**
 * Address Value Object
 * 
 * Handles address information with validation and formatting.
 * Supports Indonesian address formats for PT CEX business requirements.
 * 
 * Database Integration:
 * - Works with shipping_address, billing_address JSON fields in orders table
 * - Supports address field in customers/vendors tables
 * - Handles Indonesian postal codes and regions
 */
class Address
{
    private string $street;
    private string $city;
    private string $state;
    private string $postalCode;
    private string $country;
    private ?string $district;
    private ?string $subDistrict;
    private ?string $landmark;
    private ?array $coordinates;

    /**
     * @param string $street Street address
     * @param string $city City name
     * @param string $state State/Province
     * @param string $postalCode Postal/ZIP code
     * @param string $country Country code (ISO 3166-1 alpha-2)
     * @param string|null $district District (Kecamatan in Indonesia)
     * @param string|null $subDistrict Sub-district (Kelurahan in Indonesia)
     * @param string|null $landmark Nearby landmark for easier delivery
     * @param array|null $coordinates GPS coordinates [lat, lng]
     */
    public function __construct(
        string $street,
        string $city,
        string $state,
        string $postalCode,
        string $country = 'ID',
        ?string $district = null,
        ?string $subDistrict = null,
        ?string $landmark = null,
        ?array $coordinates = null
    ) {
        $this->guardAgainstEmptyStreet($street);
        $this->guardAgainstEmptyCity($city);
        $this->guardAgainstEmptyState($state);
        $this->guardAgainstInvalidPostalCode($postalCode, $country);
        $this->guardAgainstInvalidCountry($country);
        
        if ($coordinates !== null) {
            $this->guardAgainstInvalidCoordinates($coordinates);
        }
        
        $this->street = trim($street);
        $this->city = trim($city);
        $this->state = trim($state);
        $this->postalCode = trim($postalCode);
        $this->country = strtoupper(trim($country));
        $this->district = $district ? trim($district) : null;
        $this->subDistrict = $subDistrict ? trim($subDistrict) : null;
        $this->landmark = $landmark ? trim($landmark) : null;
        $this->coordinates = $coordinates;
    }

    /**
     * Create from basic address components
     */
    public static function fromBasic(
        string $street,
        string $city,
        string $state,
        string $postalCode,
        string $country = 'ID'
    ): self {
        return new self($street, $city, $state, $postalCode, $country);
    }

    /**
     * Create Indonesian address with district details
     */
    public static function indonesian(
        string $street,
        string $city,
        string $state,
        string $postalCode,
        ?string $district = null,
        ?string $subDistrict = null,
        ?string $landmark = null
    ): self {
        return new self(
            $street,
            $city,
            $state,
            $postalCode,
            'ID',
            $district,
            $subDistrict,
            $landmark
        );
    }

    /**
     * Create from array data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['street'],
            $data['city'],
            $data['state'],
            $data['postal_code'],
            $data['country'] ?? 'ID',
            $data['district'] ?? null,
            $data['sub_district'] ?? null,
            $data['landmark'] ?? null,
            $data['coordinates'] ?? null
        );
    }

    /**
     * Get street address
     */
    public function getStreet(): string
    {
        return $this->street;
    }

    /**
     * Get city
     */
    public function getCity(): string
    {
        return $this->city;
    }

    /**
     * Get state/province
     */
    public function getState(): string
    {
        return $this->state;
    }

    /**
     * Get postal code
     */
    public function getPostalCode(): string
    {
        return $this->postalCode;
    }

    /**
     * Get country code
     */
    public function getCountry(): string
    {
        return $this->country;
    }

    /**
     * Get district
     */
    public function getDistrict(): ?string
    {
        return $this->district;
    }

    /**
     * Get sub-district
     */
    public function getSubDistrict(): ?string
    {
        return $this->subDistrict;
    }

    /**
     * Get landmark
     */
    public function getLandmark(): ?string
    {
        return $this->landmark;
    }

    /**
     * Get coordinates
     */
    public function getCoordinates(): ?array
    {
        return $this->coordinates;
    }

    /**
     * Check if address is in Indonesia
     */
    public function isIndonesian(): bool
    {
        return $this->country === 'ID';
    }

    /**
     * Check if has GPS coordinates
     */
    public function hasCoordinates(): bool
    {
        return $this->coordinates !== null;
    }

    /**
     * Get formatted address for display
     */
    public function getFormattedAddress(): string
    {
        $parts = [$this->street];
        
        if ($this->subDistrict) {
            $parts[] = $this->subDistrict;
        }
        
        if ($this->district) {
            $parts[] = $this->district;
        }
        
        $parts[] = $this->city;
        $parts[] = $this->state;
        $parts[] = $this->postalCode;
        
        if ($this->country !== 'ID') {
            $parts[] = $this->getCountryName();
        }
        
        return implode(', ', $parts);
    }

    /**
     * Get formatted address for shipping labels
     */
    public function getShippingLabel(): string
    {
        $label = $this->street . "\n";
        
        if ($this->subDistrict) {
            $label .= $this->subDistrict . ", ";
        }
        
        if ($this->district) {
            $label .= $this->district . "\n";
        }
        
        $label .= $this->city . ", " . $this->state . " " . $this->postalCode;
        
        if ($this->country !== 'ID') {
            $label .= "\n" . $this->getCountryName();
        }
        
        if ($this->landmark) {
            $label .= "\n(Near: " . $this->landmark . ")";
        }
        
        return $label;
    }

    /**
     * Get single line address
     */
    public function getSingleLine(): string
    {
        return str_replace("\n", ", ", $this->getShippingLabel());
    }

    /**
     * Get country name
     */
    public function getCountryName(): string
    {
        return match ($this->country) {
            'ID' => 'Indonesia',
            'MY' => 'Malaysia',
            'SG' => 'Singapore',
            'TH' => 'Thailand',
            'PH' => 'Philippines',
            'VN' => 'Vietnam',
            'US' => 'United States',
            'AU' => 'Australia',
            'JP' => 'Japan',
            'KR' => 'South Korea',
            'CN' => 'China',
            'GB' => 'United Kingdom',
            'DE' => 'Germany',
            'FR' => 'France',
            default => $this->country,
        };
    }

    /**
     * Calculate estimated shipping zone for Indonesia
     */
    public function getIndonesianShippingZone(): string
    {
        if (!$this->isIndonesian()) {
            return 'international';
        }
        
        // Jakarta and surrounding areas
        $jakartaAreas = ['DKI Jakarta', 'Jakarta', 'Bekasi', 'Depok', 'Tangerang', 'Bogor'];
        foreach ($jakartaAreas as $area) {
            if (str_contains(strtolower($this->city . ' ' . $this->state), strtolower($area))) {
                return 'jabodetabek';
            }
        }
        
        // Java island
        $javaProvinces = ['Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Yogyakarta', 'Banten'];
        if (in_array($this->state, $javaProvinces)) {
            return 'java';
        }
        
        // Sumatra
        $sumatraProvinces = ['Sumatera Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Riau', 'Jambi', 'Bengkulu', 'Lampung', 'Aceh', 'Kepulauan Riau', 'Kepulauan Bangka Belitung'];
        if (in_array($this->state, $sumatraProvinces)) {
            return 'sumatra';
        }
        
        // Kalimantan
        $kalimantanProvinces = ['Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara'];
        if (in_array($this->state, $kalimantanProvinces)) {
            return 'kalimantan';
        }
        
        // Sulawesi
        $sulawesiProvinces = ['Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat'];
        if (in_array($this->state, $sulawesiProvinces)) {
            return 'sulawesi';
        }
        
        // Eastern Indonesia
        return 'eastern_indonesia';
    }

    /**
     * Update with coordinates
     */
    public function withCoordinates(float $latitude, float $longitude): Address
    {
        return new Address(
            $this->street,
            $this->city,
            $this->state,
            $this->postalCode,
            $this->country,
            $this->district,
            $this->subDistrict,
            $this->landmark,
            ['lat' => $latitude, 'lng' => $longitude]
        );
    }

    /**
     * Update with landmark
     */
    public function withLandmark(string $landmark): Address
    {
        return new Address(
            $this->street,
            $this->city,
            $this->state,
            $this->postalCode,
            $this->country,
            $this->district,
            $this->subDistrict,
            $landmark,
            $this->coordinates
        );
    }

    /**
     * Check if equals another address
     */
    public function equals(Address $other): bool
    {
        return $this->street === $other->street &&
               $this->city === $other->city &&
               $this->state === $other->state &&
               $this->postalCode === $other->postalCode &&
               $this->country === $other->country;
    }

    /**
     * Convert to array for database storage
     */
    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postalCode,
            'country' => $this->country,
            'district' => $this->district,
            'sub_district' => $this->subDistrict,
            'landmark' => $this->landmark,
            'coordinates' => $this->coordinates,
            'formatted_address' => $this->getFormattedAddress(),
            'single_line' => $this->getSingleLine(),
            'country_name' => $this->getCountryName(),
            'shipping_zone' => $this->getIndonesianShippingZone(),
        ];
    }

    public function __toString(): string
    {
        return $this->getFormattedAddress();
    }

    private function guardAgainstEmptyStreet(string $street): void
    {
        if (empty(trim($street))) {
            throw new InvalidArgumentException('Street address cannot be empty');
        }
        
        if (strlen(trim($street)) > 255) {
            throw new InvalidArgumentException('Street address cannot exceed 255 characters');
        }
    }

    private function guardAgainstEmptyCity(string $city): void
    {
        if (empty(trim($city))) {
            throw new InvalidArgumentException('City cannot be empty');
        }
        
        if (strlen(trim($city)) > 100) {
            throw new InvalidArgumentException('City cannot exceed 100 characters');
        }
    }

    private function guardAgainstEmptyState(string $state): void
    {
        if (empty(trim($state))) {
            throw new InvalidArgumentException('State/Province cannot be empty');
        }
        
        if (strlen(trim($state)) > 100) {
            throw new InvalidArgumentException('State/Province cannot exceed 100 characters');
        }
    }

    private function guardAgainstInvalidPostalCode(string $postalCode, string $country): void
    {
        $postalCode = trim($postalCode);
        
        if (empty($postalCode)) {
            throw new InvalidArgumentException('Postal code cannot be empty');
        }
        
        // Indonesian postal code validation (5 digits)
        if (strtoupper($country) === 'ID') {
            if (!preg_match('/^\d{5}$/', $postalCode)) {
                throw new InvalidArgumentException('Indonesian postal code must be 5 digits');
            }
        }
        
        if (strlen($postalCode) > 20) {
            throw new InvalidArgumentException('Postal code cannot exceed 20 characters');
        }
    }

    private function guardAgainstInvalidCountry(string $country): void
    {
        $country = strtoupper(trim($country));
        
        if (empty($country)) {
            throw new InvalidArgumentException('Country code cannot be empty');
        }
        
        if (strlen($country) !== 2) {
            throw new InvalidArgumentException('Country code must be 2 characters (ISO 3166-1 alpha-2)');
        }
        
        if (!preg_match('/^[A-Z]{2}$/', $country)) {
            throw new InvalidArgumentException('Country code must contain only uppercase letters');
        }
    }

    private function guardAgainstInvalidCoordinates(array $coordinates): void
    {
        if (!isset($coordinates['lat']) || !isset($coordinates['lng'])) {
            throw new InvalidArgumentException('Coordinates must have lat and lng keys');
        }
        
        $lat = $coordinates['lat'];
        $lng = $coordinates['lng'];
        
        if (!is_numeric($lat) || !is_numeric($lng)) {
            throw new InvalidArgumentException('Coordinates must be numeric');
        }
        
        if ($lat < -90 || $lat > 90) {
            throw new InvalidArgumentException('Latitude must be between -90 and 90');
        }
        
        if ($lng < -180 || $lng > 180) {
            throw new InvalidArgumentException('Longitude must be between -180 and 180');
        }
    }
}