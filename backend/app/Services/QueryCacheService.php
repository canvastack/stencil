<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Query Cache Service
 * 
 * Provides query result caching to improve API response times.
 * Implements intelligent cache invalidation and performance monitoring.
 * 
 * Target: All API responses < 500ms
 * Requirements: 10.2.2 (Performance Optimization)
 * 
 * Usage:
 * ```php
 * $result = $queryCacheService->remember(
 *     'vendor_profile',
 *     ['vendor_id' => $vendorId, 'tenant_id' => $tenantId],
 *     fn() => $repository->findById($vendorId, $tenantId)
 * );
 * ```
 */
class QueryCacheService
{
    /**
     * Remember query result with caching
     * 
     * @param string $queryType Query type from config (e.g., 'vendor_profile')
     * @param array $params Query parameters for cache key generation
     * @param callable $callback Function to execute if cache miss
     * @return mixed Cached or fresh query result
     */
    public function remember(string $queryType, array $params, callable $callback): mixed
    {
        // Check if caching is enabled globally and for this query type
        if (!$this->isCachingEnabled($queryType)) {
            return $this->executeWithMonitoring($queryType, $params, $callback);
        }

        $cacheKey = $this->generateCacheKey($queryType, $params);
        $ttl = $this->getTtl($queryType);
        $tags = $this->getTags($queryType);

        $startTime = microtime(true);

        try {
            // Use cache tags if supported by driver (Redis, Memcached)
            if ($this->supportsTags()) {
                $result = Cache::tags($tags)->remember($cacheKey, $ttl, function () use ($callback, $queryType, $params) {
                    $this->logCacheMiss($queryType, $params);
                    return $callback();
                });
            } else {
                $result = Cache::remember($cacheKey, $ttl, function () use ($callback, $queryType, $params) {
                    $this->logCacheMiss($queryType, $params);
                    return $callback();
                });
            }

            $executionTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
            $this->logCacheHit($queryType, $params, $executionTime);

            return $result;

        } catch (\Exception $e) {
            Log::error('Query cache error', [
                'query_type' => $queryType,
                'params' => $params,
                'error' => $e->getMessage(),
            ]);

            // Fallback to direct execution on cache error
            return $this->executeWithMonitoring($queryType, $params, $callback);
        }
    }

