<?php

namespace App\Infrastructure\ExchangeRate\Repositories;

use App\Domain\ExchangeRate\Repositories\ExchangeRateProviderRepositoryInterface;
use App\Models\ExchangeRateProvider;
use Illuminate\Support\Collection;

class ExchangeRateProviderRepository implements ExchangeRateProviderRepositoryInterface
{
    public function getById(int $id): ?ExchangeRateProvider
    {
        return ExchangeRateProvider::find($id);
    }
    
    public function findById(int $id): ?ExchangeRateProvider
    {
        return $this->getById($id);
    }
    
    public function getActive(int $tenantId): ?ExchangeRateProvider
    {
        $settings = \App\Models\ExchangeRateSetting::forTenant($tenantId)->first();
        
        if (!$settings || !$settings->active_provider_id) {
            // Return first enabled provider by priority
            return ExchangeRateProvider::forTenant($tenantId)
                ->enabled()
                ->orderedByPriority()
                ->first();
        }
        
        return ExchangeRateProvider::find($settings->active_provider_id);
    }
    
    public function getNextAvailable(int $tenantId, int $currentProviderId): ?ExchangeRateProvider
    {
        $currentProvider = $this->getById($currentProviderId);
        
        if (!$currentProvider) {
            return null;
        }
        
        // Get all enabled providers ordered by priority
        $providers = ExchangeRateProvider::forTenant($tenantId)
            ->enabled()
            ->orderedByPriority()
            ->get();
        
        // Find next provider with higher priority number (lower priority)
        foreach ($providers as $provider) {
            if ($provider->priority > $currentProvider->priority) {
                // Check if this provider has available quota
                $quota = $provider->getCurrentQuota();
                
                if ($provider->is_unlimited || !$quota || !$quota->isExhausted()) {
                    return $provider;
                }
            }
        }
        
        return null;
    }
    
    public function getAllEnabled(int $tenantId): Collection
    {
        return ExchangeRateProvider::forTenant($tenantId)
            ->enabled()
            ->orderedByPriority()
            ->get();
    }
    
    public function getAllForTenant(int $tenantId): Collection
    {
        return ExchangeRateProvider::forTenant($tenantId)
            ->orderedByPriority()
            ->get();
    }
    
    public function save(ExchangeRateProvider $provider): ExchangeRateProvider
    {
        $provider->save();
        return $provider->fresh();
    }
}
