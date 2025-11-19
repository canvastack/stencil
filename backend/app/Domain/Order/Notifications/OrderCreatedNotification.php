<?php

namespace App\Domain\Order\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

class OrderCreatedNotification extends OrderNotification
{
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pesanan Baru - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Terima kasih atas pesanan Anda!')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Total: **' . $this->formatCurrency($this->order->total_amount) . '**')
            ->line('Kami akan segera memproses pesanan Anda.')
            ->action('Lihat Detail Pesanan', $this->getOrderUrl())
            ->line('Terima kasih telah menggunakan layanan kami!');
    }

    protected function getDatabaseMessage(): string
    {
        return "Pesanan {$this->order->order_number} telah dibuat dengan total " . 
               $this->formatCurrency($this->order->total_amount);
    }

    protected function getSmsMessage($notifiable): string
    {
        return 'Pesanan ' . $this->order->order_number . ' telah diterima dengan total ' . $this->formatCurrency($this->order->total_amount) . '. Terima kasih sudah memesan.';
    }
}
