<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Chatbot Entity Value Object
 * 
 * Represents an extracted entity from user input including
 * type, value, confidence, and position information.
 */
class ChatbotEntity
{
    public function __construct(
        private string $type,
        private string $value,
        private float $confidence,
        private int $startPos = 0,
        private int $endPos = 0
    ) {}

    public function getType(): string
    {
        return $this->type;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getStartPos(): int
    {
        return $this->startPos;
    }

    public function getEndPos(): int
    {
        return $this->endPos;
    }

    public function getLength(): int
    {
        return $this->endPos - $this->startPos;
    }

    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'value' => $this->value,
            'confidence' => $this->confidence,
            'start_pos' => $this->startPos,
            'end_pos' => $this->endPos,
            'length' => $this->getLength()
        ];
    }
}