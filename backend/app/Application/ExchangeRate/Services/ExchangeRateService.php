<?php

namespace App\Application\ExchangeRate\Services;

use App\Domain\ExchangeRate\Entities\ExchangeRate;
use App\Domain\ExchangeRate\Repositories\ApiQuotaTrackingRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ExchangeRateHistoryRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ExchangeRateProviderRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ExchangeRateSettingRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ProviderSwitchEventRepositoryInterface;
use App\Domain\ExchangeRate\Services\ExchangeRateValidationService;
use App\Domain\ExchangeRate\Exceptions\NoRateAvailableException;
use App\Domain\ExchangeRate\Exceptions\StaleRateException;
use App\Domain\ExchangeRate\Exceptions\InvalidManualRateException;
use App\Infrastructure\ExchangeRate\Factories\ProviderClientFactory;
use App\Infrastructure\ExchangeRate\Services\DatabaseTransactionService;
use App\Infrastructure\ExchangeRate\Exceptions\DatabaseException;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use App\Models\ExchangeRateProvider;
use Exception;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    public function __construct(
        private ExchangeRateSettingRepositoryInterface $settingRepository,
        private ExchangeRateProviderRepositoryInterface $providerRepository,
        private ApiQuotaTrackingRepositoryInterface $quotaRepository,
        private ExchangeRateHistoryRepositoryInterface $historyRepository,
        private ProviderSwitchEventRepositoryInterface $switchEventRepository,
        private ProviderClientFactory $clientFactory,
        private NotificationService $notificationService,
        private DatabaseTransactionService $dbTransactionService,
        private ExchangeRateValidationService $validationService
    ) {}

    /**
     * Update exchange rate based on current mode
     * 
     * @param int $tenantId
     * @return ExchangeRate
     * @throws Exception
     */
    public function updateRate(int $tenantId): ExchangeRate
    {
        try {
            return $this->dbTransactionService->executeWithRetry(
                function () use ($tenantId) {
                    $settings = $this->settingRepository->getForTenant($tenantId);
                    
                    if (!$settings) {
                        throw NoRateAvailableException::noProviders();
                    }
                    
                    if ($settings->isManualMode()) {
                        // Validate manual rate
                        try {
                            $this->validationService->validateManualRate($settings->manual_rate, true);
                        } catch (InvalidManualRateException $e) {
                            Log::error('Invalid manual rate configured', [
                                'tenant_id' => $tenantId,
                                'rate' => $settings->manual_rate,
                                'error' => $e->getMessage()
                            ]);
                            throw $e;
                        }
                        
                        // In manual mode, return the manually configured rate
                        return new ExchangeRate(
                            (float) $settings->manual_rate,
                            now(),
                            'manual',
                            'manual'
                        );
                    }
                    
                    // In auto mode, fetch from API
                    return $this->fetchFromApi($tenantId);
                },
                'update_exchange_rate'
            );
        } catch (DatabaseException $e) {
            Log::error('Database error during rate update', [
                'tenant_id' => $tenantId,
                'error_type' => $e->getErrorType(),
                'error' => $e->getMessage(),
                'context' => $e->getContext()
            ]);
            throw new Exception('Failed to update exchange rate due to database error: ' . $e->getMessage(), 0, $e);
        } catch (InvalidManualRateException | NoRateAvailableException $e) {
            // Re-throw business logic exceptions as-is
            throw $e;
        }
    }

    /**
     * Fetch exchange rate from API with quota checking and failover
     * 
     * @param int $tenantId
     * @return ExchangeRate
     * @throws Exception
     */
    private function fetchFromApi(int $tenantId): ExchangeRate
    {
        try {
            return $this->dbTransactionService->executeTransaction(
                function () use ($tenantId) {
                    $activeProvider = $this->providerRepository->getActive($tenantId);
                    
                    if (!$activeProvider) {
                        throw NoRateAvailableException::noProviders();
                    }
                    
                    $quota = $this->quotaRepository->getForProvider($activeProvider->id);
                    
                    // Check if quota needs reset
                    if ($quota && $quota->shouldReset()) {
                        $this->quotaRepository->resetQuota($activeProvider->id);
                        $quota = $this->quotaRepository->getForProvider($activeProvider->id);
                    }
                    
                    // Check quota levels and notify
                    if ($quota) {
                        $this->checkQuotaLevels($quota, $activeProvider, $tenantId);
                    }
                    
                    // If exhausted, try to switch provider
                    if ($quota && $quota->isExhausted()) {
                        try {
                            $activeProvider = $this->switchToNextProvider($tenantId, $activeProvider);
                            $quota = $this->quotaRepository->getForProvider($activeProvider->id);
                        } catch (Exception $e) {
                            // All providers exhausted, fall back to cached rate
                            return $this->handleApiFallback($tenantId, NoRateAvailableException::allProvidersExhausted());
                        }
                    }
                    
                    // Fetch rate from API (outside transaction for external call)
                    try {
                        $client = $this->clientFactory->create($this->convertToProviderEntity($activeProvider));
                        $rate = $client->fetchRate('USD', 'IDR');
                        
                        // Validate API rate
                        $this->validationService->validateApiRate($rate, $activeProvider->name);
                        
                        // Store results in database (inside transaction)
                        return $this->storeRateResults($tenantId, $activeProvider, $quota, $rate);
                        
                    } catch (ApiException $e) {
                        Log::warning('API error during rate fetch', [
                            'tenant_id' => $tenantId,
                            'provider' => $activeProvider->name,
                            'error_type' => $e->getErrorType(),
                            'error' => $e->getMessage()
                        ]);
                        
                        // If rate limit error, try to switch to next provider
                        if ($e->getErrorType() === ApiException::ERROR_RATE_LIMIT) {
                            try {
                                $nextProvider = $this->switchToNextProvider($tenantId, $activeProvider);
                                
                                // Try to fetch from the new provider directly
                                $nextClient = $this->clientFactory->create($this->convertToProviderEntity($nextProvider));
                                $nextRate = $nextClient->fetchRate('USD', 'IDR');
                                
                                // Validate API rate
                                $this->validationService->validateApiRate($nextRate, $nextProvider->name);
                                
                                // Get quota for new provider
                                $nextQuota = $this->quotaRepository->getForProvider($nextProvider->id);
                                
                                // Store results with new provider
                                return $this->storeRateResults($tenantId, $nextProvider, $nextQuota, $nextRate);
                                
                            } catch (Exception $switchException) {
                                Log::warning('Failed to switch provider after rate limit', [
                                    'tenant_id' => $tenantId,
                                    'original_provider' => $activeProvider->name,
                                    'switch_error' => $switchException->getMessage()
                                ]);
                                // Fall back to cached rate if provider switch fails
                                return $this->handleApiFallback($tenantId, NoRateAvailableException::allProvidersExhausted());
                            }
                        }
                        
                        // For other API errors, fall back to cached rate
                        return $this->handleApiFallback($tenantId, NoRateAvailableException::apiFailure($e->getMessage()));
                    }
                },
                'fetch_from_api'
            );
        } catch (DatabaseException $e) {
            Log::error('Database error during API fetch', [
                'tenant_id' => $tenantId,
                'error_type' => $e->getErrorType(),
                'error' => $e->getMessage(),
                'context' => $e->getContext()
            ]);
            
            // Try to fall back to cached rate
            return $this->handleApiFallback($tenantId, $e);
        } catch (NoRateAvailableException $e) {
            // Re-throw business logic exceptions
            throw $e;
        } catch (Exception $e) {
            return $this->handleApiFallback($tenantId, $e);
        }
    }

    /**
     * Store rate results in database
     * 
     * @param int $tenantId
     * @param ExchangeRateProvider $activeProvider
     * @param mixed $quota
     * @param float $rate
     * @return ExchangeRate
     * @throws Exception
     */
    private function storeRateResults(int $tenantId, ExchangeRateProvider $activeProvider, $quota, float $rate): ExchangeRate
    {
        // Increment quota
        if ($quota && !$activeProvider->is_unlimited) {
            $this->quotaRepository->incrementUsage($activeProvider->id);
        }
        
        // Store rate in settings
        $this->settingRepository->updateCurrentRate($tenantId, $rate);
        
        // Log to history
        $this->historyRepository->logRateUpdate(
            $tenantId,
            $rate,
            $activeProvider->id,
            'api',
            'rate_change',
            ['provider' => $activeProvider->name]
        );
        
        // Create and return ExchangeRate entity
        return new ExchangeRate(
            $rate,
            now(),
            'api',
            $activeProvider->name
        );
    }

    /**
     * Check quota levels and send notifications
     * 
     * @param \App\Models\ApiQuotaTracking $quota
     * @param ExchangeRateProvider $provider
     * @param int $tenantId
     * @return void
     */
    private function checkQuotaLevels($quota, ExchangeRateProvider $provider, int $tenantId): void
    {
        $remaining = $quota->remaining_quota;
        
        // Skip notifications for unlimited providers
        if ($provider->is_unlimited) {
            return;
        }
        
        // Critical level (red notification)
        if ($remaining <= $provider->critical_threshold && $remaining > 0) {
            $nextProvider = $this->providerRepository->getNextAvailable($tenantId, $provider->id);
            
            if ($nextProvider) {
                $nextQuota = $this->quotaRepository->getForProvider($nextProvider->id);
                $nextRemaining = $nextQuota ? $nextQuota->remaining_quota : $nextProvider->monthly_quota;
                
                $this->notificationService->sendCriticalQuotaWarning(
                    $provider->name,
                    $remaining,
                    $nextProvider->name,
                    $nextRemaining
                );
            }
        }
        // Warning level (orange notification)
        elseif ($remaining <= $provider->warning_threshold && $remaining > 0) {
            $this->notificationService->sendQuotaWarning(
                $provider->name,
                $remaining
            );
        }
    }

    /**
     * Switch to next available provider
     * 
     * @param int $tenantId
     * @param ExchangeRateProvider $currentProvider
     * @return ExchangeRateProvider
     * @throws Exception
     */
    private function switchToNextProvider(int $tenantId, ExchangeRateProvider $currentProvider): ExchangeRateProvider
    {
        try {
            return $this->dbTransactionService->executeTransaction(
                function () use ($tenantId, $currentProvider) {
                    $nextProvider = $this->providerRepository->getNextAvailable($tenantId, $currentProvider->id);
                    
                    if (!$nextProvider) {
                        throw new Exception('All providers exhausted');
                    }
                    
                    // Update active provider
                    $this->settingRepository->updateActiveProvider($tenantId, $nextProvider->id);
                    
                    // Log switch event
                    $this->switchEventRepository->logSwitch(
                        $tenantId,
                        $currentProvider->id,
                        $nextProvider->id,
                        $currentProvider->name,
                        $nextProvider->name,
                        'quota_exhausted'
                    );
                    
                    return $nextProvider;
                },
                'switch_provider'
            );
        } catch (DatabaseException $e) {
            Log::error('Database error during provider switch', [
                'tenant_id' => $tenantId,
                'current_provider' => $currentProvider->id,
                'error_type' => $e->getErrorType(),
                'error' => $e->getMessage()
            ]);
            throw new Exception('Failed to switch provider due to database error: ' . $e->getMessage(), 0, $e);
        } finally {
            // Send notification outside transaction
            if (isset($nextProvider)) {
                $nextQuota = $this->quotaRepository->getForProvider($nextProvider->id);
                $nextRemaining = $nextQuota ? $nextQuota->remaining_quota : $nextProvider->monthly_quota;
                
                $this->notificationService->sendProviderSwitched(
                    $nextProvider->name,
                    $nextRemaining
                );
            }
        }
    }

    /**
     * Handle API fallback by using cached rate
     * 
     * @param int $tenantId
     * @param Exception $exception
     * @return ExchangeRate
     * @throws Exception
     */
    private function handleApiFallback(int $tenantId, Exception $exception): ExchangeRate
    {
        try {
            return $this->dbTransactionService->executeWithRetry(
                function () use ($tenantId, $exception) {
                    $cachedRate = $this->historyRepository->getCachedRate($tenantId);
                    
                    if (!$cachedRate) {
                        throw NoRateAvailableException::noCachedRate();
                    }
                    
                    // Validate cached rate availability and check for staleness
                    try {
                        $this->validationService->validateRateAvailability(
                            $cachedRate->rate,
                            $cachedRate->created_at,
                            'cached'
                        );
                    } catch (StaleRateException $e) {
                        // Log staleness warning but continue with cached rate
                        Log::warning('Using stale cached rate', [
                            'tenant_id' => $tenantId,
                            'rate' => $cachedRate->rate,
                            'rate_date' => $cachedRate->created_at->format('Y-m-d H:i:s'),
                            'days_old' => $e->getDaysOld(),
                            'original_error' => $exception->getMessage()
                        ]);
                    }
                    
                    // Send fallback notification with staleness info
                    $isStale = $this->validationService->shouldWarnAboutStaleness($cachedRate->created_at);
                    $this->notificationService->sendFallbackNotification(
                        $cachedRate->rate,
                        $cachedRate->created_at,
                        $isStale
                    );
                    
                    // Return cached rate as ExchangeRate entity
                    return new ExchangeRate(
                        (float) $cachedRate->rate,
                        $cachedRate->created_at,
                        'cached',
                        $cachedRate->provider->name ?? 'cached'
                    );
                },
                'api_fallback'
            );
        } catch (DatabaseException $e) {
            Log::error('Database error during API fallback', [
                'tenant_id' => $tenantId,
                'original_error' => $exception->getMessage(),
                'db_error_type' => $e->getErrorType(),
                'db_error' => $e->getMessage()
            ]);
            throw new Exception('Failed to retrieve cached rate due to database error: ' . $e->getMessage(), 0, $e);
        } catch (NoRateAvailableException $e) {
            // Re-throw business logic exceptions
            throw $e;
        }
    }

    /**
     * Validate and set manual exchange rate
     * 
     * @param int $tenantId
     * @param float $rate
     * @throws InvalidManualRateException
     * @throws DatabaseException
     */
    public function setManualRate(int $tenantId, float $rate): void
    {
        // Validate the manual rate
        $this->validationService->validateManualRate($rate, true);
        
        try {
            $this->dbTransactionService->executeTransaction(
                function () use ($tenantId, $rate) {
                    // Update the manual rate in settings
                    $this->settingRepository->updateManualRate($tenantId, $rate);
                    
                    // Log the manual rate change
                    $this->historyRepository->logRateUpdate(
                        $tenantId,
                        $rate,
                        null, // No provider for manual rates
                        'manual',
                        'manual_update',
                        ['previous_rate' => null] // Could be enhanced to track previous rate
                    );
                },
                'set_manual_rate'
            );
        } catch (DatabaseException $e) {
            Log::error('Database error setting manual rate', [
                'tenant_id' => $tenantId,
                'rate' => $rate,
                'error_type' => $e->getErrorType(),
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Convert Eloquent model to domain entity
     * 
     * @param ExchangeRateProvider $model
     * @return \App\Domain\ExchangeRate\Entities\Provider
     */
    private function convertToProviderEntity(ExchangeRateProvider $model): \App\Domain\ExchangeRate\Entities\Provider
    {
        return new \App\Domain\ExchangeRate\Entities\Provider(
            code: $model->code,
            name: $model->name,
            apiUrl: $model->api_url,
            apiKey: $model->api_key,
            requiresApiKey: $model->requires_api_key,
            isUnlimited: $model->is_unlimited,
            monthlyQuota: $model->monthly_quota,
            priority: $model->priority,
            isEnabled: $model->is_enabled,
            warningThreshold: $model->warning_threshold,
            criticalThreshold: $model->critical_threshold
        );
    }
}
