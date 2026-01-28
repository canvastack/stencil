<?php

namespace App\Domain\Shared\Rules;

abstract class BusinessRule
{
    protected int $priority = 100;
    protected bool $enabled = true;
    protected array $parameters = [];
    protected array $applicableContexts = [];

    /**
     * Evaluate the rule against the given context
     */
    abstract public function evaluate($context): RuleResult;

    /**
     * Get the rule description
     */
    abstract public function getDescription(): string;

    /**
     * Get the rule code (unique identifier)
     */
    abstract public function getRuleCode(): string;

    /**
     * Get the rule category
     */
    abstract public function getCategory(): string;

    /**
     * Get the rule name
     */
    abstract public function getName(): string;

    /**
     * Get rule priority
     */
    public function getPriority(): int
    {
        return $this->priority;
    }

    /**
     * Set rule priority
     */
    public function setPriority(int $priority): void
    {
        $this->priority = $priority;
    }

    /**
     * Check if rule is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Set rule enabled status
     */
    public function setEnabled(bool $enabled): void
    {
        $this->enabled = $enabled;
    }

    /**
     * Get rule parameters
     */
    public function getParameters(): array
    {
        return $this->parameters;
    }

    /**
     * Set rule parameters
     */
    public function setParameters(array $parameters): void
    {
        $this->parameters = array_merge($this->parameters, $parameters);
    }

    /**
     * Get default parameters
     */
    public function getDefaultParameters(): array
    {
        return [];
    }

    /**
     * Get default priority
     */
    public function getDefaultPriority(): int
    {
        return 100;
    }

    /**
     * Get applicable contexts
     */
    public function getApplicableContexts(): array
    {
        return $this->applicableContexts;
    }

    /**
     * Set applicable contexts
     */
    public function setApplicableContexts(array $contexts): void
    {
        $this->applicableContexts = $contexts;
    }

    /**
     * Get rule severity level
     */
    public function getSeverity(): string
    {
        if ($this->priority >= 90) {
            return 'critical';
        } elseif ($this->priority >= 70) {
            return 'high';
        } elseif ($this->priority >= 50) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Get rule metadata
     */
    public function getMetadata(): array
    {
        return [
            'code' => $this->getRuleCode(),
            'name' => $this->getName(),
            'description' => $this->getDescription(),
            'category' => $this->getCategory(),
            'priority' => $this->getPriority(),
            'severity' => $this->getSeverity(),
            'enabled' => $this->isEnabled(),
            'parameters' => $this->getParameters(),
            'applicable_contexts' => $this->getApplicableContexts(),
            'default_parameters' => $this->getDefaultParameters(),
            'default_priority' => $this->getDefaultPriority()
        ];
    }
}