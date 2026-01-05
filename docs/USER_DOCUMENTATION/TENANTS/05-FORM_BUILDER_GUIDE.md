# 📋 Form Builder - Panduan Lengkap

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Fitur Utama](#fitur-utama)
3. [Cara Menggunakan](#cara-menggunakan)
4. [Tipe Field yang Tersedia](#tipe-field-yang-tersedia)
5. [Dynamic Fields & Repeater](#dynamic-fields--repeater)
6. [Template System](#template-system)
7. [Best Practices](#best-practices)

---

## Pengenalan

**Form Builder** adalah fitur powerful di CanvaStencil yang memungkinkan tenant untuk membuat form pemesanan produk yang **fully customizable** dan **dynamic** tanpa coding.

### Keunggulan
- ✅ **Drag & Drop** - Reorder fields dengan mudah
- ✅ **Dynamic Fields** - Field yang bisa ditambah/hapus oleh customer
- ✅ **Repeater Groups** - Group fields dengan berbagai tipe input
- ✅ **Template System** - Gunakan template siap pakai atau buat sendiri
- ✅ **Real-time Preview** - Lihat hasil langsung saat mendesain
- ✅ **Multi-tenant Safe** - Data form terpisah per tenant

---

## Fitur Utama

### 1. Field Library
Koleksi lengkap tipe input yang bisa ditambahkan ke form:

**Basic Fields:**
- Text Input, Textarea, Number, Email, Phone, URL, Date

**Selection Fields:**
- Select Dropdown, Multi Select, Radio Buttons, Checkboxes

**Advanced Fields:**
- Color Picker, File Upload, WYSIWYG Editor, **Repeater**

### 2. Field Configuration Panel
Setiap field bisa dikonfigurasi dengan detail:
- Label, placeholder, help text
- Validasi (min/max length, pattern, required)
- Default value
- Custom error messages
- Dynamic settings (untuk repeatable fields)

### 3. Live Preview (3 Mode)
Lihat tampilan form secara real-time saat kamu mendesain dengan 3 pilihan mode preview:
- **Live Panel** - Preview otomatis di panel kanan saat tidak ada field yang dipilih
- **Preview Popup** - Modal dialog (4xl) dengan toggle Desktop/Mobile view
- **Full Preview** - True fullscreen mode (fixed inset-0) dengan immersive experience

### 4. Template Selector
Pilih dari template siap pakai atau buat template kustom

### 5. Workspace Mode (IDE-Style)
Mode workspace fullscreen dengan panel management seperti IDE modern:
- **Resizable Panels** - Resize Field Library, Canvas, dan Config Panel dengan drag handle
- **Panel Visibility** - Hide/show Field Library dengan toggle button
- **Main Panel Selection** - Pilih Canvas atau Config Panel sebagai fokus utama
- **Adaptive Layout** - Panel otomatis adjust berdasarkan selection dan visibility

---

## Cara Menggunakan

### Workspace Mode (Advanced)

**Workspace Mode** adalah fitur IDE-style yang memberikan kontrol penuh terhadap layout dan panel management.

#### Mengaktifkan Workspace Mode

1. Klik tombol **"Workspace"** (icon MonitorPlay) di header kanan
2. Form Builder akan switch ke fullscreen workspace mode
3. Klik **"Exit Workspace"** untuk kembali ke normal view

#### Workspace Features

**1. Panel Visibility Toggle**
- Klik **"Field Library"** di workspace header untuk hide/show panel Field Library
- Berguna saat butuh lebih banyak space untuk Canvas atau Config Panel
- Panel yang di-hide akan otomatis adjust layout

**2. Main Panel Selection**
Pilih panel mana yang jadi fokus utama di tengah workspace:

- **Canvas Mode** (default):
  - Canvas jadi main panel di tengah
  - Field Library di kiri (optional)
  - Config Panel di kanan (muncul saat field selected)
  
- **Config Panel Mode**:
  - Config Panel jadi main panel di tengah
  - Field Library di kiri (optional)
  - Canvas jadi preview panel di kanan
  - Ideal untuk fokus edit field configuration

**Cara Switch Main Panel:**
1. Klik button **"Canvas"** atau **"Config Panel"** di workspace header
2. Layout akan otomatis adjust
3. **Note:** Config Panel mode hanya available saat ada field yang selected

**3. Resizable Panels**
Semua panel bisa di-resize dengan drag handle:
- **Vertical handles** muncul di antara panels
- **Drag handle** (icon GripVertical) untuk resize
- **Min/Max size** limits untuk prevent terlalu kecil/besar
- Size preferences auto-saved di browser

**Panel Size Limits:**
- Field Library: 15% - 30% width
- Main Panel: min 40% width
- Secondary Panel: 15% - 40% width

#### Workspace Layout Modes

**Mode 1: Full Layout (Canvas Main)**
```
┌─────────────┬──────────────────────┬────────────────┐
│   Field     │    Form Canvas       │ Field Config   │
│   Library   │    (Main Panel)      │ Panel          │
│   15-30%    │    40%+              │ 15-35%         │
└─────────────┴──────────────────────┴────────────────┘
```

**Mode 2: Hidden Library (Canvas Main)**
```
┌──────────────────────────┬────────────────┐
│    Form Canvas           │ Field Config   │
│    (Main Panel)          │ Panel          │
│    60%+                  │ 15-35%         │
└──────────────────────────┴────────────────┘
```

**Mode 3: Config Main Panel**
```
┌─────────────┬──────────────────────┬────────────────┐
│   Field     │  Field Config Panel  │ Canvas Preview │
│   Library   │  (Main Panel)        │ 15-40%         │
│   15-30%    │  40%+                │                │
└─────────────┴──────────────────────┴────────────────┘
```

#### Tips Workspace Mode

**💡 Best Practices:**
- Gunakan **Canvas Main** untuk drag & drop workflow
- Gunakan **Config Main** untuk fokus edit field properties
- Hide Field Library saat sudah tau field apa yang mau ditambah
- Resize panels sesuai monitor size dan preferences
- Kombinasi dengan keyboard shortcuts untuk max productivity

**🎯 Use Cases:**
- **Large Monitor (27"+)**: Full layout dengan semua panels visible
- **Laptop (13-15")**: Hide Field Library, fokus Canvas + Config
- **Dual Monitor**: Workspace di monitor utama, preview di monitor kedua
- **Touch Screen**: Resize panels lebih besar untuk touch-friendly

---

## Cara Menggunakan (Basic)

### Akses Form Builder

1. Login ke **Admin Panel** sebagai tenant admin
2. Navigasi ke **Products** → Pilih produk
3. Klik tab **"Form Builder"** atau tombol **"Advanced Form Builder"**
4. URL: `/admin/products/{product-uuid}/form-builder`

### Membuat Form dari Scratch

#### Step 1: Tambah Field
1. Pilih field dari **Field Library** (panel kiri)
2. Klik field yang ingin ditambahkan
3. Field akan muncul di **Form Canvas** (panel tengah)

#### Step 2: Konfigurasi Field
1. Klik field di canvas
2. **Field Configuration Panel** akan terbuka (panel kanan)
3. Atur properti field:
   - **General Tab**: Label, name, placeholder, required, dll
   - **Validation Tab**: Min/max, pattern, custom error message
   - **Nested Fields Tab** *(khusus Repeater)*: Manage nested fields

#### Step 3: Reorder Fields
1. Drag & drop field di canvas untuk mengubah urutan
2. Order number akan auto-update

#### Step 4: Save Configuration
1. Klik tombol **"Save Configuration"**
2. Form siap digunakan di halaman produk publik

### Menggunakan Template

#### Cara 1: Browse Templates
1. Klik **"Use Template"** atau **"Browse Templates"**
2. Pilih template yang sesuai
3. Klik **"Apply"**
4. Template akan di-load ke canvas
5. Customize sesuai kebutuhan

#### Cara 2: Quick Start
Jika canvas kosong, tombol template akan muncul otomatis di tengah canvas.

### Modes & Views

Form Builder menyediakan **2 workspace modes** dan **3 preview modes**:

#### Workspace Modes

**1. Normal View (Default)**
- Standard grid layout: Field Library (3 cols) - Canvas (6 cols) - Live Preview/Config (3 cols)
- Fixed panel sizes dengan responsive breakpoints
- Best for: Quick form building, standard workflow

**2. Workspace Mode (Advanced)**
- Fullscreen IDE-style layout dengan resizable panels
- Panel visibility toggles dan main panel selection
- Best for: Complex forms, focus mode, power users

**Cara Switch:** Klik tombol **"Workspace"** di header

---

### Preview Form (3 Mode)

Form Builder menyediakan **3 cara berbeda** untuk melihat preview form yang sedang kamu desain:

#### Mode 1: Live Panel (Auto Preview)
- **Lokasi**: Panel kanan (sidebar)
- **Kapan muncul**: Otomatis saat tidak ada field yang dipilih
- **Kegunaan**: Quick preview saat mendesain
- **Fitur**:
  - Real-time update saat kamu edit field
  - Sticky position mengikuti scroll
  - Tidak perlu klik tombol apapun

**Cara Pakai**:
1. Klik area kosong di canvas (deselect semua field)
2. Live Panel otomatis muncul di kanan
3. Edit field → preview langsung update

#### Mode 2: Preview Popup (Dialog)
- **Lokasi**: Modal dialog overlay
- **Kapan muncul**: Klik tombol **"Preview"** (icon Maximize2)
- **Kegunaan**: Preview dengan fokus penuh tanpa distraksi
- **Fitur**:
  - Dialog max-width 4xl (1280px)
  - Toggle **Desktop** / **Mobile** view
  - Scrollable content (max-height 90vh)
  - Clean layout tanpa sidebar

**Cara Pakai**:
1. Klik tombol **"Preview"** di header kanan
2. Dialog akan terbuka dengan form preview
3. Toggle Desktop/Mobile untuk lihat responsive design
4. Klik di luar dialog atau tombol X untuk menutup

#### Mode 3: Full Preview (True Fullscreen)
- **Lokasi**: Fullscreen overlay (fixed inset-0, z-50)
- **Kapan muncul**: Klik tombol **"Full Preview"** (icon Eye)
- **Kegunaan**: Lihat form dalam mode fullscreen murni seperti theme code editor
- **Fitur**:
  - Toggle **Desktop** / **Mobile** view
  - Background gradient + container shadow
  - **True fullscreen** (bukan modal dialog)
  - Menggantikan seluruh builder view
  - Tombol "Exit Fullscreen" atau "Close" untuk kembali

**Cara Pakai**:
1. Klik tombol **"Full Preview"** di header kanan
2. Builder akan di-replace dengan fullscreen preview
3. Toggle Desktop/Mobile untuk test responsive
4. Klik **"Close"** atau **"Exit Fullscreen"** untuk kembali ke builder

#### Perbandingan Mode Preview

| Mode | Trigger | Layout | Desktop/Mobile Toggle | Best For |
|------|---------|--------|----------------------|----------|
| **Live Panel** | Auto (no field selected) | Sidebar kanan | ❌ | Quick check saat edit |
| **Preview Popup** | Tombol "Preview" | Dialog 4xl | ✅ | Focused review tanpa distraksi |
| **Full Preview** | Tombol "Full Preview" | True fullscreen (fixed inset-0) | ✅ | Final check immersive experience |

**💡 Tips Preview:**
- Gunakan **Live Panel** untuk quick iteration saat mendesain
- Gunakan **Preview Popup** untuk review UX dengan fokus penuh (ideal untuk dual monitor)
- Gunakan **Full Preview** untuk final check sebelum save configuration (true fullscreen, no distractions)
- Test **Mobile view** di Popup/Full Preview untuk memastikan responsive design
- Preview Desktop default width: 100%, Mobile: 375px (iPhone SE)
- **Full Preview** menggantikan entire builder view - klik Close untuk kembali
- **Preview Popup** adalah dialog overlay - bisa overlap dengan builder

---

## Tipe Field yang Tersedia

### Basic Fields

#### 1. Text Input
```json
{
  "type": "text",
  "name": "customer_name",
  "label": "Nama Lengkap",
  "placeholder": "Masukkan nama lengkap",
  "required": true,
  "validation": {
    "minLength": 3,
    "maxLength": 100
  }
}
```

#### 2. Number
```json
{
  "type": "number",
  "name": "quantity",
  "label": "Jumlah Pesanan",
  "required": true,
  "validation": {
    "min": 1,
    "max": 10000
  }
}
```

#### 3. Email
```json
{
  "type": "email",
  "name": "email",
  "label": "Email",
  "required": true,
  "validation": {
    "email": true
  }
}
```

### Selection Fields

#### 4. Select Dropdown
```json
{
  "type": "select",
  "name": "size",
  "label": "Ukuran",
  "required": true,
  "options": [
    {"value": "small", "label": "Small"},
    {"value": "medium", "label": "Medium"},
    {"value": "large", "label": "Large"}
  ]
}
```

#### 5. Checkbox
```json
{
  "type": "checkbox",
  "name": "features",
  "label": "Fitur Tambahan",
  "options": [
    {"value": "gift_wrap", "label": "Gift Wrapping"},
    {"value": "express", "label": "Express Delivery"}
  ]
}
```

### Advanced Fields

#### 6. Color Picker
```json
{
  "type": "color",
  "name": "color",
  "label": "Warna",
  "defaultValue": "#FFFFFF",
  "presetColors": [
    "#FFFFFF", "#000000", "#FF0000", "#00FF00"
  ]
}
```

#### 7. File Upload
```json
{
  "type": "file",
  "name": "design_file",
  "label": "Upload Design",
  "accept": "image/*",
  "maxSize": 10485760
}
```

#### 8. WYSIWYG Editor
```json
{
  "type": "wysiwyg",
  "name": "notes",
  "label": "Catatan",
  "maxLength": 5000,
  "toolbar": [
    "bold", "italic", "underline",
    "bulletList", "orderedList"
  ]
}
```

---

## Dynamic Fields & Repeater

### Repeatable Single Field

Field biasa yang bisa di-add/delete oleh customer.

**Contoh Use Case:** Multiple phone numbers, multiple addresses

**Cara Setting:**
1. Tambah field (misal: Text Input)
2. Klik field → buka Configuration Panel
3. Di **General Tab**, aktifkan toggle **"Repeatable"**
4. Scroll ke **Dynamic Field Settings**:
   - **Min Items**: 1 (minimal harus ada 1 entry)
   - **Max Items**: 5 (maksimal 5 entries)
   - **Add Button Text**: "+ Tambah Telepon"

**Hasil di Customer View:**
```
┌─────────────────────────────────────────┐
│ No. Telepon              [+ Tambah]     │
├─────────────────────────────────────────┤
│ [08123456789            ]        [🗑️]  │
│ [08234567890            ]        [🗑️]  │
└─────────────────────────────────────────┘
```

### Repeater Group

Group beberapa field dengan tipe berbeda yang bisa di-add/delete sebagai satu unit.

**Contoh Use Case:** Teks Custom pada produk etching (teks + posisi + warna)

**Cara Membuat Repeater:**

#### Via Form Builder UI:
1. Drag field **"Repeater"** dari Field Library
2. Klik repeater field → buka Configuration Panel
3. Di **General Tab**, atur:
   - Label: "Teks Custom (Opsional)"
   - Add Button Text: "+ Tambah Teks"
   - Min Items: 0
   - Max Items: 10
4. Pindah ke tab **"Nested Fields"**
5. Klik **"Add Field"** untuk menambah nested field
6. Untuk setiap nested field, atur:
   - Field Type (text, select, color, dll)
   - Field Name (unique key)
   - Label
   - Placeholder
   - Required
   - Options *(untuk select/radio/checkbox)*

#### Contoh Struktur Repeater (Teks Custom):
```json
{
  "type": "repeater",
  "name": "customTexts",
  "label": "Teks Custom (Opsional)",
  "addButtonText": "+ Tambah Teks",
  "minItems": 0,
  "maxItems": 10,
  "helpText": "Tambahkan teks custom pada produk",
  "fields": [
    {
      "id": "text_field",
      "type": "text",
      "name": "text",
      "label": "Teks",
      "placeholder": "Masukkan teks",
      "required": true
    },
    {
      "id": "placement_field",
      "type": "select",
      "name": "placement",
      "label": "Letak Teks",
      "required": true,
      "options": [
        {"value": "depan", "label": "Depan"},
        {"value": "belakang", "label": "Belakang"}
      ],
      "defaultValue": "depan"
    },
    {
      "id": "position_field",
      "type": "select",
      "name": "position",
      "label": "Posisi Teks",
      "required": true,
      "options": [
        {"value": "atas", "label": "Atas"},
        {"value": "bawah", "label": "Bawah"},
        {"value": "tengah", "label": "Tengah"}
      ]
    },
    {
      "id": "color_field",
      "type": "color",
      "name": "color",
      "label": "Warna Teks",
      "defaultValue": "#000000",
      "presetColors": ["#000000", "#FFFFFF", "#FF0000"]
    }
  ]
}
```

**Hasil di Customer View:**
```
┌──────────────────────────────────────────────┐
│ Teks Custom (Opsional)        [+ Tambah]     │
├──────────────────────────────────────────────┤
│ ┌─ Teks Custom #1 ────────────────────[🗑️]─┐│
│ │ Teks                                      ││
│ │ [Masukkan teks custom                  ]  ││
│ │                                           ││
│ │ Letak Teks            Posisi Teks         ││
│ │ [Depan ▼]             [Atas ▼]            ││
│ │                                           ││
│ │ Warna Teks                                ││
│ │ [#000000] 🎨 Pilih dari Color Picker      ││
│ │ ⬛ Preview: #000000                        ││
│ └───────────────────────────────────────────┘│
│                                              │
│ ┌─ Teks Custom #2 ────────────────────[🗑️]─┐│
│ │ ...                                       ││
│ └───────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
Tambahkan teks custom pada produk etching
```

---

## Template System

### Template yang Tersedia

#### 1. Default Product Order Form
Template komprehensif dengan 13 fields:
- Customer Information (3 fields)
- Order Details (2 fields)
- Product Specifications (5 fields)
- Customization Options (3 fields termasuk repeater)

#### 2. Template Lainnya
- Simple Product Order
- Metal Plakat Form
- Acrylic Etching Form
- Custom Gift Form
- Dan lainnya...

### Membuat Template Kustom

**Via Seeder (Developer):**
```php
ProductFormTemplate::create([
    'name' => 'My Custom Template',
    'category' => 'custom',
    'is_system' => false,
    'is_public' => true,
    'form_schema' => [
        'fields' => [
            // ... field definitions
        ]
    ]
]);
```

---

## Best Practices

### 1. Naming Convention
- **Field Name**: Gunakan snake_case, deskriptif
  - ✅ `customer_name`, `phone_number`, `custom_texts`
  - ❌ `field1`, `data`, `x`

### 2. Validation
- Selalu set **required** untuk field yang wajib
- Gunakan **minLength/maxLength** untuk text inputs
- Set **min/max** untuk number inputs
- Tambahkan **pattern** untuk format khusus (phone, etc)

### 3. User Experience
- Gunakan **placeholder** yang jelas
- Tambahkan **helpText** untuk field yang kompleks
- Set **default value** untuk field yang sering diisi sama
- Gunakan **disabled** untuk field auto-filled

### 4. Dynamic Fields
- Set **minItems** = 0 untuk optional repeater
- Set **minItems** >= 1 untuk required repeater
- Batasi **maxItems** untuk performa (recommend max 20)
- Gunakan **addButtonText** yang deskriptif

### 5. Performance
- Jangan terlalu banyak fields (recommend max 30)
- Hindari nested repeater lebih dari 1 level
- Optimize file upload size dengan **maxSize**
- Gunakan select/radio untuk pilihan terbatas (<10 options)

### 6. Testing
- Test form di desktop dan mobile
- Test validasi setiap field
- Test dynamic add/delete functionality
- Test dengan data edge cases

---

## Troubleshooting

### Field tidak muncul di preview
- ✅ Pastikan field sudah disave
- ✅ Refresh halaman preview
- ✅ Check browser console untuk error

### Nested fields tidak bisa ditambah
- ✅ Pastikan field type = "repeater"
- ✅ Pastikan sudah klik tab "Nested Fields"
- ✅ Pastikan belum mencapai maxItems

### Validation tidak bekerja
- ✅ Check validation rules sudah di-set dengan benar
- ✅ Check tipe field sesuai dengan validation (text → minLength, number → min)
- ✅ Check custom error message sudah di-set

### Form tidak tersimpan
- ✅ Check koneksi internet
- ✅ Check console untuk API errors
- ✅ Pastikan punya permission untuk edit product
- ✅ Check field names unique (tidak ada duplicate)

---

## API Reference

### Save Form Configuration
```
POST /api/tenant/products/{uuid}/form-configuration
```

### Get Form Configuration
```
GET /api/tenant/products/{uuid}/form-configuration
```

### Get Form Templates
```
GET /api/tenant/form-templates?include_schema=true
```

---

## Roadmap Future Features

### Phase 2 (Q1 2026)
- [ ] Conditional Logic (show/hide fields based on other fields)
- [ ] Field Groups & Sections
- [ ] Multi-page Forms
- [ ] Formula Fields (calculated fields)

### Phase 3 (Q2 2026)
- [ ] Import/Export form configurations
- [ ] Form Analytics (field completion rates)
- [ ] A/B Testing for forms
- [ ] Custom Field Types (via plugins)

---

## Support

Butuh bantuan? Hubungi:
- 📧 Email: support@canvastack.com
- 💬 Slack: #form-builder-support
- 📚 Docs: https://docs.canvastack.com/form-builder

---

**Last Updated:** 5 Januari 2026  
**Version:** 1.0.0
