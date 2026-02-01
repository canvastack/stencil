<?php

namespace App\Domain\ExchangeRate\Repositories;

use App\Models\ExchangeRateProvider;
use Illuminate\Support\Collection;

interface ExchangeRateProviderRepositoryInterface
{
    public function getById(int $id): ?ExchangeRateProvider;
    
    public function findById(int $id): ?ExchangeRateProvider;
    
    public function getActive(int $tenantId): ?ExchangeRateProvider;
    
    public function getNextAvailable(int $tenantId, int $currentProviderId): ?ExchangeRateProvider;
    
    public function getAllEnabled(int $tenantId): Collection;
    
    public function getAllForTenant(int $tenantId): Collection;
    
    public function save(ExchangeRateProvider $provider): ExchangeRateProvider;
}
