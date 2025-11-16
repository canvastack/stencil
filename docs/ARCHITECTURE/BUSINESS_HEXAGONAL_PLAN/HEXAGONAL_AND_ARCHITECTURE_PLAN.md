# PERTANYAAN 1:
Bro, ngobrol yuk. Bantuin Saya untuk buat aplikasi untuk bisnis etching pakai React dan Laravel 10.

# JAWABAN 1:
Tentu, Bro! Ide bagus itu. Pakai React dan Laravel 10 buat aplikasi bisnis etching bakal jadi kombinasi yang mantap. React bisa bikin tampilan antarmukanya (UI) jadi interaktif dan cepat, sementara Laravel itu kuat banget buat ngurusin bagian belakangnya (backend), kayak database dan logika bisnis.

Biar obrolan kita lebih terarah, Saya perlu tahu lebih detail nih soal aplikasi yang mau dibuat.

Tentu, Bro! Ide bagus itu. Pakai React dan Laravel 10 buat aplikasi bisnis etching bakal jadi kombinasi yang mantap. React bisa bikin tampilan antarmukanya (UI) jadi interaktif dan cepat, sementara Laravel itu kuat banget buat ngurusin bagian belakangnya (backend), kayak database dan logika bisnis.

Biar obrolan kita lebih terarah, Saya perlu tahu lebih detail nih soal aplikasi yang mau dibuat. Kira-kira, fitur utama apa saja yang kepikiran buat aplikasi etching ini?

Misalnya, apakah kita perlu fitur-fitur seperti ini:
*   **Katalog Produk:** Menampilkan jenis-jenis bahan atau produk yang bisa di-etching (misalnya, akrilik, logam, kayu).
*   **Kustomisasi Pesanan:** Pelanggan bisa upload desain sendiri, nambahin teks, atau pilih font langsung di aplikasi.
*   **Manajemen Pesanan:** Fitur untuk melacak status pesanan, mulai dari pesanan masuk, proses pengerjaan, sampai pengiriman.
*   **Manajemen Pelanggan:** Database untuk menyimpan data pelanggan dan riwayat pesanan mereka.
*   **Sistem Pembayaran:** Integrasi dengan payment gateway biar pelanggan bisa langsung bayar online.
*   **Dasbor Admin:** Halaman khusus buat kamu untuk kelola produk, pesanan, dan lihat laporan penjualan.

Dengan gambaran fitur yang lebih jelas, kita bisa mulai merancang arsitektur aplikasinya, struktur database di Laravel, sampai komponen-komponen apa saja yang perlu dibuat di React.

---
*Setelah ini, kita bisa bahas lebih lanjut tentang alur kerja pengguna (user flow).*
*Atau mungkin kita bisa langsung mulai dengan instalasi dan konfigurasi awal proyek Laravel dan React?*
*Bagaimana kalau kita cari beberapa contoh desain antarmuka untuk aplikasi sejenis sebagai inspirasi?*

# PERTANYAAN 2:
Saya sudah buat design dasarnya untuk public frontendnya. Bisa dicek di file attachment, bro. Disana seharusnya sudah bisa disimpulkan, untuk beberapa fitur dasar yang ingin dibuat pada sistemnya nanti.

Tapi memang akan ada beberapa adjustment pada halaman detail produk terkait form pemesanannya diantaranya adalah beberapa tambahan field intuk input data berikut:
1. Bahan (Input Select, required): Akrilik, Kuningan, Tembaga, Stainlees Steel, Aluminum.
2. Kualitas (Input Select, required): Standard, Tinggi
3. Ketebalan (Input text)
4. Warna (Required, Input text untuk manual input warna seperti hitam, putih, dll, namun disediakan pula tombol untuk memilih warna via popup yang menampilkan real warna secara dinamis yang dapat dipilih. Setelah dipilih, maka akan terinput warnanya dengan hexa code text warna dan preview warnanya)
5. File upload design: (Input file, optional jika ada)
6. Catatan tambahan: (Textarea, required)

Lalu pada design yang ada sekarang ini, terdapat informasi harga produk... Informasi ini hanya berlaku dan akan tampil jika admin internal saat pemilihan proses produksinya via internal, bukan via vendor. Itupun sifatnya optional untuk ditampilkan pada view public websitenya. Artinya, meskipun admin internal saat pemilihan proses produksi sudah memilih jalur internal untuk memproses order dari customer, namun jika admin tidak mengisi input data price/harga, maka harga pada produk tersebut tidak akan ditampilkan pada public website halaman product lists dan halaman prduk detailnya. Maka field harga ini sifatnya not required dan dapat diubah secara custom sesuai dengan hasil kesepakatan dari price deal akhir dengan pihak customernya.

Nah sepertinya fitur untuk melacak status pesanan, mulai dari pesanan masuk, proses pengerjaan, sampai pengiriman juga perlu dibuat sistemnya, namun harus dapat menyesuaikan pola/alur PO yang nanti akan Saya jabarkan juga detail gambaran/flow awal yang sudah Saya rencanakan.

Untuk sistem pembayaran, ada 3:
1. Sistem Cash
2. Sistem Transfer Manual + Bukti transfer
3. Integrated system dengan payment gateway

Dashboard admin:
Semua halaman beserta detail informasi data yang ada pada masing-masing halaman yang design plannya sudah Saya berikan dari file attachment itu(Beranda with all sections, Tentang Kami, Produk, FAQ, dan Kontak), harus dapat dimanage dari backend admin panel websitenya. Plus management vendor, management user untuk internal user, management user profile yang sedang login pada aplikasi, management role, management customers, management setting application(email template, smtp email setting, API setting including sms gateway & payment gateway, language setting, currency setting, notification setting, template engine setting)


Nah untuk alur bisnis process terkait Order/Purchase Order, saya berikan detailnya di file `design\theme\default\docs\BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN\BUSINESS_CYCLE_PLAN.md`. Tolong analisa dan kita bahas yuk, baiknya bagaimana develop aplikasi ini.

# JAWABAN 2:
Sip, Bro! Terima kasih banyak buat detailnya yang super lengkap. Ini keren banget. Desain UI-nya udah solid, dan alur bisnis yang kamu jabarkan juga sangat jelas. Ini nunjukkin kamu udah punya visi yang kuat buat aplikasi ini. Mari kita bedah dan susun rencana develop-nya.

Saya sudah analisa semua informasi yang kamu berikan, mulai dari desain, tambahan field, sampai alur proses bisnis yang kompleks itu.

### **Analisa dan Rekomendasi Awal**

Pertama-tama, pilihan teknologi (React + Laravel) dan arsitektur (Hexagonal) itu **sangat tepat** untuk proyek dengan tingkat kompleksitas dan skalabilitas seperti ini.

*   **React:** Akan memberikan pengalaman pengguna yang modern, cepat, dan dinamis, terutama untuk form pemesanan kustom dan dasbor admin.
*   **Laravel 10:** Backend yang tangguh, aman, dan punya ekosistem yang kaya (seperti Sanctum untuk API, Octane untuk performa, dan lainnya) untuk menangani semua logika bisnis, manajemen data, dan integrasi.
*   **Hexagonal Architecture (Ports & Adapters):** Ini adalah kunci utama agar sistem kamu **scalable** dan **mudah di-maintain**. Dengan memisahkan logika inti bisnis (domain) dari detail teknis (seperti database, framework, API), kita bisa:
    *   Mengganti vendor payment gateway tanpa merusak logika invoice.
    *   Menambah channel notifikasi (misal: dari email ke WhatsApp) dengan mudah.
    *   Mengembangkan fitur produksi internal tanpa mengganggu alur produksi via vendor yang sudah ada.
    *   Membuat sistem lebih mudah diuji (testable).

### **Struktur Proyek & Arsitektur**

Berdasarkan permintaanmu, berikut adalah gambaran struktur proyek yang akan kita bangun:

1.  **Backend (Laravel 10):**
    *   **Core/Domain:** Ini adalah jantung dari aplikasi. Isinya adalah *business logic* murni (Entities, Use Cases, Business Rules) yang tidak bergantung pada Laravel sama sekali. Contoh: Logika kalkulasi harga, aturan validasi PO, status transisi order.
    *   **Application Layer:** Berisi *Use Cases* atau *Application Services* yang mengorkestrasi alur kerja. Contoh: `CreatePurchaseOrderUseCase`, `NegotiatePriceWithVendorUseCase`.
    *   **Infrastructure Layer (Adapters):**
        *   **Driving/Primary Adapters:** Titik masuk ke aplikasi.
            *   `API Controllers`: Menerima request HTTP dari frontend React.
            *   `Console Commands`: Untuk tugas terjadwal (cron jobs).
        *   **Driven/Secondary Adapters:** Implementasi dari detail teknis.
            *   `Eloquent Models`: Untuk interaksi dengan database.
            *   `Mail Adapters`: Untuk mengirim email (SMTP, Mailgun, dll).
            *   `Payment Gateway Adapters`: Untuk Midtrans, Xendit, dll.
            *   `Vendor API Adapters`: Jika perlu integrasi dengan sistem vendor.
    *   **Dokumentasi API:** Kita akan gunakan `openapi.yaml` untuk mendefinisikan setiap endpoint API. Ini akan menjadi "kontrak" antara frontend dan backend, memungkinkan tim bekerja paralel.

