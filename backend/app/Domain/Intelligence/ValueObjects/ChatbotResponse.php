<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Chatbot Response Value Object
 * 
 * Represents a complete response from the chatbot including
 * message, actions, confidence, and metadata.
 */
class ChatbotResponse
{
    public function __construct(
        private string $message,
        private array $actions = [],
        private float $confidence = 0.0,
        private bool $requiresHumanHandoff = false,
        private array $suggestedResponses = [],
        private array $data = []
    ) {}

    public function getMessage(): string
    {
        return $this->message;
    }

    public function getActions(): array
    {
        return $this->actions;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function requiresHumanHandoff(): bool
    {
        return $this->requiresHumanHandoff;
    }

    public function getSuggestedResponses(): array
    {
        return $this->suggestedResponses;
    }

    public function getData(): array
    {
        return $this->data;
    }

    public function toArray(): array
    {
        return [
            'message' => $this->message,
            'actions' => $this->actions,
            'confidence' => $this->confidence,
            'requires_human_handoff' => $this->requiresHumanHandoff,
            'suggested_responses' => $this->suggestedResponses,
            'data' => $this->data
        ];
    }
}