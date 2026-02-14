<?php

namespace App\Domain\Order\Notifications;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Notifications\Messages\MailMessage;

class QuoteAcceptedByVendorNotification extends OrderNotification
{
    public function __construct(
        Order $order,
        protected OrderVendorNegotiation $quote,
        protected int $estimatedDeliveryDays
    ) {
        parent::__construct($order);
    }

    public function toMail($notifiable): MailMessage
    {
        $vendorName = $this->quote->vendor?->name ?? 'Vendor';
        $quoteNumber = $this->quote->quote_number;
        $orderNumber = $this->order->order_number;
        $agreedPrice = $this->quote->latest_offer ?? $this->quote->initial_offer;
        
        return (new MailMessage)
            ->subject('Vendor Accepted Quote - ' . $quoteNumber)
            ->view('emails.admin.quote-accepted-by-vendor', [
                'admin' => $notifiable,
                'order' => $this->order,
                'quote' => $this->quote,
                'vendorName' => $vendorName,
                'quoteNumber' => $quoteNumber,
                'orderNumber' => $orderNumber,
                'agreedPrice' => $agreedPrice,
                'estimatedDeliveryDays' => $this->estimatedDeliveryDays,
                'orderUrl' => $this->getOrderUrl(),
                'quoteUrl' => $this->getQuoteUrl(),
            ]);
    }

    protected function getDatabaseMessage(): string
    {
        $vendorName = $this->quote->vendor?->name ?? 'Vendor';
        return "Vendor {$vendorName} accepted quote {$this->quote->quote_number}. " .
               "Order {$this->order->order_number} status updated to Customer Quote. " .
               "Estimated delivery: {$this->estimatedDeliveryDays} days.";
    }

    protected function getSmsMessage($notifiable): string
    {
        $vendorName = $this->quote->vendor?->name ?? 'Vendor';
        return "Quote {$this->quote->quote_number} accepted by {$vendorName}. " .
               "Order {$this->order->order_number} ready for customer quotation. " .
               "Delivery: {$this->estimatedDeliveryDays} days.";
    }

    protected function getQuoteUrl(): string
    {
        return config('app.frontend_url') . '/admin/quotes/' . $this->quote->uuid;
    }

    public function toDatabase($notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'quote_id' => $this->quote->id,
            'quote_number' => $this->quote->quote_number,
            'vendor_name' => $this->quote->vendor?->name,
            'agreed_price' => $this->quote->latest_offer ?? $this->quote->initial_offer,
            'estimated_delivery_days' => $this->estimatedDeliveryDays,
            'status' => $this->order->status,
            'message' => $this->getDatabaseMessage(),
        ];
    }
}