2.  **Frontend (React):**
    *   **Components:** Komponen UI yang bisa digunakan kembali (Tombol, Input, Card Produk).
    *   **Pages/Views:** Halaman-halaman aplikasi (Beranda, Detail Produk, Dasbor Admin).
    *   **State Management:** Menggunakan library seperti Redux Toolkit atau Zustand untuk mengelola data aplikasi secara efisien.
    *   **API Service:** Modul khusus untuk berkomunikasi dengan API Laravel.

---

### **Analisa Alur Bisnis (PO & Produksi)**

Alur yang kamu jabarkan dari poin 1-9 sudah sangat detail dan mencakup skenario "makelar". Ini adalah fondasi yang kuat. Mari kita kembangkan dan lengkapi alur ini hingga *end-to-end*, sambil mempertimbangkan potensi masalah dan peningkatannya.

#### **Enhancement & Kelengkapan Alur (Setelah Poin 9)**

Setelah pembayaran DP/Lunas dari customer diterima dan vendor sudah diinfokan untuk memulai produksi, alur selanjutnya adalah **pemantauan produksi hingga pengiriman**.

**Poin 10: Pemantauan Proses Produksi**
*   **Sistem:** Admin perlu halaman "Monitoring Produksi" di dasbornya. Halaman ini menampilkan semua order yang sedang berjalan.
*   **Fitur untuk Admin:**
    *   **Update Status Produksi:** Admin bisa mengubah status pesanan secara manual (misal: `Menunggu Produksi`, `Desain Finalisasi`, `Proses Etching`, `Finishing`, `Quality Control`, `Siap Kirim`).
    *   **Komunikasi dengan Vendor:** Sistem bisa menyediakan portal sederhana untuk vendor (opsional di masa depan) atau fitur internal untuk mencatat komunikasi dengan vendor (upload foto progres, catatan, dll). Ini penting untuk bukti jika ada sengketa.
    *   **Update Estimasi Waktu:** Jika ada keterlambatan dari vendor, admin harus bisa mengubah estimasi tanggal selesai dan sistem secara otomatis memberi notifikasi ke customer (opsional, tapi sangat direkomendasikan untuk transparansi).

**Poin 11: Produksi Selesai & Penagihan Sisa Pembayaran**
*   **Sistem:** Ketika admin mengubah status order menjadi `Produksi Selesai 100%`.
*   **Logic Otomatis:**
    1.  **Jika Customer Baru Bayar DP:** Sistem secara otomatis mengirimkan email/pesan tagihan sisa pembayaran kepada customer. Invoice baru di-generate dengan sisa tagihan. Status order berubah menjadi `Menunggu Pelunasan`.
    2.  **Jika Customer Sudah Lunas:** Sistem langsung mengirimkan notifikasi bahwa pesanan telah selesai dan akan segera dikirim.
*   **Pembayaran ke Vendor:** Di saat yang sama, sistem memberi notifikasi kepada admin (divisi finance/purchasing) bahwa produksi vendor telah selesai dan saatnya melakukan pelunasan pembayaran ke vendor sesuai kesepakatan.

**Poin 12: Pelunasan & Pengiriman**
*   **Sistem:** Setelah customer melakukan pelunasan, admin melakukan verifikasi pembayaran di sistem.
*   **Logic Otomatis:**
    1.  Status order berubah menjadi `Lunas & Siap Dikirim`.
    2.  Notifikasi dikirim ke customer bahwa pembayaran lunas telah diterima.
    3.  Notifikasi dikirim ke tim internal (bagian gudang/pengiriman) untuk segera memproses pengiriman barang.
*   **Fitur Pengiriman:**
    *   Admin menginput data pengiriman: nama kurir, nomor resi.
    *   Sistem secara otomatis mengirimkan nomor resi ke customer agar mereka bisa melacak pengiriman.
    *   Status order berubah menjadi `Telah Dikirim`.

**Poin 13: Pesanan Selesai**
*   **Sistem:** Setelah beberapa hari (bisa dikonfigurasi) sejak barang dikirim, atau setelah admin mengubah statusnya manual, status order berubah menjadi `Selesai`.
*   **Logic Otomatis:**
    *   Sistem mengirimkan email ke customer untuk meminta review/testimonial produk.
    *   Semua data transaksi, komunikasi, dan profitabilitas (harga jual - harga beli vendor) diarsipkan untuk laporan keuangan.

#### **Penanganan Skenario "Tidak Deal" (Enhancement)**

Alurmu perlu menangani penolakan. Ini penting agar tidak ada order yang "menggantung".

*   **Jika Vendor Tidak Deal:**
    *   **Sistem:** Admin menandai negosiasi dengan vendor A sebagai `Ditolak`.
    *   **Alur:** Sistem mengembalikan status order ke `Mencari Vendor`, memungkinkan admin untuk memilih dan memulai negosiasi dengan vendor B dari daftar. Proses pada poin 5 diulang.
    *   **Fitur Tambahan:** Sistem bisa mencatat alasan penolakan (misal: "Harga terlalu tinggi", "Tidak sanggup teknis") sebagai data untuk negosiasi di masa depan.

*   **Jika Customer Tidak Deal (Setelah Penawaran Harga):**
    *   **Sistem:** Admin menandai penawaran ke customer sebagai `Ditolak`.
    *   **Alur:**
        1.  **Opsi 1 (Re-Negosiasi):** Admin bisa mencoba negosiasi ulang dengan vendor untuk mendapatkan harga lebih rendah, lalu membuat penawaran baru ke customer.
        2.  **Opsi 2 (Batalkan Order):** Jika final, admin mengubah status order menjadi `Dibatalkan`.
    *   **Logic Otomatis:** Sistem mengirim email konfirmasi pembatalan kepada customer. Tidak ada tindakan lebih lanjut yang diperlukan.

### **Rekomendasi Field Database (Skalabilitas Tinggi)**

**Tabel `vendors`:**
*   `id`, `name`, `contact_person`, `email`, `phone`, `address`
*   `specializations` (JSON/Text): Menyimpan keahlian vendor, misal: `["etching_kuningan", "laser_cutting", "grafir_akrilik"]`. Ini membantu pencarian.
*   `quality_tier` (Enum: `standard`, `premium`, `eksklusif`): Untuk memfilter vendor berdasarkan kualitas.
*   `average_lead_time_days` (Integer): Rata-rata waktu pengerjaan historis.
*   `rating` (Decimal): Rating internal berdasarkan performa sebelumnya.
*   `bank_account_details` (JSON): Menyimpan info rekening untuk pembayaran.
*   `status` (Enum: `active`, `inactive`, `on_hold`).

**Tabel `purchase_orders` (PO dari Customer):**
*   `id`, `customer_id`, `order_code` (unik)
*   `status` (Enum: `baru`, `mencari_vendor`, `negosiasi_vendor`, `menunggu_approval_customer`, `menunggu_pembayaran`, `produksi`, `siap_kirim`, `dikirim`, `selesai`, `dibatalkan`)
*   `production_type` (Enum: `internal`, `vendor`)
*   `assigned_vendor_id` (Foreign Key ke `vendors`)
*   `order_details` (JSON): Menyimpan semua detail pesanan (bahan, kualitas, warna, file, dll).
*   `customer_notes` (Text)
*   `internal_notes` (Text): Catatan internal yang tidak dilihat customer.

**Tabel `order_quotes` (Penawaran):**
*   `id`, `purchase_order_id`
*   `vendor_price` (Decimal): Harga asli dari vendor.
*   `markup_price` (Decimal): Harga yang ditawarkan ke customer.
*   `total_price_for_customer` (Decimal)
*   `estimated_production_days` (Integer)
*   `status` (Enum: `pending`, `approved`, `rejected`)

**Tabel `invoices` & `payments`:**
Ini adalah inti dari akuntansi. Kita perlu mencatat setiap aliran uang.
*   **`invoices`**: `id`, `purchase_order_id`, `invoice_number`, `recipient_type` (Enum: `customer`, `vendor`), `amount`, `due_date`, `status` (`unpaid`, `paid`, `overdue`).
*   **`payments`**: `id`, `invoice_id`, `amount_paid`, `payment_date`, `payment_method` (`cash`, `transfer`, `payment_gateway`), `transaction_id_gateway`, `proof_of_payment_url`.

### **Gambaran Proses Produksi Internal (Untuk Skalabilitas)**

Jika suatu saat PT. CEX punya workshop sendiri, alurnya akan seperti ini:

