# Audit Integrasi Frontend–Backend & Multi-Tenancy

Tanggal: 10 Desember 2025
Penulis: Azad (assistant)
Scope: Backend Laravel + Frontend React (public pages & admin)

## Ringkasan Eksekutif
- **Backend**: Klien platform/tenant sudah memaksa header tenant & token; tidak ditemukan penggunaan mock di layer klien utama. Namun beberapa service utilitas (error/performance) masih mock-only.
- **Frontend publik**: Produk publik diarahkan ke API nyata, tetapi fallback ke mock bila API gagal. Konten halaman publik menggunakan API anon, namun memiliki fallback hardcoded (platform & tenant). Flag `VITE_USE_MOCK_DATA` default `true` sehingga mock bisa aktif jika digunakan di modul lain.
- **Pengelolaan via admin**: ContentContext mendukung update lewat API platform/tenant; tetapi beberapa service (productPageContent) masih TODO/hardcoded fetch sehingga belum terintegrasi penuh dengan admin/backend.
- **Multi-tenant**: Klien tenant menyetel `X-Tenant-ID`/`X-Tenant-Slug`; ContentContext & publicProducts memisahkan slug tenant. Fallback ke konten platform dapat menyebabkan kebocoran pengalaman (bukan data) jika API tenant gagal, namun tidak terlihat kebocoran data sensitif.

## Temuan per Pertanyaan

### 1) Backend: API ke PostgreSQL vs mock/hardcode
- Klien tenant (`tenantApiClient`) menambahkan header auth + `X-Tenant-ID`/`X-Tenant-Slug` dan tidak memanggil mock; semua request diarahkan ke API basis data. (src/services/api/tenantApiClient.ts l42-57)
- Klien platform (`platformApiClient`) serupa untuk akun platform. (src/services/api/platformApiClient.ts l42-52)
- Klien anon (`anonymousApiClient`) memanggil endpoint publik dengan fallback konten lokal bila 404/500; fallback bukan DB. (src/services/api/anonymousApiClient.ts l135-220)
- Service utilitas error/performance masih mock-only melalui `mockApiCall`. (src/services/api/errorReporting.ts l66-236; src/services/api/performance.ts l51-292)
- Kesimpulan: Endpoint utama CRUD sudah diarahkan ke API/DB, namun ada modul non-kritis masih mock dan anon fallback yang tidak menyentuh DB.

### 2) Frontend publik: API vs mock/hardcode
- **Produk publik**: `publicProductsService` default `USE_MOCK = false`, panggil `/public[/tenant]/products` lalu transformasi; jika API gagal → fallback mock dataset. (src/services/api/publicProducts.ts l6,78-199)
- **Konten halaman**: `ContentContext` untuk user anonymous memanggil `anonymousApiClient.getPlatformContent` atau `getTenantContent`; jika gagal → fallback konten statis. (src/contexts/ContentContext.tsx l120-149)
- **Flag global**: `VITE_USE_MOCK_DATA` default `true` di envConfig, berpotensi mengaktifkan mock di modul yang menggunakannya. (src/config/env.config.ts l61-63)
- **Service product page content** masih TODO / fetch dummy `/api/products/page-content` tanpa klien resmi atau tenant context. (src/services/productPageContent.ts l5-36)
- **Hook useAnonymousContent** cache + fallback; tidak menjamin data berasal dari backend. (src/hooks/useAnonymousContent.ts l95-132)
- Kesimpulan: Produk publik sudah diarahkan ke API tapi masih fallback ke mock; konten halaman publik punya fallback hardcoded sehingga belum 100% tersandarkan pada DB.

### 3) Apakah data publik bisa dikelola penuh via admin panel?
- Admin platform/tenant dapat memanggil API konten melalui `ContentContext` (updatePageContent -> platformApiClient/tenantApiClient). (src/contexts/ContentContext.tsx l181-207)
- Namun konten produk (product page content) belum terhubung API resmi (masih TODO). (src/services/productPageContent.ts l5-36)
- Fallback statis di sisi anonim berarti jika API/DB tidak tersedia, perubahan admin tidak tercermin di publik.
- Kesimpulan: Sebagian besar halaman CMS bisa dikelola, tapi ada celah: konten produk & fallback statis mengurangi jaminan bahwa publik selalu menampilkan data dari admin/DB.

