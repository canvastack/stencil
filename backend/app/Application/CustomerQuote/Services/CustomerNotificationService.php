<?php

namespace App\Application\CustomerQuote\Services;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerNotification;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;

class CustomerNotificationService
{
    /**
     * Create a notification for quote sent.
     */
    public function notifyQuoteSent(CustomerQuote $quote): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'quote_sent',
            'title' => 'New Quote Received',
            'message' => "You have received a new quotation #{$quote->quote_number}. Please review and respond.",
            'priority' => 'high',
            'action_url' => "/quotes/{$quote->response_token}",
            'action_text' => 'View Quote',
            'data' => [
                'quote_number' => $quote->quote_number,
                'grand_total' => $quote->grand_total,
                'currency' => $quote->currency,
                'valid_until' => $quote->valid_until->toIso8601String(),
            ],
        ]);
    }

    /**
     * Create a notification for quote expiring soon.
     */
    public function notifyQuoteExpiringSoon(CustomerQuote $quote, int $hoursRemaining): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'quote_expiring_soon',
            'title' => 'Quote Expiring Soon',
            'message' => "Your quotation #{$quote->quote_number} will expire in {$hoursRemaining} hours. Please respond before it expires.",
            'priority' => 'urgent',
            'action_url' => "/quotes/{$quote->response_token}",
            'action_text' => 'View Quote',
            'data' => [
                'quote_number' => $quote->quote_number,
                'hours_remaining' => $hoursRemaining,
                'valid_until' => $quote->valid_until->toIso8601String(),
            ],
        ]);
    }

    /**
     * Create a notification for quote expired.
     */
    public function notifyQuoteExpired(CustomerQuote $quote): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'quote_expired',
            'title' => 'Quote Expired',
            'message' => "Your quotation #{$quote->quote_number} has expired. Please contact us if you're still interested.",
            'priority' => 'normal',
            'action_url' => "/quotes/{$quote->response_token}",
            'action_text' => 'View Quote',
            'data' => [
                'quote_number' => $quote->quote_number,
                'expired_at' => $quote->valid_until->toIso8601String(),
            ],
        ]);
    }

    /**
     * Create a notification for quote accepted (auto-approved).
     */
    public function notifyQuoteAccepted(CustomerQuote $quote): CustomerNotification
    {
        // Get payment schedule from order
        $paymentSchedule = $quote->order->payment_schedule ?? [];
        $dpSchedule = collect($paymentSchedule)->firstWhere('type', 'dp_50');
        
        $dpAmount = $dpSchedule['amount'] ?? ($quote->grand_total * 0.5);
        $dpDueDate = $dpSchedule['due_date'] ?? now()->addDays(3)->toDateString();

        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'quote_accepted',
            'title' => 'Quote Accepted - Payment Required',
            'message' => "Your quotation #{$quote->quote_number} has been accepted. Please proceed with down payment of " . 
                         number_format($dpAmount / 100, 0, ',', '.') . " IDR by {$dpDueDate}.",
            'priority' => 'high',
            'action_url' => "/customer/quotes/{$quote->uuid}",
            'action_text' => 'Make Payment',
            'data' => [
                'quote_number' => $quote->quote_number,
                'approval_method' => $quote->approval_method,
                'grand_total' => $quote->grand_total,
                'currency' => $quote->currency,
                'payment_initiated' => true,
                'dp_amount' => $dpAmount,
                'dp_due_date' => $dpDueDate,
                'payment_schedule' => $paymentSchedule,
            ],
        ]);
    }

    /**
     * Create a notification for quote pending approval.
     */
    public function notifyQuotePendingApproval(CustomerQuote $quote): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'quote_pending_approval',
            'title' => 'Quote Under Review',
            'message' => "Your acceptance of quotation #{$quote->quote_number} is being reviewed by our team. You'll receive payment instructions within 24 hours.",
            'priority' => 'normal',
            'action_url' => "/customer/quotes/{$quote->uuid}",
            'action_text' => 'View Details',
            'data' => [
                'quote_number' => $quote->quote_number,
                'approval_reason' => $quote->approval_reason,
            ],
        ]);
    }

    /**
     * Create a notification for counter offer received from admin.
     */
    public function notifyCounterOfferReceived(CustomerQuote $quote): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'counter_offer_received',
            'title' => 'Counter Offer Received',
            'message' => "We have sent you a counter offer for quotation #{$quote->quote_number}. Please review the updated terms.",
            'priority' => 'high',
            'action_url' => "/quotes/{$quote->response_token}",
            'action_text' => 'View Counter Offer',
            'data' => [
                'quote_number' => $quote->quote_number,
                'new_amount' => $quote->grand_total,
                'currency' => $quote->currency,
                'negotiation_round' => $quote->counter_offer_round,
            ],
        ]);
    }

    /**
     * Create a notification for counter offer accepted.
     */
    public function notifyCounterOfferAccepted(CustomerQuote $quote): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'counter_offer_accepted',
            'title' => 'Counter Offer Accepted',
            'message' => "Your counter offer for quotation #{$quote->quote_number} has been accepted. Please proceed with payment.",
            'priority' => 'high',
            'action_url' => "/customer/quotes/{$quote->uuid}",
            'action_text' => 'View Details',
            'data' => [
                'quote_number' => $quote->quote_number,
                'final_amount' => $quote->grand_total,
                'currency' => $quote->currency,
            ],
        ]);
    }

    /**
     * Create a notification for counter offer rejected.
     */
    public function notifyCounterOfferRejected(CustomerQuote $quote, string $reason): CustomerNotification
    {
        return CustomerNotification::create([
            'tenant_id' => $quote->tenant_id,
            'customer_id' => $quote->order->customer_id,
            'customer_quote_id' => $quote->id,
            'order_id' => $quote->order_id,
            'type' => 'counter_offer_rejected',
            'title' => 'Counter Offer Declined',
            'message' => "Your counter offer for quotation #{$quote->quote_number} has been declined. Reason: {$reason}",
            'priority' => 'normal',
            'action_url' => "/customer/quotes/{$quote->uuid}",
            'action_text' => 'View Details',
            'data' => [
                'quote_number' => $quote->quote_number,
                'rejection_reason' => $reason,
            ],
        ]);
    }

    /**
     * Get unread notifications for a customer.
     */
    public function getUnreadNotifications(int $customerId, int $tenantId, int $limit = 10)
    {
        return CustomerNotification::where('customer_id', $customerId)
            ->where('tenant_id', $tenantId)
            ->unread()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get all notifications for a customer.
     */
    public function getAllNotifications(int $customerId, int $tenantId, int $perPage = 20)
    {
        return CustomerNotification::where('customer_id', $customerId)
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get unread count for a customer.
     */
    public function getUnreadCount(int $customerId, int $tenantId): int
    {
        return CustomerNotification::where('customer_id', $customerId)
            ->where('tenant_id', $tenantId)
            ->unread()
            ->count();
    }

    /**
     * Mark notification as read.
     */
    public function markAsRead(string $uuid, int $customerId, int $tenantId): bool
    {
        $notification = CustomerNotification::where('uuid', $uuid)
            ->where('customer_id', $customerId)
            ->where('tenant_id', $tenantId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            return true;
        }

        return false;
    }

    /**
     * Mark all notifications as read for a customer.
     */
    public function markAllAsRead(int $customerId, int $tenantId): int
    {
        return CustomerNotification::where('customer_id', $customerId)
            ->where('tenant_id', $tenantId)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Delete a notification.
     */
    public function deleteNotification(string $uuid, int $customerId, int $tenantId): bool
    {
        return CustomerNotification::where('uuid', $uuid)
            ->where('customer_id', $customerId)
            ->where('tenant_id', $tenantId)
            ->delete() > 0;
    }
}
