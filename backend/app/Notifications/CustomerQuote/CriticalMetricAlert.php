<?php

namespace App\Notifications\CustomerQuote;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Critical Metric Alert Notification
 * 
 * Sent to admins when critical quote metrics exceed thresholds
 */
class CriticalMetricAlert extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private string $title,
        private string $message,
        private string $severity,
        private array $data = []
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mailMessage = (new MailMessage)
            ->subject("[{$this->getSeverityLabel()}] {$this->title}")
            ->greeting("Alert: {$this->title}")
            ->line($this->message);

        // Add data details
        if (!empty($this->data)) {
            $mailMessage->line('**Details:**');
            foreach ($this->data as $key => $value) {
                $label = ucwords(str_replace('_', ' ', $key));
                $mailMessage->line("- {$label}: {$value}");
            }
        }

        // Add action button based on severity
        if ($this->severity === 'critical') {
            $mailMessage->action('View Dashboard', url('/admin/customer-quotes/metrics'))
                       ->line('**This requires immediate attention.**');
        } else {
            $mailMessage->action('View Metrics', url('/admin/customer-quotes/metrics'))
                       ->line('Please review and take appropriate action.');
        }

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'severity' => $this->severity,
            'data' => $this->data,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Get severity label
     */
    private function getSeverityLabel(): string
    {
        return match($this->severity) {
            'critical' => 'CRITICAL',
            'warning' => 'WARNING',
            default => 'INFO',
        };
    }
}
