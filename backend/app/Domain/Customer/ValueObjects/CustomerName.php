<?php

namespace App\Domain\Customer\ValueObjects;

use InvalidArgumentException;

class CustomerName
{
    private string $firstName;
    private string $lastName;

    public function __construct(string $firstName, string $lastName)
    {
        $this->validateName($firstName, 'First name');
        $this->validateName($lastName, 'Last name');
        
        $this->firstName = trim($firstName);
        $this->lastName = trim($lastName);
    }

    public function getFirstName(): string
    {
        return $this->firstName;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function getFullName(): string
    {
        return $this->firstName . ' ' . $this->lastName;
    }

    public function getInitials(): string
    {
        return strtoupper(substr($this->firstName, 0, 1) . substr($this->lastName, 0, 1));
    }

    public function equals(CustomerName $other): bool
    {
        return $this->firstName === $other->getFirstName() &&
               $this->lastName === $other->getLastName();
    }

    public function __toString(): string
    {
        return $this->getFullName();
    }

    private function validateName(string $name, string $type): void
    {
        $name = trim($name);
        
        if (empty($name)) {
            throw new InvalidArgumentException($type . ' cannot be empty');
        }

        if (strlen($name) < 2) {
            throw new InvalidArgumentException($type . ' must be at least 2 characters long');
        }

        if (strlen($name) > 50) {
            throw new InvalidArgumentException($type . ' cannot exceed 50 characters');
        }

        if (!preg_match("/^[a-zA-Z\s\-'\.]+$/", $name)) {
            throw new InvalidArgumentException($type . ' contains invalid characters');
        }
    }
}