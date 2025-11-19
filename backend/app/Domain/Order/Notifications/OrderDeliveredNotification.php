<?php

namespace App\Domain\Order\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class OrderDeliveredNotification extends OrderNotification
{
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pesanan Telah Diterima - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Pesanan Anda telah diterima!')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Kami harap Anda puas dengan produk yang diterima.')
            ->line('Jika ada masalah, jangan ragu untuk menghubungi kami.')
            ->action('Berikan Ulasan', $this->getOrderUrl())
            ->line('Terima kasih telah berbelanja dengan kami!');
    }

    protected function getDatabaseMessage(): string
    {
        return "Pesanan {$this->order->order_number} telah diterima";
    }

    protected function getSmsMessage($notifiable): string
    {
        return 'Pesanan ' . $this->order->order_number . ' telah diterima. Terima kasih sudah mempercayai kami.';
    }
}
