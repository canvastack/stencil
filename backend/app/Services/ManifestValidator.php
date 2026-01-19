<?php

namespace App\Services;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ManifestValidator
{
    protected array $schema = [
        'name' => 'required|string|regex:/^[a-z0-9-]+$/',
        'version' => 'required|string|regex:/^\d+\.\d+\.\d+$/',
        'display_name' => 'required|string|max:255',
        'description' => 'required|string|max:500',
        'author' => 'required|string|max:255',
        'requires.php' => 'required|string',
        'requires.laravel' => 'required|string',
        'dependencies' => 'array',
        'migrations' => 'present|array',
        'seeders' => 'array',
        'permissions' => 'present|array',
        'routes.api' => 'string',
        'routes.web' => 'string',
        'service_providers' => 'array',
        'frontend.admin_module' => 'string',
        'frontend.public_module' => 'string',
        'uninstall_behavior' => 'required|in:keep_data,delete_data',
        'table_prefix' => 'required|string|regex:/^[a-z0-9_]+$/',
    ];

    public function validate(array $manifest): void
    {
        $validator = Validator::make($manifest, $this->schema);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $this->validatePhpVersion($manifest);
        $this->validateLaravelVersion($manifest);
        $this->validateMigrationFiles($manifest);
    }

    protected function validatePhpVersion(array $manifest): void
    {
        $requiredPhp = $manifest['requires']['php'] ?? '>=8.2';
        if (!$this->checkPhpVersion($requiredPhp)) {
            throw new \RuntimeException("PHP version $requiredPhp required");
        }
    }

    protected function validateLaravelVersion(array $manifest): void
    {
        $requiredLaravel = $manifest['requires']['laravel'] ?? '>=10.0';
        if (!$this->checkLaravelVersion($requiredLaravel)) {
            throw new \RuntimeException("Laravel version $requiredLaravel required");
        }
    }

    protected function validateMigrationFiles(array $manifest): void
    {
        foreach ($manifest['migrations'] as $migration) {
            // Plugins are in project root (canvastencil/plugins), not backend/plugins
            $filePath = dirname(base_path()) . "/plugins/{$manifest['name']}/{$migration}";
            if (!file_exists($filePath)) {
                throw new \RuntimeException("Migration file not found: $migration");
            }
        }
    }

    protected function checkPhpVersion(string $required): bool
    {
        $required = str_replace('>=', '', $required);
        return version_compare(PHP_VERSION, $required, '>=');
    }

    protected function checkLaravelVersion(string $required): bool
    {
        $required = str_replace('>=', '', $required);
        return version_compare(app()->version(), $required, '>=');
    }

    public function parse(string $manifestPath): array
    {
        if (!file_exists($manifestPath)) {
            throw new \RuntimeException("Manifest file not found: $manifestPath");
        }

        $content = file_get_contents($manifestPath);
        $manifest = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException("Invalid JSON in manifest: " . json_last_error_msg());
        }

        $this->validate($manifest);

        return $manifest;
    }

    public function parseFromString(string $jsonContent): array
    {
        $manifest = json_decode($jsonContent, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException("Invalid JSON: " . json_last_error_msg());
        }

        $this->validate($manifest);

        return $manifest;
    }
}
