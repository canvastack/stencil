# Panduan Negosiasi dengan Vendor

## Gambaran Umum

Tahap **Negosiasi dengan Vendor** adalah tahap krusial dimana PT CEX bernegosiasi dengan vendor terpilih untuk mendapatkan harga terbaik dan kesepakatan terms untuk order customer.

## Tujuan Tahap Ini

1. **Mendapatkan Harga Vendor** - Negosiasi harga produksi dengan vendor
2. **Menyepakati Timeline** - Konfirmasi waktu pengerjaan dan pengiriman
3. **Finalisasi Spesifikasi** - Pastikan vendor memahami semua requirement
4. **Dokumentasi Kesepakatan** - Catat semua hasil negosiasi

## Informasi yang Harus Dikumpulkan

### 1. Harga Vendor (Wajib)
- **Field**: `vendor_quoted_price`
- **Format**: Dalam Rupiah (cents)
- **Contoh**: Rp 5.000.000 = 500000000 (cents)
- **Keterangan**: Harga yang ditawarkan vendor untuk mengerjakan order ini

### 2. Estimasi Waktu Pengerjaan (Wajib)
- **Field**: `vendor_lead_time_days`
- **Format**: Jumlah hari
- **Contoh**: 14 (hari)
- **Keterangan**: Berapa lama vendor butuh untuk menyelesaikan order

### 3. Catatan Negosiasi (Opsional)
- **Field**: `negotiation_notes`
- **Format**: Text
- **Contoh**: "Vendor setuju memberikan diskon 10% untuk order di atas 100 unit. Pengiriman menggunakan ekspedisi vendor."
- **Keterangan**: Catatan penting dari proses negosiasi

### 4. Terms & Conditions (Opsional)
- **Field**: `vendor_terms`
- **Format**: Text/JSON
- **Contoh**: 
  ```json
  {
    "payment_terms": "50% DP, 50% sebelum pengiriman",
    "warranty": "6 bulan",
    "revision_policy": "Maksimal 2x revisi gratis"
  }
  ```

## Alur Kerja Negosiasi

### Langkah 1: Hubungi Vendor
1. Buka detail order
2. Lihat vendor yang sudah di-assign
3. Hubungi vendor via telepon/email/WhatsApp
4. Diskusikan requirement order

### Langkah 2: Negosiasi Harga & Terms
1. **Sampaikan Spesifikasi**:
   - Tunjukkan detail produk yang diinginkan customer
   - Jelaskan quantity dan spesifikasi khusus
   - Tanyakan apakah vendor bisa mengerjakan

2. **Minta Penawaran Harga**:
   - Minta vendor memberikan harga per unit
   - Tanyakan apakah ada diskon untuk quantity tertentu
   - Konfirmasi apakah harga sudah termasuk ongkir atau belum

3. **Konfirmasi Timeline**:
   - Tanyakan berapa lama proses produksi
   - Konfirmasi tanggal pengiriman yang bisa dijanjikan
   - Tanyakan apakah ada kemungkinan percepatan (rush order)

4. **Diskusikan Terms**:
   - Payment terms (DP berapa persen, kapan pelunasan)
   - Warranty/garansi produk
   - Kebijakan revisi jika ada yang tidak sesuai
   - Siapa yang tanggung ongkir

### Langkah 3: Input Hasil Negosiasi ke Sistem
1. Klik tombol **"Complete Stage"** pada timeline
2. Isi form negosiasi:
   - **Harga Vendor**: Masukkan harga yang disepakati
   - **Estimasi Waktu**: Masukkan jumlah hari pengerjaan
   - **Catatan**: Tulis ringkasan hasil negosiasi
3. Klik **"Simpan & Lanjutkan"**

### Langkah 4: Sistem Otomatis Hitung Harga Jual
Setelah input harga vendor, sistem akan:
1. Menghitung markup (keuntungan PT CEX)
2. Menambahkan biaya operasional
3. Menghasilkan **Harga Penawaran ke Customer** (`quotation_amount`)

## Formula Perhitungan Harga

```
Harga Vendor (dari negosiasi)     = Rp 5.000.000
Markup PT CEX (misalnya 30%)       = Rp 1.500.000
Biaya Operasional (misalnya 5%)    = Rp   250.000
----------------------------------------
Harga Penawaran ke Customer        = Rp 6.750.000
```

**Catatan**: Persentase markup dan biaya operasional bisa dikonfigurasi per tenant.

## Contoh Skenario Negosiasi

### Skenario 1: Negosiasi Sukses
**Situasi**: Order untuk 50 plakat etching stainless steel

**Proses**:
1. Hubungi PT Supplier Utama
2. Vendor quote: Rp 150.000/unit = Rp 7.500.000 total
3. Negosiasi: Minta diskon untuk quantity 50
4. Vendor setuju: Rp 140.000/unit = Rp 7.000.000 total
5. Lead time: 10 hari kerja
6. Payment terms: 50% DP, 50% sebelum kirim

**Input ke Sistem**:
- Harga Vendor: Rp 7.000.000
- Estimasi Waktu: 10 hari
- Catatan: "Diskon quantity 50 unit. Payment 50/50. Termasuk packing kayu."

