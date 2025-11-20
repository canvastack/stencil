# Development Server Setup Guide

Panduan untuk menjalankan frontend (Vite) dan backend (Laravel) secara bersamaan dalam development.

## 📋 Prerequisites

- **Node.js** v16+ dengan npm
- **PHP** v8.1+ dan Composer
- **Git** (untuk version control)

## 🚀 Quick Start

### Opsi 1: npm scripts (Recommended)

Jalankan kedua server dengan satu command:

```bash
npm run dev:all
```

Atau gunakan alias:

```bash
npm run dev:both
```

### Opsi 2: Custom CLI Command (npx)

```bash
npx canvastencil start servers
```

## 📌 Available Commands

### Running Both Servers

```bash
# npm script
npm run dev:all
npm run dev:both

# OR dengan custom CLI
npx canvastencil start servers
```

### Running Frontend Only

```bash
npm run dev:frontend

# OR
npx canvastencil start servers --frontend
```

### Running Backend Only

```bash
npm run dev:backend

# OR
npx canvastencil start servers --backend
```

### Development Mode with Enhanced Debugging

```bash
# Both servers with dev mode enabled (strict React checks, debug tools)
npx canvastencil start servers --dev

# Frontend only with dev mode
npx canvastencil start servers --frontend --dev

# Backend only with dev mode
npx canvastencil start servers --backend --dev
```

**Dev Mode Features:**
- Frontend: `VITE_DEV_MODE=true` untuk akses development tools
- Backend: `APP_DEBUG=true` untuk enhanced error reporting
- Strict React checks dan validation enabled
- Additional debugging information dalam console

### Help

```bash
npx canvastencil start servers --help
```

## 🌐 Server URLs

Ketika kedua server berjalan:

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:8000`

## ⚙️ Configuration

### Frontend (Vite)

Konfigurasi frontend ada di `vite.config.ts`:

```typescript
// Configurasi Vite untuk dev server
// Port default: 5173
// Mode: hot reload enabled
```

### Backend (Laravel)

Konfigurasi backend ada di `.env`:

```bash
# backend/.env
APP_URL=http://localhost:8000
APP_PORT=8000
```

## 🔧 Manual Setup (Alternative)

Jika ingin menjalankan server secara manual di terminal terpisah:

### Terminal 1 (Frontend)

```bash
npm run dev:frontend
# atau
npm run dev
```

### Terminal 2 (Backend)

```bash
cd backend
npm run serve
# atau
php artisan serve
```

## 📝 Output Example

Ketika menggunakan `npm run dev:all`:

```
> npm run dev:all

[FRONTEND] VITE v5.4.19  ready in 123 ms
[FRONTEND] 
[FRONTEND] ➜  Local:   http://localhost:5173/
[FRONTEND] ➜  press h to show help

[BACKEND] INFO  Server running on [http://127.0.0.1:8000].
[BACKEND] 
[BACKEND]   Press Ctrl+C to stop the server
```

## 🛑 Stopping Servers

Ketika menggunakan `npm run dev:all` atau `npx canvastencil start servers`:

Tekan `Ctrl+C` di terminal - ini akan otomatis stop kedua server.

Jika menggunakan terminal terpisah, tekan `Ctrl+C` di masing-masing terminal.

## 🐛 Troubleshooting

### Error: "Port already in use"

**Frontend port 5173:**

```bash
# Kill process pada port 5173
lsof -ti:5173 | xargs kill -9

# Atau run dengan port custom
npm run dev:frontend -- --port 5174
```

**Backend port 8000:**

```bash
# Kill process pada port 8000
lsof -ti:8000 | xargs kill -9

# Atau di backend/.env ubah APP_PORT
php artisan serve --port 8001
```

### Error: "Cannot find module 'concurrently'"

```bash
npm install --save-dev concurrently
```

### PHP Command Not Found

Pastikan PHP sudah di PATH environment:

```bash
php --version
```

Jika tidak, tambahkan PHP folder ke PATH atau gunakan full path ke php executable.

## 🚦 Development Workflow

1. **Mulai servers:**

   ```bash
   npm run dev:all
   ```

2. **Frontend development** di `http://localhost:5173`
   - Changes secara otomatis hot reload

3. **Backend development** di `backend/`
   - Edit files dan server akan auto reload (jika ada file watcher)

4. **Testing API**:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:8000`
   - Postman/Insomnia: `http://localhost:8000/api/v1/...`

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Laravel Documentation](https://laravel.com/docs)
- [npm Documentation](https://docs.npmjs.com/)
