<?php

namespace App\Domain\Shared\Rules;

class RuleResult
{
    private bool $isValid;
    private array $errors;
    private array $warnings;
    private array $metadata;
    private float $executionTime;
    private string $ruleCode;

    public function __construct(
        bool $isValid,
        array $errors = [],
        array $warnings = [],
        array $metadata = [],
        float $executionTime = 0.0,
        string $ruleCode = ''
    ) {
        $this->isValid = $isValid;
        $this->errors = $errors;
        $this->warnings = $warnings;
        $this->metadata = $metadata;
        $this->executionTime = $executionTime;
        $this->ruleCode = $ruleCode;
    }

    public static function success(array $metadata = [], array $warnings = []): self
    {
        return new self(true, [], $warnings, $metadata);
    }

    public static function failure(string|array $errors, array $warnings = [], array $metadata = []): self
    {
        $errorArray = is_string($errors) ? [$errors] : $errors;
        return new self(false, $errorArray, $warnings, $metadata);
    }

    public function isValid(): bool
    {
        return $this->isValid;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getWarnings(): array
    {
        return $this->warnings;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getExecutionTime(): float
    {
        return $this->executionTime;
    }

    public function getRuleCode(): string
    {
        return $this->ruleCode;
    }

    public function setExecutionTime(float $executionTime): void
    {
        $this->executionTime = $executionTime;
    }

    public function setRuleCode(string $ruleCode): void
    {
        $this->ruleCode = $ruleCode;
    }

    public function toArray(): array
    {
        return [
            'isValid' => $this->isValid,
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'metadata' => $this->metadata,
            'executionTime' => $this->executionTime,
            'ruleCode' => $this->ruleCode
        ];
    }

    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }

    public function hasWarnings(): bool
    {
        return !empty($this->warnings);
    }

    public function addError(string $error): void
    {
        $this->errors[] = $error;
        $this->isValid = false;
    }

    public function addWarning(string $warning): void
    {
        $this->warnings[] = $warning;
    }

    public function addMetadata(string $key, $value): void
    {
        $this->metadata[$key] = $value;
    }
}