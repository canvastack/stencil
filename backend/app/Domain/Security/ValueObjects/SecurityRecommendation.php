<?php

namespace App\Domain\Security\ValueObjects;

/**
 * Security Recommendation Value Object
 * 
 * Contains actionable security recommendations based on detected anomalies.
 */
class SecurityRecommendation
{
    public function __construct(
        private string $type,
        private string $priority,
        private string $title,
        private string $description,
        private array $actions
    ) {
        $this->validatePriority($priority);
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getPriority(): string
    {
        return $this->priority;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getActions(): array
    {
        return $this->actions;
    }

    public function isHighPriority(): bool
    {
        return in_array($this->priority, ['high', 'critical']);
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'priority' => $this->priority,
            'title' => $this->title,
            'description' => $this->description,
            'actions' => $this->actions,
            'is_high_priority' => $this->isHighPriority()
        ];
    }

    private function validatePriority(string $priority): void
    {
        $validPriorities = ['low', 'medium', 'high', 'critical'];
        
        if (!in_array($priority, $validPriorities)) {
            throw new \InvalidArgumentException("Invalid priority: {$priority}. Must be one of: " . implode(', ', $validPriorities));
        }
    }
}