<?php

namespace App\Domain\Customer\ValueObjects;

use InvalidArgumentException;

class CustomerAddress
{
    private string $street;
    private string $city;
    private string $province;
    private string $postalCode;
    private string $country;

    public function __construct(
        string $street,
        string $city,
        string $province,
        string $postalCode,
        string $country = 'Indonesia'
    ) {
        $this->validateStreet($street);
        $this->validateCity($city);
        $this->validateProvince($province);
        $this->validatePostalCode($postalCode, $country);
        $this->validateCountry($country);

        $this->street = trim($street);
        $this->city = trim($city);
        $this->province = trim($province);
        $this->postalCode = trim($postalCode);
        $this->country = trim($country);
    }

    public function getStreet(): string
    {
        return $this->street;
    }

    public function getCity(): string
    {
        return $this->city;
    }

    public function getProvince(): string
    {
        return $this->province;
    }

    public function getPostalCode(): string
    {
        return $this->postalCode;
    }

    public function getCountry(): string
    {
        return $this->country;
    }

    public function getFullAddress(): string
    {
        return implode(', ', [
            $this->street,
            $this->city,
            $this->province . ' ' . $this->postalCode,
            $this->country
        ]);
    }

    public function getShortAddress(): string
    {
        return $this->city . ', ' . $this->province;
    }

    public function equals(CustomerAddress $other): bool
    {
        return $this->street === $other->getStreet() &&
               $this->city === $other->getCity() &&
               $this->province === $other->getProvince() &&
               $this->postalCode === $other->getPostalCode() &&
               $this->country === $other->getCountry();
    }

    public function __toString(): string
    {
        return $this->getFullAddress();
    }

    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'province' => $this->province,
            'postal_code' => $this->postalCode,
            'country' => $this->country
        ];
    }

    private function validateStreet(string $street): void
    {
        $street = trim($street);
        
        if (empty($street)) {
            throw new InvalidArgumentException('Street address cannot be empty');
        }

        if (strlen($street) > 255) {
            throw new InvalidArgumentException('Street address cannot exceed 255 characters');
        }
    }

    private function validateCity(string $city): void
    {
        $city = trim($city);
        
        if (empty($city)) {
            throw new InvalidArgumentException('City cannot be empty');
        }

        if (strlen($city) > 100) {
            throw new InvalidArgumentException('City name cannot exceed 100 characters');
        }

        if (!preg_match("/^[a-zA-Z\s\-'\.]+$/", $city)) {
            throw new InvalidArgumentException('City name contains invalid characters');
        }
    }

    private function validateProvince(string $province): void
    {
        $province = trim($province);
        
        if (empty($province)) {
            throw new InvalidArgumentException('Province cannot be empty');
        }

        if (strlen($province) > 100) {
            throw new InvalidArgumentException('Province name cannot exceed 100 characters');
        }

        if (!preg_match("/^[a-zA-Z\s\-'\.]+$/", $province)) {
            throw new InvalidArgumentException('Province name contains invalid characters');
        }
    }

    private function validatePostalCode(string $postalCode, string $country): void
    {
        $postalCode = trim($postalCode);
        
        if (empty($postalCode)) {
            throw new InvalidArgumentException('Postal code cannot be empty');
        }

        if ($country === 'Indonesia') {
            if (!preg_match('/^[0-9]{5}$/', $postalCode)) {
                throw new InvalidArgumentException('Indonesian postal code must be 5 digits');
            }
        } else {
            if (strlen($postalCode) > 20) {
                throw new InvalidArgumentException('Postal code cannot exceed 20 characters');
            }
        }
    }

    private function validateCountry(string $country): void
    {
        $country = trim($country);
        
        if (empty($country)) {
            throw new InvalidArgumentException('Country cannot be empty');
        }

        if (strlen($country) > 100) {
            throw new InvalidArgumentException('Country name cannot exceed 100 characters');
        }

        if (!preg_match("/^[a-zA-Z\s\-'\.]+$/", $country)) {
            throw new InvalidArgumentException('Country name contains invalid characters');
        }
    }
}