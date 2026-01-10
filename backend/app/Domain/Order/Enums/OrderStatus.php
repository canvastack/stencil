<?php

namespace App\Domain\Order\Enums;

enum OrderStatus: string
{
    // PT CEX Business Workflow - 12 Status System
    case DRAFT = 'draft';
    case PENDING = 'pending';
    case VENDOR_SOURCING = 'vendor_sourcing';
    case VENDOR_NEGOTIATION = 'vendor_negotiation';
    case CUSTOMER_QUOTE = 'customer_quote';
    case AWAITING_PAYMENT = 'awaiting_payment';
    case PARTIAL_PAYMENT = 'partial_payment';
    case FULL_PAYMENT = 'full_payment';
    case IN_PRODUCTION = 'in_production';
    case QUALITY_CONTROL = 'quality_control';
    case SHIPPING = 'shipping';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft Order',
            self::PENDING => 'Pending Review',
            self::VENDOR_SOURCING => 'Mencari Vendor',
            self::VENDOR_NEGOTIATION => 'Negosiasi Vendor',
            self::CUSTOMER_QUOTE => 'Penawaran Harga',
            self::AWAITING_PAYMENT => 'Menunggu Pembayaran',
            self::PARTIAL_PAYMENT => 'DP Diterima (50%)',
            self::FULL_PAYMENT => 'Full Payment (100%)',
            self::IN_PRODUCTION => 'Dalam Produksi',
            self::QUALITY_CONTROL => 'Quality Control',
            self::SHIPPING => 'Sedang Dikirim',
            self::COMPLETED => 'Selesai',
            self::CANCELLED => 'Dibatalkan',
            self::REFUNDED => 'Dikembalikan',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::DRAFT => 'Pesanan dalam bentuk draft',
            self::PENDING => 'Pesanan baru masuk ke sistem',
            self::VENDOR_SOURCING => 'Tim sedang mencari vendor yang sesuai',
            self::VENDOR_NEGOTIATION => 'Negosiasi harga dan timeline dengan vendor',
            self::CUSTOMER_QUOTE => 'Menunggu konfirmasi penawaran harga dari customer',
            self::AWAITING_PAYMENT => 'Menunggu pembayaran dari customer',
            self::PARTIAL_PAYMENT => 'DP 50% telah diterima',
            self::FULL_PAYMENT => 'Pembayaran telah diterima 100%',
            self::IN_PRODUCTION => 'Pesanan sedang dalam proses produksi',
            self::QUALITY_CONTROL => 'Produk sedang dalam pengecekan kualitas',
            self::SHIPPING => 'Pesanan sudah dikirim ke customer',
            self::COMPLETED => 'Pesanan selesai',
            self::CANCELLED => 'Pesanan dibatalkan',
            self::REFUNDED => 'Dana telah dikembalikan ke customer',
        };
    }

    public function canBeUpdated(): bool
    {
        return !in_array($this, [
            self::COMPLETED,
            self::CANCELLED,
            self::REFUNDED,
        ]);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this, [
            self::DRAFT,
            self::PENDING,
            self::VENDOR_SOURCING,
            self::VENDOR_NEGOTIATION,
            self::CUSTOMER_QUOTE,
            self::AWAITING_PAYMENT,
        ]);
    }

    public function canBeRefunded(): bool
    {
        return in_array($this, [
            self::PARTIAL_PAYMENT,
            self::FULL_PAYMENT,
            self::IN_PRODUCTION,
            self::QUALITY_CONTROL,
            self::CANCELLED,
        ]);
    }

    public function isActive(): bool
    {
        return !in_array($this, [
            self::COMPLETED,
            self::CANCELLED,
            self::REFUNDED,
        ]);
    }

    public function requiresPayment(): bool
    {
        return in_array($this, [
            self::CUSTOMER_QUOTE,
            self::AWAITING_PAYMENT,
        ]);
    }

    public function requiresVendor(): bool
    {
        return in_array($this, [
            self::VENDOR_SOURCING,
            self::VENDOR_NEGOTIATION,
            self::IN_PRODUCTION,
        ]);
    }

    public function getAllowedTransitions(): array
    {
        return match ($this) {
            self::DRAFT => [
                self::PENDING,
            ],
            self::PENDING => [
                self::VENDOR_SOURCING,
                self::CUSTOMER_QUOTE,
                self::CANCELLED,
            ],
            self::VENDOR_SOURCING => [
                self::VENDOR_NEGOTIATION,
                self::CANCELLED,
            ],
            self::VENDOR_NEGOTIATION => [
                self::CUSTOMER_QUOTE,
                self::VENDOR_SOURCING,
                self::CANCELLED,
            ],
            self::CUSTOMER_QUOTE => [
                self::AWAITING_PAYMENT,
                self::VENDOR_NEGOTIATION,
                self::CANCELLED,
            ],
            self::AWAITING_PAYMENT => [
                self::PARTIAL_PAYMENT,
                self::FULL_PAYMENT,
                self::CANCELLED,
            ],
            self::PARTIAL_PAYMENT => [
                self::IN_PRODUCTION,
                self::CANCELLED,
            ],
            self::FULL_PAYMENT => [
                self::IN_PRODUCTION,
            ],
            self::IN_PRODUCTION => [
                self::QUALITY_CONTROL,
            ],
            self::QUALITY_CONTROL => [
                self::SHIPPING,
                self::IN_PRODUCTION,
            ],
            self::SHIPPING => [
                self::COMPLETED,
            ],
            self::COMPLETED => [
                self::REFUNDED,
            ],
            self::CANCELLED => [
                self::REFUNDED,
            ],
            self::REFUNDED => [],
        };
    }

    public function canTransitionTo(OrderStatus $newStatus): bool
    {
        return in_array($newStatus, $this->getAllowedTransitions());
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'draft' => self::DRAFT,
            'pending', 'new' => self::PENDING,
            'vendor_sourcing', 'sourcing_vendor' => self::VENDOR_SOURCING,
            'vendor_negotiation' => self::VENDOR_NEGOTIATION,
            'customer_quote', 'customer_quotation' => self::CUSTOMER_QUOTE,
            'awaiting_payment', 'waiting_payment' => self::AWAITING_PAYMENT,
            'partial_payment' => self::PARTIAL_PAYMENT,
            'full_payment', 'payment_received' => self::FULL_PAYMENT,
            'in_production' => self::IN_PRODUCTION,
            'quality_control', 'quality_check' => self::QUALITY_CONTROL,
            'shipping', 'ready_to_ship', 'shipped' => self::SHIPPING,
            'completed', 'delivered' => self::COMPLETED,
            'cancelled' => self::CANCELLED,
            'refunded' => self::REFUNDED,
            default => throw new \ValueError("Status pesanan tidak valid: {$status}"),
        };
    }
}