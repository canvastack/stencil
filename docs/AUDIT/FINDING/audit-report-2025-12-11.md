# Audit Integrasi Data Stencil (11 Des 2025)

## Ringkasan Eksekutif
- Backend sudah terhubung penuh ke PostgreSQL (multi-tenant schema), public & tenant API menggunakan Eloquent dan filter tenant.
- Frontend **masih mengizinkan mock/fallback**: `VITE_USE_MOCK_DATA` default `true` membuat layanan produk/halaman di admin tetap memakai mock; public API punya fallback ke mock bila API gagal.
- Konten publik bisa dikelola lewat admin (TenantContentService) tetapi fallback/fallback cache bisa menutupi ketidakterpenuhan data DB.
- Isolasi multi-tenant ditegakkan lewat middleware (domain/subdomain/header/path), search_path schema tenant, dan route terpisah platform/tenant.

## Metodologi Singkat
- Baca kode nyata (bukan dokumentasi) pada backend routes/controllers, middleware multi-tenant, frontend services/hooks, serta konfigurasi env.
- Fokus empat pertanyaan audit: (1) sumber data backend, (2) sumber data frontpages publik, (3) kemampuan admin mengelola data publik, (4) pemisahan data multi-tenant.

## Temuan per Pertanyaan

### 1) Backend: Postgres vs mock/hardcode
- Public Product API (`backend/app/Http/Controllers/Api/V1/Public/ProductController.php`) memakai Eloquent `Product` + filter tenant; tidak ada mock.
- Public Content API (`Api/V1/Public/ContentController`) baca `PlatformPage` dari DB; hanya fallback ke mock konten bila page tidak ada.
- Tenant Content API (`backend/app/Http/Controllers/Tenant/ContentController.php`) CRUD penuh via `TenantContentService`, respons JSON dengan UUID dan timestamp.
- Kesimpulan: backend sudah DB-first; mock hanya sebagai fallback konten platform saat data kosong.

### 2) Frontpages publik: API vs mock/hardcode
- `publicProductsService` hardcode `USE_MOCK=false` → mencoba `/public` API, tapi fallback ke mock JSON saat error.
- `productsService` (dipakai banyak komponen) mengikuti `VITE_USE_MOCK_DATA`; default env `true` ⇒ di environment tanpa override akan **selalu** pakai mock dan tidak menulis DB.
- `pages.ts` (admin) juga `USE_MOCK` bila env bukan `false` ⇒ konten halaman admin bisa tetap mock jika env tidak disetel.
- `ContentContext` & `usePageContent` untuk publik: panggil anonymous API `/public/content/...`; jika gagal, isi fallback hardcode (mock) sehingga halaman publik tetap tampil walau DB kosong.
- Kesimpulan: front masih campuran API+mock; perlu memaksa produksi ke API dan mematikan fallback untuk mendeteksi kegagalan.

### 3) Pengelolaan data publik via admin panel
- Tenant Content Controller menyediakan CRUD/publish/archive/update content → dapat mengelola konten publik dari admin.
- Frontend admin untuk konten/prod bergantung pada `VITE_USE_MOCK_DATA`; jika tidak di-set ke `false`, perubahan admin tidak pernah menyentuh API (hanya mock in-memory).
- Produk publik: public API sudah ada, namun front publik memakai fallback; bila backend down/empty, pengguna melihat mock statis.
- Kesimpulan: secara arsitektur sudah bisa dikelola via admin, tetapi konfigurasi env & fallback bisa membuat data nyata tidak tersimpan atau tidak terlihat.

### 4) Pemisahan data & multi-tenant (CRUD admin vs view publik)
- Middleware `TenantContextMiddleware` identifikasi tenant via domain/subdomain, header `X-Tenant-ID/X-Tenant-Slug`, atau path; menolak tenant non-aktif & cross-tenant access; set `makeCurrent()` untuk schema switching.
- Routes dipisah: `platform.php` (Account A) vs `tenant.php` (Account B); public routes mendukung tenantSlug.
- Content/public API filter `tenant_id`; public product endpoints punya varian global dan per-tenant.
- Kesimpulan: mekanisme isolasi sudah ada dan aktif; risiko utama bukan kebocoran data tapi fallback/mock yang bisa menyajikan konten generik lintas tenant bila DB kosong.

## Risiko & Gap
- **Mock default aktif** (`VITE_USE_MOCK_DATA` true) → admin & beberapa hook produk/halaman tidak pernah menyentuh API/DB; data bisa hilang saat deploy.
- **Fallback konten** di public & content context menutupi kegagalan API; user bisa melihat konten generic yang bukan milik tenant.
- **Ketergantungan env**: perlu memastikan `VITE_API_URL`/`VITE_PUBLIC_API_URL` menunjuk ke backend multi-tenant; jika salah akan memicu fallback.
- **Lintasan error tak terlapor**: publicProductsService menelan error dan langsung fallback ke mock; tidak ada alert/log produksi.

## Rekomendasi Aksi Cepat (prioritas tinggi)
1) Set env produksi: `VITE_USE_MOCK_DATA=false`, `VITE_API_URL` & `VITE_PUBLIC_API_URL` ke endpoint backend yang benar; matikan mock di pipeline build.
2) Nonaktifkan fallback ke mock pada public/products & content untuk lingkungan produksi (atau hanya izinkan fallback di dev) + tambah logging/alert.
3) Seed/isi `PlatformPage` dan konten tenant utama (home, products, about, faq, contact) agar tidak memicu fallback.
4) Tambah check di CI: gagal build/test jika `VITE_USE_MOCK_DATA` tidak `false` pada profile production.
5) Perketat respons public: jika DB kosong, tampilkan error/maintenance page bukan mock generic lintas tenant.

## Bukti Kode Kunci
- Backend Product API: `backend/app/Http/Controllers/Api/V1/Public/ProductController.php` (query Eloquent + filter tenant).
- Backend Content API: `backend/app/Http/Controllers/Api/V1/Public/ContentController.php` (DB first, mock fallback), `backend/app/Http/Controllers/Tenant/ContentController.php` (CRUD DB).
- Middleware isolasi: `backend/app/Infrastructure/Presentation/Http/Middleware/TenantContextMiddleware.php`.
- Front services: `src/services/api/products.ts` (USE_MOCK env), `src/services/api/pages.ts`, `src/services/api/publicProducts.ts` (fallback mock), `src/contexts/ContentContext.tsx` & hooks `usePageContent`, `usePublicProducts` (fallback behavior).

## Catatan Lanjut
- Pertimbangkan menambahkan health-check UI yang menolak render bila sumber data masih mock.
- Perlu audit lanjutan untuk state management admin (Redux/Zustand) guna memastikan perubahan konten/prod disimpan ke API setelah mock dimatikan.