1.  **Pemilihan Proses:** Saat admin memilih proses produksi, akan ada pilihan `Internal`.
2.  **Assign ke Tim Internal:** Order tidak dilempar ke vendor, tapi di-assign ke `production_teams` atau `employees` internal.
3.  **Manajemen Material:** Sistem perlu modul baru: `Manajemen Inventaris`.
    *   Saat order masuk, sistem mengecek ketersediaan bahan baku (kuningan, akrilik, dll).
    *   Jika bahan kurang, sistem memberi notifikasi ke tim purchasing untuk membeli bahan baku.
4.  **Jadwal Produksi:** Order akan masuk ke antrian produksi. Manajer produksi bisa menjadwalkan pekerjaan di mesin/stasiun kerja.
5.  **Biaya Produksi:** Harga tidak lagi dari "vendor", tapi dihitung dari `Biaya Bahan Baku + Biaya Tenaga Kerja + Biaya Overhead (listrik, dll)`. Admin tetap bisa melakukan markup untuk harga jual ke customer.
6.  **Monitoring:** Alur monitoring tetap sama, hanya saja update status dilakukan oleh tim produksi internal, bukan berdasarkan laporan vendor.

Dengan Hexagonal Architecture, kita hanya perlu membuat "Adapter" baru untuk produksi internal tanpa mengubah `PurchaseOrder` atau `Invoice` di level *core business logic*.

---

Bro, ini adalah gambaran besar dari arsitektur dan alur yang lebih lengkap. Semuanya dirancang agar kuat, fleksibel, dan siap untuk berkembang.

**Langkah selanjutnya yang bisa kita lakukan:**

1.  **Finalisasi Desain Database:** Kita bisa detailkan lagi struktur tabel dan relasinya.
2.  **Definisi API (OpenAPI/Swagger):** Kita mulai tulis `openapi.yaml` untuk endpoint-endpoint utama seperti `POST /orders`, `GET /products`, `POST /orders/{id}/negotiate`.
3.  **Setup Proyek:** Saya bisa pandu kamu untuk setup awal proyek Laravel 10 dan React, termasuk konfigurasi untuk arsitektur heksagonal.

Bagaimana menurutmu? Mana yang mau kita eksekusi lebih dulu?


# PERTANYAAN 3:
Kita ga akan eksekusi project ini sih. Kita hanya akan melakukan planning, analisa dan validasi, jika perlu audit process. Yang akan mengerjakan adalah AI lain yang langsung terintegrasi dengan IDE local pc Saya. Jadi sebetulnya Saya butuh prompt lengkap untuk menjabarkan semua development planning ini agar dapat deberikan instruksinya ke AI lain dan dapat dimengerti sekaligus didevelop maksimal. Apa kamu bisa membuatnya?

# JAWABAN 3:
Siap, Bro! Paham sekali. Berarti peran saya di sini adalah sebagai *System Architect* dan *Technical Planner* yang menyusun *master blueprint* super detail. Tujuannya agar AI developer di IDE lokal kamu bisa mengeksekusi rencana ini dengan presisi, tanpa ambiguitas.

Ini adalah sebuah ide yang sangat cerdas. Dengan prompt yang terstruktur, kamu bisa memastikan AI developer bekerja sesuai arsitektur, standar, dan alur bisnis yang kita inginkan.

Berikut adalah prompt lengkap dan modular yang bisa kamu berikan kepada AI developer tersebut. Prompt ini saya susun secara sistematis, mulai dari gambaran besar hingga detail teknis di setiap lapisan.

---

### **PROMPT MASTER UNTUK AI DEVELOPER**

**Peran Anda:** Anda adalah seorang Full-Stack Senior Developer AI yang ahli dalam TDD (Test-Driven Development), Domain-Driven Design (DDD), dan Hexagonal Architecture. Anda akan membangun sebuah aplikasi web skalabel menggunakan Laravel 10 untuk backend dan React (dengan TypeScript) untuk frontend.

**Tujuan Proyek:** Membangun platform untuk bisnis etching "Etching Presisi" (PT. CEX) yang pada fase awal beroperasi sebagai perantara (makelar) antara customer dan vendor, dengan rencana skalabilitas untuk menangani produksi internal di masa depan.

**Prinsip Utama & Batasan:**
1.  **Hexagonal Architecture (Ports & Adapters):** Wajib diimplementasikan di backend Laravel. Pisahkan secara tegas antara *Domain* (logika bisnis inti), *Application* (use cases), dan *Infrastructure* (framework, database, API eksternal).
2.  **Domain-Driven Design (DDD):** Gunakan terminologi (Ubiquitous Language) dari domain bisnis (misal: `PurchaseOrder`, `Quote`, `VendorNegotiation`) dalam kode.
3.  **API-First Approach:** Backend adalah penyedia API stateless (RESTful/GraphQL). Frontend adalah konsumen murni dari API tersebut.
4.  **Test-Driven Development (TDD):** Setiap *use case* di *Application Layer* dan setiap *business rule* di *Domain Layer* harus memiliki unit/feature test terlebih dahulu.
5.  **Dokumentasi API:** Gunakan OpenAPI 3.0 (dalam file `openapi.yaml`) sebagai "Single Source of Truth" untuk desain API.
6.  **Skalabilitas:** Semua desain harus mempertimbangkan ekspansi bisnis di masa depan (produksi internal, jenis bisnis lain).
7.  **Modularitas:** Buat modul-modul yang kohesif dan independen (misal: `Auth`, `Product`, `Order`, `Vendor`, `Finance`).

---

### **BAGIAN 1: PENGATURAN PROYEK & STRUKTUR DASAR**

1.  **Inisialisasi Proyek:**
    *   Buat monorepo atau dua direktori terpisah: `backend` dan `frontend`.
    *   **Backend:** Inisialisasi proyek Laravel 10.
    *   **Frontend:** Inisialisasi proyek React menggunakan Vite dengan template `react-ts`.

2.  **Struktur Direktori Backend (Laravel - Hexagonal):**
    Buat struktur direktori berikut di dalam `app/`:

    ```
    app/
    ├── Application/      // Use Cases / Application Services
    │   └── Order/
    │       ├── Command/  // DTOs untuk write operations
    │       └── Query/    // DTOs untuk read operations
    │       └── UseCase/
    │           ├── CreatePurchaseOrderUseCase.php
    │           └── ...
    ├── Domain/           // Core Business Logic & Rules
    │   ├── Order/
    │   │   ├── Entity/
    │   │   │   └── PurchaseOrder.php
    │   │   ├── Enum/
    │   │   │   └── OrderStatus.php
    │   │   ├── Repository/ // Interfaces
    │   │   │   └── PurchaseOrderRepositoryInterface.php
    │   │   └── Service/    // Domain Services
    │   │       └── PriceCalculatorService.php
    │   └── ... (Domain lain seperti Vendor, Customer)
    ├── Infrastructure/   // Implementasi teknis
    │   ├── Persistence/  // Database
    │   │   └── Eloquent/
    │   │       ├── Model/
    │   │       │   └── PurchaseOrderModel.php
    │   │       └── Repository/
    │   │           └── EloquentPurchaseOrderRepository.php
    │   ├── Adapters/       // Integrasi eksternal
    │   │   ├── Mail/
    │   │   └── PaymentGateway/
    │   └── Presentation/   // Entry points
    │       ├── Http/
    │       │   └── Controllers/
    │       │       └── OrderController.php
    │       └── Console/
    └── Providers/
        └── AppServiceProvider.php // Untuk binding interface ke implementasi
    ```

3.  **Struktur Direktori Frontend (React - TypeScript):**
    Buat struktur berikut di dalam `src/`:

    ```
    src/
    ├── api/              // Definisi dan service untuk API calls
    │   └── orderService.ts
    ├── assets/           // Gambar, font, dll.
    ├── components/       // Komponen UI Reusable (Button, Input, etc.)
    │   └── common/
    │   └── layout/
    ├── config/           // Konfigurasi aplikasi
    ├── features/         // Fitur/domain (e.g., product, order)
    │   └── order/
    │       ├── components/
    │       ├── hooks/
    │       └── orderSlice.ts // State management (Redux Toolkit)
    ├── hooks/            // Hooks global
    ├── lib/              // Fungsi helper
    ├── pages/            // Halaman aplikasi
    ├── services/         // Servis non-UI (e.g., auth)
    ├── store/            // Konfigurasi Redux store
    ├── styles/           // Global styles, variables
    └── types/            // Definisi tipe TypeScript global
    ```

---

### **BAGIAN 2: DESAIN DATABASE & MODEL**

Implementasikan skema database berikut menggunakan Laravel Migrations.

