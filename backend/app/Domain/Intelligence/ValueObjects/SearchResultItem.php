<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Search Result Item Value Object
 * 
 * Represents a single search result item with relevance scoring
 * and metadata for display and navigation.
 */
class SearchResultItem
{
    public function __construct(
        private string $id,
        private string $type,
        private string $title,
        private string $subtitle,
        private ?string $description,
        private string $url,
        private float $relevanceScore,
        private array $metadata = []
    ) {}

    public function getId(): string
    {
        return $this->id;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getSubtitle(): string
    {
        return $this->subtitle;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getUrl(): string
    {
        return $this->url;
    }

    public function getRelevanceScore(): float
    {
        return $this->relevanceScore;
    }

    public function setRelevanceScore(float $score): void
    {
        $this->relevanceScore = $score;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'subtitle' => $this->subtitle,
            'description' => $this->description,
            'url' => $this->url,
            'relevance_score' => $this->relevanceScore,
            'metadata' => $this->metadata
        ];
    }
}