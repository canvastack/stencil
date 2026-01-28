<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Chatbot Intent Value Object
 * 
 * Represents the detected intent from a user query including
 * confidence score and detection method.
 */
class ChatbotIntent
{
    public function __construct(
        private string $intent,
        private float $confidence,
        private string $method = 'unknown'
    ) {}

    public function getIntent(): string
    {
        return $this->intent;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    public function isMediumConfidence(): bool
    {
        return $this->confidence >= 0.6 && $this->confidence < 0.8;
    }

    public function isLowConfidence(): bool
    {
        return $this->confidence < 0.6;
    }

    public function toArray(): array
    {
        return [
            'intent' => $this->intent,
            'confidence' => $this->confidence,
            'method' => $this->method,
            'confidence_level' => $this->isHighConfidence() ? 'high' : 
                                ($this->isMediumConfidence() ? 'medium' : 'low')
        ];
    }
}