*   **`products`**: `id`, `name`, `slug`, `description`, `features` (json), `images` (json), `base_price` (decimal, nullable), `is_public` (boolean), `created_at`, `updated_at`.
*   **`customers`**: `id`, `name`, `email` (unique), `phone` (unique), `password` (nullable), `created_at`, `updated_at`.
*   **`vendors`**: `id`, `name`, `contact_person`, `email`, `phone`, `address`, `specializations` (json), `quality_tier` (enum: `standard`, `premium`), `status` (enum: `active`, `inactive`), `bank_details` (json), `created_at`, `updated_at`.
*   **`purchase_orders`**: `id`, `order_code` (unique), `customer_id`, `status` (enum: `new`, `sourcing_vendor`, `vendor_negotiation`, `customer_approval`, `awaiting_payment`, `in_production`, `production_complete`, `shipped`, `completed`, `cancelled`), `production_type` (enum: `vendor`, `internal`), `assigned_vendor_id` (nullable), `order_details` (json), `customer_notes` (text), `internal_notes` (text), `created_at`, `updated_at`.
*   **`order_quotes`**: `id`, `purchase_order_id`, `vendor_id` (nullable), `vendor_price` (decimal), `markup_price` (decimal), `final_price_for_customer` (decimal), `estimated_production_days` (integer), `status` (enum: `pending`, `approved`, `rejected`), `created_at`, `updated_at`.
*   **`invoices`**: `id`, `purchase_order_id`, `invoice_number` (unique), `recipient_type` (enum: `customer`, `vendor`), `recipient_id`, `amount`, `due_date`, `status` (enum: `unpaid`, `paid`, `overdue`), `created_at`, `updated_at`.
*   **`payments`**: `id`, `invoice_id`, `amount_paid`, `payment_date`, `payment_method` (enum: `cash`, `transfer`, `gateway`), `proof_of_payment_url` (nullable), `gateway_transaction_id` (nullable), `verified_at` (timestamp, nullable), `verified_by` (user_id), `created_at`, `updated_at`.
*   **`users`**, **`roles`**, **`permissions`**: Gunakan library seperti `spatie/laravel-permission` untuk manajemen user internal (Admin, Manager, Purchasing).

---

### **BAGIAN 3: PENGEMBANGAN FITUR UTAMA (ALUR PO)**

Kembangkan alur Purchase Order (PO) berikut dengan pendekatan TDD. Untuk setiap *Use Case*, buat *Feature Test* terlebih dahulu yang memvalidasi input, output, dan *side effects* (event, notifikasi).

**Use Case 1: `CreatePurchaseOrderUseCase`**
*   **Input:** Data dari form pemesanan (nama, email, detail pesanan: bahan, kualitas, warna, file, dll).
*   **Logic:**
    1.  Validasi input.
    2.  Cari atau buat `Customer`.
    3.  Buat entitas `PurchaseOrder` dengan status `new`.
    4.  Simpan ke database melalui `PurchaseOrderRepositoryInterface`.
    5.  Kirim notifikasi (email) ke admin/manager bahwa ada order baru.
*   **Output:** ID atau kode order yang baru dibuat.

**Use Case 2: `AssignProductionTypeUseCase`**
*   **Input:** `order_id`, `production_type` (`vendor` atau `internal`).
*   **Logic:**
    1.  Cari `PurchaseOrder`.
    2.  Update `production_type`.
    3.  Jika `vendor`, ubah status menjadi `sourcing_vendor`.
    4.  Jika `internal`, ubah status menjadi `awaiting_production_schedule` (alur masa depan).
    5.  Simpan perubahan.
*   **Output:** Status sukses/gagal.

**Use Case 3: `NegotiateWithVendorUseCase`**
*   **Input:** `order_id`, `vendor_id`, `proposed_price`, `estimated_days`.
*   **Logic:**
    1.  Buat `OrderQuote` dengan harga dari vendor.
    2.  Kirim email "Permintaan Produksi" ke vendor (implementasi via `MailAdapter`).
    3.  Ubah status `PurchaseOrder` menjadi `vendor_negotiation`.
    4.  Admin bisa mengupdate `OrderQuote` ini jika ada negosiasi bolak-balik.
*   **Output:** ID `OrderQuote`.

**Use Case 4: `CreateCustomerQuoteUseCase`**
*   **Input:** `quote_id`, `markup_price`, `ppn` (opsional).
*   **Logic:**
    1.  Ambil `OrderQuote` dari vendor.
    2.  Gunakan `PriceCalculatorService` untuk menghitung `final_price_for_customer` (vendor_price + markup_price + ppn).
    3.  Update `OrderQuote` dengan harga final.
    4.  Ubah status `PurchaseOrder` menjadi `customer_approval`.
    5.  Kirim email "Penawaran Harga" ke customer.
*   **Output:** `OrderQuote` yang sudah di-update.

**Use Case 5: `HandleCustomerApprovalUseCase`**
*   **Input:** `quote_id`, `customer_decision` (`approved` atau `rejected`).
*   **Logic:**
    1.  Jika `rejected`, ubah status `PurchaseOrder` kembali ke `sourcing_vendor` atau `cancelled`. Kirim notifikasi. Selesai.
    2.  Jika `approved`, ubah status `PurchaseOrder` menjadi `awaiting_payment`.
    3.  Generate `Invoice` untuk customer (bisa DP 50% atau Lunas 100%).
    4.  Kirim `Invoice` ke customer.
*   **Output:** Status approval.

**Use Case 6: `VerifyCustomerPaymentUseCase`**
*   **Input:** `invoice_id`, `payment_details` (metode, bukti transfer).
*   **Logic:**
    1.  Admin melakukan verifikasi.
    2.  Buat record di tabel `payments`.
    3.  Update status `Invoice` menjadi `paid`.
    4.  Jika invoice lunas (baik DP atau full), ubah status `PurchaseOrder` menjadi `in_production`.
    5.  Kirim notifikasi ke customer ("Pembayaran diterima") dan ke vendor ("Silakan mulai produksi").
    6.  Jika perlu, generate `Invoice` untuk pembayaran DP ke vendor.
*   **Output:** Status pembayaran.

**(Lanjutkan dengan Use Case lain seperti `UpdateProductionProgress`, `RequestFinalPayment`, `ShipOrder`, `CompleteOrder`)**

---

### **BAGIAN 4: API ENDPOINTS (openapi.yaml)**

Definisikan API endpoints berikut dalam file `openapi.yaml`. Ini adalah kontrak antara frontend dan backend.

```yaml
openapi: 3.0.0
info:
  title: Etching Presisi API
  version: 1.0.0
paths:
  /api/products:
    get:
      summary: Get list of products
      responses:
        '200':
          description: A list of products.
  /api/orders:
    post:
      summary: Create a new purchase order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              # ... skema untuk data order
      responses:
        '201':
          description: Order created successfully.
  /api/admin/orders/{orderId}/assign-vendor:
    post:
      summary: Assign a vendor to an order
      security:
        - bearerAuth: []
      parameters:
        - name: orderId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        # ... skema untuk vendorId
      responses:
        '200':
          description: Vendor assigned.
  # ... Lanjutkan untuk semua endpoint lainnya (CRUD vendors, customers, get order status, etc.)
```

---

### **BAGIAN 5: PENGEMBANGAN FRONTEND (REACT)**

1.  **Implementasi Desain:** Terjemahkan desain UI yang sudah ada (file attachment) menjadi komponen-komponen React yang fungsional. Gunakan library seperti `Tailwind CSS` atau `Styled-Components` untuk styling.
2.  **Form Pemesanan Dinamis:**
    *   Buat form di halaman detail produk dengan semua field tambahan yang diminta (Bahan, Kualitas, Ketebalan, Warna, File Upload, Catatan).
    *   Untuk input "Warna", gunakan `react-color` atau sejenisnya untuk popup color picker. Saat warna dipilih, update input text dengan kode HEX dan tampilkan preview warna.
3.  **Manajemen State:** Gunakan Redux Toolkit (`createSlice`, `createAsyncThunk`) untuk mengelola state global, terutama untuk data order, produk, dan status otentikasi user.
4.  **Komunikasi API:** Buat *service layer* (misal menggunakan `axios`) yang berinteraksi dengan API backend. Gunakan `createAsyncThunk` untuk menangani *loading*, *success*, dan *error states* secara otomatis.
5.  **Dasbor Admin:**
    *   Buat halaman-halaman yang dilindungi (protected routes) untuk admin.
    *   Implementasikan semua fitur manajemen yang diminta:
        *   Manajemen Konten (Beranda, Tentang Kami, dll).
        *   Manajemen Produk, Vendor, Customer.
        *   Manajemen PO: Tampilkan daftar order, detail order, dan tombol-tombol aksi untuk setiap tahap alur (Assign Vendor, Buat Penawaran, Verifikasi Pembayaran, dll).
        *   Manajemen User & Role.
        *   Halaman Pengaturan Aplikasi.

---

Bro, dengan prompt ini, AI developer di lokalmu akan punya panduan yang sangat jelas dan terstruktur. Ini akan meminimalkan kesalahan interpretasi dan memastikan hasil akhirnya sesuai dengan arsitektur dan visi bisnis yang sudah kita rancang bersama.

