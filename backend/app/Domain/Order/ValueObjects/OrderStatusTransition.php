<?php

namespace App\Domain\Order\ValueObjects;

use App\Domain\Order\Enums\OrderStatus;

class OrderStatusTransition
{
    private const REQUIRED_FIELDS = [
        'vendor_sourcing' => [],
        'vendor_negotiation' => ['vendor_id'],
        'customer_quote' => ['vendor_cost', 'markup_percentage', 'customer_price'],
        'awaiting_payment' => ['quote_sent_at', 'customer_price', 'total_amount'],
        'partial_payment' => ['payment_type', 'dp_amount', 'dp_received_at'],
        'full_payment' => ['payment_type', 'payment_amount', 'payment_received_at'],
        'in_production' => ['production_start'],
        'quality_control' => ['production_end'],
        'shipping' => ['qc_passed_at', 'tracking_number'],
        'completed' => ['delivered_at'],
    ];

    private const FIELD_DESCRIPTIONS = [
        'vendor_id' => 'ID vendor yang ditugaskan',
        'vendor_cost' => 'Harga dari vendor',
        'markup_percentage' => 'Persentase markup',
        'customer_price' => 'Harga ke customer',
        'quote_sent_at' => 'Waktu pengiriman quotation',
        'total_amount' => 'Total amount pesanan',
        'payment_type' => 'Tipe pembayaran (dp_50 atau full_100)',
        'dp_amount' => 'Jumlah DP',
        'dp_received_at' => 'Waktu penerimaan DP',
        'payment_amount' => 'Jumlah pembayaran penuh',
        'payment_received_at' => 'Waktu penerimaan pembayaran',
        'production_start' => 'Waktu mulai produksi',
        'production_end' => 'Waktu selesai produksi',
        'qc_passed_at' => 'Waktu QC selesai',
        'tracking_number' => 'Nomor resi pengiriman',
        'delivered_at' => 'Waktu pengiriman selesai',
    ];

    public static function canTransition(OrderStatus $from, OrderStatus $to): bool
    {
        return $from->canTransitionTo($to);
    }

    public static function getRequiredFields(OrderStatus $to): array
    {
        return self::REQUIRED_FIELDS[$to->value] ?? [];
    }

    public static function validateTransitionData(array $orderData, OrderStatus $to): array
    {
        $required = self::getRequiredFields($to);
        $missing = [];

        foreach ($required as $field) {
            $value = $orderData[$field] ?? null;
            if (empty($value) && $value !== 0 && $value !== '0') {
                $description = self::FIELD_DESCRIPTIONS[$field] ?? $field;
                $missing[] = [
                    'field' => $field,
                    'message' => "{$description} wajib diisi untuk transisi ke status {$to->label()}",
                ];
            }
        }

        return $missing;
    }

    public static function getFieldDescription(string $field): string
    {
        return self::FIELD_DESCRIPTIONS[$field] ?? $field;
    }

    public static function getAllRequiredFields(): array
    {
        return self::REQUIRED_FIELDS;
    }

    public static function validatePaymentType(?string $paymentType): bool
    {
        if ($paymentType === null) {
            return false;
        }

        return in_array($paymentType, ['dp_50', 'full_100']);
    }

    public static function validatePaymentAmount(?float $dpAmount, ?float $customerPrice): bool
    {
        if ($dpAmount === null || $customerPrice === null) {
            return false;
        }

        $expectedDp = $customerPrice * 0.5;
        $tolerance = 0.01;

        return abs($dpAmount - $expectedDp) <= $tolerance;
    }

    public static function validateFullPayment(?float $paymentAmount, ?float $customerPrice): bool
    {
        if ($paymentAmount === null || $customerPrice === null) {
            return false;
        }

        $tolerance = 0.01;

        return abs($paymentAmount - $customerPrice) <= $tolerance;
    }

    public static function validatePricing(?float $vendorCost, ?float $markupPercentage, ?float $customerPrice): bool
    {
        if ($vendorCost === null || $markupPercentage === null || $customerPrice === null) {
            return false;
        }

        $expectedCustomerPrice = $vendorCost * (1 + ($markupPercentage / 100));
        $tolerance = 0.01;

        return abs($customerPrice - $expectedCustomerPrice) <= $tolerance;
    }
}
