<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Settings\Repositories\SettingsRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsRepository implements SettingsRepositoryInterface
{
    protected Setting $model;
    protected string $cachePrefix = 'settings:';
    protected int $cacheTime = 3600; // 1 hour

    public function __construct(Setting $model)
    {
        $this->model = $model;
    }

    public function get(string $key, $default = null)
    {
        return Cache::remember(
            $this->getCacheKey($key),
            $this->cacheTime,
            function () use ($key, $default) {
                $setting = $this->model->where('key', $key)->first();
                
                if (!$setting) {
                    return $default;
                }
                
                return $setting->getCastedValue() ?? $setting->default_value ?? $default;
            }
        );
    }

    public function set(string $key, $value, array $options = []): bool
    {
        $setting = $this->model->updateOrCreate(
            ['key' => $key],
            array_merge([
                'value' => $value,
                'type' => $options['type'] ?? $this->guessType($value),
                'category' => $options['category'] ?? 'general',
                'label' => $options['label'] ?? null,
                'description' => $options['description'] ?? null,
                'is_public' => $options['is_public'] ?? false,
                'is_editable' => $options['is_editable'] ?? true,
                'validation_rules' => $options['validation_rules'] ?? null,
            ])
        );

        // Set value with type casting
        $setting->setCastedValue($value);
        $setting->save();

        // Clear cache
        Cache::forget($this->getCacheKey($key));

        return true;
    }

    public function has(string $key): bool
    {
        return $this->model->where('key', $key)->exists();
    }

    public function delete(string $key): bool
    {
        $deleted = $this->model->where('key', $key)->delete();
        Cache::forget($this->getCacheKey($key));
        
        return $deleted > 0;
    }

    public function getByCategory(string $category): array
    {
        return Cache::remember(
            $this->cachePrefix . 'category:' . $category,
            $this->cacheTime,
            function () use ($category) {
                $settings = $this->model->byCategory($category)->get();
                
                return $settings->mapWithKeys(function ($setting) {
                    return [$setting->key => $setting->getCastedValue()];
                })->toArray();
            }
        );
    }

    public function getByKeyPrefix(string $prefix): array
    {
        return Cache::remember(
            $this->cachePrefix . 'prefix:' . $prefix,
            $this->cacheTime,
            function () use ($prefix) {
                $settings = $this->model->byKeyPrefix($prefix)->get();
                
                return $settings->mapWithKeys(function ($setting) {
                    return [$setting->key => $setting->getCastedValue()];
                })->toArray();
            }
        );
    }

    public function setMany(array $settings, string $category = 'general'): bool
    {
        foreach ($settings as $key => $value) {
            $this->set($key, $value, ['category' => $category]);
        }

        return true;
    }

    public function flush(): void
    {
        // Clear all settings cache
        $keys = $this->model->pluck('key')->toArray();
        foreach ($keys as $key) {
            Cache::forget($this->getCacheKey($key));
        }
        
        // Clear category caches
        Cache::flush(); // or more selective approach
    }

    public function all(): array
    {
        return Cache::remember(
            $this->cachePrefix . 'all',
            $this->cacheTime,
            function () {
                $settings = $this->model->all();
                
                return $settings->mapWithKeys(function ($setting) {
                    return [$setting->key => $setting->getCastedValue()];
                })->toArray();
            }
        );
    }

    /**
     * Guess the type of a value
     */
    protected function guessType($value): string
    {
        if (is_int($value)) {
            return 'integer';
        }
        
        if (is_float($value)) {
            return 'float';
        }
        
        if (is_bool($value)) {
            return 'boolean';
        }
        
        if (is_array($value)) {
            return 'array';
        }
        
        return 'string';
    }

    /**
     * Get cache key for a setting
     */
    protected function getCacheKey(string $key): string
    {
        return $this->cachePrefix . $key;
    }
}