### Skenario 2: Perlu Negosiasi Ulang
**Situasi**: Harga vendor terlalu tinggi

**Proses**:
1. Vendor pertama quote: Rp 200.000/unit (terlalu mahal)
2. Coba negosiasi, vendor tidak bisa turun harga
3. **Opsi A**: Cari vendor alternatif
   - Kembali ke tahap "Vendor Sourcing"
   - Pilih vendor lain
   - Mulai negosiasi baru
4. **Opsi B**: Lanjutkan dengan harga tinggi
   - Input harga vendor yang tinggi
   - Sistem hitung harga jual (akan tinggi juga)
   - Biarkan customer yang putuskan

## Tips Negosiasi yang Efektif

### 1. Persiapan Sebelum Negosiasi
- ✅ Pahami detail spesifikasi order
- ✅ Ketahui harga pasar untuk produk serupa
- ✅ Siapkan alternatif vendor jika negosiasi gagal
- ✅ Tentukan target harga maksimal

### 2. Selama Negosiasi
- ✅ Tanyakan breakdown harga (material, labor, overhead)
- ✅ Tawarkan kerjasama jangka panjang untuk harga lebih baik
- ✅ Diskusikan kemungkinan diskon quantity
- ✅ Konfirmasi semua terms secara tertulis

### 3. Setelah Negosiasi
- ✅ Dokumentasikan semua kesepakatan
- ✅ Input data ke sistem dengan akurat
- ✅ Simpan bukti komunikasi (email, chat, dll)
- ✅ Follow up jika ada yang belum jelas

## Troubleshooting

### Masalah: Vendor Tidak Merespon
**Solusi**:
1. Coba hubungi via channel lain (telepon → WhatsApp → email)
2. Jika masih tidak respon dalam 24 jam, pilih vendor alternatif
3. Update status vendor menjadi "Tidak Responsif" untuk referensi future

### Masalah: Harga Vendor Terlalu Tinggi
**Solusi**:
1. Tanyakan apakah bisa nego untuk quantity lebih besar
2. Tanyakan apakah ada alternatif material yang lebih murah
3. Jika tidak bisa nego, cari vendor lain
4. Dokumentasikan harga untuk perbandingan

### Masalah: Lead Time Terlalu Lama
**Solusi**:
1. Tanyakan apakah bisa dipercepat dengan biaya tambahan
2. Diskusikan dengan customer apakah bisa tunggu lebih lama
3. Jika urgent, cari vendor dengan lead time lebih cepat
4. Pertimbangkan partial delivery jika memungkinkan

### Masalah: Spesifikasi Tidak Bisa Dipenuhi
**Solusi**:
1. Tanyakan alternatif yang mendekati spesifikasi
2. Diskusikan dengan customer apakah alternatif acceptable
3. Jika tidak bisa kompromi, cari vendor lain
4. Update requirement order jika customer setuju alternatif

## Checklist Sebelum Complete Stage

Sebelum klik "Complete Stage", pastikan:

- [ ] Sudah hubungi dan diskusi dengan vendor
- [ ] Harga vendor sudah dikonfirmasi dan disepakati
- [ ] Lead time sudah jelas dan realistis
- [ ] Payment terms sudah disepakati
- [ ] Semua spesifikasi sudah dikonfirmasi vendor bisa kerjakan
- [ ] Catatan negosiasi sudah lengkap
- [ ] Bukti komunikasi sudah disimpan

## Tahap Selanjutnya

Setelah negosiasi selesai dan data sudah diinput:

1. **Sistem Otomatis**:
   - Hitung harga penawaran ke customer
   - Generate draft quotation
   - Update order status ke "Customer Quote"

2. **Tugas Admin**:
   - Review harga penawaran yang di-generate sistem
   - Adjust jika perlu (markup bisa disesuaikan)
   - Kirim quotation ke customer
   - Tunggu approval customer

## Pertanyaan Umum (FAQ)

### Q: Apakah harus negosiasi setiap order?
**A**: Ya, setiap order sebaiknya dinegosiasi untuk mendapatkan harga terbaik. Namun untuk vendor langganan dengan harga kontrak, bisa langsung input harga kontrak.

### Q: Bagaimana jika vendor minta DP sebelum mulai produksi?
**A**: Ini normal. Catat di "Vendor Terms" dan koordinasikan dengan finance untuk transfer DP setelah customer approve quotation.

### Q: Apakah bisa ganti vendor setelah negosiasi?
**A**: Bisa. Kembali ke tahap "Vendor Sourcing", pilih vendor baru, dan mulai negosiasi ulang.

### Q: Bagaimana jika customer tidak setuju dengan harga?
**A**: Bisa negosiasi ulang dengan vendor untuk harga lebih rendah, atau tawarkan alternatif spesifikasi yang lebih murah.

### Q: Apakah harus input semua field?
**A**: Field wajib: Harga Vendor dan Lead Time. Field lain opsional tapi sangat direkomendasikan untuk dokumentasi.

## Kontak Support

Jika ada pertanyaan atau kendala:
- **Email**: support@ptcex.com
- **WhatsApp**: +62 xxx-xxxx-xxxx
- **Internal Chat**: #order-support channel

---

**Terakhir diupdate**: 30 Januari 2026  
**Versi**: 1.0