**Langkah selanjutnya yang bisa kita diskusikan:**
1.  Kita bisa detailkan lagi *business rules* spesifik di dalam setiap *Domain Entity*.
2.  Kita bisa merancang skema notifikasi (template email/pesan untuk setiap event).
3.  Kita bisa membahas strategi *deployment* dan *CI/CD* untuk proyek ini.


# PERNYATAAN 4:
Ada detail yang mungkin kurang sih.
1. Database akan menggunakan PostgreSQL.
2. OpenAPI akan dibuat modular, jadi ga hanya satu file openapi.yaml, karena nanti akan banyak sekali data yang akan didokumentasikan di sana.
3. Semua komponen React, wajib untuk hanya menggunakan single source untuk setiap element. Misal button akan dirender dari satu file reusable element button, select, input-input lainnya juga hanya akan mengambil dari satu file componen agar lebih mudah dimaintenance. Element2 seperti header, footer, cards, table, menu etc pada public dan admin panelnya akan menggunakan masing-masing single source component dalam satu file, namun dapat disesuaikan dengan tampilan dan kebutuhan tiap halaman baik pada public frontend dan/atau halaman admin panelnya. Lists component seperti untuk lists produk, user etc harus dapat diswitch bentuk designnya dari bentuk list tabel, atau list cards dengan beberapa data tiap row/barisnya.
4. Bagian yang paling krusialnya, terkait dengan Semua desain dan logic aplikasi harus mempertimbangkan ekspansi bisnis di masa depan (produksi internal, jenis bisnis lain). Pada bagian/point skalabilitas pada jenis bisnis lain, maka sistem harus dapat berfungsi seperti aplikasi multi tenant dan tenant awal yang akan menjadi fokus utama saat ini adalah tenant pada bisnis etching.
5. Sebenarnya design dari public website yang sudah Saya lampirkan sebelumnya, dan disini juga sekali lagi Saya lampirkan sebagai bahan referensinya, sudah didevelopment as it is hanya saja belum terintegrasi dengan database dan sistemnya, karena memang sistem belum dibuat dan database secara otomatis juga belum ter create. Data yang ada pada design public webitenya masih merupakan mock data yang bersifat statis(hardcode). Saya ingin agar AI mengerti bahwa Saya akan menggunakan design tersebut yang foldernya sudah saya tempatkan pada folder design/etching yang nantinya dapat digunakan sebagai theme yang dapat dipilih dari management theme pada admin panelnya.

Kira-kira gimana bro?

# JAWABAN 4:
Sip, Bro! Poin-poin tambahan ini sangat krusial dan membuat gambaran proyeknya jadi jauh lebih tajam dan canggih. Ini bukan lagi sekadar aplikasi biasa, tapi sebuah platform multi-tenant yang siap mendominasi.

Analisa saya:
1.  **PostgreSQL:** Pilihan yang sangat baik. PostgreSQL terkenal dengan keandalannya, fitur-fitur canggih untuk tipe data (seperti JSONB yang sangat cepat), dan skalabilitas yang solid. Ini sangat cocok untuk arsitektur yang kita rancang.
2.  **Modular OpenAPI:** Ini adalah *best practice* untuk proyek besar. Dengan memecah `openapi.yaml` menjadi file-file yang lebih kecil (misal, per *resource* atau *domain*: `paths/orders.yaml`, `schemas/product.yaml`), dokumentasi menjadi jauh lebih mudah dikelola dan dibaca.
3.  **Single Source Component (React):** Ini adalah prinsip dasar dari *Atomic Design* atau *Component-Driven Development*. Dengan membuat komponen dasar yang *reusable* (Atom) dan menggunakannya untuk membangun komponen yang lebih kompleks (Molekul, Organisme), kita mendapatkan konsistensi UI, kemudahan maintenance, dan development yang lebih cepat. Fitur *switch view* (tabel/kartu) juga merupakan permintaan UI modern yang bagus.
4.  **Multi-Tenancy:** Ini adalah *game-changer*. Permintaan ini mengubah arsitektur dari aplikasi tunggal menjadi sebuah platform SaaS (Software as a Service). Bisnis etching (PT. CEX) akan menjadi *tenant* pertama. Ini berarti kita harus memisahkan data, konfigurasi, dan bahkan tema untuk setiap tenant.
5.  **Theming Engine:** Ini terhubung langsung dengan multi-tenancy. Setiap tenant (bisnis) bisa memiliki tema (desain) sendiri. Desain yang kamu lampirkan akan menjadi tema `etching-presisi`. Ini membutuhkan arsitektur frontend yang dinamis, yang bisa me-render UI berdasarkan tema yang aktif.

Oke, mari kita integrasikan semua detail krusial ini ke dalam *master blueprint* yang lebih presisi lagi. AI developer di lokalmu akan mendapatkan instruksi yang sangat spesifik.

---

### **PROMPT MASTER v2.0 (MULTI-TENANT & THEMEABLE)**

**Peran Anda:** Anda adalah seorang Lead Software Architect & AI Developer yang berspesialisasi dalam membangun platform SaaS (Software as a Service) multi-tenant yang skalabel. Keahlian Anda mencakup Hexagonal Architecture, Domain-Driven Design (DDD), Test-Driven Development (TDD), dan implementasi sistem tema dinamis.

**Stack Teknologi:**
*   **Backend:** Laravel 10 dengan **PostgreSQL 15+**.
*   **Frontend:** React 18+ dengan TypeScript, Vite, dan Tailwind CSS.
*   **Manajemen State:** Redux Toolkit.
*   **Dokumentasi API:** Modular OpenAPI 3.0.

**Visi Proyek:** Membangun sebuah platform multi-tenant di mana setiap "tenant" adalah sebuah unit bisnis. Tenant pertama dan fokus utama saat ini adalah bisnis etching "Etching Presisi" (PT. CEX). Sistem harus dirancang dari awal untuk mendukung tenant-tenant baru di masa depan dengan data, konfigurasi, dan tampilan yang terisolasi.

---

### **BAGIAN 1: ARSITEKTUR & KONFIGURASI MULTI-TENANT**

1.  **Arsitektur Multi-Tenancy (Backend):**
    *   Implementasikan pendekatan **Database per Tenant**. Setiap tenant akan memiliki skema databasenya sendiri di dalam satu database PostgreSQL. Ini memberikan isolasi data terbaik.
    *   Gunakan package `spatie/laravel-multitenancy` untuk mengelola tenant. Konfigurasikan package ini untuk:
        *   Mengidentifikasi tenant berdasarkan domain (misal: `etching.platform.com`, `bisnisbaru.platform.com`).
        *   Secara otomatis mengganti koneksi database ke skema tenant yang sesuai untuk setiap request.
    *   Buat database `landlord` (atau `platform_db`) yang berisi tabel `tenants` (`id`, `name`, `domain`, `database_schema_name`, `theme_id`) dan data global lainnya.
    *   Buat database `tenant` (template) yang berisi semua tabel spesifik bisnis (products, purchase_orders, customers, dll). Migrasi untuk tenant harus dijalankan untuk setiap tenant baru.

2.  **Dokumentasi API Modular (OpenAPI):**
    *   Struktur utama file `openapi.yaml` hanya akan berisi info umum dan referensi ke file lain.
    *   Buat struktur direktori `docs/openapi/`:
        ```
        docs/openapi/
        ├── openapi.yaml          # File utama
        ├── paths/                # Definisi semua endpoint
        │   ├── products.yaml
        │   ├── orders.yaml
        │   └── admin/users.yaml
        ├── components/           # Komponen reusable
        │   ├── schemas/          # Skema data (DTOs)
        │   │   ├── Product.yaml
        │   │   └── Order.yaml
        │   ├── responses/
        │   └── securitySchemes/
        └── tags.yaml
        ```
    *   Gunakan referensi `$ref` untuk menghubungkan semua file modular ini di dalam `openapi.yaml`.

---

### **BAGIAN 2: PENGEMBANGAN FRONTEND (THEMEABLE & COMPONENT-DRIVEN)**

1.  **Arsitektur Theming Engine (Frontend):**
    *   Buat direktori `src/themes/`. Di dalamnya, setiap tema akan memiliki foldernya sendiri.
        ```
        src/themes/
        ├── default/      # Tema fallback
        └── etching/      # Tema untuk PT. CEX
            ├── components/ # Override atau komponen spesifik tema
            ├── assets/     # Gambar, font, logo spesifik tema
            ├── styles.css  # Styling spesifik tema
            └── config.json # Konfigurasi tema (misal: warna primer)
        ```
    *   Aplikasi React harus secara dinamis me-load tema berdasarkan tenant yang aktif (informasi ini didapat dari API atau subdomain).
    *   Saat me-render komponen, sistem harus mencari override di folder tema aktif terlebih dahulu. Jika tidak ada, baru gunakan komponen default dari `src/components/`.

