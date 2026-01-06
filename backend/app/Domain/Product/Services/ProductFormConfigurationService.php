<?php

namespace App\Domain\Product\Services;

use App\Models\ProductFormConfiguration;
use Illuminate\Support\Facades\Cache;

class ProductFormConfigurationService
{
    private const CACHE_TTL = 86400; // 24 hours

    /**
     * Get active form configuration for a product with caching
     */
    public function getActiveFormConfiguration(string $productUuid): ?ProductFormConfiguration
    {
        $cacheKey = $this->getCacheKey($productUuid);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($productUuid) {
            return ProductFormConfiguration::where('product_uuid', $productUuid)
                ->where('is_active', true)
                ->first();
        });
    }

    /**
     * Get form configuration by UUID with caching
     */
    public function getFormConfigurationByUuid(string $configUuid): ?ProductFormConfiguration
    {
        $cacheKey = $this->getConfigCacheKey($configUuid);
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($configUuid) {
            return ProductFormConfiguration::where('uuid', $configUuid)->first();
        });
    }

    /**
     * Clear cache for a specific product
     */
    public function clearCache(string $productUuid): void
    {
        $cacheKey = $this->getCacheKey($productUuid);
        Cache::forget($cacheKey);
    }

    /**
     * Clear cache for a specific form configuration
     */
    public function clearConfigCache(string $configUuid): void
    {
        $cacheKey = $this->getConfigCacheKey($configUuid);
        Cache::forget($cacheKey);
    }

    /**
     * Invalidate cache when form configuration is updated
     */
    public function invalidateCacheOnUpdate(ProductFormConfiguration $config): void
    {
        // Clear both product and config caches
        if ($config->product_uuid) {
            $this->clearCache($config->product_uuid);
        }
        
        if ($config->uuid) {
            $this->clearConfigCache($config->uuid);
        }
    }

    /**
     * Get cache key for product-based lookup
     */
    private function getCacheKey(string $productUuid): string
    {
        return "product_form_config:{$productUuid}";
    }

    /**
     * Get cache key for config UUID-based lookup
     */
    private function getConfigCacheKey(string $configUuid): string
    {
        return "form_config:{$configUuid}";
    }

    /**
     * Warm cache for multiple products
     */
    public function warmCache(array $productUuids): void
    {
        foreach ($productUuids as $productUuid) {
            $this->getActiveFormConfiguration($productUuid);
        }
    }

    /**
     * Clear all form configuration caches
     */
    public function clearAllCaches(): void
    {
        Cache::tags(['product_form_configs'])->flush();
    }
}
