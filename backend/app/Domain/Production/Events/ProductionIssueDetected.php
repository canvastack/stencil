<?php

namespace App\Domain\Production\Events;

use App\Domain\Shared\Events\DomainEvent;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Production\Enums\IssueType;
use DateTimeImmutable;

/**
 * Production Issue Detected Event
 * 
 * Fired when a production issue is detected.
 */
final class ProductionIssueDetected implements DomainEvent
{
    public function __construct(
        private UuidValueObject $orderId,
        private IssueType $issueType,
        private string $severity,
        private string $description,
        private DateTimeImmutable $detectedAt
    ) {}

    public function getOrderId(): UuidValueObject
    {
        return $this->orderId;
    }

    public function getIssueType(): IssueType
    {
        return $this->issueType;
    }

    public function getSeverity(): string
    {
        return $this->severity;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getDetectedAt(): DateTimeImmutable
    {
        return $this->detectedAt;
    }

    public function getEventName(): string
    {
        return 'production.issue.detected';
    }

    public function getAggregateId(): string
    {
        return $this->orderId->getValue();
    }

    public function getOccurredOn(): DateTimeImmutable
    {
        return $this->detectedAt;
    }

    public function toArray(): array
    {
        return [
            'order_id' => $this->orderId->getValue(),
            'issue_type' => $this->issueType->value,
            'issue_type_label' => $this->issueType->getLabel(),
            'severity' => $this->severity,
            'description' => $this->description,
            'detected_at' => $this->detectedAt->format('Y-m-d H:i:s'),
            'event_name' => $this->getEventName()
        ];
    }
}