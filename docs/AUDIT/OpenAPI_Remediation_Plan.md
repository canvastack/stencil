# OpenAPI Remediation Plan (RBAC, Examples, 429, Number Format)

Tanggal: 2025-11-15
Penulis: Qodo (AI)

Tujuan
- Melengkapi empat temuan audit tanpa mengganggu semantik API:
  1) RBAC (scopes/x-permissions) terdokumentasi di setiap operation
  2) Response/Request examples tersedia untuk operasi utama
  3) 429 RateLimitExceeded distandardisasi di endpoint publik/sensitif
  4) Format angka diselaraskan (double/multipleOf) untuk menghilangkan peringatan IDE

Catatan Penting
- Implementasi dilakukan bertahap per berkas (multi-commit) agar mudah ditinjau dan rollback.
- Tidak mengubah model bisnis/domain; hanya dokumentasi & konsistensi spesifikasi.

1) RBAC (x-permissions) — Standar & Pemetaan
1.1. Konvensi
- Gunakan vendor extension x-permissions: [string]
- Bentuk nama permission: <domain>.<aksi>
  - domain: modul atau subdomain (inventory, doc, media, suppliers, licensing, settings, seo, language, theme, plugins, users, vendors, orders, products, faq, homepage, contact, reviews, customers)
  - aksi: read, list, create, update, delete, approve, evaluate, export, import, search, analytics
- Permission minimal per operasi:
  - list/read/get: <domain>.read (atau <domain>.list untuk listing besar)
  - create/post: <domain>.create
  - update/put/patch: <domain>.update
  - delete/delete: <domain>.delete
  - approve/evaluate: <domain>.approve / <domain>.evaluate
  - export/import: <domain>.export / <domain>.import
  - search: <domain>.search
  - analytics: <domain>.analytics
- Operasi public (tanpa auth): tidak perlu x-permissions (tetap dokumentasikan security: [] dan RateLimitExceeded 429 bila relevan).

1.2. Pemetaan per modul (contoh representatif)
- documentation (doc.*): doc.list, doc.read, doc.create, doc.update, doc.delete, doc.search, doc.analytics
- media (media.*): media.upload, media.read, media.list, media.update, media.delete, media.move, media.transform, media.analytics, media.tag.manage, media.folder.manage
- inventory (inventory.*): inventory.dashboard.read, inventory.item.{list,read,create,update,delete}, inventory.location.{list,create}, inventory.movement.{list,create,approve}, inventory.adjustment.list, inventory.alert.{list,acknowledge}, inventory.count.list, inventory.reservation.list, inventory.report.{lowstock,valuation}
- suppliers (suppliers.*): suppliers.{list,read,create,update,delete}, suppliers.contact.{list,create,read,update,delete}, suppliers.product.{list,create,read,update,delete}, suppliers.quotation.{list,create,read,update,delete,evaluate}, suppliers.approve
- licensing/platform (licensing.*): licensing.platform.{create,update,validate,install}, licensing.tenant.{create,read,update}, licensing.analytics
- Modul lain mengikuti pola read/list/create/update/delete sesuai endpoint.

1.3. Contoh penyisipan
- Di setiap operation YAML:
  operationId: getInventoryItem
  security:
    - bearerAuth: []
  x-permissions:
    - inventory.item.read

2) Examples — Kebijakan & Cakupan
2.1. Kebijakan
- Setiap operasi utama harus memiliki minimal satu requestBody.examples (jika ada request body) dan minimal satu responses.<code>.content.*.examples atau example.
- Gunakan data yang mencerminkan domain nyata (UUID, tanggal ISO, nilai desimal yang wajar).

2.2. Prioritas cakupan
- POST/PUT/PATCH (create/update) pada modul:
  - documentation, media, inventory, suppliers, products, orders, plugins, theme, users
- GET detail (read) yang sering dipakai front/back-office.
- Endpoint bulk (import/export) — minimal satu contoh.

2.3. Format penulisan
- requestBody.content.application/json.examples.<nama> { summary, value }
- responses.'200'.content.application/json.examples.<nama> { summary, value }
- Untuk response dengan allOf, contoh di layer teratas (menurut prasyarat tooling)

