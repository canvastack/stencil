<?php

namespace App\Domain\Tenant\Entities;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\ValueObjects\TenantName;
use App\Domain\Tenant\ValueObjects\TenantSlug;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Enums\SubscriptionStatus;
use Carbon\Carbon;
use DateTime;

class Tenant
{
    public function __construct(
        private Uuid $id,
        private TenantName $name,
        private TenantSlug $slug,
        private ?string $domain = null,
        private ?string $database = null,
        private ?array $data = null,
        private TenantStatus $status = TenantStatus::TRIAL,
        private SubscriptionStatus $subscriptionStatus = SubscriptionStatus::ACTIVE,
        private ?Carbon $trialEndsAt = null,
        private ?Carbon $subscriptionEndsAt = null,
        private ?Uuid $createdBy = null,
        private ?Carbon $createdAt = null,
        private ?Carbon $updatedAt = null
    ) {}

    public static function create(
        TenantName $name,
        TenantSlug $slug,
        ?Uuid $createdBy = null,
        ?string $domain = null
    ): self {
        return new self(
            id: Uuid::generate(),
            name: $name,
            slug: $slug,
            domain: $domain,
            createdBy: $createdBy,
            createdAt: Carbon::now()
        );
    }

    // Getters
    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getName(): TenantName
    {
        return $this->name;
    }

    public function getSlug(): TenantSlug
    {
        return $this->slug;
    }

    public function getDomain(): ?string
    {
        return $this->domain;
    }

    public function getStatus(): TenantStatus
    {
        return $this->status;
    }

    public function getSubscriptionStatus(): SubscriptionStatus
    {
        return $this->subscriptionStatus;
    }

    public function getTrialEndsAt(): ?Carbon
    {
        return $this->trialEndsAt;
    }

    public function getSubscriptionEndsAt(): ?Carbon
    {
        return $this->subscriptionEndsAt;
    }

    // Business Logic Methods
    public function isActive(): bool
    {
        return $this->status === TenantStatus::ACTIVE && 
               $this->subscriptionStatus === SubscriptionStatus::ACTIVE &&
               ($this->subscriptionEndsAt === null || $this->subscriptionEndsAt->isFuture());
    }

    public function isOnTrial(): bool
    {
        return $this->subscriptionStatus === SubscriptionStatus::ACTIVE && 
               $this->trialEndsAt && 
               $this->trialEndsAt->isFuture();
    }

    public function hasCustomDomain(): bool
    {
        return !empty($this->domain);
    }

    public function getPrimaryDomain(): string
    {
        if ($this->domain) {
            return $this->domain;
        }
        
        return "canvastencil.com/{$this->slug->getValue()}";
    }

    public function activate(): void
    {
        $this->status = TenantStatus::ACTIVE;
        $this->updatedAt = Carbon::now();
    }

    public function suspend(): void
    {
        $this->status = TenantStatus::SUSPENDED;
        $this->updatedAt = Carbon::now();
    }

    public function deactivate(): void
    {
        $this->status = TenantStatus::INACTIVE;
        $this->updatedAt = Carbon::now();
    }

    public function setCustomDomain(string $domain): void
    {
        $this->domain = $domain;
        $this->updatedAt = Carbon::now();
    }

    public function extendTrial(Carbon $newTrialEnd): void
    {
        $this->trialEndsAt = $newTrialEnd;
        $this->updatedAt = Carbon::now();
    }

    public function updateSubscription(
        SubscriptionStatus $status, 
        ?DateTime $endsAt = null
    ): void {
        $this->subscriptionStatus = $status;
        $this->subscriptionEndsAt = $endsAt ? Carbon::parse($endsAt) : null;
        $this->updatedAt = Carbon::now();
    }

    public function getPublicUrl(string $path = ''): string
    {
        $domain = $this->getPrimaryDomain();
        $path = ltrim($path, '/');
        
        if ($this->hasCustomDomain()) {
            return "https://{$domain}/{$path}";
        }
        
        return "https://canvastencil.com/{$this->slug->getValue()}/{$path}";
    }

    public function getAdminUrl(string $path = ''): string
    {
        $path = ltrim($path, '/');
        return $this->getPublicUrl("admin/{$path}");
    }

    public function isSuspended(): bool
    {
        return $this->status === TenantStatus::SUSPENDED;
    }

    public function startTrial(DateTime $trialEndsAt): void
    {
        $this->status = TenantStatus::TRIAL;
        $this->subscriptionStatus = SubscriptionStatus::ACTIVE;
        $this->trialEndsAt = Carbon::parse($trialEndsAt);
        $this->updatedAt = Carbon::now();
    }

    public function endTrial(): void
    {
        $this->status = TenantStatus::ACTIVE;
        $this->subscriptionStatus = SubscriptionStatus::ACTIVE;
        $this->trialEndsAt = null;
        $this->updatedAt = Carbon::now();
    }

    public function expireSubscription(): void
    {
        $this->subscriptionStatus = SubscriptionStatus::EXPIRED;
        $this->updatedAt = Carbon::now();
    }

    public function getCustomDomain(): ?string
    {
        return $this->domain;
    }

    public function removeCustomDomain(): void
    {
        $this->domain = null;
        $this->updatedAt = Carbon::now();
    }

    public function hasActiveSubscription(): bool
    {
        return $this->subscriptionStatus === SubscriptionStatus::ACTIVE &&
               ($this->subscriptionEndsAt === null || $this->subscriptionEndsAt->isFuture());
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->toString(),
            'name' => $this->name->getValue(),
            'slug' => $this->slug->getValue(),
            'domain' => $this->domain,
            'custom_domain' => $this->domain,
            'database' => $this->database,
            'data' => $this->data,
            'status' => $this->status->value,
            'subscription_status' => $this->subscriptionStatus->value,
            'trial_ends_at' => $this->trialEndsAt?->toISOString(),
            'subscription_ends_at' => $this->subscriptionEndsAt?->toISOString(),
            'created_by' => $this->createdBy?->toString(),
            'created_at' => $this->createdAt?->toISOString(),
            'updated_at' => $this->updatedAt?->toISOString(),
        ];
    }
}