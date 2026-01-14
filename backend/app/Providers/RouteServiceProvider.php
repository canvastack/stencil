<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use App\Models\InstalledPlugin;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api/v1')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            $this->loadPluginRoutes();
        });
    }

    protected function loadPluginRoutes(): void
    {
        \Log::info("🚀 loadPluginRoutes() called - Starting dynamic plugin route loading");
        
        try {
            $activePlugins = InstalledPlugin::where('status', 'active')
                ->whereNotNull('manifest')
                ->get();

            \Log::info("📦 Found active plugins", ['count' => $activePlugins->count()]);

            foreach ($activePlugins as $plugin) {
                $manifest = $plugin->manifest;
                $pluginBasePath = dirname(base_path());
                
                if (isset($manifest['routes']['api'])) {
                    $apiRoutePath = str_replace('/', DIRECTORY_SEPARATOR, $manifest['routes']['api']);
                    $routeFile = $pluginBasePath . DIRECTORY_SEPARATOR . 
                        implode(DIRECTORY_SEPARATOR, ['plugins', $plugin->plugin_name, $apiRoutePath]);
                    
                    if (file_exists($routeFile)) {
                        \Log::info("✅ Loading plugin API routes", ['plugin' => $plugin->plugin_name, 'file' => $routeFile]);
                        Route::middleware('api')
                            ->prefix('api/v1')
                            ->group($routeFile);
                    } else {
                        \Log::warning("❌ Plugin route file not found", ['plugin' => $plugin->plugin_name, 'file' => $routeFile]);
                    }
                }

                if (isset($manifest['routes']['web'])) {
                    $webRoutePath = str_replace('/', DIRECTORY_SEPARATOR, $manifest['routes']['web']);
                    $routeFile = $pluginBasePath . DIRECTORY_SEPARATOR . 
                        implode(DIRECTORY_SEPARATOR, ['plugins', $plugin->plugin_name, $webRoutePath]);
                    
                    if (file_exists($routeFile)) {
                        \Log::info("✅ Loading plugin web routes", ['plugin' => $plugin->plugin_name, 'file' => $routeFile]);
                        Route::middleware('web')
                            ->group($routeFile);
                    }
                }
            }
            
            \Log::info("✨ Plugin route loading completed successfully");
        } catch (\Exception $e) {
            \Log::error("💥 Failed to load plugin routes", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
