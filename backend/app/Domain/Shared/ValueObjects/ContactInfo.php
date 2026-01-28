<?php

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

/**
 * ContactInfo Value Object
 * 
 * Handles contact information with validation and formatting.
 * Supports PT CEX business requirements for customer and vendor communication.
 * 
 * Database Integration:
 * - Works with email, phone fields in customers/vendors tables
 * - Supports JSON metadata for additional contact methods
 * - Handles Indonesian phone number formats
 */
class ContactInfo
{
    private string $email;
    private ?string $phone;
    private ?string $whatsapp;
    private ?string $alternativeEmail;
    private array $additionalContacts;

    /**
     * @param string $email Primary email address
     * @param string|null $phone Primary phone number
     * @param string|null $whatsapp WhatsApp number (can be different from phone)
     * @param string|null $alternativeEmail Secondary email
     * @param array $additionalContacts Additional contact methods
     */
    public function __construct(
        string $email,
        ?string $phone = null,
        ?string $whatsapp = null,
        ?string $alternativeEmail = null,
        array $additionalContacts = []
    ) {
        $this->guardAgainstInvalidEmail($email);
        
        if ($phone !== null) {
            $this->guardAgainstInvalidPhone($phone);
        }
        
        if ($whatsapp !== null) {
            $this->guardAgainstInvalidPhone($whatsapp);
        }
        
        if ($alternativeEmail !== null) {
            $this->guardAgainstInvalidEmail($alternativeEmail);
        }
        
        $this->email = strtolower(trim($email));
        $this->phone = $phone ? $this->normalizePhoneNumber($phone) : null;
        $this->whatsapp = $whatsapp ? $this->normalizePhoneNumber($whatsapp) : null;
        $this->alternativeEmail = $alternativeEmail ? strtolower(trim($alternativeEmail)) : null;
        $this->additionalContacts = $additionalContacts;
    }

    /**
     * Create from basic email and phone
     */
    public static function fromBasic(string $email, ?string $phone = null): self
    {
        return new self($email, $phone);
    }

    /**
     * Create from customer data
     */
    public static function fromCustomerData(array $data): self
    {
        return new self(
            $data['email'],
            $data['phone'] ?? null,
            $data['whatsapp'] ?? null,
            $data['alternative_email'] ?? null,
            $data['additional_contacts'] ?? []
        );
    }

    /**
     * Get primary email
     */
    public function getEmail(): string
    {
        return $this->email;
    }

    /**
     * Get primary phone
     */
    public function getPhone(): ?string
    {
        return $this->phone;
    }

    /**
     * Get WhatsApp number
     */
    public function getWhatsapp(): ?string
    {
        return $this->whatsapp;
    }

    /**
     * Get alternative email
     */
    public function getAlternativeEmail(): ?string
    {
        return $this->alternativeEmail;
    }

    /**
     * Get additional contacts
     */
    public function getAdditionalContacts(): array
    {
        return $this->additionalContacts;
    }

    /**
     * Get best phone number for SMS (prioritize phone over WhatsApp)
     */
    public function getBestPhoneForSms(): ?string
    {
        return $this->phone ?? $this->whatsapp;
    }

    /**
     * Get best phone number for WhatsApp (prioritize WhatsApp over phone)
     */
    public function getBestPhoneForWhatsapp(): ?string
    {
        return $this->whatsapp ?? $this->phone;
    }

    /**
     * Check if has phone number
     */
    public function hasPhone(): bool
    {
        return $this->phone !== null || $this->whatsapp !== null;
    }

    /**
     * Check if has WhatsApp
     */
    public function hasWhatsapp(): bool
    {
        return $this->whatsapp !== null;
    }

    /**
     * Check if has alternative email
     */
    public function hasAlternativeEmail(): bool
    {
        return $this->alternativeEmail !== null;
    }

    /**
     * Get all available contact methods
     */
    public function getAvailableContactMethods(): array
    {
        $methods = ['email'];
        
        if ($this->hasPhone()) {
            $methods[] = 'phone';
            $methods[] = 'sms';
        }
        
        if ($this->hasWhatsapp()) {
            $methods[] = 'whatsapp';
        }
        
        if ($this->hasAlternativeEmail()) {
            $methods[] = 'alternative_email';
        }
        
        foreach ($this->additionalContacts as $contact) {
            if (isset($contact['type'])) {
                $methods[] = $contact['type'];
            }
        }
        
        return array_unique($methods);
    }

    /**
     * Format phone number for display
     */
    public function getFormattedPhone(): ?string
    {
        if ($this->phone === null) {
            return null;
        }
        
        // Format Indonesian phone numbers
        if (str_starts_with($this->phone, '+62')) {
            $number = substr($this->phone, 3);
            return '+62 ' . substr($number, 0, 3) . '-' . substr($number, 3, 4) . '-' . substr($number, 7);
        }
        
        return $this->phone;
    }

