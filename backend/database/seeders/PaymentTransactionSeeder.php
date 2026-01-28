<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;

class PaymentTransactionSeeder extends Seeder
{
    public function run(): void
    {
        // Get first 10 orders with customers
        $orders = Order::with('customer')
            ->whereNotNull('customer_id')
            ->take(10)
            ->get();

        foreach ($orders as $order) {
            if ($order->customer) {
                // Create a payment transaction for each order
                OrderPaymentTransaction::create([
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                    'direction' => 'incoming',
                    'type' => 'payment',
                    'status' => 'completed',
                    'amount' => $order->total_amount,
                    'currency' => 'IDR',
                    'method' => fake()->randomElement(['bank_transfer', 'credit_card', 'e_wallet', 'cash']),
                    'reference' => 'TXN-' . $order->order_number,
                    'paid_at' => fake()->dateTimeBetween('-30 days', 'now'),
                ]);

                // Sometimes add a partial refund
                if (fake()->boolean(20)) {
                    OrderPaymentTransaction::create([
                        'tenant_id' => $order->tenant_id,
                        'order_id' => $order->id,
                        'customer_id' => $order->customer_id,
                        'direction' => 'outgoing',
                        'type' => 'refund',
                        'status' => 'completed',
                        'amount' => intval($order->total_amount * 0.1), // 10% refund
                        'currency' => 'IDR',
                        'method' => 'bank_transfer',
                        'reference' => 'REF-' . $order->order_number,
                        'paid_at' => fake()->dateTimeBetween('-15 days', 'now'),
                    ]);
                }
            }
        }

        $this->command->info('Created payment transactions for ' . $orders->count() . ' orders');
    }
}