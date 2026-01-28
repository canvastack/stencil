<?php

namespace App\Infrastructure\Monitoring\Channels;

use App\Infrastructure\Monitoring\ValueObjects\Alert;
use App\Infrastructure\Monitoring\ValueObjects\AlertSeverity;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Slack Alert Channel
 * 
 * Sends alerts to Slack channels via webhooks.
 */
class SlackAlertChannel implements AlertChannelInterface
{
    private string $webhookUrl;
    private string $defaultChannel;

    public function __construct()
    {
        $this->webhookUrl = config('monitoring.slack.webhook_url', '');
        $this->defaultChannel = config('monitoring.slack.default_channel', '#alerts');
    }

    /**
     * Send alert to Slack
     */
    public function send(Alert $alert): void
    {
        if (!$this->isAvailable()) {
            throw new \Exception('Slack webhook URL not configured');
        }

        try {
            $payload = $this->buildSlackPayload($alert);
            
            $response = Http::post($this->webhookUrl, $payload);

            if (!$response->successful()) {
                throw new \Exception('Slack API returned error: ' . $response->body());
            }

            Log::info('Slack alert sent successfully', [
                'metric' => $alert->getMetric(),
                'channel' => $this->defaultChannel
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send Slack alert', [
                'metric' => $alert->getMetric(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Send escalated alert to Slack
     */
    public function sendEscalated(Alert $alert, array $recipients): void
    {
        if (!$this->isAvailable()) {
            throw new \Exception('Slack webhook URL not configured');
        }

        try {
            $payload = $this->buildEscalatedSlackPayload($alert, $recipients);
            
            $response = Http::post($this->webhookUrl, $payload);

            if (!$response->successful()) {
                throw new \Exception('Slack API returned error: ' . $response->body());
            }

            Log::warning('Escalated Slack alert sent', [
                'metric' => $alert->getMetric(),
                'channel' => $this->defaultChannel,
                'mentions' => $recipients
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send escalated Slack alert', [
                'metric' => $alert->getMetric(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Check if Slack webhook is available
     */
    public function isAvailable(): bool
    {
        return !empty($this->webhookUrl);
    }

    /**
     * Get channel name
     */
    public function getName(): string
    {
        return 'slack';
    }

    /**
     * Build Slack message payload
     */
    private function buildSlackPayload(Alert $alert): array
    {
        $color = $this->getSeverityColor($alert->getSeverity());
        $icon = $this->getSeverityIcon($alert->getSeverity());

        return [
            'channel' => $this->defaultChannel,
            'username' => 'CanvaStencil Monitor',
            'icon_emoji' => ':warning:',
            'attachments' => [
                [
                    'color' => $color,
                    'title' => sprintf('%s %s Alert', $icon, ucfirst($alert->getSeverity()->value)),
                    'text' => $alert->getDescription(),
                    'fields' => [
                        [
                            'title' => 'Metric',
                            'value' => $alert->getMetric(),
                            'short' => true
                        ],
                        [
                            'title' => 'Current Value',
                            'value' => sprintf('%.2f %s', $alert->getValue(), $alert->getThreshold()->getUnit()),
                            'short' => true
                        ],
                        [
                            'title' => 'Threshold',
                            'value' => sprintf('Warning: %.2f, Critical: %.2f %s', 
                                $alert->getThreshold()->getWarningThreshold(),
                                $alert->getThreshold()->getCriticalThreshold(),
                                $alert->getThreshold()->getUnit()
                            ),
                            'short' => false
                        ],
                        [
                            'title' => 'Timestamp',
                            'value' => $alert->getTimestamp()->format('Y-m-d H:i:s T'),
                            'short' => true
                        ]
                    ],
                    'footer' => 'CanvaStencil Monitoring',
                    'ts' => $alert->getTimestamp()->timestamp
                ]
            ]
        ];
    }

    /**
     * Build escalated Slack message payload
     */
    private function buildEscalatedSlackPayload(Alert $alert, array $recipients): array
    {
        $payload = $this->buildSlackPayload($alert);
        
        // Add escalation information
        $payload['attachments'][0]['title'] = ':rotating_light: ESCALATED ALERT :rotating_light:';
        $payload['attachments'][0]['color'] = 'danger';
        $payload['attachments'][0]['pretext'] = sprintf(
            'Alert escalated! Mentioning: %s',
            implode(' ', array_map(fn($r) => "<@{$r}>", $recipients))
        );

        return $payload;
    }

    /**
     * Get color for severity level
     */
    private function getSeverityColor(AlertSeverity $severity): string
    {
        return match($severity) {
            AlertSeverity::CRITICAL => 'danger',
            AlertSeverity::WARNING => 'warning',
            AlertSeverity::INFO => 'good'
        };
    }

    /**
     * Get icon for severity level
     */
    private function getSeverityIcon(AlertSeverity $severity): string
    {
        return match($severity) {
            AlertSeverity::CRITICAL => ':red_circle:',
            AlertSeverity::WARNING => ':yellow_circle:',
            AlertSeverity::INFO => ':blue_circle:'
        };
    }
}