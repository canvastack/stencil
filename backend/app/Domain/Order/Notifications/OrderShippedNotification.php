<?php

namespace App\Domain\Order\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

use App\Infrastructure\Persistence\Eloquent\Models\Order;

class OrderShippedNotification extends OrderNotification
{
    public function __construct(
        Order $order,
        protected string $trackingNumber
    ) {
        parent::__construct($order);
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pesanan Telah Dikirim - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Pesanan Anda telah dikirim!')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Nomor Resi: **' . $this->trackingNumber . '**')
            ->line('Paket Anda sedang dalam perjalanan dan akan segera tiba.')
            ->action('Lacak Pesanan', $this->getOrderUrl())
            ->line('Terima kasih atas kesabaran Anda!');
    }

    protected function getDatabaseMessage(): string
    {
        return "Pesanan {$this->order->order_number} telah dikirim dengan nomor resi {$this->trackingNumber}";
    }

    protected function getSmsMessage($notifiable): string
    {
        return 'Pesanan ' . $this->order->order_number . ' telah dikirim. Resi: ' . $this->trackingNumber . '.';
    }

    public function toDatabase($notifiable): array
    {
        return array_merge(parent::toDatabase($notifiable), [
            'tracking_number' => $this->trackingNumber,
        ]);
    }
}
