<?php

namespace App\Domain\Order\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class OrderPaymentService
{
    public function recordCustomerPayment(Order $order, array $data): OrderPaymentTransaction
    {
        $amount = (int) Arr::get($data, 'amount', 0);

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Jumlah pembayaran harus lebih besar dari 0');
        }

        $currency = Arr::get($data, 'currency', $order->currency ?? 'IDR');
        $paidAt = Arr::get($data, 'paid_at');
        $paidAt = $paidAt ? Carbon::parse($paidAt) : Carbon::now();
        $status = Arr::get($data, 'status', 'completed');
        $method = Arr::get($data, 'method');
        if (!$method) {
            $method = $order->payment_method;
        }
        $reference = Arr::get($data, 'reference');
        $dueAt = Arr::get($data, 'due_at');
        $dueAt = $dueAt ? Carbon::parse($dueAt) : null;

        $type = Arr::get($data, 'type');

        $previousPaid = $order->total_paid_amount;
        $remaining = max(0, ($order->total_amount ?? 0) - $previousPaid);

        if ($remaining <= 0) {
            throw new \DomainException('Pesanan sudah lunas');
        }

        if ($amount > $remaining) {
            $amount = $remaining;
        }

        if (!$type) {
            $type = $amount >= $remaining ? 'final_payment' : 'down_payment';
        }

        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'customer_id' => $order->customer_id,
            'vendor_id' => null,
            'direction' => 'incoming',
            'type' => $type,
            'status' => $status,
            'amount' => $amount,
            'currency' => $currency,
            'method' => $method,
            'reference' => $reference,
            'due_at' => $dueAt,
            'paid_at' => $paidAt,
            'metadata' => Arr::get($data, 'metadata'),
        ]);

        $order->total_paid_amount = $previousPaid + $amount;
        if ($method) {
            $order->payment_method = $method;
        }

        if ($order->total_paid_amount >= ($order->total_amount ?? 0)) {
            $order->payment_status = 'paid';
            $order->payment_date = $paidAt;
        } elseif ($order->total_paid_amount > 0) {
            $order->payment_status = 'partially_paid';
        } else {
            $order->payment_status = 'unpaid';
        }

        if ($type === 'down_payment' && !$order->down_payment_paid_at) {
            $order->down_payment_paid_at = $paidAt;
        }

        if (Arr::has($data, 'down_payment_amount')) {
            $order->down_payment_amount = (int) Arr::get($data, 'down_payment_amount', $order->down_payment_amount);
        }

        if ($dueAt && !$order->down_payment_due_at) {
            $order->down_payment_due_at = $dueAt;
        }

        $metadata = $order->metadata ?? [];
        $currentPayments = $metadata['payments'] ?? [];
        if (!is_array($currentPayments)) {
            $currentPayments = [];
        }

        $currentPayments = array_merge($currentPayments, [
            'last_customer_payment_at' => $paidAt->toIso8601String(),
            'last_payment_reference' => $reference,
            'last_payment_method' => $method,
        ]);

        $metadata['payments'] = $currentPayments;
        $order->metadata = $metadata;

        $order->save();

        Log::info('Customer payment recorded', [
            'order_id' => $order->id,
            'transaction_id' => $transaction->id,
            'amount' => $amount,
            'currency' => $currency,
            'tenant_id' => $order->tenant_id,
        ]);

        return $transaction;
    }

    public function recordVendorDisbursement(Order $order, array $data): OrderPaymentTransaction
    {
        $amount = (int) Arr::get($data, 'amount', 0);

        if ($amount <= 0) {
            throw new \InvalidArgumentException('Jumlah disbursement harus lebih besar dari 0');
        }

        $currency = Arr::get($data, 'currency', $order->currency ?? 'IDR');
        $paidAt = Arr::get($data, 'paid_at');
        $paidAt = $paidAt ? Carbon::parse($paidAt) : Carbon::now();
        $status = Arr::get($data, 'status', 'completed');
        $method = Arr::get($data, 'method', $order->payment_method);
        $reference = Arr::get($data, 'reference');
        $dueAt = Arr::get($data, 'due_at');
        $dueAt = $dueAt ? Carbon::parse($dueAt) : null;
        $type = Arr::get($data, 'type', 'vendor_disbursement');

        $vendorId = Arr::get($data, 'vendor_id', $order->vendor_id);

        if (!$vendorId) {
            throw new \DomainException('Vendor harus dihubungkan sebelum melakukan disbursement');
        }

        $transaction = OrderPaymentTransaction::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'customer_id' => null,
            'vendor_id' => $vendorId,
            'direction' => 'outgoing',
            'type' => $type,
            'status' => $status,
            'amount' => $amount,
            'currency' => $currency,
            'method' => $method,
            'reference' => $reference,
            'due_at' => $dueAt,
            'paid_at' => $paidAt,
            'metadata' => Arr::get($data, 'metadata'),
        ]);

        $order->total_disbursed_amount = ($order->total_disbursed_amount ?? 0) + $amount;

        $metadata = $order->metadata ?? [];
        $currentPayments = $metadata['payments'] ?? [];
        if (!is_array($currentPayments)) {
            $currentPayments = [];
        }

        $currentPayments = array_merge($currentPayments, [
            'last_vendor_disbursement_at' => $paidAt->toIso8601String(),
            'last_disbursement_reference' => $reference,
        ]);

        $metadata['payments'] = $currentPayments;
        $order->metadata = $metadata;

        $order->save();

        Log::info('Vendor disbursement recorded', [
            'order_id' => $order->id,
            'transaction_id' => $transaction->id,
            'amount' => $amount,
            'currency' => $currency,
            'tenant_id' => $order->tenant_id,
            'vendor_id' => $vendorId,
        ]);

        return $transaction;
    }
}