3) 429 RateLimitExceeded — Standardisasi
3.1. Komponen terpusat
- Gunakan $ref: '#/components/responses/RateLimitExceeded' (sudah tersedia di components/responses.yaml)
- Tambahkan header rate limit (jika tersedia di components/headers: X-RateLimit-Limit/Remaining/Reset). Jika belum, ekstensi minimal: documentasikan via x-rateLimitNotes.

3.2. Endpoint target (prioritas)
- Endpoint public: /public/documentation/* (GET), help ticket public (POST)
- Endpoint read-heavy: documentation search, knowledge base list, user guides list (opsional)
- Pola penambahan di setiap operation (contoh):
  responses:
    '429':
      $ref: '#/components/responses/RateLimitExceeded'

4) Number Format — Standar
4.1. Aturan umum
- Ganti format: decimal → format: double (menghilangkan warning IDE)
- Tambahkan multipleOf untuk bidang uang/persentase agar lebih presisi untuk UI/validator:
  - Uang (price/fee/cost/amount/value): multipleOf: 0.01
  - Persentase (uptime_sla, usage_alert_threshold): multipleOf: 0.01
  - Overage_rate/precision tinggi: multipleOf: 0.0001

4.2. Target awal (prioritas)
- openapi/schemas/platform/platform-licensing.yaml — kolom monetary & percentage
- openapi/schemas/content-management/suppliers.yaml — kolom price/amount/rating (degan desimal)
- openapi/schemas/content-management/inventory.yaml — kolom cost/quantity/value (jika memakai decimal)
- openapi/schemas/content-management/media.yaml — ukuran file/persentase jika menggunakan decimal (opsional)

4.3. Contoh penyesuaian
- Sebelum:
  monthly_price:
    type: number
    format: decimal
    minimum: 0
- Sesudah:
  monthly_price:
    type: number
    format: double
    minimum: 0
    multipleOf: 0.01

- Sebelum:
  uptime_sla:
    type: number
    format: decimal
    minimum: 90.00
    maximum: 100.00
- Sesudah:
  uptime_sla:
    type: number
    format: double
    minimum: 90.0
    maximum: 100.0
    multipleOf: 0.01

5) Rencana Implementasi Bertahap
5.1. Tahap 1 — RBAC & 429 Public
- Tambahkan x-permissions ke semua operasi di modul: documentation, media, inventory, suppliers, platform-licensing (paths terkait)
- Tambahkan '429': $ref RateLimitExceeded ke endpoint public/sensitif: /public/documentation/*, /documentation/search, /help/tickets (public), endpoint list heavy.

5.2. Tahap 2 — Examples
- Tambahkan examples pada request/response operasi utama (CRUD & bulk) di modul: documentation, media, inventory, suppliers. Pastikan minimal satu contoh untuk setiap kombinasi method+status umum ('200'/'201'/'400'/'404').

5.3. Tahap 3 — Number Format
- Lakukan penggantian format di schema target sesuai 4.2, disertai multipleOf di bidang uang/persentase.

5.4. Tahap 4 — Konsolidasi & Review
- Jalankan validator internal dan linter IDE.
- Review acak endpoint untuk konsistensi x-permissions vs arsitektur RBAC.
- Tambahkan contoh tambahan pada modul lain jika masih 0%.

6) Checklist Eksekusi
- [ ] RBAC x-permissions ditambahkan di setiap operation (modul prioritas)
- [ ] 429 RateLimitExceeded tersisip di endpoint public/sensitif (modul prioritas)
- [ ] Examples request/response tersedia pada operasi utama (modul prioritas)
- [ ] format: decimal → double, multipleOf diterapkan di monetary/percentage
- [ ] Validator PASS + lint IDE bersih

7) Catatan Integrasi
- x-permissions tidak mengubah mekanisme auth; hanya dokumentasi. Backend gateway/ACL harus menegakkan policy aktual.
- RateLimitExceeded 429 perlu selaras dengan reverse proxy/gateway (header X-RateLimit-* jika digunakan).

8) Lampiran — Contoh Patch YAML
- Penambahan x-permissions (di operation):
  x-permissions:
    - inventory.item.read

- Penambahan 429 (responses):
  responses:
    '429':
      $ref: '#/components/responses/RateLimitExceeded'

- Example response sederhana:
  responses:
    '200':
      description: OK
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/BaseResponse'
          examples:
            ok:
              summary: Successful response
              value:
                success: true
                data: {}
