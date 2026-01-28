<?php

namespace App\Infrastructure\Monitoring\Channels;

use App\Infrastructure\Monitoring\ValueObjects\Alert;

/**
 * Alert Channel Interface
 * 
 * Defines the contract for alert notification channels.
 */
interface AlertChannelInterface
{
    /**
     * Send alert through this channel
     */
    public function send(Alert $alert): void;

    /**
     * Send escalated alert with specific recipients
     */
    public function sendEscalated(Alert $alert, array $recipients): void;

    /**
     * Check if channel is available
     */
    public function isAvailable(): bool;

    /**
     * Get channel name
     */
    public function getName(): string;
}