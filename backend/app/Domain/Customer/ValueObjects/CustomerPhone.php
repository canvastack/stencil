<?php

namespace App\Domain\Customer\ValueObjects;

use InvalidArgumentException;

class CustomerPhone
{
    private string $value;
    private string $countryCode;

    public function __construct(string $value, string $countryCode = '+62')
    {
        $this->validateCountryCode($countryCode);
        $this->validate($value);
        
        $this->value = $this->normalizePhoneNumber($value);
        $this->countryCode = $countryCode;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getCountryCode(): string
    {
        return $this->countryCode;
    }

    public function getFormattedValue(): string
    {
        return $this->countryCode . $this->value;
    }

    public function getInternationalFormat(): string
    {
        if ($this->countryCode === '+62') {
            return $this->formatIndonesianNumber();
        }
        
        return $this->getFormattedValue();
    }

    public function equals(CustomerPhone $other): bool
    {
        return $this->value === $other->getValue() &&
               $this->countryCode === $other->getCountryCode();
    }

    public function __toString(): string
    {
        return $this->getInternationalFormat();
    }

    private function validate(string $value): void
    {
        $value = $this->normalizePhoneNumber($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Phone number cannot be empty');
        }

        if (strlen($value) < 8) {
            throw new InvalidArgumentException('Phone number must be at least 8 digits');
        }

        if (strlen($value) > 15) {
            throw new InvalidArgumentException('Phone number cannot exceed 15 digits');
        }

        if (!preg_match('/^[0-9]+$/', $value)) {
            throw new InvalidArgumentException('Phone number must contain only digits');
        }
    }

    private function validateCountryCode(string $countryCode): void
    {
        if (!preg_match('/^\+[1-9]\d{0,3}$/', $countryCode)) {
            throw new InvalidArgumentException('Invalid country code format');
        }
    }

    private function normalizePhoneNumber(string $value): string
    {
        $normalized = preg_replace('/[^0-9]/', '', $value);
        
        if (strpos($normalized, '0') === 0) {
            $normalized = substr($normalized, 1);
        }
        
        return $normalized;
    }

    private function formatIndonesianNumber(): string
    {
        $number = $this->value;
        
        if (strlen($number) >= 10) {
            return $this->countryCode . ' ' . 
                   substr($number, 0, 3) . '-' . 
                   substr($number, 3, 4) . '-' . 
                   substr($number, 7);
        }
        
        return $this->getFormattedValue();
    }
}