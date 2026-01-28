<?php

namespace App\Domain\Shared\Rules;

use Illuminate\Support\Collection;

class ValidationResult
{
    private Collection $results;

    public function __construct(array $results = [])
    {
        $this->results = collect($results);
    }

    /**
     * Check if all validations passed
     */
    public function isValid(): bool
    {
        return $this->results->every(fn(RuleResult $result) => $result->isValid());
    }

    /**
     * Get all validation results
     */
    public function getResults(): Collection
    {
        return $this->results;
    }

    /**
     * Get all errors from failed validations
     */
    public function getErrors(): array
    {
        return $this->results
            ->filter(fn(RuleResult $result) => !$result->isValid())
            ->flatMap(fn(RuleResult $result) => $result->getErrors())
            ->toArray();
    }

    /**
     * Get all warnings from validations
     */
    public function getWarnings(): array
    {
        return $this->results
            ->flatMap(fn(RuleResult $result) => $result->getWarnings())
            ->toArray();
    }

    /**
     * Get combined metadata from all validations
     */
    public function getMetadata(): array
    {
        $metadata = [];
        
        foreach ($this->results as $result) {
            $ruleCode = $result->getRuleCode();
            $metadata[$ruleCode] = $result->getMetadata();
        }

        return $metadata;
    }

    /**
     * Get failed validations
     */
    public function getFailedValidations(): Collection
    {
        return $this->results->filter(fn(RuleResult $result) => !$result->isValid());
    }

    /**
     * Get successful validations
     */
    public function getSuccessfulValidations(): Collection
    {
        return $this->results->filter(fn(RuleResult $result) => $result->isValid());
    }

    /**
     * Get validations with warnings
     */
    public function getValidationsWithWarnings(): Collection
    {
        return $this->results->filter(fn(RuleResult $result) => $result->hasWarnings());
    }

    /**
     * Get total execution time
     */
    public function getTotalExecutionTime(): float
    {
        return $this->results->sum(fn(RuleResult $result) => $result->getExecutionTime());
    }

    /**
     * Get average execution time
     */
    public function getAverageExecutionTime(): float
    {
        if ($this->results->isEmpty()) {
            return 0.0;
        }

        return $this->getTotalExecutionTime() / $this->results->count();
    }

    /**
     * Get validation summary
     */
    public function getSummary(): array
    {
        return [
            'total_validations' => $this->results->count(),
            'successful_validations' => $this->getSuccessfulValidations()->count(),
            'failed_validations' => $this->getFailedValidations()->count(),
            'validations_with_warnings' => $this->getValidationsWithWarnings()->count(),
            'total_errors' => count($this->getErrors()),
            'total_warnings' => count($this->getWarnings()),
            'total_execution_time' => $this->getTotalExecutionTime(),
            'average_execution_time' => $this->getAverageExecutionTime(),
            'is_valid' => $this->isValid()
        ];
    }

    /**
     * Add a validation result
     */
    public function addResult(RuleResult $result): void
    {
        $this->results->push($result);
    }

    /**
     * Check if there are any results
     */
    public function hasResults(): bool
    {
        return $this->results->isNotEmpty();
    }

    /**
     * Get results as array
     */
    public function toArray(): array
    {
        return [
            'is_valid' => $this->isValid(),
            'summary' => $this->getSummary(),
            'results' => $this->results->map(fn(RuleResult $result) => $result->toArray())->toArray(),
            'errors' => $this->getErrors(),
            'warnings' => $this->getWarnings(),
            'metadata' => $this->getMetadata()
        ];
    }
}