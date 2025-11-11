# CONTACT US/HUBUNGI KAMI MODULE
## Database Schema & API Documentation

**Module:** Content Management - Contact Us  
**Total Fields:** 35+  
**Total Tables:** 7  
**Admin Page:** `src/pages/admin/PageContact.tsx`

---

## OVERVIEW

Modul Contact Us mengelola halaman kontak dengan fitur:
1. **Hero Section** - Banner halaman kontak
2. **Contact Information** - Alamat, telepon, email, jam operasional
3. **Dynamic Form Builder** - Formulir kontak yang dapat dikustomisasi
4. **Map Integration** - Integrasi peta lokasi
5. **Quick Contacts** - WhatsApp, Telegram, dan kontak cepat lainnya
6. **Form Submissions** - Tracking dan manajemen pesan masuk

---

## DATABASE SCHEMA

### 1. Contact Hero Section

```sql
CREATE TABLE page_contact_hero (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_contact_hero ADD CONSTRAINT fk_page_contact_hero_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_contact_hero ADD CONSTRAINT unique_page_contact_hero_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_contact_hero_updated_at BEFORE UPDATE ON page_contact_hero
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Contact Information Section

```sql
CREATE TABLE page_contact_info (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_contact_info ADD CONSTRAINT fk_page_contact_info_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_contact_info ADD CONSTRAINT unique_page_contact_info_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_contact_info_updated_at BEFORE UPDATE ON page_contact_info
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_contact_info_items (
    id BIGSERIAL PRIMARY KEY,
    contact_info_id BIGINT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_contact_info_items_contact_info_id ON page_contact_info_items(contact_info_id);
CREATE INDEX idx_page_contact_info_items_display_order ON page_contact_info_items(display_order);

ALTER TABLE page_contact_info_items ADD CONSTRAINT fk_page_contact_info_items_contact_info_id 
    FOREIGN KEY (contact_info_id) REFERENCES page_contact_info(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_contact_info_items_updated_at BEFORE UPDATE ON page_contact_info_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_contact_info_items.icon_name IS 'MapPin, Phone, Mail, Clock';
COMMENT ON COLUMN page_contact_info_items.title IS 'e.g., Alamat, Telepon, Email, Jam Operasional';
COMMENT ON COLUMN page_contact_info_items.content IS 'The actual contact information';
```

**Fields:**
- `icon_name` - Icon Lucide (MapPin, Phone, Mail, Clock, Building)
- `title` - Label info kontak (contoh: "Alamat", "Telepon", "Email")
- `content` - Konten aktual (bisa multi-line untuk alamat lengkap)

### 3. Dynamic Contact Form

```sql
CREATE TABLE page_contact_form (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL DEFAULT 'Send us a message',
    subtitle TEXT NULL,
    success_message TEXT NULL DEFAULT 'Thank you! We will contact you soon.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_contact_form ADD CONSTRAINT fk_page_contact_form_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_contact_form ADD CONSTRAINT unique_page_contact_form_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_contact_form_updated_at BEFORE UPDATE ON page_contact_form
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_contact_form_fields (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'file')),
    field_label VARCHAR(255) NOT NULL,
    placeholder VARCHAR(255) NULL,
    is_required BOOLEAN DEFAULT TRUE,
    validation_rules JSONB NULL,
    options JSONB NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_contact_form_fields_form_id ON page_contact_form_fields(form_id);
CREATE INDEX idx_page_contact_form_fields_display_order ON page_contact_form_fields(display_order);

ALTER TABLE page_contact_form_fields ADD CONSTRAINT fk_page_contact_form_fields_form_id 
    FOREIGN KEY (form_id) REFERENCES page_contact_form(id) ON DELETE CASCADE;

ALTER TABLE page_contact_form_fields ADD CONSTRAINT unique_page_contact_form_fields_field_name 
    UNIQUE (form_id, field_name);

CREATE TRIGGER update_page_contact_form_fields_updated_at BEFORE UPDATE ON page_contact_form_fields
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_contact_form_fields.field_name IS 'e.g., name, email, phone, message';
COMMENT ON COLUMN page_contact_form_fields.field_label IS 'Display label';
```

**Field Types:**
- `text` - Input teks biasa (nama, subjek)
- `email` - Input email dengan validasi
- `tel` - Input nomor telepon
- `textarea` - Text area untuk pesan panjang
- `select` - Dropdown selection
- `checkbox` - Multiple choice
- `radio` - Single choice from multiple options
- `file` - Upload file attachment

**Validation Rules (JSON):**
```json
{
  "minLength": 3,
  "maxLength": 100,
  "pattern": "^[a-zA-Z\\s]+$",
  "fileTypes": ["pdf", "jpg", "png"],
  "maxFileSize": 5242880
}
```

**Options (JSON) - untuk select/radio/checkbox:**
```json
["General Inquiry", "Product Question", "Partnership", "Support"]
```

### 4. Map Integration

```sql
CREATE TABLE page_contact_map (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    zoom_level INT DEFAULT 15,
    marker_title VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_contact_map ADD CONSTRAINT fk_page_contact_map_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_contact_map ADD CONSTRAINT unique_page_contact_map_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_contact_map_updated_at BEFORE UPDATE ON page_contact_map
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_contact_map.latitude IS 'Latitude coordinate';
COMMENT ON COLUMN page_contact_map.longitude IS 'Longitude coordinate';
COMMENT ON COLUMN page_contact_map.zoom_level IS 'Map zoom level (1-20)';
COMMENT ON COLUMN page_contact_map.marker_title IS 'Marker popup title';
```

**Fields:**
- `latitude` - Koordinat latitude (-90 to 90)
- `longitude` - Koordinat longitude (-180 to 180)
- `zoom_level` - Level zoom peta (1-20, default 15)
- `marker_title` - Teks yang muncul saat marker diklik

**Example Values:**
```
Jakarta Office:
- latitude: -6.2088
- longitude: 106.8456
- zoom_level: 15
- marker_title: "Our Jakarta Office"
```

### 5. Quick Contact Options

```sql
CREATE TABLE page_contact_quick_contacts (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN ('whatsapp', 'telegram', 'line', 'phone', 'email', 'other')),
    contact_label VARCHAR(100) NOT NULL,
    contact_value VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_contact_quick_contacts_page_id ON page_contact_quick_contacts(page_id);
CREATE INDEX idx_page_contact_quick_contacts_contact_type ON page_contact_quick_contacts(contact_type);
CREATE INDEX idx_page_contact_quick_contacts_display_order ON page_contact_quick_contacts(display_order);

ALTER TABLE page_contact_quick_contacts ADD CONSTRAINT fk_page_contact_quick_contacts_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_contact_quick_contacts_updated_at BEFORE UPDATE ON page_contact_quick_contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_contact_quick_contacts.contact_label IS 'Display label';
COMMENT ON COLUMN page_contact_quick_contacts.contact_value IS 'Phone number, email, or link';
COMMENT ON COLUMN page_contact_quick_contacts.icon_name IS 'Custom icon name';
```

**Contact Types:**
- `whatsapp` - WhatsApp (contoh: "6281234567890")
- `telegram` - Telegram username (contoh: "@company_support")
- `line` - LINE ID
- `phone` - Telepon langsung
- `email` - Email
- `other` - Custom contact method

**Example Records:**
```sql
INSERT INTO page_contact_quick_contacts VALUES
(1, 1, 'whatsapp', 'Chat via WhatsApp', '6281234567890', 'MessageCircle', 1, 1),
(2, 1, 'telegram', 'Telegram Support', '@company_support', 'Send', 1, 2),
(3, 1, 'phone', 'Call Us', '+62-21-1234567', 'Phone', 1, 3),
(4, 1, 'email', 'Email Us', 'info@company.com', 'Mail', 1, 4);
```

### 6. Form Submissions

```sql
CREATE TABLE contact_form_submissions (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL,
    submission_data JSONB NOT NULL,
    submitter_ip VARCHAR(45) NULL,
    submitter_user_agent TEXT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    replied_at TIMESTAMP NULL,
    replied_by BIGINT NULL,
    reply_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_form_submissions_form_id ON contact_form_submissions(form_id);
CREATE INDEX idx_contact_form_submissions_status ON contact_form_submissions(status);
CREATE INDEX idx_contact_form_submissions_created_at ON contact_form_submissions(created_at);

ALTER TABLE contact_form_submissions ADD CONSTRAINT fk_contact_form_submissions_form_id 
    FOREIGN KEY (form_id) REFERENCES page_contact_form(id) ON DELETE CASCADE;

ALTER TABLE contact_form_submissions ADD CONSTRAINT fk_contact_form_submissions_replied_by 
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TRIGGER update_contact_form_submissions_updated_at BEFORE UPDATE ON contact_form_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN contact_form_submissions.submitter_ip IS 'IP address of submitter';
COMMENT ON COLUMN contact_form_submissions.submitter_user_agent IS 'Browser user agent';
```

**Submission Data (JSON Example):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+62 812-3456-7890",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your laser etching services..."
}
```

**Status Workflow:**
1. `new` - Baru masuk, belum dibaca
2. `read` - Sudah dibaca admin
3. `replied` - Sudah dibalas
4. `archived` - Diarsipkan

---

## API ENDPOINTS

### Public Endpoints

#### Get Contact Page Content

```http
GET /api/v1/pages/contact
```

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": 3,
      "slug": "contact",
      "title": "Contact Us"
    },
    "hero": {
      "title": "Get in Touch",
      "subtitle": "We're here to help and answer any questions"
    },
    "contactInfo": {
      "enabled": true,
      "items": [
        {
          "id": 1,
          "iconName": "MapPin",
          "title": "Our Address",
          "content": "Jl. Sudirman No. 123\nJakarta Pusat 10220\nIndonesia"
        },
        {
          "id": 2,
          "iconName": "Phone",
          "title": "Phone",
          "content": "+62 21 1234 5678"
        },
        {
          "id": 3,
          "iconName": "Mail",
          "title": "Email",
          "content": "info@company.com"
        },
        {
          "id": 4,
          "iconName": "Clock",
          "title": "Business Hours",
          "content": "Monday - Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM"
        }
      ]
    },
    "form": {
      "enabled": true,
      "title": "Send us a Message",
      "subtitle": "Fill out the form below and we'll get back to you",
      "successMessage": "Thank you! We will contact you soon.",
      "fields": [
        {
          "id": 1,
          "fieldName": "name",
          "fieldType": "text",
          "fieldLabel": "Full Name",
          "placeholder": "Enter your full name",
          "isRequired": true,
          "validationRules": {
            "minLength": 3,
            "maxLength": 100
          }
        },
        {
          "id": 2,
          "fieldName": "email",
          "fieldType": "email",
          "fieldLabel": "Email Address",
          "placeholder": "your.email@example.com",
          "isRequired": true
        },
        {
          "id": 3,
          "fieldName": "phone",
          "fieldType": "tel",
          "fieldLabel": "Phone Number",
          "placeholder": "+62 812-3456-7890",
          "isRequired": false
        },
        {
          "id": 4,
          "fieldName": "subject",
          "fieldType": "select",
          "fieldLabel": "Subject",
          "isRequired": true,
          "options": [
            "General Inquiry",
            "Product Question",
            "Partnership Opportunity",
            "Technical Support"
          ]
        },
        {
          "id": 5,
          "fieldName": "message",
          "fieldType": "textarea",
          "fieldLabel": "Message",
          "placeholder": "Tell us how we can help you...",
          "isRequired": true,
          "validationRules": {
            "minLength": 10,
            "maxLength": 1000
          }
        }
      ]
    },
    "map": {
      "enabled": true,
      "latitude": -6.2088,
      "longitude": 106.8456,
      "zoomLevel": 15,
      "markerTitle": "Visit Our Office"
    },
    "quickContacts": [
      {
        "id": 1,
        "contactType": "whatsapp",
        "label": "Chat on WhatsApp",
        "value": "6281234567890",
        "iconName": "MessageCircle"
      },
      {
        "id": 2,
        "contactType": "telegram",
        "label": "Telegram Support",
        "value": "@company_support",
        "iconName": "Send"
      }
    ]
  }
}
```

#### Submit Contact Form

```http
POST /api/v1/contact/submit
Content-Type: application/json
```

**Request Body:**
```json
{
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+62 812-3456-7890",
    "subject": "Product Question",
    "message": "I would like to know more about your laser etching services..."
  }
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Thank you! We will contact you soon.",
  "data": {
    "submissionId": 123
  }
}
```

**Response Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "email": ["The email field is required"],
      "message": ["The message must be at least 10 characters"]
    }
  }
}
```

---

### Admin Endpoints

#### Update Hero Section

```http
PUT /api/v1/admin/pages/contact/hero
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Get in Touch",
  "subtitle": "We're here to help"
}
```

#### Update Contact Info

```http
PUT /api/v1/admin/pages/contact/info
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "enabled": true,
  "items": [
    {
      "iconName": "MapPin",
      "title": "Our Address",
      "content": "Jl. Sudirman No. 123\nJakarta Pusat 10220"
    },
    {
      "iconName": "Phone",
      "title": "Phone",
      "content": "+62 21 1234 5678"
    }
  ]
}
```

#### Update Form Settings

```http
PUT /api/v1/admin/pages/contact/form
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "enabled": true,
  "title": "Send us a Message",
  "subtitle": "We'll get back to you within 24 hours",
  "successMessage": "Thank you! Your message has been sent.",
  "fields": [
    {
      "fieldName": "name",
      "fieldType": "text",
      "fieldLabel": "Full Name",
      "placeholder": "Enter your name",
      "isRequired": true,
      "validationRules": {
        "minLength": 3,
        "maxLength": 100
      }
    },
    {
      "fieldName": "email",
      "fieldType": "email",
      "fieldLabel": "Email",
      "isRequired": true
    }
  ]
}
```

#### Update Map Settings

```http
PUT /api/v1/admin/pages/contact/map
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "enabled": true,
  "latitude": -6.2088,
  "longitude": 106.8456,
  "zoomLevel": 15,
  "markerTitle": "Visit Our Office"
}
```

#### Quick Contacts CRUD

```http
POST /api/v1/admin/pages/contact/quick-contacts
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "contactType": "whatsapp",
  "label": "Chat on WhatsApp",
  "value": "6281234567890",
  "iconName": "MessageCircle",
  "enabled": true
}
```

```http
PUT /api/v1/admin/pages/contact/quick-contacts/{id}
DELETE /api/v1/admin/pages/contact/quick-contacts/{id}
```

#### Form Submissions Management

```http
GET /api/v1/admin/contact/submissions?status=new&page=1&perPage=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` - Filter: `new`, `read`, `replied`, `archived`
- `dateFrom` - YYYY-MM-DD
- `dateTo` - YYYY-MM-DD
- `page` - Page number
- `perPage` - Items per page (max 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "submissionData": {
        "name": "John Doe",
        "email": "john@example.com",
        "subject": "Product Question",
        "message": "..."
      },
      "status": "new",
      "submitterIp": "192.168.1.1",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "perPage": 20,
      "total": 45,
      "lastPage": 3
    }
  }
}
```

#### Get Single Submission

```http
GET /api/v1/admin/contact/submissions/{id}
Authorization: Bearer {token}
```

#### Update Submission Status

```http
PUT /api/v1/admin/contact/submissions/{id}/status
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "read"
}
```

#### Reply to Submission

```http
POST /api/v1/admin/contact/submissions/{id}/reply
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "replyMessage": "Thank you for contacting us. We will process your request..."
}
```

---

## VALIDATION RULES

### Form Fields
```
field_name: required|alpha_dash|max:100|unique:form_id
field_type: required|in:text,email,tel,textarea,select,checkbox,radio,file
field_label: required|string|max:255
placeholder: nullable|string|max:255
is_required: boolean
validation_rules: nullable|json
options: nullable|json|required_if:field_type,select,radio,checkbox
```

### Map Settings
```
latitude: required|numeric|min:-90|max:90
longitude: required|numeric|min:-180|max:180
zoom_level: integer|min:1|max:20
marker_title: nullable|string|max:255
```

### Quick Contacts
```
contact_type: required|in:whatsapp,telegram,line,phone,email,other
contact_label: required|string|max:100
contact_value: required|string|max:255
```

---

## BUSINESS RULES

1. **Dynamic form fields** dapat ditambah/edit/hapus sesuai kebutuhan
2. **Form submission** menyimpan data dalam format JSON untuk fleksibilitas
3. **Status workflow** harus berurutan: new → read → replied → archived
4. **Map coordinates** harus valid (latitude: -90 to 90, longitude: -180 to 180)
5. **Quick contacts** dapat diaktifkan/nonaktifkan per item
6. **WhatsApp format** tanpa "+" dan "-", hanya angka (contoh: 6281234567890)

---

**Previous:** [03-ABOUT.md](./03-ABOUT.md)  
**Next:** [05-FAQ.md](./05-FAQ.md)
