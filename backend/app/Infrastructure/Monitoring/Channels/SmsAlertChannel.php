<?php

namespace App\Infrastructure\Monitoring\Channels;

use App\Infrastructure\Monitoring\ValueObjects\Alert;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SMS Alert Channel
 * 
 * Sends critical alerts via SMS for immediate attention.
 */
class SmsAlertChannel implements AlertChannelInterface
{
    private string $apiKey;
    private string $apiUrl;
    private array $defaultRecipients;

    public function __construct()
    {
        $this->apiKey = config('monitoring.sms.api_key', '');
        $this->apiUrl = config('monitoring.sms.api_url', '');
        $this->defaultRecipients = config('monitoring.sms.recipients', [
            '+6281234567890' // Default Indonesian mobile number format
        ]);
    }

    /**
     * Send alert via SMS (only for critical alerts)
     */
    public function send(Alert $alert): void
    {
        // Only send SMS for critical alerts to avoid spam
        if (!$alert->isCritical()) {
            Log::info('Skipping SMS for non-critical alert', [
                'metric' => $alert->getMetric(),
                'severity' => $alert->getSeverity()->value
            ]);
            return;
        }

        if (!$this->isAvailable()) {
            throw new \Exception('SMS service not configured');
        }

        try {
            $message = $this->buildSmsMessage($alert);
            
            foreach ($this->defaultRecipients as $recipient) {
                $this->sendSms($recipient, $message);
            }

            Log::info('SMS alert sent successfully', [
                'metric' => $alert->getMetric(),
                'recipients_count' => count($this->defaultRecipients)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send SMS alert', [
                'metric' => $alert->getMetric(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Send escalated alert via SMS
     */
    public function sendEscalated(Alert $alert, array $recipients): void
    {
        if (!$this->isAvailable()) {
            throw new \Exception('SMS service not configured');
        }

        try {
            $message = $this->buildEscalatedSmsMessage($alert);
            
            // Convert email addresses to phone numbers if needed
            $phoneNumbers = $this->convertToPhoneNumbers($recipients);
            
            foreach ($phoneNumbers as $phoneNumber) {
                $this->sendSms($phoneNumber, $message);
            }

            Log::warning('Escalated SMS alert sent', [
                'metric' => $alert->getMetric(),
                'recipients_count' => count($phoneNumbers)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send escalated SMS alert', [
                'metric' => $alert->getMetric(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Check if SMS service is available
     */
    public function isAvailable(): bool
    {
        return !empty($this->apiKey) && !empty($this->apiUrl);
    }

    /**
     * Get channel name
     */
    public function getName(): string
    {
        return 'sms';
    }

    /**
     * Send SMS to specific number
     */
    private function sendSms(string $phoneNumber, string $message): void
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Content-Type' => 'application/json'
        ])->post($this->apiUrl, [
            'to' => $phoneNumber,
            'message' => $message,
            'from' => 'CanvaStencil'
        ]);

        if (!$response->successful()) {
            throw new \Exception('SMS API returned error: ' . $response->body());
        }
    }

    /**
     * Build SMS message for alert
     */
    private function buildSmsMessage(Alert $alert): string
    {
        return sprintf(
            "[CRITICAL] CanvaStencil Alert: %s is %.2f %s (threshold: %.2f). Time: %s",
            $alert->getThreshold()->getDescription(),
            $alert->getValue(),
            $alert->getThreshold()->getUnit(),
            $alert->getThreshold()->getCriticalThreshold(),
            $alert->getTimestamp()->format('H:i')
        );
    }

    /**
     * Build escalated SMS message
     */
    private function buildEscalatedSmsMessage(Alert $alert): string
    {
        return sprintf(
            "[ESCALATED] CanvaStencil: %s alert not acknowledged. %s is %.2f %s. Immediate attention required!",
            strtoupper($alert->getSeverity()->value),
            $alert->getThreshold()->getDescription(),
            $alert->getValue(),
            $alert->getThreshold()->getUnit()
        );
    }

    /**
     * Convert email addresses to phone numbers
     * In production, this would lookup phone numbers from user database
     */
    private function convertToPhoneNumbers(array $recipients): array
    {
        $phoneNumbers = [];
        
        foreach ($recipients as $recipient) {
            // For demo purposes, use default numbers
            // In production, lookup phone number by email from users table
            if (str_contains($recipient, '@')) {
                // Lookup phone number from database
                $phoneNumbers[] = $this->defaultRecipients[0] ?? '+6281234567890';
            } else {
                // Assume it's already a phone number
                $phoneNumbers[] = $recipient;
            }
        }
        
        return array_unique($phoneNumbers);
    }
}