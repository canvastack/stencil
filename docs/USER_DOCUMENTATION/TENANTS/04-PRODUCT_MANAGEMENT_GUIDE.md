# Panduan Manajemen Produk - Admin Tenant

**Target:** Admin Tenant (Business Owner, Store Manager, Catalog Manager)  
**Version:** 1.0  
**Last Updated:** 2025-12-26

---

## 📋 Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Mengakses Product Catalog](#mengakses-product-catalog)
3. [Menambah Produk Baru](#menambah-produk-baru)
4. [Mengedit Produk](#mengedit-produk)
5. [Mengelola Kategori Produk](#mengelola-kategori-produk)
6. [Mengatur Stok dan Inventory](#mengatur-stok-dan-inventory)
7. [Kustomisasi Produk](#kustomisasi-produk)
8. [Filter dan Pencarian](#filter-dan-pencarian)
9. [Bulk Operations](#bulk-operations)
10. [Best Practices](#best-practices)
11. [FAQ](#faq)

---

## Pengenalan

### Apa itu Product Catalog?

Product Catalog adalah sistem manajemen produk lengkap yang memungkinkan Anda untuk:

✅ **Mengelola katalog produk** dengan mudah  
✅ **Mengatur harga dan stok** real-time  
✅ **Menambah opsi kustomisasi** untuk customer  
✅ **Filter dan search** produk dengan cepat  
✅ **Update massal** untuk efisiensi  
✅ **Monitor performa** produk dengan analytics

### Fitur Utama

- **Multi-Type Support:** Metal Etching, Glass Etching, Award Plaque
- **Advanced Filtering:** Type, Size, Material, Category, Rating
- **Custom Options:** Text input, dropdown, checkbox untuk personalisasi
- **Rich Media:** Upload multiple images dengan drag & drop
- **SEO Friendly:** Auto-generate slug, meta description
- **Real-time Stock:** Update otomatis saat ada pesanan

---

## Mengakses Product Catalog

### Login ke Admin Dashboard

1. Buka URL tenant Anda: `https://canvastencil.com/{tenant-slug}/admin`
2. Login dengan kredensial admin
3. Klik menu **"Products"** di sidebar

### Dashboard Overview

Setelah masuk ke Product Catalog, Anda akan melihat:

- **Total Products:** Jumlah produk (All / Published / Draft / Archived)
- **Low Stock Alerts:** Produk dengan stok menipis
- **Recent Products:** Produk yang baru ditambahkan
- **Top Performing:** Produk dengan penjualan tertinggi

### Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│  [+ Add Product]  [Import]  [Export]       [🔍 Search]  │
├─────────────────────────────────────────────────────────┤
│  Filters: [Type ▼] [Category ▼] [Status ▼] [Reset]     │
├──────┬────────────────────┬────────┬────────┬───────────┤
│ ☐    │ Product Name       │ Price  │ Stock  │ Actions   │
├──────┼────────────────────┼────────┼────────┼───────────┤
│ ☐    │ Metal Trophy       │ 150K   │ 50     │ [⋮]       │
│ ☐    │ Glass Plaque       │ 200K   │ 30     │ [⋮]       │
│ ☐    │ Award Medal        │ 75K    │ 100    │ [⋮]       │
└──────┴────────────────────┴────────┴────────┴───────────┘
         Showing 1-10 of 106 products
```

---

## Menambah Produk Baru

### Step 1: Klik "Add Product"

Klik tombol **"+ Add Product"** di pojok kanan atas.

### Step 2: Isi Informasi Dasar

#### **Basic Information**

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **Product Name** | ✅ Yes | Nama produk (max 255 karakter) | "Premium Metal Trophy" |
| **Slug** | Auto | URL-friendly name (auto-generated) | "premium-metal-trophy" |
| **Description** | ✅ Yes | Deskripsi singkat (maks 500 karakter) | "Trophy berkualitas tinggi..." |
| **Long Description** | No | Detail lengkap dengan HTML support | (Rich text editor) |

**Tips:**
- Gunakan nama yang descriptive dan SEO-friendly
- Description singkat tampil di product cards
- Long description tampil di detail page

#### **Product Type**

| Field | Required | Options | Description |
|-------|----------|---------|-------------|
| **Technical Type** | ✅ Yes | Physical / Digital / Service | Jenis produk secara teknis |
| **Business Type** | ✅ Yes | Metal Etching / Glass Etching / Award Plaque | Kategori bisnis |

**Example:** Untuk trophy logam:
- Technical Type: `Physical`
- Business Type: `Metal Etching`

### Step 3: Set Harga dan Stok

#### **Pricing**

| Field | Required | Format | Example |
|-------|----------|--------|---------|
| **Price** | ✅ Yes | Rupiah (integer) | 150000 |
| **Currency** | ✅ Yes | IDR / USD / etc | IDR |
| **Discount** | No | Percentage | 10% |

**Tips:**
- Harga disimpan dalam satuan penuh (bukan cents)
- System akan otomatis format dengan separator ribuan
- Discount akan otomatis calculate harga final

#### **Inventory**

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| **SKU** | No | Stock Keeping Unit | MET-001 |
| **Stock Quantity** | ✅ Yes | Jumlah stok | 50 |
| **Low Stock Threshold** | No | Alert saat stok kurang dari | 10 |

**Stock Status (Auto-calculated):**
- **In Stock:** `quantity > low_stock_threshold`
- **Low Stock:** `quantity <= low_stock_threshold && quantity > 0`
- **Out of Stock:** `quantity = 0`

### Step 4: Pilih Kategori

1. Klik dropdown **"Category"**
2. Pilih kategori yang sesuai (contoh: "Trophies & Awards")
3. Optional: Isi subcategory (contoh: "Sports Trophy")

**Available Categories:**
- Trophies & Awards
- Corporate Gifts
- Personalized Items
- Signage & Displays
- Promotional Products

### Step 5: Upload Images

#### **Image Upload Guidelines**

✅ **Format Accepted:** JPG, PNG, WebP  
✅ **Max File Size:** 5MB per image  
✅ **Recommended Size:** 1200x1200px (square)  
✅ **Maximum Images:** 5 images per product

**Upload Methods:**

**A. Drag & Drop:**
1. Drag file dari komputer Anda
2. Drop ke area upload
3. Wait for processing

**B. Click to Browse:**
1. Klik area upload
2. Select files dari file explorer
3. Klik "Open"

**Tips:**
- Image pertama akan menjadi thumbnail
- Drag untuk re-order images
- Gunakan high-quality images untuk profesional look

### Step 6: Material & Specifications

#### **Materials**

| Field | Description | Example |
|-------|-------------|---------|
| **Primary Material** | Material utama | Stainless Steel |
| **Available Materials** | Multiple options (JSON array) | ["Stainless Steel", "Brass", "Bronze"] |
| **Available Sizes** | Multiple size options | ["Small", "Medium", "Large"] |
| **Quality Levels** | Tier kualitas | ["Standard", "Premium", "Deluxe"] |

#### **Specifications**

Specifications disimpan sebagai key-value pairs:

```json
{
  "weight": "500g",
  "dimensions": "15cm x 10cm x 5cm",
  "finish": "Polished",
  "engraving_area": "10cm x 8cm"
}
```

**Contoh Pengisian:**

| Key | Value |
|-----|-------|
| weight | 500g |
| dimensions | 15cm x 10cm x 5cm |
| finish | Polished |

### Step 7: Features & Benefits

Tambahkan bullet points untuk highlight features:

**Example:**
- ✨ Laser precision etching
- 🛡️ Weatherproof coating
- 🎁 Custom engraving included
- 📦 Premium gift box packaging

**Format:**
- Satu feature per line
- Maksimal 10 features
- Gunakan emoji untuk visual appeal (optional)

### Step 8: Customization Options

Enable custom options jika produk bisa dipersonalisasi.

#### **Toggle Customization**

```
[✓] This product is customizable
```

#### **Add Custom Options**

**Example 1: Text Input**
```
Option Name: Engraving Text
Type: Text
Required: No
Max Length: 100 characters
Price Modifier: +0
```

**Example 2: Dropdown Selection**
```
Option Name: Size
Type: Select
Required: Yes
Options:
  - Small (10cm) +0
  - Medium (15cm) +50000
  - Large (20cm) +100000
```

**Example 3: Checkbox**
```
Option Name: Premium Gift Box
Type: Checkbox
Required: No
Price Modifier: +25000
```

**Available Option Types:**
- **Text:** Free text input
- **Textarea:** Multi-line text
- **Select:** Dropdown menu
- **Number:** Numeric input
- **Checkbox:** Yes/No option

### Step 9: Ordering Information

| Field | Description | Example |
|-------|-------------|---------|
| **Lead Time** | Waktu produksi | "5-7 hari kerja" |
| **Min Order Quantity** | Minimum order | 1 |
| **Max Order Quantity** | Maximum per order | 100 |
| **Production Type** | On-demand / Stock | "on_demand" |

### Step 10: Set Status & Publish

#### **Product Status**

| Status | Description | Visibility |
|--------|-------------|------------|
| **Draft** | Belum siap publish | Admin only |
| **Published** | Aktif di store | Public |
| **Archived** | Discontinued | Hidden |

#### **Additional Options**

```
[✓] Featured Product (tampil di homepage)
[ ] New Arrival (badge "NEW")
[ ] Best Seller (badge "BEST SELLER")
```

### Step 11: Save Product

1. Review semua informasi
2. Klik **"Save as Draft"** (untuk save tanpa publish)
3. Atau klik **"Publish"** (untuk langsung tayang)

**Success Message:**
```
✅ Product created successfully!
   View product | Edit product | Add another
```

---

## Mengedit Produk

### Quick Edit

Untuk perubahan cepat (harga, stok, status):

1. Hover produk di tabel
2. Klik icon **"Quick Edit"** (⚡)
3. Edit field yang diperlukan
4. Klik **"Save"**

**Fields tersedia di Quick Edit:**
- Price
- Stock Quantity
- Status
- Featured flag

### Full Edit

Untuk perubahan komprehensif:

1. Klik produk atau icon **"Edit"** (✏️)
2. Edit fields yang diperlukan
3. Klik **"Update Product"**

### Version History

System menyimpan history perubahan:

```
📜 Version History
   
   2025-12-26 10:30 | admin@tenant.com
   Updated: Price (150K → 175K), Stock (50 → 45)
   
   2025-12-25 14:15 | manager@tenant.com
   Updated: Description, Added image
   
   2025-12-20 09:00 | admin@tenant.com
   Created product
```

### Duplicate Product

Untuk create product serupa:

1. Klik **"Duplicate"** (📋)
2. Edit fields yang berbeda
3. Save as new product

**Use Cases:**
- Create product variants
- Similar products dengan sedikit perbedaan
- Seasonal versions

---

## Mengelola Kategori Produk

### Akses Category Management

**Menu:** Products → Categories

### Create New Category

1. Klik **"+ Add Category"**
2. Isi informasi:
   - **Name:** Nama kategori (contoh: "Trophies & Awards")
   - **Slug:** URL-friendly (auto-generated)
   - **Description:** Deskripsi kategori
   - **Parent Category:** (optional) untuk subcategory
   - **Icon:** Upload icon (optional)
3. Klik **"Save"**

### Nested Categories

Struktur hierarki:

```
Trophies & Awards (parent)
├── Sports Trophies (child)
├── Academic Awards (child)
└── Corporate Recognition (child)

Corporate Gifts (parent)
├── Desktop Items (child)
├── Office Accessories (child)
└── Executive Gifts (child)
```

### Edit Category

1. Find category di list
2. Klik **"Edit"**
3. Update fields
4. Klik **"Update"**

### Delete Category

⚠️ **Warning:** Deleting category akan:
- Set products ke "Uncategorized"
- Remove dari navigation menu
- Cannot be undone

**Steps:**
1. Klik **"Delete"** (🗑️)
2. Confirm action
3. Category moved to trash

---

## Mengatur Stok dan Inventory

### Manual Stock Update

#### **Single Product:**

1. Go to product edit page
2. Update **"Stock Quantity"** field
3. Klik **"Save"**

#### **Bulk Update:**

1. Select multiple products (checkbox)
2. Klik **"Bulk Actions"** → **"Update Stock"**
3. Pilih operation:
   - **Set to:** Set exact quantity
   - **Increase by:** Add quantity
   - **Decrease by:** Reduce quantity
4. Klik **"Apply"**

### Low Stock Alerts

System akan send email notification saat:
- Stock ≤ Low Stock Threshold
- Stock = 0 (Out of stock)

**Configure Alerts:**

Settings → Notifications → Inventory Alerts
```
[✓] Email me when stock is low
[✓] Email me when stock is out
    Alert Recipients: admin@tenant.com, inventory@tenant.com
```

### Stock History

Track semua perubahan stok:

```
📊 Stock History - Premium Metal Trophy

2025-12-26 14:30 | Order #1234 | -2 units | Stock: 48
2025-12-26 10:15 | Manual Adjustment | +5 units | Stock: 50
2025-12-25 16:45 | Order #1233 | -1 unit | Stock: 45
2025-12-24 09:00 | Stock Reorder | +30 units | Stock: 46
```

### Inventory Reports

**Menu:** Products → Reports → Inventory

**Available Reports:**
- **Stock Summary:** Current stock levels
- **Low Stock Report:** Products below threshold
- **Stock Movement:** In/out transactions
- **Valuation Report:** Total inventory value

**Export Options:**
- PDF
- Excel (XLSX)
- CSV

---

## Kustomisasi Produk

### Enable Product Customization

Product detail page → **Customization** tab:

```
[✓] Enable customization for this product
```

### Add Custom Fields

**Common Use Cases:**

#### **1. Text Engraving**

```
Field Type: Text
Label: "Engraving Text"
Required: No
Max Length: 100
Placeholder: "Enter text to be engraved"
Price: +0
```

**Customer Experience:**
```
┌─────────────────────────────────────┐
│ Engraving Text (optional)           │
│ ┌─────────────────────────────────┐ │
│ │ John Doe - Champion 2025        │ │
│ └─────────────────────────────────┘ │
│ 0/100 characters                    │
└─────────────────────────────────────┘
```

#### **2. Size Selection**

```
Field Type: Dropdown
Label: "Size"
Required: Yes
Options:
  - Small (10cm) | +0
  - Medium (15cm) | +50,000
  - Large (20cm) | +100,000
```

**Customer Experience:**
```
┌─────────────────────────────────────┐
│ Size *                              │
│ ┌─────────────────────────────────┐ │
│ │ Medium (15cm)        ▼          │ │
│ └─────────────────────────────────┘ │
│ +Rp 50,000                          │
└─────────────────────────────────────┘
```

#### **3. Material Choice**

```
Field Type: Select
Label: "Material"
Required: Yes
Options:
  - Stainless Steel | +0
  - Brass | +75,000
  - Bronze | +100,000
```

#### **4. Gift Box**

```
Field Type: Checkbox
Label: "Premium Gift Box"
Required: No
Price: +25,000
Description: "Includes velvet-lined presentation box"
```

**Customer Experience:**
```
┌─────────────────────────────────────┐
│ [✓] Premium Gift Box    +Rp 25,000  │
│     Includes velvet-lined           │
│     presentation box                │
└─────────────────────────────────────┘
```

### Price Calculation

System akan automatically calculate total price:

```
Base Price:           Rp 150,000
Size (Medium):        + Rp 50,000
Material (Brass):     + Rp 75,000
Gift Box:             + Rp 25,000
─────────────────────────────────────
TOTAL:                Rp 300,000
```

### Preview Custom Options

Before saving, preview bagaimana customer akan melihat custom options:

1. Scroll ke **"Preview"** section
2. Try mengisi custom fields
3. Check price calculation
4. Verify validation rules

---

## Filter dan Pencarian

### Search Products

**Global Search Box:**
```
🔍 [Search products by name, SKU, or description]
```

**Search Behavior:**
- Case-insensitive
- Searches in: name, description, SKU
- Real-time results (debounced 300ms)
- Supports partial matching

### Filter Options

#### **1. Business Type Filter**

```
Type: [ All Types ▼ ]
      - All Types
      - Metal Etching
      - Glass Etching
      - Award Plaque
```

#### **2. Category Filter**

```
Category: [ All Categories ▼ ]
          - All Categories
          - Trophies & Awards
          - Corporate Gifts
          - Personalized Items
```

#### **3. Status Filter**

```
Status: [ All Status ▼ ]
        - All Status
        - Published
        - Draft
        - Archived
```

#### **4. Stock Filter**

```
Stock: [ All ▼ ]
       - All
       - In Stock
       - Low Stock
       - Out of Stock
```

#### **5. Price Range**

```
Price: [Min: ______] - [Max: ______]
       Preset: [ All | Under 100K | 100K-500K | 500K+ ]
```

### Advanced Filters

Klik **"Advanced Filters"** untuk lebih banyak options:

- **Date Added:** Last 7 days / Last 30 days / Custom range
- **Featured:** Yes / No
- **Material:** Metal / Glass / Acrylic / Wood
- **Size:** Small / Medium / Large
- **Rating:** 1-5 stars

### Save Filter Presets

Untuk frequently used filters:

1. Set filters yang diinginkan
2. Klik **"Save as Preset"**
3. Beri nama (contoh: "Low Stock Metal Products")
4. Klik **"Save"**

**Use Preset:**
```
Presets: [ My Presets ▼ ]
         - Low Stock Metal Products
         - New Arrivals This Month
         - Featured Products
         - [Create New Preset]
```

---

## Bulk Operations

### Select Multiple Products

**Methods:**

**1. Manual Selection:**
- Check individual checkboxes
- Shows: "3 products selected"

**2. Select All on Page:**
- Check header checkbox
- Shows: "12 products selected on this page"

**3. Select All Matching Filter:**
- Klik "Select all 106 products matching current filter"
- Shows: "106 products selected"

### Available Bulk Actions

#### **1. Update Status**

```
Bulk Actions: [ Update Status ▼ ] [Apply]

Options:
- Publish selected products
- Move to draft
- Archive selected products
```

**Result:**
```
✅ Successfully updated 15 products
❌ Failed to update 2 products:
   - Product X: Already published
   - Product Y: Insufficient permissions
```

#### **2. Update Price**

```
Bulk Actions: [ Update Price ▼ ] [Apply]

Price Operation:
○ Set to exact price
○ Increase by amount
○ Increase by percentage
○ Decrease by amount
○ Decrease by percentage

Amount: [_______] [Apply]
```

**Example:**
- Select 10 products
- Choose "Increase by percentage"
- Enter "10" (10% increase)
- Klik "Apply"

**Result:**
```
✅ 10 products updated successfully

   Product A: 100K → 110K
   Product B: 150K → 165K
   Product C: 200K → 220K
   ...
```

#### **3. Update Category**

```
Bulk Actions: [ Change Category ▼ ] [Apply]

New Category: [ Select Category ▼ ]
              - Trophies & Awards
              - Corporate Gifts
              - ...

[Apply]
```

#### **4. Set Featured**

```
Bulk Actions: [ Set Featured ▼ ] [Apply]

Options:
- Mark as Featured
- Remove Featured flag
```

#### **5. Update Stock**

```
Bulk Actions: [ Update Stock ▼ ] [Apply]

Stock Operation:
○ Set to exact quantity
○ Increase by
○ Decrease by

Quantity: [_______] [Apply]
```

#### **6. Export Selected**

```
Bulk Actions: [ Export ▼ ] [Apply]

Format:
○ CSV
○ Excel (XLSX)
○ PDF

[Export]
```

#### **7. Duplicate Products**

```
Bulk Actions: [ Duplicate ▼ ] [Apply]

Creates copies of selected products with:
- Same attributes
- " (Copy)" appended to name
- Status set to "Draft"
```

#### **8. Delete Products**

⚠️ **Danger Zone**

```
Bulk Actions: [ Delete ▼ ] [Apply]

⚠️ Warning: This will archive selected products.
   They can be restored from trash within 30 days.

[ ] I understand the consequences
[Cancel] [Delete Products]
```

---

## Best Practices

### 1. Product Naming

✅ **DO:**
- Use clear, descriptive names
- Include key features (size, material)
- Make it SEO-friendly

Example: "Premium Stainless Steel Trophy - 15cm"

❌ **DON'T:**
- Use generic names ("Trophy 1", "Product A")
- All caps ("TROPHY")
- Special characters excessively

### 2. Product Images

✅ **DO:**
- Use high-resolution images (min 1200x1200px)
- Show product from multiple angles
- Use white or neutral background
- Consistent lighting

❌ **DON'T:**
- Upload blurry or pixelated images
- Use watermarks (except brand logo)
- Mixed image styles

### 3. Pricing Strategy

✅ **DO:**
- Research competitor pricing
- Use psychological pricing (149K instead of 150K)
- Offer volume discounts
- Regular price reviews

❌ **DON'T:**
- Price too low (undervalues product)
- Frequent price changes (confuses customers)
- Forget to update after cost changes

### 4. Product Descriptions

✅ **DO:**
- Focus on benefits, not just features
- Use bullet points for readability
- Include dimensions and specifications
- Answer common questions

**Example:**
```
✨ Features & Benefits:

• Laser-precision etching ensures intricate details
• Weatherproof coating protects against elements
• Custom engraving included in price
• Premium gift box packaging for special occasions

📏 Specifications:
• Material: Stainless Steel
• Dimensions: 15cm (H) x 10cm (W) x 5cm (D)
• Weight: 500g
• Finish: Polished Mirror

⏱️ Production:
• Lead time: 5-7 business days
• Rush service available (+50%)
```

❌ **DON'T:**
- Copy-paste from competitors
- Use generic templates
- Forget to proofread
- Leave specifications incomplete

### 5. Inventory Management

✅ **DO:**
- Set appropriate low stock thresholds
- Regular stock audits (weekly/monthly)
- Enable low stock alerts
- Buffer stock for popular items

❌ **DON'T:**
- Oversell (stock goes negative)
- Ignore low stock warnings
- Forget to update after manual adjustments

### 6. Category Organization

✅ **DO:**
- Create logical category hierarchy
- Limit to 3 levels deep max
- Use clear, intuitive names
- One product, one primary category

❌ **DON'T:**
- Create too many categories (confusing)
- Use overlapping categories
- Leave products uncategorized

### 7. SEO Optimization

✅ **DO:**
- Use keywords in product name
- Write unique descriptions (no duplicates)
- Use descriptive file names for images
- Add alt text to images

**Example:**
```
Product Name: Premium Metal Trophy Award for Sports Champions
Slug: premium-metal-trophy-award-sports
Alt Text: Stainless steel trophy with gold plating
```

❌ **DON'T:**
- Keyword stuffing
- Duplicate content
- Generic image names (IMG_1234.jpg)

---

## FAQ

### General Questions

**Q: Berapa lama produk baru akan tampil di store?**  
A: Produk dengan status "Published" akan langsung tampil di public store. Tidak ada delay.

**Q: Apakah saya bisa undo setelah delete produk?**  
A: Ya, produk yang di-delete masuk ke Trash dan bisa di-restore dalam 30 hari. Setelah itu permanent delete.

**Q: Bagaimana cara set produk sebagai "New Arrival"?**  
A: Tidak perlu manual setting. System otomatis menampilkan badge "NEW" untuk produk yang dibuat dalam 30 hari terakhir.

**Q: Apakah ada limit jumlah produk yang bisa saya buat?**  
A: Tergantung subscription plan Anda:
- Starter: 100 products
- Business: 1,000 products
- Enterprise: Unlimited

### Pricing & Stock

**Q: Bagaimana cara set diskon untuk produk tertentu?**  
A: Ada 2 cara:
1. **Product-level discount:** Edit product → Set discount percentage
2. **Promotional discount:** Marketing → Promotions → Create discount campaign

**Q: Stock saya berkurang sendiri, kenapa?**  
A: Stock otomatis berkurang saat:
- Customer complete order (status: paid)
- Admin create order di backend
- Stock adjustment via API

Check Stock History untuk detail perubahan.

**Q: Apakah saya bisa set different prices untuk different customer groups?**  
A: Ya, gunakan fitur "Customer Group Pricing":
- Settings → Pricing Rules
- Create rules based on customer groups (retail, wholesale, VIP)

### Customization

**Q: Bagaimana cara limit jumlah karakter untuk engraving?**  
A: Saat create custom option:
- Type: Text
- Max Length: [number]
- System akan enforce limit di frontend

**Q: Apakah custom options affect inventory?**  
A: Tidak, custom options tidak affect stock quantity. Stock tracked di product level, bukan variant level.

**Q: Bagaimana cara preview customization sebelum publish?**  
A: Gunakan "Preview" button di product edit page. Anda bisa test semua custom options sebagai customer.

### Technical

**Q: Format apa yang supported untuk product import?**  
A: CSV dan Excel (XLSX). Download template dari Import page.

**Q: Apakah saya bisa export products untuk backup?**  
A: Ya, klik Export → Select format (CSV/Excel/PDF) → Download.

**Q: Bagaimana cara integrate dengan external inventory system?**  
A: Gunakan API integration:
- Documentation: Admin → API Docs
- Generate API token: Settings → API Keys
- Sync via webhook or scheduled jobs

### Images

**Q: Berapa ukuran maksimum untuk upload image?**  
A: 5MB per image. Recommended: 1200x1200px untuk kualitas optimal.

**Q: Format image apa yang di-support?**  
A: JPG, PNG, WebP. System akan auto-optimize untuk web.

**Q: Apakah images di-resize otomatis?**  
A: Ya, system generate multiple sizes:
- Thumbnail: 150x150px
- Card: 400x400px
- Detail: 800x800px
- Full: Original size

### SEO

**Q: Apakah slug bisa di-customize?**  
A: Ya, edit product → URL slug. Tapi sebaiknya biarkan auto-generate untuk konsistensi.

**Q: Bagaimana cara improve SEO produk saya?**  
A: Tips:
1. Use descriptive product names
2. Write unique descriptions (min 150 words)
3. Add alt text to images
4. Use relevant categories
5. Add product tags

**Q: Apakah ada sitemap untuk products?**  
A: Ya, auto-generated di: `{your-domain}/sitemap.xml`

---

## Troubleshooting

### Common Issues

#### **1. Product tidak tampil di store**

**Checklist:**
- [ ] Status = "Published" (bukan Draft/Archived)
- [ ] Stock > 0 atau "Allow backorder" enabled
- [ ] Price set (bukan 0 atau null)
- [ ] Images uploaded (min 1 image)
- [ ] Clear browser cache

#### **2. Image tidak ke-upload**

**Solutions:**
- Check file size (max 5MB)
- Check format (JPG/PNG/WebP only)
- Check internet connection
- Try different browser
- Contact support jika persists

#### **3. Filter tidak working**

**Solutions:**
- Clear filter dan re-apply
- Refresh page
- Clear browser cache
- Check if products actually match filter criteria

#### **4. Bulk update failed**

**Common Causes:**
- Selected products from different tenants
- Insufficient permissions
- Validation errors on some products

**Solution:**
- Check error messages for details
- Update products in smaller batches
- Verify permissions with admin

---

## Support & Resources

**Help Center:** https://help.canvastencil.com  
**Video Tutorials:** https://canvastencil.com/tutorials  
**Community Forum:** https://community.canvastencil.com  
**Email Support:** support@canvastencil.com  
**Live Chat:** Available in admin dashboard (bottom-right)

**Business Hours:**  
Monday - Friday: 9:00 - 18:00 WIB  
Saturday: 9:00 - 15:00 WIB  
Sunday: Closed

---

**Last Updated:** 2025-12-26  
**Version:** 1.0  
**Feedback:** Punya saran untuk improve documentation ini? Email ke docs@canvastencil.com
