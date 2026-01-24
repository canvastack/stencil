<?php

namespace App\Providers;

use App\Contracts\PluginRepositoryInterface;
use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use App\Domain\Content\Repositories\TenantPageRepositoryInterface;
use App\Domain\Settings\Repositories\SettingsRepositoryInterface;
use App\Domain\Review\Repositories\ReviewRepositoryInterface;
use App\Domain\TenantConfiguration\Services\SSLProviderInterface;
use App\Infrastructure\Repositories\PlatformPageRepository;
use App\Infrastructure\Repositories\TenantPageRepository;
use App\Infrastructure\Persistence\Repositories\SettingsRepository;
use App\Infrastructure\Persistence\Repositories\ReviewEloquentRepository;
use App\Infrastructure\Adapters\LetsEncryptAdapter;
use App\Repositories\PluginRepository;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Observers\ProductObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Plugin System Repository Binding
        $this->app->bind(PluginRepositoryInterface::class, PluginRepository::class);
        
        // Content Management Repository Bindings
        $this->app->bind(PlatformPageRepositoryInterface::class, PlatformPageRepository::class);
        $this->app->bind(TenantPageRepositoryInterface::class, TenantPageRepository::class);
        
        // Settings Repository Binding
        $this->app->bind(SettingsRepositoryInterface::class, SettingsRepository::class);
        
        // Review Repository Binding
        $this->app->bind(ReviewRepositoryInterface::class, ReviewEloquentRepository::class);
        
        // SSL Provider Binding
        $this->app->bind(SSLProviderInterface::class, LetsEncryptAdapter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Product::observe(ProductObserver::class);
        
        // Register plugin service providers and namespaces after database is ready
        $this->registerPluginServiceProviders();
        $this->registerPluginNamespaces();
    }
    
    protected function registerPluginServiceProviders(): void
    {
        \Log::info("🔌 registerPluginServiceProviders() called");
        
        try {
            $activePlugins = \App\Models\InstalledPlugin::where('status', 'active')
                ->whereNotNull('manifest')
                ->get();

            \Log::info("📦 Found active plugins for service provider registration", ['count' => $activePlugins->count()]);

            foreach ($activePlugins as $plugin) {
                $manifest = $plugin->manifest;
                
                if (isset($manifest['service_providers']) && is_array($manifest['service_providers'])) {
                    foreach ($manifest['service_providers'] as $providerClass) {
                        if (class_exists($providerClass)) {
                            $this->app->register($providerClass);
                            \Log::info("✅ Registered plugin service provider", [
                                'plugin' => $plugin->plugin_name,
                                'provider' => $providerClass
                            ]);
                        } else {
                            \Log::warning("❌ Plugin service provider class not found", [
                                'plugin' => $plugin->plugin_name,
                                'provider' => $providerClass
                            ]);
                        }
                    }
                }
            }
            
            \Log::info("✨ Plugin service provider registration completed");
        } catch (\Exception $e) {
            \Log::error("💥 Failed to register plugin service providers", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }

    protected function registerPluginNamespaces(): void
    {
        \Log::info("🔧 registerPluginNamespaces() called - Starting plugin namespace registration");
        
        try {
            $activePlugins = \App\Models\InstalledPlugin::where('status', 'active')
                ->whereNotNull('manifest')
                ->get();

            \Log::info("📦 Found active plugins for namespace registration", ['count' => $activePlugins->count()]);

            foreach ($activePlugins as $plugin) {
                $pluginBasePath = dirname(base_path());
                $pluginPath = $pluginBasePath . DIRECTORY_SEPARATOR . 
                    implode(DIRECTORY_SEPARATOR, ['plugins', $plugin->plugin_name, 'src']);
                
                if (is_dir($pluginPath)) {
                    $namespace = $this->getPluginNamespace($plugin->plugin_name);
                    $pluginsPrefixNamespace = 'Plugins\\' . $namespace;
                    
                    \Log::info("✅ Registering plugin namespace", [
                        'plugin' => $plugin->plugin_name,
                        'namespace' => $pluginsPrefixNamespace,
                        'path' => $pluginPath
                    ]);
                    
                    spl_autoload_register(function ($class) use ($pluginsPrefixNamespace, $pluginPath, $plugin) {
                        if (strpos($class, $pluginsPrefixNamespace) === 0) {
                            $relativeClass = substr($class, strlen($pluginsPrefixNamespace));
                            $file = $pluginPath . DIRECTORY_SEPARATOR . str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';
                            
                            if (file_exists($file)) {
                                \Log::debug("📥 Autoloading plugin class", [
                                    'plugin' => $plugin->plugin_name,
                                    'class' => $class,
                                    'file' => $file
                                ]);
                                require $file;
                            }
                        }
                    });
                } else {
                    \Log::warning("❌ Plugin src directory not found", [
                        'plugin' => $plugin->plugin_name,
                        'path' => $pluginPath
                    ]);
                }
            }
            
            \Log::info("✨ Plugin namespace registration completed");
        } catch (\Exception $e) {
            \Log::error("💥 Failed to register plugin namespaces", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    protected function getPluginNamespace(string $pluginName): string
    {
        return str_replace('-', '', ucwords($pluginName, '-')) . '\\';
    }
}
