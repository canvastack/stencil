<?php

namespace App\Domain\Settings\Repositories;

interface SettingsRepositoryInterface
{
    /**
     * Get a setting value by key
     * 
     * @param string $key Setting key
     * @param mixed $default Default value if setting not found
     * @return mixed Setting value (casted to appropriate type)
     */
    public function get(string $key, $default = null);

    /**
     * Set a setting value by key
     * 
     * @param string $key Setting key
     * @param mixed $value Setting value
     * @param array $options Additional options (type, category, description, etc.)
     * @return bool Success status
     */
    public function set(string $key, $value, array $options = []): bool;

    /**
     * Check if a setting exists
     * 
     * @param string $key Setting key
     * @return bool
     */
    public function has(string $key): bool;

    /**
     * Delete a setting
     * 
     * @param string $key Setting key
     * @return bool Success status
     */
    public function delete(string $key): bool;

    /**
     * Get all settings in a category
     * 
     * @param string $category Category name
     * @return array Associative array of settings (key => value)
     */
    public function getByCategory(string $category): array;

    /**
     * Get settings by key prefix
     * 
     * @param string $prefix Key prefix (e.g., 'vendor.')
     * @return array Associative array of settings (key => value)
     */
    public function getByKeyPrefix(string $prefix): array;

    /**
     * Set multiple settings at once
     * 
     * @param array $settings Associative array of settings (key => value)
     * @param string $category Optional category for all settings
     * @return bool Success status
     */
    public function setMany(array $settings, string $category = 'general'): bool;

    /**
     * Flush settings cache (if caching is implemented)
     * 
     * @return void
     */
    public function flush(): void;

    /**
     * Get all settings as associative array
     * 
     * @return array
     */
    public function all(): array;
}
