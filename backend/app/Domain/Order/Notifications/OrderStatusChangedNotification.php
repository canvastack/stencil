<?php

namespace App\Domain\Order\Notifications;

use App\Domain\Order\Enums\OrderStatus;
use Illuminate\Notifications\Messages\MailMessage;

use App\Infrastructure\Persistence\Eloquent\Models\Order;

class OrderStatusChangedNotification extends OrderNotification
{
    public function __construct(
        Order $order,
        protected string $oldStatus,
        protected string $newStatus
    ) {
        parent::__construct($order);
    }

    public function toMail($notifiable): MailMessage
    {
        $status = OrderStatus::fromString($this->newStatus);
        
        $message = (new MailMessage)
            ->subject('Status Pesanan Diperbarui - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Status pesanan Anda telah diperbarui.')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Status Baru: **' . $status->label() . '**')
            ->line($status->description());

        if ($this->newStatus === 'shipped' && $this->order->tracking_number) {
            $message->line('Nomor Resi: **' . $this->order->tracking_number . '**');
        }

        return $message
            ->action('Lihat Detail Pesanan', $this->getOrderUrl())
            ->line('Terima kasih!');
    }

    protected function getDatabaseMessage(): string
    {
        $status = OrderStatus::fromString($this->newStatus);
        return "Status pesanan {$this->order->order_number} diubah menjadi {$status->label()}";
    }

    protected function getSmsMessage($notifiable): string
    {
        $status = OrderStatus::fromString($this->newStatus)->label();
        $message = 'Status pesanan ' . $this->order->order_number . ' sekarang ' . $status . '.';

        if ($this->newStatus === 'shipped' && $this->order->tracking_number) {
            $message .= ' Resi: ' . $this->order->tracking_number . '.';
        }

        return $message;
    }

    public function toDatabase($notifiable): array
    {
        return array_merge(parent::toDatabase($notifiable), [
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
        ]);
    }
}
