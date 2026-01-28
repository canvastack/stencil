<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Voice Command Result Value Object
 * 
 * Represents the result of processing a voice command, including
 * the action to take, parameters, confidence level, and response.
 */
class VoiceCommandResult
{
    public function __construct(
        private bool $isSuccessful,
        private string $action,
        private array $parameters,
        private float $confidence,
        private string $response,
        private array $suggestions
    ) {}

    public function isSuccessful(): bool
    {
        return $this->isSuccessful;
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

    public function getResponse(): string
    {
        return $this->response;
    }

    public function getSuggestions(): array
    {
        return $this->suggestions;
    }

    public function toArray(): array
    {
        return [
            'is_successful' => $this->isSuccessful,
            'action' => $this->action,
            'parameters' => $this->parameters,
            'confidence' => $this->confidence,
            'response' => $this->response,
            'suggestions' => $this->suggestions
        ];
    }
}