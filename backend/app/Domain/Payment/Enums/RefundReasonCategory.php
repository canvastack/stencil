<?php

namespace App\Domain\Payment\Enums;

enum RefundReasonCategory: string
{
    case CUSTOMER_REQUEST = 'customer_request';
    case ORDER_CANCELLATION = 'order_cancellation';
    case PRODUCT_DEFECT = 'product_defect';
    case SHIPPING_ISSUE = 'shipping_issue';
    case DUPLICATE_PAYMENT = 'duplicate_payment';
    case FRAUD = 'fraud';
    case OTHER = 'other';

    public function label(): string
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => 'Customer Request',
            self::ORDER_CANCELLATION => 'Order Cancellation',
            self::PRODUCT_DEFECT => 'Product Defect',
            self::SHIPPING_ISSUE => 'Shipping Issue',
            self::DUPLICATE_PAYMENT => 'Duplicate Payment',
            self::FRAUD => 'Fraud',
            self::OTHER => 'Other',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => 'Customer requested refund for personal reasons',
            self::ORDER_CANCELLATION => 'Order was cancelled before or during production',
            self::PRODUCT_DEFECT => 'Product has quality issues or defects',
            self::SHIPPING_ISSUE => 'Problems with shipping or delivery',
            self::DUPLICATE_PAYMENT => 'Customer made duplicate payment',
            self::FRAUD => 'Fraudulent transaction detected',
            self::OTHER => 'Other reasons not listed above',
        };
    }

    public function requiresApproval(): bool
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => true,
            self::ORDER_CANCELLATION => false, // Auto-approve for cancellations
            self::PRODUCT_DEFECT => true,
            self::SHIPPING_ISSUE => true,
            self::DUPLICATE_PAYMENT => false, // Auto-approve for duplicates
            self::FRAUD => true, // Requires investigation
            self::OTHER => true,
        };
    }

    public function getApprovalLevel(): string
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => 'low',
            self::ORDER_CANCELLATION => 'low',
            self::PRODUCT_DEFECT => 'medium',
            self::SHIPPING_ISSUE => 'medium',
            self::DUPLICATE_PAYMENT => 'low',
            self::FRAUD => 'high',
            self::OTHER => 'medium',
        };
    }

    public function affectsVendorPayment(): bool
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => true,
            self::ORDER_CANCELLATION => true,
            self::PRODUCT_DEFECT => true,
            self::SHIPPING_ISSUE => false, // Shipping is company responsibility
            self::DUPLICATE_PAYMENT => false,
            self::FRAUD => false,
            self::OTHER => true,
        };
    }

    public function getColorClass(): string
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => 'bg-blue-100 text-blue-800',
            self::ORDER_CANCELLATION => 'bg-yellow-100 text-yellow-800',
            self::PRODUCT_DEFECT => 'bg-red-100 text-red-800',
            self::SHIPPING_ISSUE => 'bg-orange-100 text-orange-800',
            self::DUPLICATE_PAYMENT => 'bg-green-100 text-green-800',
            self::FRAUD => 'bg-purple-100 text-purple-800',
            self::OTHER => 'bg-gray-100 text-gray-800',
        };
    }

    public function getIconClass(): string
    {
        return match ($this) {
            self::CUSTOMER_REQUEST => 'fas fa-user',
            self::ORDER_CANCELLATION => 'fas fa-times-circle',
            self::PRODUCT_DEFECT => 'fas fa-exclamation-triangle',
            self::SHIPPING_ISSUE => 'fas fa-truck',
            self::DUPLICATE_PAYMENT => 'fas fa-copy',
            self::FRAUD => 'fas fa-shield-alt',
            self::OTHER => 'fas fa-question-circle',
        };
    }

    public static function fromString(string $category): self
    {
        return match (strtolower($category)) {
            'customer_request' => self::CUSTOMER_REQUEST,
            'order_cancellation' => self::ORDER_CANCELLATION,
            'product_defect' => self::PRODUCT_DEFECT,
            'shipping_issue' => self::SHIPPING_ISSUE,
            'duplicate_payment' => self::DUPLICATE_PAYMENT,
            'fraud' => self::FRAUD,
            'other' => self::OTHER,
            default => throw new \ValueError("Invalid refund reason category: {$category}"),
        };
    }

    public static function getAutoApprovalCategories(): array
    {
        return array_filter(self::cases(), fn($case) => !$case->requiresApproval());
    }

    public static function getManualApprovalCategories(): array
    {
        return array_filter(self::cases(), fn($case) => $case->requiresApproval());
    }

    public static function getVendorAffectingCategories(): array
    {
        return array_filter(self::cases(), fn($case) => $case->affectsVendorPayment());
    }
}