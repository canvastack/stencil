<?php

namespace App\Observers;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     */
    public function created(Order $order): void
    {
        $this->updateCustomerStats($order);
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        $this->updateCustomerStats($order);
        
        // If customer_id changed, update both old and new customer
        if ($order->isDirty('customer_id') && $order->getOriginal('customer_id')) {
            $this->updateCustomerStatsById($order->getOriginal('customer_id'), $order->tenant_id);
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        $this->updateCustomerStats($order);
    }

    /**
     * Update customer statistics based on order changes
     */
    private function updateCustomerStats(Order $order): void
    {
        if (!$order->customer_id) {
            return;
        }

        $this->updateCustomerStatsById($order->customer_id, $order->tenant_id);
    }

    /**
     * Update customer statistics by customer ID
     */
    private function updateCustomerStatsById(int $customerId, int $tenantId): void
    {
        try {
            $customer = Customer::where('id', $customerId)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$customer) {
                return;
            }

            // Calculate totals from orders
            $orders = Order::where('customer_id', $customerId)
                ->where('tenant_id', $tenantId);

            $totalSpent = $orders->sum('total_amount') ?? 0;
            $totalOrders = $orders->count() ?? 0;

            // Update customer fields
            $customer->update([
                'total_spent' => $totalSpent,
                'total_orders' => $totalOrders,
            ]);

            Log::info('[OrderObserver] Updated customer stats', [
                'customer_id' => $customerId,
                'tenant_id' => $tenantId,
                'total_spent' => $totalSpent,
                'total_orders' => $totalOrders,
            ]);

        } catch (\Exception $e) {
            Log::error('[OrderObserver] Failed to update customer stats', [
                'customer_id' => $customerId,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}