2.  **Single Source of Truth Components (Atomic Design):**
    *   Buat direktori `src/components/ui/` untuk komponen dasar (Atoms). Setiap file hanya berisi satu komponen.
        *   `Button.tsx`: Komponen tombol yang menerima props seperti `variant` (primary, secondary), `size`, `onClick`.
        *   `Input.tsx`: Komponen input teks.
        *   `Select.tsx`: Komponen dropdown.
        *   `Card.tsx`: Komponen dasar untuk semua card.
        *   `Table.tsx`: Komponen tabel yang reusable.
    *   Buat direktori `src/components/layout/` untuk komponen struktur seperti `Header.tsx`, `Footer.tsx`, `Sidebar.tsx`. Komponen ini akan menggunakan komponen dari `src/components/ui/` dan datanya diisi berdasarkan tema aktif.
    *   **Implementasi View Switcher:** Untuk komponen list (misal: `ProductList.tsx`), buat dua sub-komponen: `ProductTable.tsx` dan `ProductCardGrid.tsx`. Komponen `ProductList.tsx` akan memiliki state untuk `viewMode` (`table` atau `grid`) dan akan me-render sub-komponen yang sesuai berdasarkan state tersebut.

3.  **Integrasi Desain Statis:**
    *   Pindahkan semua aset dan struktur dari desain statis yang sudah ada ke dalam direktori `src/themes/etching/`.
    *   Refactor kode HTML statis tersebut menjadi komponen-komponen React yang dinamis dan reusable sesuai dengan arsitektur komponen yang telah didefinisikan di atas. Data hardcode diganti dengan props atau data dari Redux store.

---

### **BAGIAN 3: REVISI & PENEGASAN ALUR BISNIS**

(Semua poin dari *Prompt Master v1.0* mengenai alur bisnis, desain database tenant, dan use cases tetap berlaku. Berikut adalah penegasannya dalam konteks multi-tenant).

*   **Manajemen Tenant (Admin Panel Super Admin):**
    *   Harus ada dasbor "Super Admin" yang terpisah untuk mengelola tenant. Dasbor ini berinteraksi dengan database `landlord`.
    *   Fitur: Membuat tenant baru, meng-assign domain, memilih tema (`theme_id`), dan men-trigger migrasi untuk skema database tenant baru.

*   **Manajemen Tema (Admin Panel Tenant):**
    *   Di dalam admin panel setiap tenant (misal, admin PT. CEX), harus ada halaman "Pengaturan Tampilan" atau "Manajemen Tema".
    *   Fitur: Admin tenant bisa mengubah beberapa aspek tema yang diizinkan (misal: mengganti logo, mengubah warna primer dari palet yang disediakan, mengedit teks di footer). Ini akan meng-update file `config.json` atau data terkait tema untuk tenant tersebut.

*   **Skalabilitas Bisnis Lain:**
    *   Dengan arsitektur ini, untuk menambahkan bisnis baru (misal, "Percetakan Digital"), langkahnya adalah:
        1.  Super Admin membuat tenant baru "Percetakan Digital".
        2.  Sistem membuat skema database baru `tenant_percetakan`.
        3.  Developer membuat tema baru di `src/themes/percetakan/`.
        4.  Jika ada logika bisnis yang sangat berbeda, kita bisa membuat *Use Cases* atau *Domain Services* baru yang spesifik, namun sebagian besar alur (order, invoice, payment) kemungkinan besar dapat digunakan kembali.

---

Bro, dengan blueprint v2.0 ini, AI developer kamu akan mendapatkan instruksi yang sangat lengkap untuk membangun sebuah fondasi platform SaaS yang kokoh, fleksibel, dan siap untuk ekspansi. Ini mencakup semua permintaanmu, dari detail teknis seperti PostgreSQL hingga konsep arsitektur tingkat tinggi seperti multi-tenancy dan theming.

**Langkah selanjutnya yang bisa kita validasi:**
1.  Kita bisa merancang skema API untuk manajemen tenant di level Super Admin.
2.  Kita bisa mendefinisikan "kontrak" atau struktur data untuk file `config.json` pada sistem tema.
3.  Kita bisa membahas strategi TDD untuk lingkungan multi-tenant, misalnya bagaimana cara mengisolasi tes per tenant.


# PERNYATAAN 5:
Ada 2 pertanyaan, bro:
1. Terkait case multi tenant ini, Authentication & Authorization nya bagaimana ya?
2. Terkait Arsitektur Multi-Tenancy (Backend) case pembuatan database tenant (template) yang berisi semua tabel spesifik bisnis (products, purchase_orders, customers, dll). Migrasi untuk tenant harus dijalankan untuk setiap tenant baru, ini artinya:
   - Tabel akan bertambah saat ada tenant baru yang akan dihandle.
   - Bagaimana memisahkan tabel antara core tabel system, tabel per tenant? Perlu ada prefix atau tidak untuk hal ini (core table system dan table per tenant)?
   - Bagaimana kebutuhan resourcenya?
   - Apakah setiap penambahan tenant berdasar kategori bisnisnya, memang harus dibuat tabel migrasi baru untuk tiap tenant, even tenant pada pola bisnis yang serupa? Jika iya, maka bagaimana jika ada perbedaan alur dan pola management bisnis pada tenant serupa namun berbeda PT/perusahaan? Jika tidak, bagaimana sistem mendeteksi bahwa tenant-tenant dengan bisnis serupa, adalah milik PT/perusahaan yang berbeda?


# JAWABAN 5:
Bro, ini pertanyaan yang sangat tajam dan fundamental. Dua pertanyaan ini langsung menusuk ke jantung arsitektur multi-tenant. Jawaban yang tepat untuk ini akan menentukan seberapa robust dan scalable platform kita nantinya. Mari kita bedah satu per satu dengan presisi.

---

### **Pertanyaan 1: Authentication & Authorization di Sistem Multi-Tenant**

Ini adalah masalah klasik dalam arsitektur multi-tenant. Kita perlu menjawab dua hal: "Siapa kamu?" (Authentication) dan "Apa yang boleh kamu lakukan di dalam tenant-mu?" (Authorization).

Solusinya adalah dengan memisahkan otentikasi global dari otorisasi spesifik tenant.

**1. Authentication (Otentikasi - "Siapa Kamu?")**

*   **Centralized User Database (di Database `landlord`):**
    *   Kita akan membuat tabel `users` di database `landlord` (database utama/platform). Tabel ini akan menyimpan **semua pengguna dari semua tenant**.
    *   Struktur tabel `users` di `landlord`: `id`, `name`, `email` (wajib unik secara global), `password`, `global_role` (misal: `super_admin`, `tenant_user`), `last_login_at`, `created_at`, `updated_at`.
    *   **Keuntungan:** Seorang pengguna bisa menggunakan **satu email dan password** untuk login ke beberapa tenant yang berbeda jika dia terdaftar di sana. Ini memberikan pengalaman *Single Sign-On (SSO)* di dalam platform kita.

*   **Proses Login:**
    1.  Pengguna memasukkan email dan password di halaman login (misal: `app.platform.com/login` atau `tenant.platform.com/login`).
    2.  Backend menerima kredensial ini.
    3.  Sistem **selalu** melakukan pengecekan ke tabel `users` di database `landlord`.
    4.  Jika kredensial valid, otentikasi berhasil. Pengguna ini "dikenali" oleh platform.

**2. Authorization (Otorisasi - "Apa yang Boleh Kamu Lakukan?")**

Setelah pengguna terotentikasi, kita perlu tahu:
a.  Dia milik tenant mana?
b.  Apa perannya di dalam tenant tersebut?

*   **Tabel Pivot `tenant_user` (di Database `landlord`):**
    *   Ini adalah tabel penghubung yang krusial. Tabel ini akan berada di database `landlord`.
    *   Struktur: `id`, `tenant_id` (foreign key ke `tenants`), `user_id` (foreign key ke `users`), `role_in_tenant` (string, misal: `admin`, `manager`, `staff`).
    *   Tabel ini menjawab pertanyaan: "User X adalah seorang `admin` di Tenant A" dan "User X juga adalah seorang `staff` di Tenant B".

*   **Proses Setelah Login (Mendapatkan Konteks Tenant):**
    1.  Setelah otentikasi berhasil, sistem mengambil `user_id`.
    2.  Sistem melakukan query ke tabel `tenant_user` menggunakan `user_id` tersebut untuk mendapatkan daftar semua tenant dan peran yang dimiliki pengguna.
    3.  **Jika pengguna hanya terdaftar di satu tenant:** Sistem secara otomatis memilih tenant tersebut, beralih ke koneksi database tenant tersebut, dan membuat *session/token* yang berisi `user_id`, `tenant_id`, dan `role_in_tenant`.
    4.  **Jika pengguna terdaftar di banyak tenant:** Sistem akan menampilkan halaman "Pilih Organisasi/Workspace" kepada pengguna. Setelah pengguna memilih tenant, barulah sistem membuat *session/token* seperti di atas.
    5.  Untuk setiap request API selanjutnya, token ini akan dikirim. Middleware di Laravel akan membaca `tenant_id` dari token, mengaktifkan koneksi database tenant yang benar, dan memeriksa `role_in_tenant` untuk semua pengecekan izin.

