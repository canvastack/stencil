# Vendor Management User Guide
## Panduan Lengkap Pengelolaan Vendor untuk Tenant

**Versi**: 1.0  
**Terakhir Diperbarui**: 17 Desember 2025  
**Untuk**: Tenant Users (Admin, Manager, Purchasing)

---

## 📖 Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Memulai](#memulai)
3. [Mengelola Vendor](#mengelola-vendor)
4. [Pelacakan Performa](#pelacakan-performa)
5. [Sourcing Requests](#sourcing-requests)
6. [Proses Pembayaran](#proses-pembayaran)
7. [Tips & Shortcuts](#tips--shortcuts)
8. [Troubleshooting](#troubleshooting)

---

## 📚 Pengenalan

Sistem Vendor Management memungkinkan Anda untuk:
- ✅ **Mengelola database vendor** - CRUD operations lengkap
- ✅ **Melacak performa vendor** - Delivery, quality, ratings
- ✅ **Mengelola sourcing requests** - Permintaan produksi ke vendor
- ✅ **Proses pembayaran** - Invoice dan payment tracking

### Akses yang Diperlukan

Untuk mengakses Vendor Management, Anda memerlukan salah satu permission berikut:
- `vendors.view` - Melihat informasi vendor
- `vendors.create` - Membuat vendor baru
- `vendors.update` - Mengupdate data vendor
- `vendors.delete` - Menghapus vendor
- `vendors.manage` - Akses penuh vendor management

---

## 🚀 Memulai

### Mengakses Vendor Management

1. **Login** ke tenant dashboard Anda
2. Navigasi ke **Operations > Vendors**
3. Anda akan melihat **Vendor Management Hub** dengan 4 tab utama:
   - **Database** - Daftar dan CRUD vendor
   - **Performance** - Metrik dan ranking performa
   - **Sourcing** - Permintaan produksi
   - **Payments** - Tracking pembayaran

---

## 👥 Mengelola Vendor

### Menambah Vendor Baru

1. Klik tombol **"Add Vendor"** di pojok kanan atas
2. Isi field yang diperlukan:

   **Required Fields:**
   - **Name** - Nama perusahaan atau vendor
   - **Email** - Email kontak utama (harus unique)
   - **Phone** - Nomor telepon kontak

   **Optional Fields:**
   - **Company Information** - Detail perusahaan
   - **Tax ID / NPWP** - Nomor pajak
   - **Bank Account** - Informasi rekening untuk pembayaran
   - **Specializations** - Keahlian vendor (etching, engraving, dll)
   - **Address** - Alamat lengkap vendor

3. Klik **"Create Vendor"**
4. Vendor baru akan muncul di list dengan status `Active`

### Mengedit Informasi Vendor

1. Temukan vendor di list
2. Klik tombol **menu (⋯)** di samping nama vendor
3. Pilih **"Edit"** dari dropdown
4. Update field yang diperlukan
5. Klik **"Save Changes"**

### Mengubah Status Vendor

Status vendor yang tersedia:
- **Active** - Vendor aktif dan dapat menerima orders
- **Inactive** - Vendor tidak aktif sementara
- **Suspended** - Vendor di-suspend karena isu tertentu
- **On Hold** - Vendor dalam status hold
- **Blacklisted** - Vendor di-blacklist dan tidak boleh digunakan

**Cara mengubah status:**
1. Klik menu (⋯) pada vendor
2. Pilih **"Change Status"**
3. Pilih status baru
4. Konfirmasi perubahan

### Filter dan Search Vendor

**Search Bar:**
- Ketik nama vendor, email, atau nama perusahaan
- Hasil filter secara real-time

**Filter Options:**
- **Status** - Filter berdasarkan status vendor
- **Rating** - Filter vendor dengan rating minimum (1-5 stars)
- **Company Size** - Small, Medium, Large
- **Specialization** - Filter berdasarkan keahlian

**Quick Filters:**
- **Top Performers** - Vendor dengan rating 4.5+
- **Active Orders** - Vendor dengan order yang sedang berjalan
- **New Vendors** - Vendor yang baru ditambahkan (< 30 hari)

### Bulk Operations

Untuk melakukan aksi pada multiple vendors:

1. Aktifkan **bulk mode** dengan klik "Compare Vendors" atau checkbox
2. Pilih vendors menggunakan checkbox
3. Pilih bulk action:
   - **Set Status** - Ubah status untuk semua selected vendors
   - **Delete** - Hapus multiple vendors
   - **Export** - Export selected vendors ke CSV/Excel
4. Klik **"Apply"**

**⚠️ Warning:** Bulk delete adalah permanent action dan tidak dapat di-undo!

---

## 📊 Pelacakan Performa

### Melihat Metrik Performa

Navigasi ke tab **"Performance"** untuk melihat:

**1. Delivery Performance Chart**
- **On Time** - Vendor mengirim tepat waktu
- **Early** - Vendor mengirim lebih cepat
- **Late** - Vendor terlambat mengirim

**2. Quality Ratings Distribution**
- **Excellent (4.5+)** - Kualitas sangat baik
- **Good (4.0-4.4)** - Kualitas baik
- **Average (3.0-3.9)** - Kualitas cukup
- **Poor (< 3.0)** - Kualitas buruk

**3. Top Performing Vendors**
- List vendor terbaik berdasarkan:
  - Overall rating (40%)
  - On-time delivery rate (30%)
  - Quality acceptance rate (20%)
  - Order volume (10%)

**4. Performance Trends**
- Grafik trend performa vendor over time
- Analisa improvement atau decline

### Vendor Rankings

Sistem secara otomatis meranking vendors berdasarkan:
- **Overall Rating** - Rating rata-rata dari semua orders
- **Delivery Performance** - Persentase on-time delivery
- **Quality Score** - Acceptance rate dari quality control
- **Order Volume** - Total value orders yang diselesaikan

---

## 📦 Sourcing Requests

### Membuat Sourcing Request Baru

1. Navigasi ke tab **"Sourcing"**
2. Klik **"New Sourcing Request"**
3. Isi informasi:
   - **Order ID** - Link ke purchase order
   - **Product Details** - Spesifikasi produk yang dibutuhkan
   - **Quantity** - Jumlah yang dibutuhkan
   - **Target Vendors** - Pilih vendor yang akan dikirimkan request
   - **Deadline** - Due date untuk quotation
4. Klik **"Send Request"**

### Tracking Request Status

Status sourcing request:
- **Pending** - Request baru dikirim ke vendor
- **Quote Received** - Vendor sudah memberikan quotation
- **Negotiating** - Dalam proses negosiasi harga
- **Accepted** - Quotation diterima, order akan diproses
- **Rejected** - Request ditolak oleh vendor atau perusahaan
- **Cancelled** - Request dibatalkan

### Membandingkan Vendor Quotations

1. Pilih sourcing request yang sudah ada quotations
2. Klik **"Compare Quotes"**
3. Lihat comparison table dengan:
   - **Price per unit**
   - **Total price**
   - **Lead time**
   - **Payment terms**
   - **Quality guarantees**
4. Pilih vendor terbaik berdasarkan criteria
5. Klik **"Accept Quote"**

---

## 💰 Proses Pembayaran

### Melihat Payment History

Tab **"Payments"** menampilkan:
- **Pending Payments** - Invoice yang belum dibayar
- **Paid Invoices** - Riwayat pembayaran
- **Overdue** - Payment yang terlambat
- **Total Outstanding** - Total hutang ke vendors

### Memproses Pembayaran

1. Pilih invoice yang akan dibayar
2. Klik **"Process Payment"**
3. Pilih metode pembayaran:
   - **Bank Transfer**
   - **Check**
   - **Payment Gateway**
4. Upload bukti pembayaran jika diperlukan
5. Klik **"Confirm Payment"**

### Payment Terms

Sistem mendukung berbagai payment terms:
- **DP (Down Payment)** - Pembayaran uang muka (biasanya 30-50%)
- **Net 30** - Pembayaran dalam 30 hari
- **Net 60** - Pembayaran dalam 60 hari
- **COD (Cash on Delivery)** - Pembayaran saat pengiriman
- **Custom Terms** - Terms khusus sesuai agreement

---

## ⌨️ Tips & Shortcuts

### Keyboard Shortcuts

Percepat workflow Anda dengan shortcuts:
- `Ctrl + N` - Buat vendor baru
- `Ctrl + F` - Focus ke search box
- `Ctrl + R` - Refresh vendor list
- `?` - Tampilkan semua shortcuts

### Quick Actions

- **Double-click vendor name** - Buka detail vendor
- **Right-click vendor row** - Buka context menu
- **Drag column headers** - Reorder columns
- **Click column header** - Sort ascending/descending

### Export Data

Export vendor data ke:
- **CSV** - Untuk Excel/Spreadsheet
- **Excel (.xlsx)** - Dengan formatting
- **PDF** - Untuk reporting

**Cara export:**
1. Filter vendors sesuai kebutuhan (optional)
2. Klik **"Export"** di toolbar
3. Pilih format
4. File akan otomatis di-download

---

## 🔧 Troubleshooting

### Masalah Umum

**❌ Issue**: Tidak bisa membuat vendor baru  
**✅ Solution**: 
- Pastikan Anda memiliki permission `vendors.create`
- Check apakah email vendor sudah digunakan (email harus unique)
- Pastikan semua required fields terisi

**❌ Issue**: Vendor tidak muncul di list  
**✅ Solution**:
- Check filter settings - clear all filters
- Refresh halaman dengan `Ctrl + R`
- Check apakah vendor status adalah `Active`

**❌ Issue**: Data performa tidak tampil  
**✅ Solution**:
- Pastikan vendor memiliki order history
- Tunggu beberapa saat untuk data sync
- Refresh halaman

**❌ Issue**: Tidak bisa upload bukti pembayaran  
**✅ Solution**:
- Check format file (hanya PDF, JPG, PNG allowed)
- Check ukuran file (max 5MB)
- Pastikan koneksi internet stabil

**❌ Issue**: Email notifikasi tidak terkirim ke vendor  
**✅ Solution**:
- Check email vendor sudah benar
- Check SMTP configuration di Settings
- Check spam folder di email vendor

---

## 📞 Dukungan

### Butuh Bantuan Lebih Lanjut?

**Internal Support:**
- Hubungi system administrator Anda
- Buka ticket di internal helpdesk

**Platform Support:**
- Email: support@canvastack.com
- Documentation: https://docs.canvastack.com
- Community Forum: https://forum.canvastack.com

---

## 📝 Best Practices

### Pengelolaan Vendor yang Baik

1. **Regular Updates** - Update informasi vendor secara berkala
2. **Performance Monitoring** - Review vendor performance setiap bulan
3. **Communication Log** - Dokumentasikan semua komunikasi dengan vendor
4. **Quality Control** - Selalu lakukan quality check sebelum accept delivery
5. **Payment Discipline** - Bayar vendor tepat waktu untuk maintain good relationship

### Data Quality

- ✅ Isi data vendor selengkap mungkin
- ✅ Verifikasi informasi bank account sebelum pembayaran
- ✅ Update status vendor secara real-time
- ✅ Archive vendor yang sudah tidak digunakan (jangan delete)

---

## 📄 Changelog

### Version 1.0 (17 Desember 2025)
- Initial release
- Complete vendor CRUD operations
- Performance tracking features
- Sourcing request management
- Payment processing
