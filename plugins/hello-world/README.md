# Hello World Plugin

Demo plugin untuk testing plugin infrastructure CanvaStencil.

## Features

- ✅ Plugin manifest validation
- ✅ Multi-tenant migration support
- ✅ Dynamic route registration
- ✅ Permission system integration

## Installation

```bash
# Via Tinker
php artisan tinker
>>> $manager = app(App\Services\PluginManager::class);
>>> $manager->install('tenant-uuid-here', 'hello-world');
```

## API Endpoints

- `GET /api/hello` - Basic hello message
- `GET /api/hello/info` - Plugin information

## Uninstallation

```bash
# Via Tinker
php artisan tinker
>>> $manager = app(App\Services\PluginManager::class);
>>> $manager->uninstall('tenant-uuid-here', 'hello-world', true);
```

## License

MIT
