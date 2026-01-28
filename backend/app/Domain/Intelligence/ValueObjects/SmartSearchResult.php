<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Smart Search Result Value Object
 * 
 * Represents the complete result of a smart search operation including
 * results, suggestions, analytics, and metadata.
 */
class SmartSearchResult
{
    public function __construct(
        private array $results,
        private array $suggestions,
        private int $totalCount,
        private float $searchTime,
        private array $queryAnalysis
    ) {}

    public function getResults(): array
    {
        return $this->results;
    }

    public function getSuggestions(): array
    {
        return $this->suggestions;
    }

    public function getTotalCount(): int
    {
        return $this->totalCount;
    }

    public function getSearchTime(): float
    {
        return $this->searchTime;
    }

    public function getQueryAnalysis(): array
    {
        return $this->queryAnalysis;
    }

    public function hasResults(): bool
    {
        return !empty($this->results);
    }

    public function hasSuggestions(): bool
    {
        return !empty($this->suggestions);
    }

    public function toArray(): array
    {
        return [
            'results' => array_map(fn($result) => $result->toArray(), $this->results),
            'suggestions' => $this->suggestions,
            'total_count' => $this->totalCount,
            'search_time' => $this->searchTime,
            'query_analysis' => $this->queryAnalysis,
            'has_results' => $this->hasResults(),
            'has_suggestions' => $this->hasSuggestions()
        ];
    }
}