    /**
     * Format WhatsApp number for display
     */
    public function getFormattedWhatsapp(): ?string
    {
        if ($this->whatsapp === null) {
            return null;
        }
        
        // Format Indonesian WhatsApp numbers
        if (str_starts_with($this->whatsapp, '+62')) {
            $number = substr($this->whatsapp, 3);
            return '+62 ' . substr($number, 0, 3) . '-' . substr($number, 3, 4) . '-' . substr($number, 7);
        }
        
        return $this->whatsapp;
    }

    /**
     * Update email address
     */
    public function withEmail(string $email): ContactInfo
    {
        return new ContactInfo(
            $email,
            $this->phone,
            $this->whatsapp,
            $this->alternativeEmail,
            $this->additionalContacts
        );
    }

    /**
     * Update phone number
     */
    public function withPhone(?string $phone): ContactInfo
    {
        return new ContactInfo(
            $this->email,
            $phone,
            $this->whatsapp,
            $this->alternativeEmail,
            $this->additionalContacts
        );
    }

    /**
     * Update WhatsApp number
     */
    public function withWhatsapp(?string $whatsapp): ContactInfo
    {
        return new ContactInfo(
            $this->email,
            $this->phone,
            $whatsapp,
            $this->alternativeEmail,
            $this->additionalContacts
        );
    }

    /**
     * Add additional contact method
     */
    public function addAdditionalContact(string $type, string $value, ?string $label = null): ContactInfo
    {
        $additionalContacts = $this->additionalContacts;
        $additionalContacts[] = [
            'type' => $type,
            'value' => $value,
            'label' => $label,
        ];
        
        return new ContactInfo(
            $this->email,
            $this->phone,
            $this->whatsapp,
            $this->alternativeEmail,
            $additionalContacts
        );
    }

    /**
     * Check if equals another ContactInfo
     */
    public function equals(ContactInfo $other): bool
    {
        return $this->email === $other->email &&
               $this->phone === $other->phone &&
               $this->whatsapp === $other->whatsapp &&
               $this->alternativeEmail === $other->alternativeEmail;
    }

    /**
     * Convert to array for database storage
     */
    public function toArray(): array
    {
        return [
            'email' => $this->email,
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'alternative_email' => $this->alternativeEmail,
            'additional_contacts' => $this->additionalContacts,
            'formatted_phone' => $this->getFormattedPhone(),
            'formatted_whatsapp' => $this->getFormattedWhatsapp(),
            'available_methods' => $this->getAvailableContactMethods(),
        ];
    }

    /**
     * Create from database array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['email'],
            $data['phone'] ?? null,
            $data['whatsapp'] ?? null,
            $data['alternative_email'] ?? null,
            $data['additional_contacts'] ?? []
        );
    }

    public function __toString(): string
    {
        $parts = [$this->email];
        
        if ($this->phone) {
            $parts[] = $this->getFormattedPhone();
        }
        
        return implode(' | ', $parts);
    }

    private function guardAgainstInvalidEmail(string $email): void
    {
        $email = trim($email);
        
        if (empty($email)) {
            throw new InvalidArgumentException('Email cannot be empty');
        }
        
        if (strlen($email) > 255) {
            throw new InvalidArgumentException('Email cannot exceed 255 characters');
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Invalid email format: {$email}");
        }
    }

    private function guardAgainstInvalidPhone(string $phone): void
    {
        $phone = trim($phone);
        
        if (empty($phone)) {
            throw new InvalidArgumentException('Phone number cannot be empty');
        }
        
        // Remove all non-digit characters except +
        $cleanPhone = preg_replace('/[^\d+]/', '', $phone);
        
        if (strlen($cleanPhone) < 10 || strlen($cleanPhone) > 15) {
            throw new InvalidArgumentException('Phone number must be between 10 and 15 digits');
        }
        
        // Temporary: Allow any phone format during transition period
        // TODO: Implement proper international phone validation
        return;
        
        // Indonesian phone number validation
        if (str_starts_with($cleanPhone, '08')) {
            // Convert 08xx to +628xx
            return;
        }
        
        if (str_starts_with($cleanPhone, '+62')) {
            return;
        }
        
        if (str_starts_with($cleanPhone, '62')) {
            return;
        }
        
        // International format
        if (str_starts_with($cleanPhone, '+')) {
            return;
        }
        
        throw new InvalidArgumentException("Invalid phone number format: {$phone}");
    }

    private function normalizePhoneNumber(string $phone): string
    {
        // Remove all non-digit characters except +
        $cleanPhone = preg_replace('/[^\d+]/', '', $phone);
        
        // Convert Indonesian local format to international
        if (str_starts_with($cleanPhone, '08')) {
            return '+62' . substr($cleanPhone, 1);
        }
        
        if (str_starts_with($cleanPhone, '62') && !str_starts_with($cleanPhone, '+62')) {
            return '+' . $cleanPhone;
        }
        
        if (!str_starts_with($cleanPhone, '+')) {
            // Assume Indonesian number if no country code
            return '+62' . $cleanPhone;
        }
        
        return $cleanPhone;
    }
}