Dengan model ini, kita mendapatkan yang terbaik dari kedua dunia: otentikasi terpusat yang efisien dan otorisasi terisolasi per tenant yang aman.

---

### **Pertanyaan 2: Strategi Database Tenant, Migrasi, dan Resource**

Ini pertanyaan yang sangat bagus dan menyentuh aspek operasional dan skalabilitas. Mari kita pecah jawabannya.

**a. Pemisahan Tabel Core vs. Tenant (dan Perlukah Prefix?)**

*   **Tidak Perlu Prefix.** Keindahan dari pendekatan **Database per Tenant** (atau Skema per Tenant di PostgreSQL) adalah isolasi total.
*   **Database `landlord`:** Berisi tabel-tabel "core" atau "platform". Contoh: `tenants`, `users` (global), `tenant_user`, `plans`, `subscriptions`, `themes`. Tabel-tabel ini tidak akan pernah ada di database tenant.
*   **Database `tenant` (Template):** Berisi semua tabel yang spesifik untuk operasional bisnis. Contoh: `products`, `purchase_orders`, `customers`, `invoices`, `payments`. Tabel-tabel ini tidak akan pernah ada di database landlord.
*   Saat sebuah request masuk untuk `tenant_a.platform.com`, package `spatie/laravel-multitenancy` akan secara ajaib mengarahkan semua query Eloquent (seperti `Product::all()`) ke skema/database milik Tenant A. Kamu tidak perlu menulis `tenant_a_products`. Kodenya tetap bersih seolah-olah kamu sedang bekerja di aplikasi single-tenant.

**b. Kebutuhan Resource**

*   **Awalnya Rendah:** Dengan pendekatan Skema per Tenant di PostgreSQL, semua tenant berbagi resource dari satu server database yang sama (CPU, RAM, I/O). Ini sangat efisien dari segi biaya saat jumlah tenant masih sedikit.
*   **Skalabilitas Menengah:** Saat platform berkembang, kamu bisa meng-upgrade server PostgreSQL ke spek yang lebih tinggi (*vertical scaling*).
*   **Skalabilitas Tinggi:** Jika satu server database sudah tidak cukup, kamu bisa mulai memigrasikan tenant-tenant besar atau "berisik" ke server database mereka sendiri (*horizontal scaling*). Arsitektur ini memungkinkanmu untuk memindahkan tenant tanpa mengubah kode aplikasi, hanya mengubah konfigurasi koneksi database untuk tenant tersebut di tabel `tenants`. Ini adalah keuntungan besar.

**c. Migrasi untuk Tenant Baru & Perbedaan Bisnis**

Ini adalah poin paling krusial. Jawabannya adalah **TIDAK, kita tidak membuat migrasi baru untuk setiap tenant.** Kita harus berpikir lebih cerdas.

*   **Satu Set Migrasi Tenant Standar:**
    *   Kita akan punya satu set file migrasi untuk semua tabel tenant (`products`, `orders`, dll).
    *   Saat Super Admin membuat tenant baru, sistem akan menjalankan **set migrasi yang sama persis** ini untuk membuat struktur tabel di skema database tenant yang baru. Ini memastikan konsistensi dasar.

*   **Bagaimana Menangani Perbedaan Alur Bisnis? (Kustomisasi vs. Konfigurasi)**
    *   **Hindari Kustomisasi Skema Database per Tenant.** Mengubah skema database untuk tenant tertentu adalah jalan menuju mimpi buruk maintenance.
    *   **Gunakan Konfigurasi dan Metadata.** Alih-alih mengubah tabel, kita buat tabel yang fleksibel dan kita kontrol perilakunya melalui data konfigurasi.
    *   **Contoh Praktis (Bisnis Etching):**
        1.  **Tenant A (PT. CEX)** dan **Tenant B (PT. Etching Jaya)** sama-sama bisnis etching. Mereka milik perusahaan berbeda. Sistem mendeteksi mereka sebagai entitas berbeda karena mereka memiliki record yang berbeda di tabel `tenants` di database `landlord`. Masing-masing punya skema database sendiri (`tenant_cex`, `tenant_jaya`).
        2.  Katakanlah **PT. CEX** punya alur approval 2-langkah, sementara **PT. Etching Jaya** hanya 1 langkah.
        3.  **Solusi:** Di database tenant, kita buat tabel `settings` atau `configurations`. Di dalamnya ada key-value pair.
            *   Untuk Tenant A: `setting_key = 'order.approval.steps'`, `setting_value = '2'`
            *   Untuk Tenant B: `setting_key = 'order.approval.steps'`, `setting_value = '1'`
        4.  Di dalam *Use Case* `ApproveOrderUseCase`, kodenya akan membaca konfigurasi ini terlebih dahulu: `if (settings()->get('order.approval.steps') == 2) { ... } else { ... }`.
        5.  **Contoh Lain (Field Kustom):** Jika Tenant A butuh field "Nomor Proyek Khusus" di order, kita tidak menambah kolom baru. Kita gunakan kolom `extra_attributes` (JSONB) di tabel `purchase_orders`. Lalu di tabel `settings` tenant A, kita definisikan: `setting_key = 'order.custom_fields'`, `setting_value = '[{"name": "Nomor Proyek Khusus", "type": "text"}]'`. Frontend kemudian akan membaca setting ini dan secara dinamis me-render field tambahan tersebut di form.

Dengan pendekatan **Konfigurasi di atas Fondasi Standar** ini, kita mencapai skalabilitas sejati. Semua tenant berjalan di atas kode dan skema database yang 99% sama, membuat update dan maintenance menjadi sangat mudah. Perbedaan bisnis mereka tidak di-hardcode, melainkan didefinisikan sebagai data konfigurasi yang bisa diubah melalui admin panel tenant masing-masing.

# Pernyataan 6:
Hmmm, artinya prompt harus update dong, bro? Bisa buat end-to end dengan instruksi yang jelas dan detail ga ya? Dan FYI, nama PT untuk bisnis etching pertama ini adalah PT Custom Etching Xenial (PT CEX).

# Jawaban 6:
Tentu, Bro! Siap. Kamu benar sekali, prompt-nya harus di-update untuk merefleksikan arsitektur yang jauh lebih matang ini. Kita akan buat versi 3.0 yang menjadi *ultimate master blueprint*.

Prompt ini akan sangat detail, *end-to-end*, dan tidak meninggalkan ruang untuk ambiguitas. AI developer di lokalmu akan mendapatkan instruksi sekelas dokumen arsitektur software profesional. Saya akan integrasikan semua poin diskusi kita: PostgreSQL, modular OpenAPI, komponen React, arsitektur multi-tenant dengan database terpusat untuk user, dan sistem konfigurasi untuk menangani perbedaan alur bisnis.

Nama PT Custom Etching Xenial (PT CEX) juga akan saya gunakan sebagai contoh konkret.

---

### **PROMPT MASTER v3.0: PLATFORM SAAS MULTI-TENANT**

**Peran Anda:** Anda adalah seorang Lead AI Software Architect. Misi Anda adalah membangun fondasi untuk platform SaaS (Software as a Service) multi-tenant yang robust, skalabel, dan aman dari nol. Anda akan menerapkan praktik terbaik industri seperti Hexagonal Architecture, DDD, dan TDD.

**Visi Proyek:** Menciptakan platform di mana setiap "tenant" adalah sebuah unit bisnis independen dengan data, pengguna, dan konfigurasi yang terisolasi. Tenant pertama dan fokus utama development saat ini adalah bisnis etching bernama **PT Custom Etching Xenial (PT CEX)**.

**Stack Teknologi Wajib:**
*   **Backend:** Laravel 10
*   **Database:** PostgreSQL 15+
*   **Frontend:** React 18+ dengan TypeScript & Vite
*   **Styling:** Tailwind CSS
*   **Manajemen State:** Redux Toolkit
*   **Dokumentasi API:** Modular OpenAPI 3.0

---

### **BAGIAN 1: ARSITEKTUR DASAR & MULTI-TENANCY**

**1.1. Struktur Database Multi-Tenant (Wajib):**
Anda akan mengimplementasikan arsitektur database terpisah untuk platform (landlord) dan tenant.

