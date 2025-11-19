<?php

namespace App\Domain\Order\Enums;

enum OrderStatus: string
{
    case NEW = 'new';
    case SOURCING_VENDOR = 'sourcing_vendor';
    case VENDOR_NEGOTIATION = 'vendor_negotiation';
    case CUSTOMER_QUOTATION = 'customer_quotation';
    case WAITING_PAYMENT = 'waiting_payment';
    case PAYMENT_RECEIVED = 'payment_received';
    case IN_PRODUCTION = 'in_production';
    case QUALITY_CHECK = 'quality_check';
    case READY_TO_SHIP = 'ready_to_ship';
    case SHIPPED = 'shipped';
    case DELIVERED = 'delivered';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::NEW => 'Pesanan Baru',
            self::SOURCING_VENDOR => 'Mencari Vendor',
            self::VENDOR_NEGOTIATION => 'Negosiasi Vendor',
            self::CUSTOMER_QUOTATION => 'Penawaran Harga',
            self::WAITING_PAYMENT => 'Menunggu Pembayaran',
            self::PAYMENT_RECEIVED => 'Pembayaran Diterima',
            self::IN_PRODUCTION => 'Dalam Produksi',
            self::QUALITY_CHECK => 'Pengecekan Kualitas',
            self::READY_TO_SHIP => 'Siap Dikirim',
            self::SHIPPED => 'Dikirim',
            self::DELIVERED => 'Terkirim',
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
            self::NEW => [
                self::SOURCING_VENDOR,
                self::CUSTOMER_QUOTATION,
                self::CANCELLED,
            ],
            self::SOURCING_VENDOR => [
                self::VENDOR_NEGOTIATION,
                self::CANCELLED,
            ],
            self::VENDOR_NEGOTIATION => [
                self::CUSTOMER_QUOTATION,
                self::SOURCING_VENDOR,
                self::CANCELLED,
            ],
            self::CUSTOMER_QUOTATION => [
                self::WAITING_PAYMENT,
                self::VENDOR_NEGOTIATION,
                self::CANCELLED,
            ],
            self::WAITING_PAYMENT => [
                self::PAYMENT_RECEIVED,
                self::CANCELLED,
            ],
            self::PAYMENT_RECEIVED => [
                self::IN_PRODUCTION,
                self::REFUNDED,
            ],
            self::IN_PRODUCTION => [
                self::QUALITY_CHECK,
                self::CANCELLED,
                self::REFUNDED,
            ],
            self::QUALITY_CHECK => [
                self::READY_TO_SHIP,
                self::IN_PRODUCTION,
                self::REFUNDED,
            ],
            self::READY_TO_SHIP => [
                self::SHIPPED,
            ],
            self::SHIPPED => [
                self::DELIVERED,
            ],
            self::DELIVERED => [
                self::COMPLETED,
            ],
            self::COMPLETED => [],
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
            'new' => self::NEW,
            'sourcing_vendor' => self::SOURCING_VENDOR,
            'vendor_negotiation' => self::VENDOR_NEGOTIATION,
            'customer_quotation' => self::CUSTOMER_QUOTATION,
            'waiting_payment' => self::WAITING_PAYMENT,
            'payment_received' => self::PAYMENT_RECEIVED,
            'in_production' => self::IN_PRODUCTION,
            'quality_check' => self::QUALITY_CHECK,
            'ready_to_ship' => self::READY_TO_SHIP,
            'shipped' => self::SHIPPED,
            'delivered' => self::DELIVERED,
            'completed' => self::COMPLETED,
            'cancelled' => self::CANCELLED,
            'refunded' => self::REFUNDED,
            default => throw new \InvalidArgumentException("Status pesanan tidak valid: {$status}"),
        };
    }
}