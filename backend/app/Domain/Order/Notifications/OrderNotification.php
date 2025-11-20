<?php

namespace App\Domain\Order\Notifications;

use App\Domain\Customer\ValueObjects\CustomerPhone;
use App\Infrastructure\Notifications\Channels\SmsChannel;
use App\Infrastructure\Notifications\Channels\WhatsappChannel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Throwable;

abstract class OrderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected Order $order
    ) {}

    public function via($notifiable): array
    {
        $channels = ['mail', 'database'];

        if ($this->shouldSendWhatsapp($notifiable)) {
            $channels[] = WhatsappChannel::class;
        }

        if ($this->shouldSendSms($notifiable)) {
            $channels[] = SmsChannel::class;
        }

        return $channels;
    }

    abstract public function toMail($notifiable): MailMessage;

    public function toDatabase($notifiable): array
    {
        return [
            'order_id' => $this->order->id,
            'order_number' => $this->order->order_number,
            'status' => $this->order->status,
            'total_amount' => $this->order->total_amount,
            'message' => $this->getDatabaseMessage(),
        ];
    }

    public function toWhatsapp($notifiable): ?array
    {
        if (!$this->shouldSendWhatsapp($notifiable)) {
            return null;
        }

        $phone = $this->resolvePhoneNumber($notifiable);

        if (!$phone) {
            return null;
        }

        return [
            'to' => $phone,
            'body' => $this->getWhatsappMessage($notifiable),
            'metadata' => [
                'order_id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'preview_url' => true,
                'order_url' => $this->getOrderUrl(),
            ],
        ];
    }

    public function toSms($notifiable): ?array
    {
        if (!$this->shouldSendSms($notifiable)) {
            return null;
        }

        $phone = $this->resolvePhoneNumber($notifiable);

        if (!$phone) {
            return null;
        }

        return [
            'to' => $phone,
            'body' => $this->getSmsMessage($notifiable),
            'context' => [
                'order_id' => $this->order->id,
                'order_number' => $this->order->order_number,
            ],
        ];
    }

    abstract protected function getDatabaseMessage(): string;

    abstract protected function getSmsMessage($notifiable): string;

    protected function getWhatsappMessage($notifiable): string
    {
        return $this->getSmsMessage($notifiable) . ' ' . $this->getOrderUrl();
    }

    protected function getOrderUrl(): string
    {
        return config('app.frontend_url') . '/orders/' . $this->order->id;
    }

    protected function formatCurrency(int $amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    protected function resolvePhoneNumber($notifiable): ?string
    {
        $raw = (string) ($notifiable->phone ?? '');

        if ($raw === '') {
            return null;
        }

        try {
            $phone = new CustomerPhone($raw);
            return $phone->getInternationalFormat();
        } catch (Throwable) {
            return null;
        }
    }

    protected function allowsChannel($notifiable, string $channel): bool
    {
        if (method_exists($notifiable, 'prefersNotificationChannel')) {
            return (bool) $notifiable->prefersNotificationChannel($channel);
        }

        $metadata = $notifiable->metadata ?? null;

        if (is_array($metadata) && isset($metadata['notifications']) && is_array($metadata['notifications'])) {
            $notifications = $metadata['notifications'];

            if (array_key_exists('enabled', $notifications) && !$notifications['enabled']) {
                return false;
            }

            if (isset($notifications['disabled']) && is_array($notifications['disabled']) && in_array($channel, $notifications['disabled'], true)) {
                return false;
            }

            if (isset($notifications['channels']) && is_array($notifications['channels'])) {
                return in_array($channel, $notifications['channels'], true);
            }

            return true;
        }

        if (is_array($metadata)) {
            if (isset($metadata['notification_channels']) && is_array($metadata['notification_channels'])) {
                return in_array($channel, $metadata['notification_channels'], true);
            }
        }

        $preferences = $notifiable->notification_preferences ?? null;

        if (is_array($preferences)) {
            if (array_key_exists('enabled', $preferences) && !$preferences['enabled']) {
                return false;
            }

            if (isset($preferences['channels']) && is_array($preferences['channels'])) {
                return in_array($channel, $preferences['channels'], true);
            }
        }

        return true;
    }

    protected function shouldSendWhatsapp($notifiable): bool
    {
        if (!config('services.whatsapp.enabled')) {
            return false;
        }

        if (!$this->allowsChannel($notifiable, 'whatsapp')) {
            return false;
        }

        return $this->resolvePhoneNumber($notifiable) !== null;
    }

    protected function shouldSendSms($notifiable): bool
    {
        if (!config('services.sms.enabled')) {
            return false;
        }

        if (!$this->allowsChannel($notifiable, 'sms')) {
            return false;
        }

        return $this->resolvePhoneNumber($notifiable) !== null;
    }
}
