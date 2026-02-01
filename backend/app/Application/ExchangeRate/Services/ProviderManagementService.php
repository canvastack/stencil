<?php

namespace App\Application\ExchangeRate\Services;

use App\Domain\ExchangeRate\Repositories\ApiQuotaTrackingRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ExchangeRateProviderRepositoryInterface;
use App\Infrastructure\ExchangeRate\Factories\ProviderClientFactory;
use App\Models\ExchangeRateProvider;
use Illuminate\Support\Collection;

class ProviderManagementService
{
    public function __construct(
        private ExchangeRateProviderRepositoryInterface $providerRepository,
        private ApiQuotaTrackingRepositoryInterface $quotaRepository,
        private ProviderClientFactory $clientFactory
    ) {}

    /**
     * Get next available provider with priority ordering
     * 
     * @param int $tenantId
     * @param int|null $currentProviderId Provider to skip (optional)
     * @return ExchangeRateProvider|null
     */
    public function getNextAvailableProvider(int $tenantId, ?int $currentProviderId = null): ?ExchangeRateProvider
    {
        $providers = $this->providerRepository->getAllEnabled($tenantId);
        
        // Filter out current provider if specified
        if ($currentProviderId !== null) {
            $providers = $providers->filter(fn($p) => $p->id !== $currentProviderId);
        }
        
        // Sort by priority (ascending - lower number = higher priority)
        $providers = $providers->sortBy('priority');
        
        // Find first provider with available quota
        foreach ($providers as $provider) {
            if ($provider->is_unlimited) {
                return $provider;
            }
            
            $quota = $this->quotaRepository->getForProvider($provider->id);
            
            if (!$quota || !$quota->isExhausted()) {
                return $provider;
            }
        }
        
        return null;
    }

    /**
     * Validate API key for a provider
     * 
     * @param ExchangeRateProvider $provider
     * @return bool True if valid, false otherwise
     * @throws \Exception If validation fails with error message
     */
    public function validateApiKey(ExchangeRateProvider $provider): bool
    {
        // Providers without API keys are always valid
        if (!$provider->requires_api_key) {
            return true;
        }
        
        // Check if API key is provided
        if (empty($provider->api_key)) {
            throw new \Exception("API key is required for provider: {$provider->name}");
        }
        
        try {
            $client = $this->clientFactory->create($provider);
            return $client->testConnection();
        } catch (\Exception $e) {
            throw new \Exception("API key validation failed for {$provider->name}: " . $e->getMessage());
        }
    }

    /**
     * Disable a provider
     * 
     * @param int $providerId
     * @return ExchangeRateProvider
     */
    public function disableProvider(int $providerId): ExchangeRateProvider
    {
        $provider = $this->providerRepository->getById($providerId);
        
        if (!$provider) {
            throw new \Exception("Provider not found: {$providerId}");
        }
        
        $provider->is_enabled = false;
        return $this->providerRepository->save($provider);
    }

    /**
     * Enable a provider
     * 
     * @param int $providerId
     * @return ExchangeRateProvider
     */
    public function enableProvider(int $providerId): ExchangeRateProvider
    {
        $provider = $this->providerRepository->getById($providerId);
        
        if (!$provider) {
            throw new \Exception("Provider not found: {$providerId}");
        }
        
        $provider->is_enabled = true;
        return $this->providerRepository->save($provider);
    }

    /**
     * Get all providers for a tenant ordered by priority
     * 
     * @param int $tenantId
     * @return Collection
     */
    public function getAllProviders(int $tenantId): Collection
    {
        return $this->providerRepository->getAllForTenant($tenantId);
    }

    /**
     * Update provider priority
     * 
     * @param int $providerId
     * @param int $newPriority
     * @return ExchangeRateProvider
     */
    public function updatePriority(int $providerId, int $newPriority): ExchangeRateProvider
    {
        $provider = $this->providerRepository->getById($providerId);
        
        if (!$provider) {
            throw new \Exception("Provider not found: {$providerId}");
        }
        
        $provider->priority = $newPriority;
        return $this->providerRepository->save($provider);
    }

    /**
     * Update provider configuration
     * 
     * @param int $providerId
     * @param array $data
     * @return ExchangeRateProvider
     */
    public function updateProvider(int $providerId, array $data): ExchangeRateProvider
    {
        $provider = $this->providerRepository->getById($providerId);
        
        if (!$provider) {
            throw new \Exception("Provider not found: {$providerId}");
        }
        
        // Update allowed fields
        if (isset($data['api_key'])) {
            $provider->api_key = $data['api_key'];
        }
        
        if (isset($data['monthly_quota'])) {
            $provider->monthly_quota = $data['monthly_quota'];
        }
        
        if (isset($data['priority'])) {
            $provider->priority = $data['priority'];
        }
        
        if (isset($data['is_enabled'])) {
            $provider->is_enabled = $data['is_enabled'];
        }
        
        if (isset($data['warning_threshold'])) {
            $provider->warning_threshold = $data['warning_threshold'];
        }
        
        if (isset($data['critical_threshold'])) {
            $provider->critical_threshold = $data['critical_threshold'];
        }
        
        // Validate API key if provided
        if (isset($data['api_key']) && $provider->requires_api_key) {
            $this->validateApiKey($provider);
        }
        
        return $this->providerRepository->save($provider);
    }
}

