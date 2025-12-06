<?php

namespace App\Domain\Order\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case PartiallyPaid = 'partially_paid';
    case Paid = 'paid';
    case Failed = 'failed';
    case Refunded = 'refunded';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Menunggu Pembayaran',
            self::PartiallyPaid => 'Sebagian Terbayar',
            self::Paid => 'Lunas',
            self::Failed => 'Gagal',
            self::Refunded => 'Dikembalikan',
            self::Cancelled => 'Dibatalkan',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'bg-yellow-100 text-yellow-800',
            self::PartiallyPaid => 'bg-blue-100 text-blue-800',
            self::Paid => 'bg-green-100 text-green-800',
            self::Failed => 'bg-red-100 text-red-800',
            self::Refunded => 'bg-gray-100 text-gray-800',
            self::Cancelled => 'bg-red-100 text-red-800',
        };
    }
}