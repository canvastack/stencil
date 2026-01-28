<?php

namespace App\Infrastructure\Monitoring\Services;

use App\Infrastructure\Monitoring\ValueObjects\Alert;
use App\Infrastructure\Monitoring\ValueObjects\AlertSeverity;
use App\Infrastructure\Monitoring\Channels\EmailAlertChannel;
use App\Infrastructure\Monitoring\Channels\SlackAlertChannel;
use App\Infrastructure\Monitoring\Channels\SmsAlertChannel;
use App\Infrastructure\Monitoring\Channels\AlertChannelInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Alerting Service
 * 
 * Manages alert distribution across multiple channels based on severity levels.
 * Provides rate limiting, escalation, and audit logging for all alerts.
 */
class AlertingService
{
    private array $channels = [];
    private array $escalationRules = [];
    
    public function __construct(
        EmailAlertChannel $emailChannel,
        SlackAlertChannel $slackChannel,
        SmsAlertChannel $smsChannel
    ) {
        $this->channels = [
            'email' => $emailChannel,
            'slack' => $slackChannel,
            'sms' => $smsChannel
        ];
        
        $this->setupEscalationRules();
    }

    /**
     * Send alert through appropriate channels based on severity
     */
    public function sendAlert(Alert $alert): void
    {
        // Check rate limiting
        if ($this->isRateLimited($alert)) {
            Log::warning('Alert rate limited', [
                'metric' => $alert->getMetric(),
                'severity' => $alert->getSeverity()->value
            ]);
            return;
        }

        // Get channels for this severity level
        $channels = $this->getAlertChannels($alert->getSeverity());
        
        // Send alert through each channel
        foreach ($channels as $channel) {
            try {
                $channel->send($alert);
                
                Log::info('Alert sent successfully', [
                    'metric' => $alert->getMetric(),
                    'severity' => $alert->getSeverity()->value,
                    'channel' => get_class($channel),
                    'timestamp' => $alert->getTimestamp()->toISOString()
                ]);
                
            } catch (\Exception $e) {
                Log::error('Failed to send alert', [
                    'metric' => $alert->getMetric(),
                    'severity' => $alert->getSeverity()->value,
                    'channel' => get_class($channel),
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        // Update rate limiting cache
        $this->updateRateLimit($alert);
        
        // Log alert for audit trail
        $this->auditAlert($alert);
        
        // Check for escalation
        $this->checkEscalation($alert);
    }

    /**
     * Get alert channels based on severity
     */
    private function getAlertChannels(AlertSeverity $severity): array
    {
        return match($severity) {
            AlertSeverity::CRITICAL => [
                $this->channels['email'],
                $this->channels['sms'],
                $this->channels['slack']
            ],
            AlertSeverity::WARNING => [
                $this->channels['email'],
                $this->channels['slack']
            ],
            AlertSeverity::INFO => [
                $this->channels['slack']
            ]
        };
    }

    /**
     * Check if alert is rate limited
     */
    private function isRateLimited(Alert $alert): bool
    {
        $key = $this->getRateLimitKey($alert);
        $limit = $this->getRateLimit($alert->getSeverity());
        
        $count = Cache::get($key, 0);
        
        return $count >= $limit;
    }

    /**
     * Update rate limit counter
     */
    private function updateRateLimit(Alert $alert): void
    {
        $key = $this->getRateLimitKey($alert);
        $ttl = $this->getRateLimitTtl($alert->getSeverity());
        
        Cache::increment($key, 1);
        Cache::expire($key, $ttl);
    }

    /**
     * Get rate limit key for alert
     */
    private function getRateLimitKey(Alert $alert): string
    {
        return sprintf(
            'alert_rate_limit:%s:%s:%s',
            $alert->getMetric(),
            $alert->getSeverity()->value,
            now()->format('Y-m-d-H')
        );
    }

    /**
     * Get rate limit based on severity
     */
    private function getRateLimit(AlertSeverity $severity): int
    {
        return match($severity) {
            AlertSeverity::CRITICAL => 5,  // 5 per hour
            AlertSeverity::WARNING => 10,  // 10 per hour
            AlertSeverity::INFO => 20      // 20 per hour
        };
    }

    /**
     * Get rate limit TTL based on severity
     */
    private function getRateLimitTtl(AlertSeverity $severity): int
    {
        return match($severity) {
            AlertSeverity::CRITICAL => 3600,  // 1 hour
            AlertSeverity::WARNING => 3600,   // 1 hour
            AlertSeverity::INFO => 1800       // 30 minutes
        };
    }

    /**
     * Log alert for audit trail
     */
    private function auditAlert(Alert $alert): void
    {
        Log::channel('alerts')->info('Alert triggered', [
            'metric' => $alert->getMetric(),
            'value' => $alert->getValue(),
            'threshold' => [
                'warning' => $alert->getThreshold()->getWarningThreshold(),
                'critical' => $alert->getThreshold()->getCriticalThreshold(),
                'unit' => $alert->getThreshold()->getUnit()
            ],
            'severity' => $alert->getSeverity()->value,
            'description' => $alert->getDescription(),
            'timestamp' => $alert->getTimestamp()->toISOString(),
            'channels_notified' => array_keys($this->channels)
        ]);
    }

    /**
     * Setup escalation rules
     */
    private function setupEscalationRules(): void
    {
        $this->escalationRules = [
            // Escalate critical alerts if not acknowledged within 15 minutes
            AlertSeverity::CRITICAL->value => [
                'escalation_time' => 900, // 15 minutes
                'escalation_channels' => ['email', 'sms', 'slack'],
                'escalation_recipients' => [
                    'management@company.com',
                    'oncall@company.com'
                ]
            ],
            
            // Escalate warning alerts if not acknowledged within 1 hour
            AlertSeverity::WARNING->value => [
                'escalation_time' => 3600, // 1 hour
                'escalation_channels' => ['email', 'slack'],
                'escalation_recipients' => [
                    'team-lead@company.com'
                ]
            ]
        ];
    }

    /**
     * Check for alert escalation
     */
    private function checkEscalation(Alert $alert): void
    {
        $severity = $alert->getSeverity()->value;
        
        if (!isset($this->escalationRules[$severity])) {
            return;
        }
        
        $rule = $this->escalationRules[$severity];
        $escalationKey = sprintf('alert_escalation:%s:%s', $alert->getMetric(), $alert->getTimestamp()->timestamp);
        
        // Schedule escalation check
        Cache::put($escalationKey, [
            'alert' => $alert,
            'rule' => $rule,
            'scheduled_at' => now()->addSeconds($rule['escalation_time'])
        ], $rule['escalation_time'] + 300); // Keep for 5 minutes after escalation time
        
        Log::info('Alert escalation scheduled', [
            'metric' => $alert->getMetric(),
            'severity' => $severity,
            'escalation_time' => $rule['escalation_time'],
            'escalation_key' => $escalationKey
        ]);
    }

    /**
     * Process escalations (called by scheduled job)
     */
    public function processEscalations(): void
    {
        $escalationKeys = Cache::get('alert_escalations', []);
        
        foreach ($escalationKeys as $key) {
            $escalationData = Cache::get($key);
            
            if (!$escalationData) {
                continue;
            }
            
            $scheduledAt = $escalationData['scheduled_at'];
            
            if (now()->gte($scheduledAt)) {
                $this->escalateAlert($escalationData['alert'], $escalationData['rule']);
                Cache::forget($key);
            }
        }
    }

    /**
     * Escalate alert to higher level
     */
    private function escalateAlert(Alert $alert, array $rule): void
    {
        // Create escalated alert
        $escalatedAlert = new Alert(
            metric: $alert->getMetric(),
            value: $alert->getValue(),
            threshold: $alert->getThreshold(),
            severity: AlertSeverity::CRITICAL, // Always escalate to critical
            timestamp: now(),
            description: 'ESCALATED: ' . $alert->getDescription() . ' (Not acknowledged within ' . ($rule['escalation_time'] / 60) . ' minutes)'
        );

        // Send to escalation channels
        foreach ($rule['escalation_channels'] as $channelName) {
            if (isset($this->channels[$channelName])) {
                try {
                    $this->channels[$channelName]->sendEscalated($escalatedAlert, $rule['escalation_recipients']);
                    
                    Log::warning('Alert escalated', [
                        'original_metric' => $alert->getMetric(),
                        'original_severity' => $alert->getSeverity()->value,
                        'escalation_channel' => $channelName,
                        'escalation_recipients' => $rule['escalation_recipients']
                    ]);
                    
                } catch (\Exception $e) {
                    Log::error('Failed to escalate alert', [
                        'metric' => $alert->getMetric(),
                        'channel' => $channelName,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
    }

    /**
     * Acknowledge alert (stops escalation)
     */
    public function acknowledgeAlert(string $metric, string $timestamp, string $acknowledgedBy): void
    {
        $escalationKey = sprintf('alert_escalation:%s:%s', $metric, $timestamp);
        
        if (Cache::has($escalationKey)) {
            Cache::forget($escalationKey);
            
            Log::info('Alert acknowledged', [
                'metric' => $metric,
                'timestamp' => $timestamp,
                'acknowledged_by' => $acknowledgedBy
            ]);
        }
    }

    /**
     * Get alert statistics
     */
    public function getAlertStatistics(int $hours = 24): array
    {
        // In production, this would query a dedicated alerts table
        return [
            'total_alerts' => rand(50, 200),
            'critical_alerts' => rand(5, 20),
            'warning_alerts' => rand(15, 50),
            'info_alerts' => rand(30, 130),
            'acknowledged_alerts' => rand(40, 180),
            'escalated_alerts' => rand(2, 10),
            'top_metrics' => [
                'order.processing_time' => rand(10, 30),
                'api.response_time' => rand(5, 15),
                'system.memory_usage' => rand(3, 10),
                'vendor.on_time_delivery' => rand(2, 8),
                'quality.acceptance_rate' => rand(1, 5)
            ],
            'alert_trends' => $this->getAlertTrends($hours)
        ];
    }

    /**
     * Get alert trends over time
     */
    private function getAlertTrends(int $hours): array
    {
        $trends = [];
        
        for ($i = $hours; $i >= 0; $i--) {
            $hour = now()->subHours($i)->format('Y-m-d H:00');
            $trends[$hour] = [
                'critical' => rand(0, 3),
                'warning' => rand(1, 8),
                'info' => rand(2, 15)
            ];
        }
        
        return $trends;
    }

    /**
     * Test alert system
     */
    public function sendTestAlert(AlertSeverity $severity = AlertSeverity::INFO): void
    {
        $testAlert = new Alert(
            metric: 'system.test',
            value: 100,
            threshold: new \App\Infrastructure\Monitoring\ValueObjects\MetricThreshold(
                metric: 'system.test',
                warningThreshold: 80,
                criticalThreshold: 95,
                unit: 'percentage',
                description: 'Test alert for system verification'
            ),
            severity: $severity,
            timestamp: now(),
            description: 'This is a test alert to verify the alerting system is working correctly.'
        );

        $this->sendAlert($testAlert);
    }
}