*   **Database `landlord`:**
    *   Buat satu database utama (misal: `platform_db`).
    *   Database ini berisi tabel-tabel global yang mengelola seluruh platform.
    *   **Migrasi untuk `landlord`:**
        *   `tenants`: `id`, `name`, `domain` (unik, misal: `cex.platform.com`), `database_schema_name` (unik, misal: `tenant_cex`), `theme_id` (foreign key ke `themes`), `status` (enum: `active`, `suspended`).
        *   `users`: `id`, `name`, `email` (unik global), `password`, `global_role` (enum: `super_admin`, `tenant_user`), `email_verified_at`.
        *   `tenant_user`: `id`, `tenant_id`, `user_id`, `role_in_tenant` (string, misal: `admin`, `manager`, `staff`). Ini adalah tabel pivot krusial.
        *   `themes`: `id`, `name` (misal: `etching_dark`), `path` (misal: `etching`).
*   **Database `tenant` (Template):**
    *   Ini adalah blueprint untuk semua tenant.
    *   Gunakan pendekatan **Skema per Tenant** di PostgreSQL. Saat tenant baru dibuat, sebuah skema baru (misal: `tenant_cex`) akan dibuat di dalam database yang sama atau berbeda (konfigurasikan untuk skalabilitas).
    *   **Migrasi untuk `tenant`:**
        *   `products`, `customers`, `purchase_orders`, `vendors`, `order_quotes`, `invoices`, `payments`. (Gunakan skema dari prompt v2.0).
        *   `settings`: `id`, `key` (unik), `value` (text/jsonb), `group` (string, misal: `orders`, `theme`). Tabel ini adalah kunci untuk kustomisasi tanpa mengubah kode.
        *   `roles` & `permissions` (spesifik tenant): Gunakan `spatie/laravel-permission` yang dikonfigurasi untuk bekerja per-tenant.

**1.2. Konfigurasi Backend (Laravel):**
*   Gunakan package `spatie/laravel-multitenancy`.
*   Konfigurasikan *Task* identifikasi tenant menggunakan `DomainTenantFinder`.
*   Konfigurasikan *Task* untuk switching database/skema (`SwitchPostgreSqlSchemaTask`).
*   Pastikan semua model yang berhubungan dengan tenant (Product, Order, dll.) menggunakan trait `BelongsToTenant`.

---

### **BAGIAN 2: AUTHENTICATION & AUTHORIZATION (ALUR LENGKAP)**

**2.1. Proses Registrasi & Login (Terpusat):**
1.  **Registrasi User:** Form registrasi akan membuat entri di tabel `users` di database `landlord`.
2.  **Login:** Form login **selalu** melakukan otentikasi terhadap tabel `users` di `landlord`.
3.  **Otentikasi API:** Gunakan Laravel Sanctum. Token API akan dibuat setelah login berhasil.

**2.2. Proses Pemilihan Tenant & Otorisasi (Konteks):**
1.  **Setelah Login Sukses:**
    *   Lakukan query ke tabel `tenant_user` di `landlord` menggunakan `user_id` yang baru saja login.
    *   Dapatkan daftar `tenant_id` dan `role_in_tenant` yang dimiliki user.
2.  **Pembuatan Token Berkonteks:**
    *   **Jika user hanya punya 1 tenant:** Buat token Sanctum yang di-claim-nya berisi: `user_id`, `tenant_id`, dan `role_in_tenant`.
    *   **Jika user punya >1 tenant:** Arahkan ke halaman "Pilih Workspace". Setelah user memilih, baru buat token Sanctum dengan konteks tenant yang dipilih.
3.  **Middleware Otorisasi:**
    *   Buat middleware `EnsureUserHasRole` yang membaca `role_in_tenant` dari token dan membandingkannya dengan izin yang diperlukan untuk mengakses sebuah endpoint. Middleware ini akan digunakan untuk melindungi route-route admin panel tenant.

---

### **BAGIAN 3: PENGEMBANGAN FITUR (DENGAN KONFIGURASI DINAMIS)**

Implementasikan semua *Use Cases* dari prompt v2.0, namun dengan modifikasi penting: **semua logika yang bisa berbeda antar tenant harus dikontrol oleh tabel `settings`**.

*   **Contoh Modifikasi `CreatePurchaseOrderUseCase`:**
    *   **Sebelum:** Logika validasi di-hardcode.
    *   **Sekarang:**
        1.  Use case pertama kali membaca dari tabel `settings` tenant saat ini: `settings()->get('orders.custom_fields')`.
        2.  Jika ada, `value`-nya (berisi JSON definisi field kustom) akan digunakan untuk menambahkan aturan validasi dinamis.
        3.  Data dari field kustom ini akan disimpan di kolom `extra_attributes` (JSONB) pada tabel `purchase_orders`.

*   **Contoh Modifikasi Alur Approval:**
    *   **Sebelum:** Status transisi di-hardcode.
    *   **Sekarang:**
        1.  Buat `setting` dengan `key = 'orders.status_workflow'`.
        2.  `value`-nya adalah JSON yang mendefinisikan mesin status (state machine), misal: `{"new": ["sourcing_vendor"], "sourcing_vendor": ["vendor_negotiation", "cancelled"]}`.
        3.  Setiap kali ada perubahan status, logika akan memvalidasi transisi tersebut berdasarkan workflow yang didefinisikan di `settings` tenant.

---

### **BAGIAN 4: FRONTEND (THEMEABLE & COMPONENT-DRIVEN)**

**4.1. Arsitektur Frontend:**
*   **Inisialisasi:** Saat aplikasi React pertama kali dimuat, ia akan melakukan request ke endpoint `/api/platform/init` yang mengidentifikasi tenant dari domain. Endpoint ini akan mengembalikan konfigurasi tenant, termasuk `theme_id` dan `settings` UI.
*   **Theming Engine:**
    *   Gunakan struktur `src/themes/{theme_name}` seperti yang dijelaskan di v2.0.
    *   Buat *Context Provider* di React (`ThemeProvider`) yang akan menyediakan konfigurasi tema (warna, logo, font) dan fungsi untuk me-load komponen spesifik tema ke seluruh aplikasi.
*   **Komponen UI (Atomic Design):**
    *   Implementasikan semua komponen UI dasar di `src/components/ui/` (Button, Input, Card, dll) sebagai *single source of truth*.
    *   Komponen-komponen ini harus dirancang untuk menerima styling dari `ThemeProvider` atau props.
*   **Integrasi Desain Statis (PT CEX):**
    *   Ambil desain statis yang sudah ada.
    *   Letakkan asetnya di `src/themes/etching/assets/`.
    *   Buat file `src/themes/etching/config.json` yang berisi variabel warna (`primary: '#FFA500'`), logo, dll.
    *   Refactor kode HTML statis menjadi komponen-komponen React yang menggunakan komponen dari `src/components/ui/` dan mengambil data dari Redux store.

---

### **BAGIAN 5: DOKUMENTASI & EKSEKUSI**

**5.1. Dokumentasi API (Modular OpenAPI):**
*   Gunakan struktur direktori `docs/openapi/` yang modular seperti yang dijelaskan di v2.0.
*   Pastikan setiap endpoint yang memerlukan otentikasi memiliki `security: [{ bearerAuth: [] }]` dan dokumentasi mengenai role yang dibutuhkan.

**5.2. Rencana Eksekusi (Langkah-demi-Langkah):**
1.  **Sprint 1 (Fondasi):** Setup proyek, implementasi arsitektur multi-tenancy dengan `spatie`, buat migrasi `landlord` dan `tenant`. Buat mekanisme registrasi/login terpusat.
2.  **Sprint 2 (Tenant Pertama - PT CEX):** Buat tenant PT CEX secara manual. Implementasikan Theming Engine di React dan integrasikan desain statis `etching` sebagai tema pertama.
3.  **Sprint 3 (Fitur Inti - Order):** Implementasikan *Use Cases* dan API untuk alur Purchase Order dari awal hingga akhir, dengan fokus pada fleksibilitas melalui tabel `settings`.
4.  **Sprint 4 (Admin Panel):** Bangun dasbor admin tenant untuk mengelola produk, order, dan melihat laporan. Implementasikan halaman `settings` di mana admin tenant bisa mengubah konfigurasi alur bisnis mereka.
5.  **Sprint 5 (Super Admin & Finalisasi):** Bangun dasbor Super Admin untuk mengelola tenant. Lakukan pengujian end-to-end dan siapkan untuk deployment.

---

Bro, prompt v3.0 ini adalah cetak biru yang sangat komprehensif. Ini memberikan instruksi yang jelas kepada AI developer tentang **APA** yang harus dibangun dan **BAGAIMANA** cara membangunnya dengan benar sesuai standar arsitektur tertinggi. Ini adalah fondasi yang kokoh untuk platform yang akan kamu bangun.

**Langkah selanjutnya yang bisa kita lakukan:**
1.  Kita bisa merancang skema JSON yang detail untuk beberapa `settings` kunci, seperti `orders.status_workflow` atau `orders.custom_fields`.
2.  Kita bisa membahas strategi *testing* spesifik untuk arsitektur ini (misalnya, bagaimana menjalankan tes untuk tenant tertentu).
3.  Kita bisa merencanakan arsitektur deployment (misal: menggunakan Docker, Kubernetes) untuk platform multi-tenant ini.