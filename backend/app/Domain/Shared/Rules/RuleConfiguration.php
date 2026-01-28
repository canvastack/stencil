<?php

namespace App\Domain\Shared\Rules;

use App\Domain\Shared\ValueObjects\UuidValueObject;

class RuleConfiguration
{
    private UuidValueObject $id;
    private int $tenantId; // Changed from UuidValueObject to int
    private string $ruleCode;
    private bool $enabled;
    private int $priority;
    private array $parameters;
    private array $applicableContexts;
    private \DateTimeInterface $createdAt;
    private \DateTimeInterface $updatedAt;

    public function __construct(
        UuidValueObject $id,
        int $tenantId, // Changed from UuidValueObject to int
        string $ruleCode,
        bool $enabled,
        int $priority,
        array $parameters,
        array $applicableContexts,
        \DateTimeInterface $createdAt,
        \DateTimeInterface $updatedAt
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->ruleCode = $ruleCode;
        $this->enabled = $enabled;
        $this->priority = $priority;
        $this->parameters = $parameters;
        $this->applicableContexts = $applicableContexts;
        $this->createdAt = $createdAt;
        $this->updatedAt = $updatedAt;
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): int // Changed return type
    {
        return $this->tenantId;
    }

    public function getRuleCode(): string
    {
        return $this->ruleCode;
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    public function getPriority(): int
    {
        return $this->priority;
    }

    public function getParameters(): array
    {
        return $this->parameters;
    }

    public function getApplicableContexts(): array
    {
        return $this->applicableContexts;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function updateEnabled(bool $enabled): void
    {
        $this->enabled = $enabled;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function updatePriority(int $priority): void
    {
        if ($priority < 1 || $priority > 100) {
            throw new \InvalidArgumentException('Priority must be between 1 and 100');
        }

        $this->priority = $priority;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function updateParameters(array $parameters): void
    {
        $this->parameters = array_merge($this->parameters, $parameters);
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function updateApplicableContexts(array $contexts): void
    {
        $this->applicableContexts = $contexts;
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getParameter(string $key, $default = null)
    {
        return $this->parameters[$key] ?? $default;
    }

    public function hasParameter(string $key): bool
    {
        return array_key_exists($key, $this->parameters);
    }

    public function isApplicableToContext(string $context): bool
    {
        return in_array($context, $this->applicableContexts);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId, // Changed
            'rule_code' => $this->ruleCode,
            'enabled' => $this->enabled,
            'priority' => $this->priority,
            'parameters' => $this->parameters,
            'applicable_contexts' => $this->applicableContexts,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s')
        ];
    }

    public static function create(
        int $tenantId, // Changed from UuidValueObject to int
        string $ruleCode,
        bool $enabled = true,
        int $priority = 100,
        array $parameters = [],
        array $applicableContexts = []
    ): self {
        return new self(
            UuidValueObject::generate(),
            $tenantId,
            $ruleCode,
            $enabled,
            $priority,
            $parameters,
            $applicableContexts,
            new \DateTimeImmutable(),
            new \DateTimeImmutable()
        );
    }
}