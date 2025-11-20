<?php

namespace App\Domain\Payment\Enums;

enum RefundMethod: string
{
    case ORIGINAL_METHOD = 'original_method';
    case BANK_TRANSFER = 'bank_transfer';
    case CASH = 'cash';
    case STORE_CREDIT = 'store_credit';
    case MANUAL = 'manual';

    public function label(): string
    {
        return match ($this) {
            self::ORIGINAL_METHOD => 'Original Payment Method',
            self::BANK_TRANSFER => 'Bank Transfer',
            self::CASH => 'Cash',
            self::STORE_CREDIT => 'Store Credit',
            self::MANUAL => 'Manual Process',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ORIGINAL_METHOD => 'Refund to the same payment method used for the original transaction',
            self::BANK_TRANSFER => 'Direct bank transfer to customer account',
            self::CASH => 'Cash refund at physical location',
            self::STORE_CREDIT => 'Store credit for future purchases',
            self::MANUAL => 'Manual refund process requiring special handling',
        };
    }

    public function isAutomated(): bool
    {
        return match ($this) {
            self::ORIGINAL_METHOD => true,
            self::BANK_TRANSFER => false,
            self::CASH => false,
            self::STORE_CREDIT => true,
            self::MANUAL => false,
        };
    }

    public function requiresBankDetails(): bool
    {
        return $this === self::BANK_TRANSFER;
    }

    public function requiresPhysicalPresence(): bool
    {
        return $this === self::CASH;
    }

    public function isInstant(): bool
    {
        return match ($this) {
            self::ORIGINAL_METHOD => false, // Depends on payment provider
            self::BANK_TRANSFER => false,
            self::CASH => true,
            self::STORE_CREDIT => true,
            self::MANUAL => false,
        };
    }

    public function getProcessingTimeInDays(): int
    {
        return match ($this) {
            self::ORIGINAL_METHOD => 3, // Typical credit card refund time
            self::BANK_TRANSFER => 1,
            self::CASH => 0,
            self::STORE_CREDIT => 0,
            self::MANUAL => 7, // Depends on manual process
        };
    }

    public function getColorClass(): string
    {
        return match ($this) {
            self::ORIGINAL_METHOD => 'bg-blue-100 text-blue-800',
            self::BANK_TRANSFER => 'bg-green-100 text-green-800',
            self::CASH => 'bg-yellow-100 text-yellow-800',
            self::STORE_CREDIT => 'bg-purple-100 text-purple-800',
            self::MANUAL => 'bg-gray-100 text-gray-800',
        };
    }

    public function getIconClass(): string
    {
        return match ($this) {
            self::ORIGINAL_METHOD => 'fas fa-credit-card',
            self::BANK_TRANSFER => 'fas fa-university',
            self::CASH => 'fas fa-money-bill-wave',
            self::STORE_CREDIT => 'fas fa-gift',
            self::MANUAL => 'fas fa-cog',
        };
    }

    public static function fromString(string $method): self
    {
        return match (strtolower($method)) {
            'original_method' => self::ORIGINAL_METHOD,
            'bank_transfer' => self::BANK_TRANSFER,
            'cash' => self::CASH,
            'store_credit' => self::STORE_CREDIT,
            'manual' => self::MANUAL,
            default => throw new \ValueError("Invalid refund method: {$method}"),
        };
    }

    public static function getAutomatedMethods(): array
    {
        return array_filter(self::cases(), fn($case) => $case->isAutomated());
    }

    public static function getManualMethods(): array
    {
        return array_filter(self::cases(), fn($case) => !$case->isAutomated());
    }

    public static function getInstantMethods(): array
    {
        return array_filter(self::cases(), fn($case) => $case->isInstant());
    }
}