    /**
     * Invalidate cache by tags
     * 
     * @param array $tags Cache tags to invalidate
     * @return void
     */
    public function invalidate(array $tags): void
    {
        if (!$this->isCachingEnabled()) {
            return;
        }

        try {
            if ($this->supportsTags()) {
                Cache::tags($tags)->flush();
                
                Log::info('Cache invalidated', [
                    'tags' => $tags,
                ]);
            } else {
                // For drivers that don't support tags, clear all cache
                Cache::flush();
                
                Log::warning('Cache flush (no tag support)', [
                    'requested_tags' => $tags,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Cache invalidation error', [
                'tags' => $tags,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalidate cache by event
     * 
     * @param string $event Event name (e.g., 'vendor.updated')
     * @return void
     */
    public function invalidateByEvent(string $event): void
    {
        $invalidationConfig = config('query-cache.invalidation', []);
        
        if (isset($invalidationConfig[$event])) {
            $tags = $invalidationConfig[$event];
            $this->invalidate($tags);
        }
    }

    /**
     * Clear specific cache entry
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @return void
     */
    public function forget(string $queryType, array $params): void
    {
        if (!$this->isCachingEnabled()) {
            return;
        }

        $cacheKey = $this->generateCacheKey($queryType, $params);
        
        try {
            Cache::forget($cacheKey);
            
            Log::debug('Cache entry forgotten', [
                'query_type' => $queryType,
                'params' => $params,
                'cache_key' => $cacheKey,
            ]);
        } catch (\Exception $e) {
            Log::error('Cache forget error', [
                'query_type' => $queryType,
                'params' => $params,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Warm cache for specific query
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @param callable $callback Function to execute
     * @return void
     */
    public function warm(string $queryType, array $params, callable $callback): void
    {
        if (!$this->isCachingEnabled($queryType)) {
            return;
        }

        try {
            $this->remember($queryType, $params, $callback);
            
            Log::info('Cache warmed', [
                'query_type' => $queryType,
                'params' => $params,
            ]);
        } catch (\Exception $e) {
            Log::error('Cache warming error', [
                'query_type' => $queryType,
                'params' => $params,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if caching is enabled
     * 
     * @param string|null $queryType Optional query type to check
     * @return bool True if caching is enabled
     */
    private function isCachingEnabled(?string $queryType = null): bool
    {
        $globalEnabled = config('query-cache.enabled', false);
        
        if (!$globalEnabled) {
            return false;
        }

        if ($queryType !== null) {
            $queryConfig = config("query-cache.queries.{$queryType}", []);
            return $queryConfig['enabled'] ?? true;
        }

        return true;
    }

    /**
     * Generate cache key from query type and parameters
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @return string Cache key
     */
    private function generateCacheKey(string $queryType, array $params): string
    {
        $prefix = config('query-cache.prefix', 'query_cache');
        
        // Sort params for consistent key generation
        ksort($params);
        
        // Create hash of parameters
        $paramsHash = md5(json_encode($params));
        
        return "{$prefix}:{$queryType}:{$paramsHash}";
    }

    /**
     * Get TTL for query type
     * 
     * @param string $queryType Query type
     * @return int TTL in seconds
     */
    private function getTtl(string $queryType): int
    {
        $queryConfig = config("query-cache.queries.{$queryType}", []);
        return $queryConfig['ttl'] ?? config('query-cache.default_ttl', 300);
    }

    /**
     * Get cache tags for query type
     * 
     * @param string $queryType Query type
     * @return array Cache tags
     */
    private function getTags(string $queryType): array
    {
        $queryConfig = config("query-cache.queries.{$queryType}", []);
        return $queryConfig['tags'] ?? [$queryType];
    }

    /**
     * Check if cache driver supports tags
     * 
     * @return bool True if tags are supported
     */
    private function supportsTags(): bool
    {
        $driver = config('query-cache.driver', config('cache.default'));
        return in_array($driver, ['redis', 'memcached', 'array']);
    }

    /**
     * Execute callback with performance monitoring
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @param callable $callback Function to execute
     * @return mixed Query result
     */
    private function executeWithMonitoring(string $queryType, array $params, callable $callback): mixed
    {
        $startTime = microtime(true);
        
        try {
            $result = $callback();
            
            $executionTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
            
            $this->logQueryExecution($queryType, $params, $executionTime);
            
            return $result;

        } catch (\Exception $e) {
            $executionTime = (microtime(true) - $startTime) * 1000;
            
            Log::error('Query execution error', [
                'query_type' => $queryType,
                'params' => $params,
                'execution_time_ms' => $executionTime,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Log cache hit
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @param float $executionTime Execution time in milliseconds
     * @return void
     */
    private function logCacheHit(string $queryType, array $params, float $executionTime): void
    {
        if (!config('query-cache.monitoring.track_hit_rate', true)) {
            return;
        }

        Log::debug('Cache hit', [
            'query_type' => $queryType,
            'params' => $params,
            'execution_time_ms' => round($executionTime, 2),
        ]);
    }

    /**
     * Log cache miss
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @return void
     */
    private function logCacheMiss(string $queryType, array $params): void
    {
        if (!config('query-cache.monitoring.track_hit_rate', true)) {
            return;
        }

        Log::debug('Cache miss', [
            'query_type' => $queryType,
            'params' => $params,
        ]);
    }

    /**
     * Log query execution
     * 
     * @param string $queryType Query type
     * @param array $params Query parameters
     * @param float $executionTime Execution time in milliseconds
     * @return void
     */
    private function logQueryExecution(string $queryType, array $params, float $executionTime): void
    {
        if (!config('query-cache.monitoring.enabled', true)) {
            return;
        }

        $slowQueryThreshold = config('query-cache.monitoring.slow_query_threshold', 500);
        
        if ($executionTime > $slowQueryThreshold && config('query-cache.monitoring.log_slow_queries', true)) {
            Log::warning('Slow query detected', [
                'query_type' => $queryType,
                'params' => $params,
                'execution_time_ms' => round($executionTime, 2),
                'threshold_ms' => $slowQueryThreshold,
            ]);
        } else {
            Log::debug('Query executed', [
                'query_type' => $queryType,
                'params' => $params,
                'execution_time_ms' => round($executionTime, 2),
            ]);
        }
    }
}
