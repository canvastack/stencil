# Panduan Berbelanja - Customer Guide

**Target:** End Users / Customers  
**Version:** 1.0  
**Last Updated:** 2025-12-26

---

## 📋 Daftar Isi

1. [Selamat Datang](#selamat-datang)
2. [Menjelajahi Produk](#menjelajahi-produk)
3. [Mencari Produk](#mencari-produk)
4. [Filter Produk](#filter-produk)
5. [Detail Produk](#detail-produk)
6. [Kustomisasi Produk](#kustomisasi-produk)
7. [Menambah ke Keranjang](#menambah-ke-keranjang)
8. [Checkout & Pembayaran](#checkout--pembayaran)
9. [Melacak Pesanan](#melacak-pesanan)
10. [Review & Rating](#review--rating)
11. [FAQ Customer](#faq-customer)

---

## Selamat Datang

### Tentang Platform Kami

Selamat datang di **CanvaStencil** - platform belanja online untuk produk custom etching, engraving, dan award plaque berkualitas tinggi! 

### Yang Bisa Anda Dapatkan

✨ **Produk Berkualitas Premium**
- Metal Etching (Trophy, Plakat Logam)
- Glass Etching (Award Kaca, Kristal)
- Award Plaque (Penghargaan, Sertifikat)

🎨 **Kustomisasi Penuh**
- Engraving teks sesuai keinginan
- Pilihan ukuran dan material
- Design custom untuk kebutuhan khusus

🚚 **Pengiriman Cepat & Aman**
- Estimasi waktu jelas
- Packaging premium
- Tracking real-time

💎 **Garansi Kualitas**
- Produk berkualitas tinggi
- Uang kembali jika tidak sesuai
- Customer support responsif

---

## Menjelajahi Produk

### Halaman Produk

Kunjungi halaman produk di: `{tenant-domain}/products`

**Layout Halaman:**

```
┌─────────────────────────────────────────────────────┐
│  🔍 [Search products...]            [Filter ▼]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ [Image] │  │ [Image] │  │ [Image] │            │
│  │ Product │  │ Product │  │ Product │            │
│  │ 150K    │  │ 200K    │  │ 175K    │            │
│  │ ⭐ 4.8  │  │ ⭐ 4.5  │  │ ⭐ 5.0  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ [Image] │  │ [Image] │  │ [Image] │            │
│  │ Product │  │ Product │  │ Product │            │
│  │ 125K    │  │ 180K    │  │ 250K    │            │
│  │ ⭐ 4.6  │  │ ⭐ 4.9  │  │ ⭐ 4.7  │            │
│  └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│          [< Previous]  1 2 3  [Next >]             │
└─────────────────────────────────────────────────────┘
```

### Product Card Information

Setiap card menampilkan:

- **📷 Foto Produk:** High-quality image
- **📝 Nama Produk:** Deskriptif dan jelas
- **💰 Harga:** Harga satuan dalam Rupiah
- **⭐ Rating:** Average rating dari customer reviews
- **🏷️ Badge:** NEW, BEST SELLER, FEATURED (jika ada)
- **📦 Stock Status:** In Stock / Low Stock / Out of Stock

### View Mode

Pilih tampilan yang nyaman untuk Anda:

**Grid View (Default):**
```
┌────┐ ┌────┐ ┌────┐
│ 1  │ │ 2  │ │ 3  │
└────┘ └────┘ └────┘
┌────┐ ┌────┐ ┌────┐
│ 4  │ │ 5  │ │ 6  │
└────┘ └────┘ └────┘
```

**List View:**
```
┌──────────────────────────────┐
│ [Image] Product Name         │
│         Description...       │
│         Price: 150K ⭐ 4.8  │
└──────────────────────────────┘
┌──────────────────────────────┐
│ [Image] Product Name         │
│         Description...       │
│         Price: 200K ⭐ 4.5  │
└──────────────────────────────┘
```

### Sorting Options

Urutkan produk sesuai preferensi:

```
Sort by: [ Name A-Z ▼ ]
```

**Available Options:**
- **Name A-Z:** Alfabetis ascending
- **Name Z-A:** Alfabetis descending
- **Price: Low to High:** Harga termurah dulu
- **Price: High to Low:** Harga termahal dulu
- **Newest:** Produk terbaru
- **Highest Rated:** Rating tertinggi
- **Most Popular:** Paling banyak dibeli

---

## Mencari Produk

### Search Bar

Gunakan search bar di bagian atas halaman:

```
🔍 [Cari produk, kategori, atau deskripsi...]
```

### Tips Pencarian Efektif

✅ **DO:**
- Gunakan kata kunci spesifik: "trophy stainless steel"
- Cari berdasarkan material: "glass plaque"
- Cari berdasarkan ukuran: "medium trophy"
- Gunakan partial words: "metal etch"

❌ **DON'T:**
- Terlalu generic: "hadiah"
- Typo tanpa koreksi (system akan suggest)

### Search Examples

| Search Query | Results |
|--------------|---------|
| "metal trophy" | Semua trophy berbahan metal |
| "award 15cm" | Award dengan ukuran 15cm |
| "engraving" | Produk dengan engraving option |
| "stainless" | Produk berbahan stainless steel |

### Auto-Complete

System akan suggest produk saat Anda mengetik:

```
🔍 [metal tro...]

   Suggestions:
   ➜ Metal Trophy Premium
   ➜ Metal Etching Plaque
   ➜ Stainless Steel Trophy
```

---

## Filter Produk

### Filter Panel

Klik button **"Filter"** untuk membuka filter panel:

```
┌─ Filters ──────────────────┐
│                            │
│ Type                       │
│ ○ All Types                │
│ ● Metal Etching            │
│ ○ Glass Etching            │
│ ○ Award Plaque             │
│                            │
│ Size                       │
│ □ Small                    │
│ ☑ Medium                   │
│ □ Large                    │
│                            │
│ Material                   │
│ □ Stainless Steel          │
│ ☑ Brass                    │
│ □ Glass                    │
│ □ Acrylic                  │
│                            │
│ Price Range                │
│ [100K] ──●────── [500K]    │
│                            │
│ Rating                     │
│ ⭐⭐⭐⭐ & up               │
│                            │
│ [Apply] [Reset]            │
└────────────────────────────┘
```

### 1. Filter by Type

Pilih kategori produk:

- **Metal Etching:** Trophy logam, plakat metal
- **Glass Etching:** Award kaca, kristal
- **Award Plaque:** Plakat penghargaan

### 2. Filter by Size

Pilih ukuran yang diinginkan:

- **Small:** Cocok untuk personal awards
- **Medium:** Standard untuk awards & trophies
- **Large:** Premium size untuk special occasions

### 3. Filter by Material

Pilih material sesuai kebutuhan:

- **Stainless Steel:** Tahan lama, modern look
- **Brass:** Elegant, classic appearance
- **Bronze:** Premium, timeless beauty
- **Glass:** Transparent, sophisticated
- **Acrylic:** Affordable, lightweight

### 4. Price Range Filter

Set budget Anda:

```
Price Range:
Min: [___100,000___]  Max: [___500,000___]

Quick Select:
[ Under 100K ] [ 100K-250K ] [ 250K-500K ] [ 500K+ ]
```

### 5. Rating Filter

Filter berdasarkan rating customer:

```
⭐⭐⭐⭐⭐ (5 stars only)
⭐⭐⭐⭐ & up (4+ stars)
⭐⭐⭐ & up (3+ stars)
```

💡 **Tip:** Filter **4 stars & up** memberikan produk dengan kualitas terjamin!

### Multiple Filters

Anda bisa combine beberapa filter:

**Example:** Cari trophy logam ukuran medium dengan rating tinggi
```
✓ Type: Metal Etching
✓ Size: Medium
✓ Rating: 4+ stars
```

**Result:** Shows 44 products matching all criteria

### Clear Filters

Reset semua filter dengan klik **"Clear All"** atau **"Reset"**

---

## Detail Produk

### Membuka Detail Produk

Klik pada product card atau foto untuk membuka detail lengkap.

### Product Detail Page Layout

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌─────────────┐  Premium Metal Trophy            │
│  │             │  ⭐⭐⭐⭐⭐ 4.8 (24 reviews)      │
│  │   [Image]   │                                  │
│  │             │  Rp 150,000                      │
│  │             │  Stock: In Stock                 │
│  └─────────────┘                                  │
│  [◀ Image 1 of 3 ▶]                              │
│                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                    │
│  📝 Description                                    │
│     High-quality metal etching trophy with        │
│     custom engraving options...                   │
│                                                    │
│  ✨ Features                                       │
│     • Laser precision etching                     │
│     • Weatherproof coating                        │
│     • Custom engraving included                   │
│     • Premium gift box packaging                  │
│                                                    │
│  📏 Specifications                                 │
│     Material: Stainless Steel                     │
│     Dimensions: 15cm x 10cm x 5cm                 │
│     Weight: 500g                                  │
│     Finish: Polished                              │
│                                                    │
│  🎨 Customization Options                         │
│     [See customization section below]             │
│                                                    │
│  ⏱️ Production & Delivery                         │
│     Lead Time: 5-7 working days                   │
│     Shipping: 2-3 days (Jakarta)                  │
│                                                    │
│  💬 Customer Reviews (24)                         │
│     [See reviews section below]                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Image Gallery

**Features:**
- **Multiple Images:** Lihat produk dari berbagai sudut
- **Zoom:** Click image untuk zoom in
- **Thumbnails:** Navigate dengan thumbnail dibawah
- **Swipe:** Support touch/swipe di mobile

**Navigation:**
```
[◀ Prev]  [Image 1] [Image 2] [Image 3]  [Next ▶]
```

### Price Information

```
┌─ Price Details ────────────┐
│ Base Price:   Rp 150,000   │
│                            │
│ Customization (if any):    │
│ + Size upgrade: Rp 50,000  │
│ + Material: Rp 75,000      │
│ ───────────────────────    │
│ Total: Rp 275,000          │
└────────────────────────────┘
```

### Stock Status

| Status | Description | Action |
|--------|-------------|--------|
| **In Stock** ✅ | Ready to order | Can add to cart |
| **Low Stock** ⚠️ | Limited quantity | Order soon |
| **Out of Stock** ❌ | Not available | "Notify when available" |
| **Pre-Order** 🔔 | Coming soon | Reserve now |

### Features & Benefits

Lihat keunggulan produk:

```
✨ Features:
  • Laser precision etching untuk detail sempurna
  • Weatherproof coating tahan cuaca
  • Custom engraving included (gratis!)
  • Premium gift box packaging
```

### Specifications

Technical details:

```
📏 Specifications:
  Material:     Stainless Steel 304
  Dimensions:   15cm (H) x 10cm (W) x 5cm (D)
  Weight:       500 grams
  Finish:       Polished mirror finish
  Base:         Wooden base (walnut)
```

### Shipping & Delivery

```
🚚 Delivery Information:
  Lead Time:    5-7 working days (production)
  Shipping:     2-3 days (Jakarta area)
               3-5 days (Java)
               5-7 days (Outside Java)
  
  Shipping Cost: Calculate at checkout
```

---

## Kustomisasi Produk

### Custom Options

Banyak produk kami yang bisa dikustomisasi sesuai keinginan Anda!

### 1. Text Engraving

**For:** Trophy, Plaque, Award

```
┌─ Engraving Text ──────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │ JOHN DOE                           │ │
│ │ CHAMPION 2025                      │ │
│ └────────────────────────────────────┘ │
│ 0/100 characters                       │
│                                        │
│ Preview:                               │
│ [Shows product with engraved text]     │
└────────────────────────────────────────┘
```

**Tips:**
- Maksimal 100 karakter (termasuk spasi)
- Gunakan CAPS untuk emphasis
- Periksa spelling sebelum order
- Preview akan show hasil engraving

### 2. Size Selection

```
┌─ Select Size ─────────────────────────┐
│ ○ Small (10cm)           Base Price   │
│ ● Medium (15cm)          +Rp 50,000   │
│ ○ Large (20cm)           +Rp 100,000  │
│                                        │
│ Your selection: Medium                 │
│ Price adjustment: +Rp 50,000           │
└────────────────────────────────────────┘
```

**Size Guide:**
- **Small (10cm):** Personal awards, desk items
- **Medium (15cm):** Standard trophies, plaques
- **Large (20cm):** Premium display, special events

### 3. Material Choice

```
┌─ Select Material ─────────────────────┐
│ ○ Stainless Steel        Base Price   │
│ ● Brass                  +Rp 75,000   │
│ ○ Bronze                 +Rp 100,000  │
│                                        │
│ Material properties:                   │
│ Brass - Elegant gold color, classic   │
│ appearance, ages beautifully          │
└────────────────────────────────────────┘
```

### 4. Additional Options

**Gift Box:**
```
[✓] Add Premium Gift Box    +Rp 25,000
    Includes velvet-lined presentation box
```

**Rush Production:**
```
[ ] Rush Service (3-4 days) +Rp 50,000
    Guaranteed faster production
```

**Certificate:**
```
[ ] Certificate of Authenticity +Rp 15,000
    Signed certificate included
```

### Price Calculator

System automatically calculate total:

```
┌─ Price Summary ───────────────────────┐
│ Base Price:              Rp 150,000   │
│ Size (Medium):           + Rp 50,000  │
│ Material (Brass):        + Rp 75,000  │
│ Gift Box:                + Rp 25,000  │
│ ──────────────────────────────────    │
│ SUBTOTAL:                Rp 300,000   │
│ ──────────────────────────────────    │
│                                        │
│ Quantity: [1] [-] [+]                 │
│ ──────────────────────────────────    │
│ TOTAL:                   Rp 300,000   │
└────────────────────────────────────────┘
```

### Preview Customization

Sebelum add to cart, preview hasil kustomisasi:

```
┌─ Preview Your Design ─────────────────┐
│                                        │
│        ┌──────────────────┐           │
│        │                  │           │
│        │   [Trophy Image] │           │
│        │                  │           │
│        │   JOHN DOE       │ ← Engraving
│        │   CHAMPION 2025  │           │
│        │                  │           │
│        └──────────────────┘           │
│                                        │
│ Material: Brass (gold color)           │
│ Size: Medium (15cm)                    │
│ Packaging: Premium gift box            │
│                                        │
│ [Edit] [Add to Cart]                  │
└────────────────────────────────────────┘
```

---

## Menambah ke Keranjang

### Add to Cart Button

Setelah customize produk, klik **"Add to Cart"**:

```
[🛒 Add to Cart]
```

### Success Notification

```
┌─ Added to Cart ✓ ────────────────────┐
│ Premium Metal Trophy                   │
│ Quantity: 1                            │
│ Price: Rp 300,000                      │
│                                        │
│ [View Cart] [Continue Shopping]        │
└────────────────────────────────────────┘
```

### Cart Icon Update

Cart icon di header akan update:

```
🛒 (3)  ← Badge showing item count
```

### View Cart

Klik cart icon untuk melihat isi keranjang:

```
┌─ Shopping Cart ───────────────────────────────────┐
│                                                   │
│ 3 items in cart                                   │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ [Image] Premium Metal Trophy                  │ │
│ │         Size: Medium, Material: Brass         │ │
│ │         Qty: [1] [-][+]   Rp 300,000   [🗑️] │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ [Image] Glass Plaque Award                    │ │
│ │         Size: Large                           │ │
│ │         Qty: [2] [-][+]   Rp 400,000   [🗑️] │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ─────────────────────────────────────────────    │
│ Subtotal:                        Rp 700,000      │
│ Shipping: (calculated at checkout)               │
│ ─────────────────────────────────────────────    │
│ TOTAL:                           Rp 700,000      │
│                                                   │
│ [Continue Shopping] [Proceed to Checkout]        │
└───────────────────────────────────────────────────┘
```

### Update Quantity

**Increase:**
```
Qty: [2] [+] ← Click to add more
```

**Decrease:**
```
Qty: [2] [-] ← Click to reduce
```

**Remove Item:**
```
[🗑️] ← Click to remove from cart
```

### Apply Coupon

Punya kode diskon?

```
┌─ Discount Code ─────────────┐
│ [WELCOME10_______] [Apply]  │
└─────────────────────────────┘

✅ Discount applied: -Rp 70,000 (10%)
```

---

## Checkout & Pembayaran

### Step 1: Review Cart

Pastikan semua item sudah benar, kemudian klik **"Proceed to Checkout"**

### Step 2: Shipping Information

Isi alamat pengiriman:

```
┌─ Shipping Address ────────────────────────────────┐
│ Full Name *: [____________________________]       │
│ Phone *:     [____________________________]       │
│ Email *:     [____________________________]       │
│                                                   │
│ Address *:   [____________________________]       │
│              [____________________________]       │
│              [____________________________]       │
│                                                   │
│ City *:      [____________________________]       │
│ Province *:  [____________________________]       │
│ Postal Code: [____________________________]       │
│                                                   │
│ [✓] Save for future orders                        │
│                                                   │
│ Special Instructions (optional):                  │
│ [_________________________________________]       │
│ [_________________________________________]       │
└───────────────────────────────────────────────────┘
```

### Step 3: Shipping Method

Pilih metode pengiriman:

```
┌─ Shipping Method ─────────────────────────────────┐
│ ○ Regular (5-7 days)              FREE            │
│ ● Express (2-3 days)              Rp 25,000       │
│ ○ Same Day (Jakarta only)         Rp 50,000       │
│                                                   │
│ Estimated delivery: Dec 30 - Jan 2                │
└───────────────────────────────────────────────────┘
```

### Step 4: Payment Method

Pilih metode pembayaran:

```
┌─ Payment Method ──────────────────────────────────┐
│                                                   │
│ ● Bank Transfer                                   │
│   BCA, Mandiri, BNI, BRI                         │
│   (Manual confirmation required)                  │
│                                                   │
│ ○ Credit/Debit Card                               │
│   Visa, Mastercard, JCB                          │
│   (Instant confirmation)                          │
│                                                   │
│ ○ E-Wallet                                        │
│   GoPay, OVO, Dana, ShopeePay                    │
│   (Instant confirmation)                          │
│                                                   │
│ ○ Virtual Account                                 │
│   Auto-generate VA number                         │
│   (Instant confirmation)                          │
│                                                   │
│ ○ Cash on Delivery (COD)                         │
│   Available for Jakarta area only                 │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Step 5: Order Summary

Review pesanan Anda:

```
┌─ Order Summary ───────────────────────────────────┐
│ 3 items                                           │
│ ─────────────────────────────────────────────    │
│ Subtotal:                        Rp 700,000      │
│ Discount (WELCOME10):           - Rp 70,000      │
│ Shipping (Express):              Rp 25,000       │
│ Tax (11%):                       Rp 71,950       │
│ ─────────────────────────────────────────────    │
│ TOTAL:                           Rp 726,950      │
│ ─────────────────────────────────────────────    │
│                                                   │
│ [✓] I agree to Terms & Conditions                 │
│                                                   │
│ [Place Order]                                     │
└───────────────────────────────────────────────────┘
```

### Step 6: Payment Confirmation

**For Bank Transfer:**

```
┌─ Payment Instructions ────────────────────────────┐
│ Please transfer to:                               │
│                                                   │
│ Bank: BCA                                         │
│ Account: 123-456-7890                             │
│ Name: PT Example Corp                             │
│ Amount: Rp 726,950                                │
│                                                   │
│ Order ID: #ORD-2025-001234                        │
│                                                   │
│ After payment, upload proof:                      │
│ [Upload Receipt] [Drag file here]                │
│                                                   │
│ Payment deadline: 24 hours                        │
│                                                   │
│ [Upload Proof] [Download Instructions]           │
└───────────────────────────────────────────────────┘
```

**For E-Wallet:**

```
┌─ Payment QR Code ─────────────────────────────────┐
│ Scan QR with GoPay app:                           │
│                                                   │
│        ┌────────────────┐                         │
│        │                │                         │
│        │   [QR CODE]    │                         │
│        │                │                         │
│        └────────────────┘                         │
│                                                   │
│ Amount: Rp 726,950                                │
│ Order: #ORD-2025-001234                           │
│                                                   │
│ ⏰ Expires in: 14:58                              │
│                                                   │
│ Waiting for payment...                            │
└───────────────────────────────────────────────────┘
```

### Order Confirmation

Setelah payment berhasil:

```
┌─ Order Confirmed ✅ ──────────────────────────────┐
│                                                   │
│ Thank you for your order!                         │
│                                                   │
│ Order Number: #ORD-2025-001234                    │
│ Payment Status: PAID ✅                           │
│                                                   │
│ Your order is being processed.                    │
│ Estimated delivery: Dec 30 - Jan 2                │
│                                                   │
│ We've sent confirmation email to:                 │
│ customer@example.com                              │
│                                                   │
│ [Track Order] [Download Invoice]                 │
└───────────────────────────────────────────────────┘
```

---

## Melacak Pesanan

### My Orders Page

Akses dari: **Account → My Orders**

```
┌─ My Orders ───────────────────────────────────────┐
│                                                   │
│ Filter: [All] [Pending] [Processing] [Completed] │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ Order #ORD-2025-001234     Dec 26, 2025    │  │
│ │ Status: Processing 🔄                       │  │
│ │ Total: Rp 726,950                           │  │
│ │                                             │  │
│ │ 3 items • Expected: Dec 30 - Jan 2          │  │
│ │                                             │  │
│ │ [Track] [View Details] [Contact Seller]    │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
│ ┌─────────────────────────────────────────────┐  │
│ │ Order #ORD-2025-001200     Dec 20, 2025    │  │
│ │ Status: Delivered ✅                        │  │
│ │ Total: Rp 450,000                           │  │
│ │                                             │  │
│ │ [View Details] [Write Review] [Reorder]    │  │
│ └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Order Status

| Status | Icon | Description |
|--------|------|-------------|
| **Pending Payment** | ⏳ | Menunggu pembayaran |
| **Payment Verified** | ✅ | Pembayaran confirmed |
| **Processing** | 🔄 | Sedang diproduksi |
| **Quality Check** | 🔍 | Quality control |
| **Packing** | 📦 | Sedang dikemas |
| **Shipped** | 🚚 | Dalam pengiriman |
| **Delivered** | ✅ | Sudah sampai |
| **Completed** | ⭐ | Pesanan selesai |
| **Cancelled** | ❌ | Dibatalkan |

### Track Shipment

Klik **"Track"** untuk detail tracking:

```
┌─ Shipment Tracking ───────────────────────────────┐
│ Order: #ORD-2025-001234                           │
│ Tracking Number: JNE123456789                     │
│                                                   │
│ ● Dec 26, 14:30 - Package shipped                │
│ │ JNE Jakarta Hub                                 │
│ │                                                 │
│ ● Dec 26, 10:00 - Package ready for delivery     │
│ │ Origin facility: Jakarta                        │
│ │                                                 │
│ ● Dec 26, 08:00 - Package packed                 │
│ │ Preparing for shipment                          │
│ │                                                 │
│ ○ Dec 25, 16:00 - Order processed                │
│   Production completed                            │
│                                                   │
│ Estimated delivery: Dec 28, 2025                  │
│                                                   │
│ [Refresh] [Contact Courier]                      │
└───────────────────────────────────────────────────┘
```

### Order Details

View lengkap informasi pesanan:

```
┌─ Order Details ───────────────────────────────────┐
│ Order #ORD-2025-001234                            │
│ Order Date: Dec 26, 2025 10:30 AM                │
│ Status: Processing                                │
│                                                   │
│ ═══ Items ════════════════════════════════════   │
│ 1x Premium Metal Trophy (Medium, Brass)           │
│    Engraving: "JOHN DOE - CHAMPION 2025"          │
│    Price: Rp 300,000                              │
│                                                   │
│ 2x Glass Plaque Award (Large)                     │
│    Price: Rp 400,000                              │
│                                                   │
│ ═══ Shipping Address ═════════════════════════   │
│ John Doe                                          │
│ Jl. Sudirman No. 123                              │
│ Jakarta Selatan, DKI Jakarta 12345                │
│ Phone: 0812-3456-7890                             │
│                                                   │
│ ═══ Payment ══════════════════════════════════   │
│ Method: Bank Transfer (BCA)                       │
│ Status: Paid ✅                                   │
│ Date: Dec 26, 2025 11:15 AM                       │
│                                                   │
│ ═══ Summary ══════════════════════════════════   │
│ Subtotal:        Rp 700,000                       │
│ Discount:      - Rp 70,000                        │
│ Shipping:        Rp 25,000                        │
│ Tax:             Rp 71,950                        │
│ ──────────────────────────                        │
│ TOTAL:           Rp 726,950                       │
│                                                   │
│ [Download Invoice] [Contact Seller] [Cancel]     │
└───────────────────────────────────────────────────┘
```

---

## Review & Rating

### Write a Review

Setelah pesanan delivered, Anda bisa tulis review:

```
┌─ Write Review ────────────────────────────────────┐
│ Premium Metal Trophy                              │
│                                                   │
│ Rating *:                                         │
│ ☆☆☆☆☆ → ★★★★★                                   │
│                                                   │
│ Title *:                                          │
│ [Excellent quality trophy!______________]        │
│                                                   │
│ Your Review *:                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ The trophy looks amazing! The engraving    │   │
│ │ is perfect and the brass material is very  │   │
│ │ high quality. Highly recommended!          │   │
│ │                                            │   │
│ └────────────────────────────────────────────┘   │
│ 0/1000 characters                                 │
│                                                   │
│ Upload Photos (optional):                         │
│ [Drag photos here or click to browse]            │
│                                                   │
│ [✓] I purchased this product                      │
│                                                   │
│ [Cancel] [Submit Review]                         │
└───────────────────────────────────────────────────┘
```

### View Reviews

Lihat review dari customer lain di product detail page:

```
┌─ Customer Reviews ────────────────────────────────┐
│ ⭐ 4.8 out of 5 (24 reviews)                      │
│                                                   │
│ ★★★★★ 18 reviews (75%)                           │
│ ★★★★☆  4 reviews (17%)                           │
│ ★★★☆☆  2 reviews (8%)                            │
│ ★★☆☆☆  0 reviews (0%)                            │
│ ★☆☆☆☆  0 reviews (0%)                            │
│                                                   │
│ ┌────────────────────────────────────────────┐   │
│ │ ★★★★★ Excellent quality!                   │   │
│ │ John D. • Verified Purchase • Dec 20       │   │
│ │                                            │   │
│ │ The trophy looks amazing! The engraving    │   │
│ │ is perfect and the brass material is very  │   │
│ │ high quality.                              │   │
│ │                                            │   │
│ │ [👍 Helpful 12] [Report]                   │   │
│ └────────────────────────────────────────────┘   │
│                                                   │
│ [Load More Reviews]                               │
└───────────────────────────────────────────────────┘
```

### Helpful Reviews

Mark review yang helpful:

```
[👍 Helpful 12] [👎 Not Helpful]
```

### Report Review

Jika ada review yang inappropriate:

```
[⚠️ Report]
→ Reason: [Spam | Inappropriate | Fake | Other]
```

---

## FAQ Customer

### Order & Payment

**Q: Bagaimana cara memesan produk custom?**  
A: Pilih produk → Isi custom options (text engraving, ukuran, dll) → Preview → Add to cart → Checkout.

**Q: Metode pembayaran apa yang diterima?**  
A: Bank Transfer, Credit/Debit Card, E-Wallet (GoPay, OVO, Dana), Virtual Account, dan COD (Jakarta only).

**Q: Berapa lama proses payment verification?**  
A: 
- E-Wallet/Card: Instant
- Bank Transfer: 1-24 jam (setelah upload bukti)
- VA: Instant

**Q: Apakah saya bisa cancel order?**  
A: Ya, selama status masih "Pending Payment" atau "Payment Verified". Jika sudah "Processing", contact customer service.

### Shipping & Delivery

**Q: Berapa lama waktu pengiriman?**  
A: 
- Production: 5-7 working days
- Shipping: 2-3 days (Jakarta), 3-5 days (Java), 5-7 days (Outside Java)

**Q: Apakah ada tracking number?**  
A: Ya, tracking number akan dikirim via email dan SMS setelah produk shipped.

**Q: Bagaimana jika paket rusak saat pengiriman?**  
A: Kami packing dengan sangat baik. Jika tetap rusak, contact customer service dengan foto untuk claim asuransi.

**Q: Bisakah saya ubah alamat setelah order?**  
A: Ya, selama status belum "Shipped". Contact customer service immediately.

### Product & Customization

**Q: Apakah saya bisa lihat preview sebelum produksi?**  
A: Ya, system akan show preview after Anda isi custom options. Untuk design khusus, kami akan kirim mockup via email untuk approval.

**Q: Bagaimana jika ada typo di engraving text?**  
A: Mohon cek dengan teliti sebelum order. Setelah production start, kami tidak bisa ubah. Kami akan kirim preview untuk approval di order khusus.

**Q: Apakah bisa request design custom diluar template?**  
A: Ya! Contact customer service dengan detail requirement. Ada additional charge untuk custom design.

**Q: Material apa yang paling tahan lama?**  
A: Stainless Steel paling tahan lama dan corrosion-resistant. Brass dan Bronze juga bagus tapi akan patina over time (aged look).

### Return & Refund

**Q: Apakah bisa return/refund?**  
A: Ya, dengan syarat:
- Produk cacat manufacturing (bukan user error)
- Salah produk terkirim
- Tidak sesuai spesifikasi yang dijanjikan
- Dalam 7 hari setelah delivery

**Q: Bagaimana proses refund?**  
A: 
1. Contact customer service dengan foto/video issue
2. Return produk (kami cover shipping cost)
3. Inspection (1-2 hari)
4. Refund processed (3-7 hari ke rekening/e-wallet Anda)

**Q: Apakah bisa tukar produk?**  
A: Ya, untuk produk non-custom. Custom products tidak bisa tukar karena dibuat khusus untuk Anda.

### Account & Support

**Q: Apakah harus register untuk order?**  
A: Tidak wajib, tapi recommended untuk:
- Track orders easily
- Save addresses
- Faster checkout
- Order history
- Exclusive promos

**Q: Bagaimana cara contact customer service?**  
A: 
- Live Chat: Di website (bottom-right corner)
- WhatsApp: +62-812-3456-7890
- Email: support@canvastencil.com
- Phone: (021) 1234-5678
- Business Hours: Mon-Fri 9AM-6PM, Sat 9AM-3PM

**Q: Apakah ada warranty?**  
A: Ya! Warranty details berbeda per produk (biasanya 6-12 bulan). Check product page untuk detail.

---

## Tips Berbelanja

### 1. Baca Reviews

Selalu baca customer reviews sebelum order. Filter **4+ stars** untuk produk berkualitas terjamin.

### 2. Cek Specifications

Pastikan dimensi dan material sesuai kebutuhan Anda. Jangan ragu contact seller untuk detail lebih lanjut.

### 3. Preview Customization

Gunakan preview feature untuk ensure engraving text dan design sudah benar sebelum order.

### 4. Order Early

Untuk event khusus, order minimal 2-3 minggu sebelumnya untuk menghindari rush charges.

### 5. Promo & Discount

Subscribe newsletter untuk dapat exclusive promos dan discount codes.

### 6. Bulk Orders

Need banyak produk? Contact sales team untuk bulk pricing dan special arrangements.

---

## Contact & Support

**Customer Service:**
- 📞 Phone: (021) 1234-5678
- 📱 WhatsApp: +62-812-3456-7890
- 📧 Email: support@canvastencil.com
- 💬 Live Chat: Available di website

**Business Hours:**
- Monday - Friday: 9:00 AM - 6:00 PM WIB
- Saturday: 9:00 AM - 3:00 PM WIB
- Sunday: Closed

**Response Time:**
- Live Chat: Immediate
- WhatsApp: < 1 hour
- Email: < 24 hours
- Phone: Immediate

---

**Selamat Berbelanja!** 🎉

Terima kasih telah memilih CanvaStencil untuk kebutuhan custom etching dan award Anda. Kami committed untuk memberikan produk berkualitas tinggi dengan service excellence.

---

**Last Updated:** 2025-12-26  
**Version:** 1.0  
**Feedback:** Punya pertanyaan atau saran? Email ke feedback@canvastencil.com
