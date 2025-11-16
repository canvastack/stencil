<?php

namespace App\Domain\Customer\ValueObjects;

use InvalidArgumentException;

class CustomerEmail
{
    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = strtolower(trim($value));
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getDomain(): string
    {
        return substr(strrchr($this->value, '@'), 1);
    }

    public function getLocalPart(): string
    {
        return substr($this->value, 0, strrpos($this->value, '@'));
    }

    public function equals(CustomerEmail $other): bool
    {
        return $this->value === $other->getValue();
    }

    public function isDisposable(): bool
    {
        $disposableDomains = [
            '10minutemail.com',
            'guerrillamail.com',
            'mailinator.com',
            'tempmail.org',
            'throwaway.email'
        ];

        return in_array($this->getDomain(), $disposableDomains);
    }

    public function __toString(): string
    {
        return $this->value;
    }

    private function validate(string $value): void
    {
        $value = trim($value);
        
        if (empty($value)) {
            throw new InvalidArgumentException('Email address cannot be empty');
        }

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address format');
        }

        if (strlen($value) > 254) {
            throw new InvalidArgumentException('Email address cannot exceed 254 characters');
        }

        $localPart = substr($value, 0, strrpos($value, '@'));
        if (strlen($localPart) > 64) {
            throw new InvalidArgumentException('Email local part cannot exceed 64 characters');
        }
    }
}