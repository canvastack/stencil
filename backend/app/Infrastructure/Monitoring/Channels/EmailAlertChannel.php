<?php

namespace App\Infrastructure\Monitoring\Channels;

use App\Infrastructure\Monitoring\ValueObjects\Alert;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Email Alert Channel
 * 
 * Sends alerts via email notifications.
 */
class EmailAlertChannel implements AlertChannelInterface
{
    private array $defaultRecipients;

    public function __construct()
    {
        $this->defaultRecipients = [
            'admin@canvastencil.com',
            'alerts@canvastencil.com'
        ];
    }

    /**
     * Send alert via email
     */
    public function send(Alert $alert): void
    {
        try {
            Mail::send('emails.alert', [
                'alert' => $alert,
                'formatted_message' => $alert->getFormattedMessage()
            ], function ($message) use ($alert) {
                $message->to($this->defaultRecipients)
                        ->subject($this->getSubject($alert));
            });

            Log::info('Email alert sent successfully', [
                'metric' => $alert->getMetric(),
                'recipients' => $this->defaultRecipients
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send email alert', [
                'metric' => $alert->getMetric(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Send escalated alert to specific recipients
     */
    public function sendEscalated(Alert $alert, array $recipients): void
    {
        try {
            Mail::send('emails.escalated-alert', [
                'alert' => $alert,
                'formatted_message' => $alert->getFormattedMessage(),
                'is_escalated' => true
            ], function ($message) use ($alert, $recipients) {
                $message->to($recipients)
                        ->subject('[ESCALATED] ' . $this->getSubject($alert))
                        ->priority(1); // High priority
            });

            Log::warning('Escalated email alert sent', [
                'metric' => $alert->getMetric(),
                'recipients' => $recipients
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send escalated email alert', [
                'metric' => $alert->getMetric(),
                'recipients' => $recipients,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Check if email service is available
     */
    public function isAvailable(): bool
    {
        try {
            // Simple check - in production, this could ping the mail server
            return config('mail.default') !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get channel name
     */
    public function getName(): string
    {
        return 'email';
    }

    /**
     * Generate email subject
     */
    private function getSubject(Alert $alert): string
    {
        return sprintf(
            '[%s] CanvaStencil Alert: %s',
            strtoupper($alert->getSeverity()->value),
            $alert->getThreshold()->getDescription()
        );
    }
}