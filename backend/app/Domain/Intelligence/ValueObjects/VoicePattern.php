<?php

namespace App\Domain\Intelligence\ValueObjects;

use Carbon\Carbon;

/**
 * Voice Pattern Value Object
 * 
 * Represents a learned voice command pattern for a specific user.
 */
class VoicePattern
{
    private ?float $confidenceImprovement = null;

    public function __construct(
        private string $id,
        private int $userId,
        private string $command,
        private string $action,
        private array $parameters,
        private float $confidence,
        private Carbon $createdAt
    ) {}

    public function getId(): string
    {
        return $this->id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function getCommand(): string
    {
        return $this->command;
    }

    public function getAction(): string
    {
        return $this->action;
    }

    public function getParameters(): array
    {
        return $this->parameters;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getCreatedAt(): Carbon
    {
        return $this->createdAt;
    }

    public function getConfidenceImprovement(): ?float
    {
        return $this->confidenceImprovement;
    }

    public function withConfidenceImprovement(float $improvement): self
    {
        $clone = clone $this;
        $clone->confidenceImprovement = $improvement;
        return $clone;
    }

    public function getPatternId(): string
    {
        return $this->id;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'command' => $this->command,
            'action' => $this->action,
            'parameters' => $this->parameters,
            'confidence' => $this->confidence,
            'created_at' => $this->createdAt->toISOString(),
            'confidence_improvement' => $this->confidenceImprovement
        ];
    }
}