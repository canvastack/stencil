<?php

namespace App\Domain\Order\Notifications;

use Illuminate\Notifications\Messages\MailMessage;

use App\Infrastructure\Persistence\Eloquent\Models\Order;

class PaymentReceivedNotification extends OrderNotification
{
    public function __construct(
        Order $order,
        protected string $paymentMethod,
        protected int $paymentAmount
    ) {
        parent::__construct($order);
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pembayaran Diterima - ' . $this->order->order_number)
            ->greeting('Halo ' . $notifiable->name . ',')
            ->line('Pembayaran Anda telah kami terima!')
            ->line('Nomor Pesanan: **' . $this->order->order_number . '**')
            ->line('Pembayaran Terbaru: **' . $this->formatCurrency($this->paymentAmount) . '**')
            ->line('Total Terbayar: **' . $this->formatCurrency($this->order->total_paid_amount ?? 0) . '**')
            ->line('Sisa Pembayaran: **' . $this->formatCurrency(max(0, ($this->order->total_amount ?? 0) - ($this->order->total_paid_amount ?? 0))) . '**')
            ->line('Metode Pembayaran: **' . ucfirst($this->paymentMethod) . '**')
            ->line('Pesanan Anda akan segera diproses.')
            ->action('Lihat Detail Pesanan', $this->getOrderUrl())
            ->line('Terima kasih!');
    }

    protected function getDatabaseMessage(): string
    {
        return "Pembayaran untuk pesanan {$this->order->order_number} sebesar " . 
               $this->formatCurrency($this->paymentAmount) . " telah diterima";
    }

    protected function getSmsMessage($notifiable): string
    {
        return 'Pembayaran ' . $this->formatCurrency($this->paymentAmount) . ' untuk pesanan ' . $this->order->order_number . ' telah diterima via ' . ucfirst($this->paymentMethod) . '.';
    }

    public function toDatabase($notifiable): array
    {
        return array_merge(parent::toDatabase($notifiable), [
            'payment_method' => $this->paymentMethod,
            'payment_amount' => $this->paymentAmount,
        ]);
    }
}
