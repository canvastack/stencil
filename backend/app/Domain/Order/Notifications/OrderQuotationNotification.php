<?php

namespace App\Domain\Order\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

use App\Infrastructure\Persistence\Eloquent\Models\Order;

class OrderQuotationNotification extends OrderNotification
{
    public function __construct(
        Order $order,
        protected int $quotationAmount
    ) {
        parent::__construct($order);
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Penawaran Harga - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Kami telah menyiapkan penawaran harga untuk pesanan Anda.')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Total Penawaran: **' . $this->formatCurrency($this->quotationAmount) . '**')
            ->line('Silakan tinjau penawaran dan lakukan pembayaran untuk melanjutkan.')
            ->action('Lihat Penawaran', $this->getOrderUrl())
            ->line('Penawaran ini berlaku selama 7 hari.')
            ->line('Terima kasih!');
    }

    protected function getDatabaseMessage(): string
    {
        return "Penawaran harga untuk pesanan {$this->order->order_number} sebesar " . 
               $this->formatCurrency($this->quotationAmount) . " telah dikirim";
    }

    protected function getSmsMessage($notifiable): string
    {
        return 'Penawaran pesanan ' . $this->order->order_number . ' sebesar ' . $this->formatCurrency($this->quotationAmount) . ' siap ditinjau.';
    }

    public function toDatabase($notifiable): array
    {
        return array_merge(parent::toDatabase($notifiable), [
            'quotation_amount' => $this->quotationAmount,
        ]);
    }
}