### 4) Pemisahan data admin CRUD vs public view (multi-tenant)
- Tenant client selalu menyetel `X-Tenant-ID` & slug + memvalidasi account_type=tenant. (src/services/api/tenantApiClient.ts l42-57,86-116)
- Public products menerima optional tenantSlug → hit `/public/{tenant}/products` dan fallback bila error. (src/services/api/publicProducts.ts l78-118)
- ContentContext menyusun slug tenant dan memanggil endpoint tenant untuk public routes; jika gagal, fallback konten tenant default. (src/contexts/ContentContext.tsx l53-149)
- Risiko: fallback platform/tenant lokal bisa menampilkan konten default yang bukan milik tenant, tapi tidak men-query DB tenant lain; isolasi data inti tetap terjaga.

## Risiko & Dampak
- **Consistent data**: Fallback mock/hardcode dapat membuat publik menampilkan data yang tidak dikelola admin → misalignment.
- **Operasional**: Flag `VITE_USE_MOCK_DATA` default true berpotensi menyalakan mock di build dev/prod jika tidak diubah.
- **Observability**: Error/performance reporting tidak mengirim ke backend; metrik tidak real.
- **Product content service**: Belum multi-tenant aware; potensial memukul endpoint generik atau gagal total.

## Rekomendasi Teknis
1) Set `VITE_USE_MOCK_DATA=false` di environment staging/prod; audit seluruh modul yang membaca flag tersebut.
2) Nonaktifkan fallback mock untuk produk publik di prod (pertimbangkan konfigurasi `USE_MOCK` via env, default false, fallback mock hanya di dev).
3) Hardening konten publik:
   - Tangani 404 dengan pesan error, bukan konten statis; atau hanya gunakan fallback bila `APP_ENV=development`.
   - Log & surface kegagalan API ke observability agar dev mengetahui ketika konten jatuh ke fallback.
4) Lengkapi `productPageContentService` memakai `tenantApiClient`/`platformApiClient` dengan header tenant & slug; hapus TODO fetch generic.
5) Migrasi service utilitas (errorReporting/performance) ke endpoint backend atau matikan di prod.
6) Tambah tes E2E untuk memastikan halaman publik (home, products, product detail) memanggil API publik dan tidak menyertakan string mock (mis. id `prod-001`).

## Checklist Implementasi
- [ ] `VITE_USE_MOCK_DATA` di .env.production diset `false`.
- [ ] Konversi fallback konten anonim menjadi dev-only atau opt-in.
- [ ] Integrasi penuh product page content ke API tenant/platform.
- [ ] Matikan/porting service mock utilitas ke backend.
- [ ] Tambah regression test E2E untuk publik & admin (produk, pages) memastikan sumber data = API.

## Bukti Singkat (lokasi kode)
- Flag mock: src/config/env.config.ts l61-63
- Produk publik API + fallback mock: src/services/api/publicProducts.ts l6,78-199
- Konten anonim + fallback: src/contexts/ContentContext.tsx l120-149; src/hooks/useAnonymousContent.ts l95-132
- Tenant headers: src/services/api/tenantApiClient.ts l42-57
- Product page content belum diintegrasikan: src/services/productPageContent.ts l5-36
- Utilitas mock-only: src/services/api/errorReporting.ts l66-236; src/services/api/performance.ts l51-292

## Kesimpulan
Arsitektur klien sudah menyiapkan jalur API multi-tenant, namun masih ada fallback mock/hardcoded di jalur publik dan beberapa service pendukung. Untuk memastikan seluruh data publik berasal dari PostgreSQL via backend, perlu mematikan mock secara default, menyelesaikan service yang masih TODO, dan menambah verifikasi E2E agar fallback tidak aktif di lingkungan produksi.
