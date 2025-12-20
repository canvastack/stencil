# WebSocket Setup Guide

## Overview

WebSocket real-time collaboration untuk Product Catalog sudah diimplementasikan di frontend, tapi masih disabled secara default karena backend WebSocket server belum disetup.

## Status Implementasi

### ✅ Frontend (SELESAI)
- `useProductWebSocket` hook sudah implementasi lengkap
- `productWebSocketService` dengan heartbeat & reconnection logic
- Event handling untuk: `product.created`, `product.updated`, `product.deleted`, `product.bulk_updated`
- Toast notifications untuk multi-user collaboration
- Auto-refresh product list saat ada perubahan
- Konfigurasi enable/disable via environment variable

### ⏳ Backend (BELUM SETUP)
- Laravel WebSockets package: **Belum terinstall**
- Broadcasting configuration: `BROADCAST_DRIVER=log` (perlu diganti)
- WebSocket server: **Tidak running**

## Cara Enable/Disable

### Disable (Default - Saat Ini)
```env
# .env
VITE_ENABLE_WEBSOCKET=false
```

### Enable
```env
# .env
VITE_ENABLE_WEBSOCKET=true
```

**CATATAN:** Enable WebSocket hanya setelah backend server sudah running, jika tidak akan muncul error koneksi di console.

## Setup WebSocket Server (Backend)

### Option 1: Laravel Reverb (Recommended untuk Laravel 10+)

```bash
# 1. Install Laravel Reverb
cd backend
composer require laravel/reverb --with-all-dependencies

# 2. Publish konfigurasi
php artisan vendor:publish --tag=reverb-config

# 3. Update .env backend
BROADCAST_DRIVER=reverb
REVERB_APP_ID=canvastack
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8000
REVERB_SCHEME=http

# 4. Start Reverb server
php artisan reverb:start
```

### Option 2: Laravel WebSockets (Alternative)

```bash
# 1. Install package
cd backend
composer require beyondcode/laravel-websockets

# 2. Publish config & migrations
php artisan vendor:publish --provider="BeyondCode\LaravelWebSockets\WebSocketsServiceProvider" --tag="migrations"
php artisan migrate

php artisan vendor:publish --provider="BeyondCode\LaravelWebSockets\WebSocketsServiceProvider" --tag="config"

# 3. Update .env backend
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=canvastack
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
PUSHER_APP_CLUSTER=mt1

# 4. Start WebSocket server
php artisan websockets:serve
```

### Option 3: Soketi (External Server)

```bash
# 1. Install Soketi globally
npm install -g @soketi/soketi

# 2. Create soketi.json config
{
  "debug": true,
  "host": "0.0.0.0",
  "port": 6001,
  "app_manager.driver": "array",
  "apps": [
    {
      "id": "canvastack",
      "key": "your-app-key",
      "secret": "your-app-secret",
      "max_connections": 100,
      "enable_client_messages": true
    }
  ]
}

# 3. Start Soketi
soketi start --config=soketi.json

# 4. Update backend .env
BROADCAST_DRIVER=pusher
PUSHER_APP_ID=canvastack
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_HOST=127.0.0.1
PUSHER_PORT=6001
PUSHER_SCHEME=http
```

## Backend Event Broadcasting

Setelah WebSocket server running, perlu implementasi broadcasting events di Laravel:

### 1. Create Product Event

```php
// app/Events/ProductUpdated.php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $productId;
    public $tenantId;
    public $userId;
    public $userName;

    public function __construct($productId, $tenantId, $userId, $userName)
    {
        $this->productId = $productId;
        $this->tenantId = $tenantId;
        $this->userId = $userId;
        $this->userName = $userName;
    }

    public function broadcastOn()
    {
        return new Channel("products.{$this->tenantId}");
    }

    public function broadcastAs()
    {
        return 'product.updated';
    }

    public function broadcastWith()
    {
        return [
            'productId' => $this->productId,
            'userId' => $this->userId,
            'userName' => $this->userName,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
```

