<?php

namespace App\Domain\Order\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

use App\Infrastructure\Persistence\Eloquent\Models\Order;

class OrderCancelledNotification extends OrderNotification
{
    public function __construct(
        Order $order,
        protected string $reason
    ) {
        parent::__construct($order);
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pesanan Dibatalkan - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Pesanan Anda telah dibatalkan.')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Alasan: **' . $this->reason . '**')
            ->line('Jika ada pertanyaan, silakan hubungi customer service kami.')
            ->action('Lihat Detail', $this->getOrderUrl())
            ->line('Terima kasih atas pengertian Anda.');
    }

    protected function getDatabaseMessage(): string
    {
        return "Pesanan {$this->order->order_number} telah dibatalkan. Alasan: {$this->reason}";
    }

    protected function getSmsMessage($notifiable): string
    {
        return 'Pesanan ' . $this->order->order_number . ' dibatalkan. Alasan: ' . $this->reason . '.';
    }

    public function toDatabase($notifiable): array
    {
        return array_merge(parent::toDatabase($notifiable), [
            'cancellation_reason' => $this->reason,
        ]);
    }
}
