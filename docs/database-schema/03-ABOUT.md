# ABOUT US/TENTANG KAMI MODULE
## Database Schema & API Documentation

**Module:** Content Management - About Us  
**Total Fields:** 40+  
**Total Tables:** 7  
**Admin Page:** `src/pages/admin/PageAbout.tsx`

---

## OVERVIEW

Modul About Us mengelola konten halaman tentang perusahaan dengan komponen:
1. **Hero Section** - Banner halaman about
2. **Company Profile** - Informasi dasar perusahaan
3. **Mission & Vision** - Misi dan visi perusahaan
4. **Company Values** - Nilai-nilai perusahaan
5. **Team Members** - Profil tim/karyawan
6. **Company Timeline** - Sejarah perusahaan
7. **Certifications** - Sertifikat dan penghargaan

---

## DATABASE SCHEMA

### 1. About Hero Section

```sql
CREATE TABLE page_about_hero (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_about_hero ADD CONSTRAINT fk_page_about_hero_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_about_hero ADD CONSTRAINT unique_page_about_hero_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_about_hero_updated_at BEFORE UPDATE ON page_about_hero
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Company Profile

```sql
CREATE TABLE page_about_company (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    founded_year INT NULL,
    location VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_about_company ADD CONSTRAINT fk_page_about_company_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_about_company ADD CONSTRAINT unique_page_about_company_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_about_company_updated_at BEFORE UPDATE ON page_about_company
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_about_company.founded_year IS 'Year company was founded';
COMMENT ON COLUMN page_about_company.location IS 'Company headquarters location';
```

**Fields:**
- `founded_year` - Tahun perusahaan didirikan (contoh: 2015)
- `location` - Lokasi kantor pusat (contoh: "Jakarta, Indonesia")

### 3. Mission & Vision

```sql
CREATE TABLE page_about_mission_vision (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    mission_title VARCHAR(255) NULL DEFAULT 'Our Mission',
    mission_statement TEXT NULL,
    vision_title VARCHAR(255) NULL DEFAULT 'Our Vision',
    vision_statement TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_about_mission_vision ADD CONSTRAINT fk_page_about_mission_vision_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_about_mission_vision ADD CONSTRAINT unique_page_about_mission_vision_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_about_mission_vision_updated_at BEFORE UPDATE ON page_about_mission_vision
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `mission_title` - Judul bagian misi (default: "Our Mission")
- `mission_statement` - Pernyataan misi perusahaan
- `vision_title` - Judul bagian visi (default: "Our Vision")
- `vision_statement` - Pernyataan visi perusahaan

### 4. Company Values

```sql
CREATE TABLE page_about_values (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL DEFAULT 'Our Values',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_about_values ADD CONSTRAINT fk_page_about_values_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_about_values ADD CONSTRAINT unique_page_about_values_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_about_values_updated_at BEFORE UPDATE ON page_about_values
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_about_value_items (
    id BIGSERIAL PRIMARY KEY,
    values_section_id BIGINT NOT NULL,
    value_description TEXT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_about_value_items_values_section_id ON page_about_value_items(values_section_id);
CREATE INDEX idx_page_about_value_items_display_order ON page_about_value_items(display_order);

ALTER TABLE page_about_value_items ADD CONSTRAINT fk_page_about_value_items_values_section_id 
    FOREIGN KEY (values_section_id) REFERENCES page_about_values(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_about_value_items_updated_at BEFORE UPDATE ON page_about_value_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `value_description` - Deskripsi nilai perusahaan (contoh: "Integrity in everything we do")

### 5. Team Members

```sql
CREATE TABLE page_about_team_members (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    bio TEXT NULL,
    photo_url VARCHAR(500) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    linkedin_url VARCHAR(500) NULL,
    twitter_url VARCHAR(500) NULL,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_about_team_members_page_id ON page_about_team_members(page_id);
CREATE INDEX idx_page_about_team_members_display_order ON page_about_team_members(display_order);
CREATE INDEX idx_page_about_team_members_is_featured ON page_about_team_members(is_featured);

ALTER TABLE page_about_team_members ADD CONSTRAINT fk_page_about_team_members_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_about_team_members_updated_at BEFORE UPDATE ON page_about_team_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_about_team_members.position IS 'Job title/position';
COMMENT ON COLUMN page_about_team_members.bio IS 'Biography/description';
COMMENT ON COLUMN page_about_team_members.is_featured IS 'Show in featured section';
```

**Fields:**
- `name` - Nama lengkap anggota tim
- `position` - Jabatan/posisi
- `bio` - Biografi singkat
- `photo_url` - URL foto profil
- `email` - Email kontak
- `phone` - Nomor telepon
- `linkedin_url` - LinkedIn profile URL
- `twitter_url` - Twitter/X profile URL
- `is_featured` - Tampilkan di section unggulan (untuk leadership team)

### 6. Company Timeline

```sql
CREATE TABLE page_about_timeline (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    year INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_about_timeline_page_id ON page_about_timeline(page_id);
CREATE INDEX idx_page_about_timeline_year ON page_about_timeline(year);
CREATE INDEX idx_page_about_timeline_display_order ON page_about_timeline(display_order);

ALTER TABLE page_about_timeline ADD CONSTRAINT fk_page_about_timeline_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_about_timeline_updated_at BEFORE UPDATE ON page_about_timeline
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_about_timeline.year IS 'Year of the milestone';
COMMENT ON COLUMN page_about_timeline.title IS 'Milestone title';
COMMENT ON COLUMN page_about_timeline.description IS 'Detailed description';
```

**Fields:**
- `year` - Tahun kejadian penting (contoh: 2015, 2018, 2020)
- `title` - Judul milestone (contoh: "Company Founded", "Expansion to Surabaya")
- `description` - Deskripsi detail kejadian

### 7. Certifications & Awards

```sql
CREATE TABLE page_about_certifications (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_year INT NULL,
    certificate_number VARCHAR(100) NULL,
    certificate_url VARCHAR(500) NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_about_certifications_page_id ON page_about_certifications(page_id);
CREATE INDEX idx_page_about_certifications_issue_year ON page_about_certifications(issue_year);
CREATE INDEX idx_page_about_certifications_display_order ON page_about_certifications(display_order);

ALTER TABLE page_about_certifications ADD CONSTRAINT fk_page_about_certifications_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_about_certifications_updated_at BEFORE UPDATE ON page_about_certifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_about_certifications.name IS 'Certification/award name';
COMMENT ON COLUMN page_about_certifications.issuer IS 'Issuing organization';
COMMENT ON COLUMN page_about_certifications.issue_year IS 'Year received';
COMMENT ON COLUMN page_about_certifications.certificate_number IS 'Certificate ID/number';
COMMENT ON COLUMN page_about_certifications.certificate_url IS 'PDF or image URL';
```

**Fields:**
- `name` - Nama sertifikat/penghargaan (contoh: "ISO 9001:2015")
- `issuer` - Organisasi penerbit (contoh: "International Organization for Standardization")
- `issue_year` - Tahun diterbitkan
- `certificate_number` - Nomor sertifikat
- `certificate_url` - URL file sertifikat (PDF/gambar)
- `description` - Deskripsi tambahan

---

## API ENDPOINTS

### Public Endpoints

#### Get About Page Content

```http
GET /api/v1/pages/about
```

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": 2,
      "slug": "about",
      "title": "About Us",
      "publishStatus": "published"
    },
    "hero": {
      "title": "About Our Company",
      "subtitle": "Building excellence since 2015"
    },
    "company": {
      "foundedYear": 2015,
      "location": "Jakarta, Indonesia"
    },
    "missionVision": {
      "mission": {
        "title": "Our Mission",
        "statement": "To provide exceptional quality products and services that exceed customer expectations"
      },
      "vision": {
        "title": "Our Vision",
        "statement": "To become the leading provider of innovative solutions in Southeast Asia"
      }
    },
    "values": {
      "enabled": true,
      "title": "Our Core Values",
      "items": [
        {
          "id": 1,
          "description": "Integrity - We conduct business with honesty and transparency",
          "displayOrder": 1
        },
        {
          "id": 2,
          "description": "Excellence - We strive for the highest quality in everything we do",
          "displayOrder": 2
        },
        {
          "id": 3,
          "description": "Innovation - We continuously improve and adapt to changes",
          "displayOrder": 3
        }
      ]
    },
    "team": [
      {
        "id": 1,
        "name": "John Doe",
        "position": "Chief Executive Officer",
        "bio": "John has over 20 years of experience in the industry...",
        "photoUrl": "/images/team/john-doe.jpg",
        "email": "john.doe@company.com",
        "phone": "+62 812-3456-7890",
        "linkedinUrl": "https://linkedin.com/in/johndoe",
        "twitterUrl": "https://twitter.com/johndoe",
        "isFeatured": true
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "position": "Chief Technology Officer",
        "bio": "Jane leads our technology initiatives...",
        "photoUrl": "/images/team/jane-smith.jpg",
        "email": "jane.smith@company.com",
        "isFeatured": true
      }
    ],
    "timeline": [
      {
        "id": 1,
        "year": 2015,
        "title": "Company Founded",
        "description": "Started operations in Jakarta with 5 employees"
      },
      {
        "id": 2,
        "year": 2017,
        "title": "First Major Contract",
        "description": "Secured partnership with leading corporation"
      },
      {
        "id": 3,
        "year": 2020,
        "title": "Regional Expansion",
        "description": "Opened offices in Surabaya and Bandung"
      },
      {
        "id": 4,
        "year": 2023,
        "title": "ISO Certification",
        "description": "Achieved ISO 9001:2015 certification"
      }
    ],
    "certifications": [
      {
        "id": 1,
        "name": "ISO 9001:2015",
        "issuer": "International Organization for Standardization",
        "issueYear": 2023,
        "certificateNumber": "ISO-9001-2023-001",
        "certificateUrl": "/documents/iso-9001-certificate.pdf",
        "description": "Quality Management System certification"
      },
      {
        "id": 2,
        "name": "Best SME Award 2024",
        "issuer": "Indonesian Chamber of Commerce",
        "issueYear": 2024,
        "certificateUrl": "/documents/sme-award.jpg"
      }
    ],
    "seo": {
      "title": "About Us - Company Name",
      "metaDescription": "Learn about our company history, mission, vision, and team",
      "metaKeywords": ["about", "company", "team", "mission", "vision"],
      "imageUrl": "/images/og-about.jpg"
    }
  }
}
```

---

### Admin Endpoints

#### Update Hero Section

```http
PUT /api/v1/admin/pages/about/hero
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "About Our Company",
  "subtitle": "Excellence in quality since 2015"
}
```

#### Update Company Profile

```http
PUT /api/v1/admin/pages/about/company
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "foundedYear": 2015,
  "location": "Jakarta, Indonesia"
}
```

#### Update Mission & Vision

```http
PUT /api/v1/admin/pages/about/mission-vision
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "mission": {
    "title": "Our Mission",
    "statement": "To provide exceptional quality products..."
  },
  "vision": {
    "title": "Our Vision",
    "statement": "To become the leading provider..."
  }
}
```

#### Update Company Values

```http
PUT /api/v1/admin/pages/about/values
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "enabled": true,
  "title": "Our Core Values",
  "items": [
    {
      "description": "Integrity - Honesty in all dealings"
    },
    {
      "description": "Excellence - Striving for the best"
    },
    {
      "description": "Innovation - Continuous improvement"
    }
  ]
}
```

#### Team Members CRUD

```http
GET /api/v1/admin/pages/about/team
Authorization: Bearer {token}
```

```http
POST /api/v1/admin/pages/about/team
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "John Doe",
  "position": "CEO",
  "bio": "Experienced leader with 20 years in the industry",
  "photoUrl": "/uploads/team/john-doe.jpg",
  "email": "john@company.com",
  "phone": "+62 812-3456-7890",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "twitterUrl": null,
  "isFeatured": true
}
```

```http
PUT /api/v1/admin/pages/about/team/{id}
Authorization: Bearer {token}
```

```http
DELETE /api/v1/admin/pages/about/team/{id}
Authorization: Bearer {token}
```

#### Timeline CRUD

```http
POST /api/v1/admin/pages/about/timeline
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "year": 2015,
  "title": "Company Founded",
  "description": "Started operations with 5 employees"
}
```

```http
PUT /api/v1/admin/pages/about/timeline/{id}
Authorization: Bearer {token}
```

```http
DELETE /api/v1/admin/pages/about/timeline/{id}
Authorization: Bearer {token}
```

#### Certifications CRUD

```http
POST /api/v1/admin/pages/about/certifications
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "ISO 9001:2015",
  "issuer": "International Organization for Standardization",
  "issueYear": 2023,
  "certificateNumber": "ISO-9001-2023-001",
  "certificateUrl": "/uploads/certificates/iso-9001.pdf",
  "description": "Quality Management System certification"
}
```

```http
PUT /api/v1/admin/pages/about/certifications/{id}
Authorization: Bearer {token}
```

```http
DELETE /api/v1/admin/pages/about/certifications/{id}
Authorization: Bearer {token}
```

---

## VALIDATION RULES

### Hero Section
```
title: required|string|max:255
subtitle: nullable|string|max:1000
```

### Company Profile
```
founded_year: nullable|integer|min:1800|max:current_year
location: nullable|string|max:255
```

### Mission & Vision
```
mission_title: nullable|string|max:255
mission_statement: nullable|string|max:2000
vision_title: nullable|string|max:255
vision_statement: nullable|string|max:2000
```

### Values
```
value_description: required|string|min:10|max:500
```

### Team Members
```
name: required|string|max:255
position: required|string|max:255
bio: nullable|string|max:2000
photo_url: nullable|url|max:500
email: nullable|email|max:255
phone: nullable|string|max:50
linkedin_url: nullable|url|max:500
twitter_url: nullable|url|max:500
is_featured: boolean
```

### Timeline
```
year: required|integer|min:1800|max:current_year+10
title: required|string|max:255
description: nullable|string|max:1000
```

### Certifications
```
name: required|string|max:255
issuer: required|string|max:255
issue_year: nullable|integer|min:1800|max:current_year
certificate_number: nullable|string|max:100
certificate_url: nullable|url|max:500
description: nullable|string|max:1000
```

---

## BUSINESS RULES

1. **Timeline items** harus diurutkan berdasarkan tahun (ascending/descending)
2. **Featured team members** ditampilkan terpisah (biasanya untuk leadership)
3. **Certificate URL** bisa berupa PDF atau gambar
4. **Social media URLs** optional, tidak semua team member harus punya
5. **Company values** tidak ada batasan jumlah item, tapi disarankan 3-7 items
6. **Founded year** tidak boleh di masa depan

---

**Previous:** [02-HOMEPAGE.md](./02-HOMEPAGE.md)  
**Next:** [04-CONTACT.md](./04-CONTACT.md)