### 2. Dispatch Events dari Controller

```php
// app/Http/Controllers/ProductController.php

use App\Events\ProductUpdated;
use App\Events\ProductCreated;
use App\Events\ProductDeleted;

public function update(Request $request, $id)
{
    $product = Product::findOrFail($id);
    $product->update($request->all());

    // Broadcast event
    broadcast(new ProductUpdated(
        $product->id,
        tenant('uuid'),
        auth()->id(),
        auth()->user()->name
    ));

    return response()->json($product);
}
```

### 3. Route untuk WebSocket (routes/web.php)

```php
use BeyondCode\LaravelWebSockets\Facades\WebSocketsRouter;

WebSocketsRouter::webSocket('/ws', \App\Http\Controllers\WebSocketController::class);
```

## Testing

### 1. Start Backend Server
```bash
cd backend
php artisan serve
```

### 2. Start WebSocket Server
```bash
# Reverb
php artisan reverb:start

# Atau WebSockets
php artisan websockets:serve

# Atau Soketi
soketi start --config=soketi.json
```

### 3. Start Frontend
```bash
cd ../
npm run dev
```

### 4. Update Frontend .env
```env
VITE_ENABLE_WEBSOCKET=true
```

### 5. Test Real-time
1. Buka browser tab 1: http://localhost:5173/admin/products/catalog
2. Buka browser tab 2: http://localhost:5173/admin/products/catalog
3. Di tab 1, edit/hapus product
4. Di tab 2, harus muncul notifikasi toast dan list auto-refresh

## Troubleshooting

### Error: NS_ERROR_WEBSOCKET_CONNECTION_REFUSED
**Cause:** WebSocket server tidak running  
**Fix:** Start WebSocket server (reverb/websockets/soketi)

### Error: CORS policy blocked
**Fix:** Update backend config/cors.php untuk allow WebSocket connections

### Koneksi terputus terus-menerus
**Check:**
1. Firewall tidak block port WebSocket
2. Heartbeat interval sesuai (default 30s)
3. Browser tidak limit WebSocket connections

### Events tidak trigger di frontend
**Check:**
1. Channel name sesuai: `products.{tenant_id}`
2. Event name sesuai: `product.created`, `product.updated`, dll
3. Backend broadcasting sudah dispatch events

## Performance Considerations

- **Heartbeat:** 30s interval (configured di `productWebSocketService.ts`)
- **Reconnection:** Max 5 attempts dengan exponential backoff
- **Cleanup:** Proper disconnect saat component unmount (verified di Issue #6)
- **Memory:** No memory leaks (verified di code review)

## Security

- WebSocket URL includes `tenant_id` dan `user_id` sebagai query params
- Backend harus validate tenant access
- Implement authentication via token/session
- Rate limiting untuk prevent spam events

## Production Deployment

### Frontend
```env
VITE_ENABLE_WEBSOCKET=true
VITE_WEBSOCKET_URL=wss://yourdomain.com/ws
```

### Backend
- Setup SSL/TLS untuk wss:// (production)
- Use process manager (supervisor/pm2) untuk keep WebSocket server running
- Load balancing untuk high traffic
- Monitor WebSocket connections & memory usage

## Resources

- [Laravel Reverb Docs](https://laravel.com/docs/10.x/reverb)
- [Laravel WebSockets](https://beyondco.de/docs/laravel-websockets)
- [Soketi](https://docs.soketi.app/)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## Implementation Timeline

- ✅ Frontend WebSocket client (Completed)
- ✅ Environment configuration toggle (Completed)
- ⏳ Backend WebSocket server setup (Pending)
- ⏳ Laravel event broadcasting (Pending)
- ⏳ Production deployment (Pending)

---

**Last Updated:** December 20, 2025  
**Status:** Frontend ready, backend pending setup
