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
            self::NEW => 'Pesanan baru masuk ke sistem',
            self::SOURCING_VENDOR => 'Tim sedang mencari vendor yang sesuai',
            self::VENDOR_NEGOTIATION => 'Negosiasi harga dan timeline dengan vendor',
            self::CUSTOMER_QUOTATION => 'Menunggu konfirmasi penawaran harga dari customer',
            self::WAITING_PAYMENT => 'Menunggu pembayaran dari customer',
            self::PAYMENT_RECEIVED => 'Pembayaran telah diterima',
            self::IN_PRODUCTION => 'Pesanan sedang dalam proses produksi',
            self::QUALITY_CHECK => 'Produk sedang dalam pengecekan kualitas',
            self::READY_TO_SHIP => 'Produk siap untuk dikirim',
            self::SHIPPED => 'Pesanan sudah dikirim ke customer',
            self::DELIVERED => 'Pesanan telah diterima customer',
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
            self::NEW,
            self::SOURCING_VENDOR,
            self::VENDOR_NEGOTIATION,
            self::CUSTOMER_QUOTATION,
            self::WAITING_PAYMENT,
        ]);
    }

    public function canBeRefunded(): bool
    {
        return in_array($this, [
            self::PAYMENT_RECEIVED,
            self::IN_PRODUCTION,
            self::QUALITY_CHECK,
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
            self::CUSTOMER_QUOTATION,
            self::WAITING_PAYMENT,
        ]);
    }

    public function requiresVendor(): bool
    {
        return in_array($this, [
            self::SOURCING_VENDOR,
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
            'pending' => self::PENDING,
            'vendor_sourcing' => self::VENDOR_SOURCING,
            'vendor_negotiation' => self::VENDOR_NEGOTIATION,
            'customer_quote' => self::CUSTOMER_QUOTE,
            'awaiting_payment' => self::AWAITING_PAYMENT,
            'partial_payment' => self::PARTIAL_PAYMENT,
            'full_payment' => self::FULL_PAYMENT,
            'in_production' => self::IN_PRODUCTION,
            'quality_control' => self::QUALITY_CONTROL,
            'shipping' => self::SHIPPING,
            'completed' => self::COMPLETED,
            'cancelled' => self::CANCELLED,
            'refunded' => self::REFUNDED,
            default => throw new \ValueError("Status pesanan tidak valid: {$status}"),
        };
    }
}