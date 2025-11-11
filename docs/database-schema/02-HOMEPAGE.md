# HOMEPAGE/BERANDA MODULE
## Database Schema & API Documentation

**Module:** Content Management - Homepage  
**Total Fields:** 80+  
**Total Tables:** 17  
**Admin Page:** `src/pages/admin/PageHome.tsx`

---

## OVERVIEW

Modul homepage mengelola seluruh konten halaman beranda dengan 7 section utama:
1. **Hero Section** - Banner carousel dengan typing text animation
2. **Social Proof** - Statistik kepercayaan pelanggan
3. **Process** - Workflow proses kerja
4. **Why Choose Us** - Keunggulan perusahaan
5. **Achievements** - Pencapaian dan sertifikasi
6. **Services** - Layanan yang ditawarkan
7. **Testimonials** - Testimoni pelanggan
8. **CTA** - Call-to-action sections (primary & secondary)

---

## DATABASE SCHEMA

### Main Page Table

```sql
CREATE TABLE pages (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    page_type VARCHAR(50) NOT NULL CHECK (page_type IN ('home', 'about', 'contact', 'faq', 'custom')),
    publish_status VARCHAR(50) DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP NULL,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_page_type ON pages(page_type);
CREATE INDEX idx_pages_publish_status ON pages(publish_status);

ALTER TABLE pages ADD CONSTRAINT fk_pages_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE pages ADD CONSTRAINT fk_pages_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 1. Hero Section

```sql
CREATE TABLE page_sections_hero (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    typing_texts JSONB NOT NULL,
    subtitle TEXT NULL,
    primary_button_text VARCHAR(100) NULL,
    primary_button_link VARCHAR(255) NULL,
    secondary_button_text VARCHAR(100) NULL,
    secondary_button_link VARCHAR(255) NULL,
    carousel_autoplay_interval INT DEFAULT 5000,
    carousel_show_pause_button BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_hero_page_id ON page_sections_hero(page_id);

ALTER TABLE page_sections_hero ADD CONSTRAINT fk_page_sections_hero_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_hero_updated_at BEFORE UPDATE ON page_sections_hero
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_hero.carousel_autoplay_interval IS 'Milliseconds';

CREATE TABLE page_sections_hero_images (
    id BIGSERIAL PRIMARY KEY,
    hero_section_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    alt_text VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_hero_images_hero_section_id ON page_sections_hero_images(hero_section_id);
CREATE INDEX idx_page_sections_hero_images_display_order ON page_sections_hero_images(display_order);

ALTER TABLE page_sections_hero_images ADD CONSTRAINT fk_page_sections_hero_images_hero_section_id 
    FOREIGN KEY (hero_section_id) REFERENCES page_sections_hero(id) ON DELETE CASCADE;
```

**Fields:**
- `typing_texts` - Array teks animasi typing (JSON)
- `subtitle` - Subtitle hero
- `primary_button_text/link` - Tombol CTA utama
- `secondary_button_text/link` - Tombol CTA sekunder
- `carousel_autoplay_interval` - Interval autoplay carousel (ms)
- `carousel_show_pause_button` - Tampilkan tombol pause
- `image_url` - URL gambar carousel
- `alt_text` - Teks alternatif untuk SEO

### 2. Social Proof Section

```sql
CREATE TABLE page_sections_social_proof (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_social_proof_page_id ON page_sections_social_proof(page_id);

ALTER TABLE page_sections_social_proof ADD CONSTRAINT fk_page_sections_social_proof_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_social_proof_updated_at BEFORE UPDATE ON page_sections_social_proof
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_social_proof_stats (
    id BIGSERIAL PRIMARY KEY,
    social_proof_section_id BIGINT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    stat_value VARCHAR(50) NOT NULL,
    stat_label VARCHAR(100) NOT NULL,
    color_class VARCHAR(100) DEFAULT 'text-blue-500',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_social_proof_stats_section_id ON page_sections_social_proof_stats(social_proof_section_id);
CREATE INDEX idx_page_sections_social_proof_stats_display_order ON page_sections_social_proof_stats(display_order);

ALTER TABLE page_sections_social_proof_stats ADD CONSTRAINT fk_page_sections_social_proof_stats_section_id 
    FOREIGN KEY (social_proof_section_id) REFERENCES page_sections_social_proof(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_social_proof_stats_updated_at BEFORE UPDATE ON page_sections_social_proof_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_social_proof_stats.icon_name IS 'Lucide icon name';
COMMENT ON COLUMN page_sections_social_proof_stats.stat_value IS 'e.g., 2000+, 99%';
COMMENT ON COLUMN page_sections_social_proof_stats.color_class IS 'Tailwind class';
```

**Fields:**
- `icon_name` - Nama icon dari Lucide Icons
- `stat_value` - Nilai statistik (contoh: "2000+", "99%")
- `stat_label` - Label statistik (contoh: "Happy Clients")
- `color_class` - Tailwind CSS class untuk warna

### 3. Process Section

```sql
CREATE TABLE page_sections_process (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 2,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_process_page_id ON page_sections_process(page_id);

ALTER TABLE page_sections_process ADD CONSTRAINT fk_page_sections_process_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_process_updated_at BEFORE UPDATE ON page_sections_process
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_process_steps (
    id BIGSERIAL PRIMARY KEY,
    process_section_id BIGINT NOT NULL,
    step_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_process_steps_section_id ON page_sections_process_steps(process_section_id);
CREATE INDEX idx_page_sections_process_steps_step_number ON page_sections_process_steps(step_number);

ALTER TABLE page_sections_process_steps ADD CONSTRAINT fk_page_sections_process_steps_section_id 
    FOREIGN KEY (process_section_id) REFERENCES page_sections_process(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_process_steps_updated_at BEFORE UPDATE ON page_sections_process_steps
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `step_number` - Nomor urut langkah (1, 2, 3, ...)
- `icon_name` - Icon untuk setiap langkah
- `title` - Judul langkah
- `description` - Deskripsi detail langkah

### 4. Why Choose Us Section

```sql
CREATE TABLE page_sections_why_choose_us (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_why_choose_us_page_id ON page_sections_why_choose_us(page_id);

ALTER TABLE page_sections_why_choose_us ADD CONSTRAINT fk_page_sections_why_choose_us_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_why_choose_us_updated_at BEFORE UPDATE ON page_sections_why_choose_us
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_why_choose_us_features (
    id BIGSERIAL PRIMARY KEY,
    why_choose_us_section_id BIGINT NOT NULL,
    feature_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_theme VARCHAR(100) DEFAULT 'blue',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_why_choose_us_features_section_id ON page_sections_why_choose_us_features(why_choose_us_section_id);
CREATE INDEX idx_page_sections_why_choose_us_features_feature_number ON page_sections_why_choose_us_features(feature_number);

ALTER TABLE page_sections_why_choose_us_features ADD CONSTRAINT fk_page_sections_why_choose_us_features_section_id 
    FOREIGN KEY (why_choose_us_section_id) REFERENCES page_sections_why_choose_us(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_why_choose_us_features_updated_at BEFORE UPDATE ON page_sections_why_choose_us_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_why_choose_us_features.color_theme IS 'Color theme name';
```

**Fields:**
- `feature_number` - Nomor fitur (1, 2, 3, 4)
- `color_theme` - Tema warna (blue, green, orange, purple, etc.)

### 5. Achievements Section

```sql
CREATE TABLE page_sections_achievements (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL,
    display_order INT DEFAULT 4,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_achievements_page_id ON page_sections_achievements(page_id);

ALTER TABLE page_sections_achievements ADD CONSTRAINT fk_page_sections_achievements_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_achievements_updated_at BEFORE UPDATE ON page_sections_achievements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_achievement_items (
    id BIGSERIAL PRIMARY KEY,
    achievements_section_id BIGINT NOT NULL,
    achievement_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_theme VARCHAR(100) DEFAULT 'blue',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_achievement_items_section_id ON page_sections_achievement_items(achievements_section_id);
CREATE INDEX idx_page_sections_achievement_items_achievement_number ON page_sections_achievement_items(achievement_number);

ALTER TABLE page_sections_achievement_items ADD CONSTRAINT fk_page_sections_achievement_items_section_id 
    FOREIGN KEY (achievements_section_id) REFERENCES page_sections_achievements(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_achievement_items_updated_at BEFORE UPDATE ON page_sections_achievement_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Services Section

```sql
CREATE TABLE page_sections_services (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_services_page_id ON page_sections_services(page_id);

ALTER TABLE page_sections_services ADD CONSTRAINT fk_page_sections_services_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_services_updated_at BEFORE UPDATE ON page_sections_services
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_service_items (
    id BIGSERIAL PRIMARY KEY,
    services_section_id BIGINT NOT NULL,
    service_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_service_items_section_id ON page_sections_service_items(services_section_id);
CREATE INDEX idx_page_sections_service_items_service_number ON page_sections_service_items(service_number);

ALTER TABLE page_sections_service_items ADD CONSTRAINT fk_page_sections_service_items_section_id 
    FOREIGN KEY (services_section_id) REFERENCES page_sections_services(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_service_items_updated_at BEFORE UPDATE ON page_sections_service_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Testimonials Section

```sql
CREATE TABLE page_sections_testimonials (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    display_order INT DEFAULT 6,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_testimonials_page_id ON page_sections_testimonials(page_id);

ALTER TABLE page_sections_testimonials ADD CONSTRAINT fk_page_sections_testimonials_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_testimonials_updated_at BEFORE UPDATE ON page_sections_testimonials
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE page_sections_testimonial_items (
    id BIGSERIAL PRIMARY KEY,
    testimonials_section_id BIGINT NOT NULL,
    testimonial_number INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_role VARCHAR(255) NULL,
    customer_company VARCHAR(255) NULL,
    rating SMALLINT DEFAULT 5,
    image_url VARCHAR(500) NULL,
    testimonial_content TEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_testimonial_items_section_id ON page_sections_testimonial_items(testimonials_section_id);
CREATE INDEX idx_page_sections_testimonial_items_testimonial_number ON page_sections_testimonial_items(testimonial_number);
CREATE INDEX idx_page_sections_testimonial_items_rating ON page_sections_testimonial_items(rating);

ALTER TABLE page_sections_testimonial_items ADD CONSTRAINT fk_page_sections_testimonial_items_section_id 
    FOREIGN KEY (testimonials_section_id) REFERENCES page_sections_testimonials(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_testimonial_items_updated_at BEFORE UPDATE ON page_sections_testimonial_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_testimonial_items.rating IS '1-5 stars';
```

**Fields:**
- `customer_name` - Nama pelanggan
- `customer_role` - Jabatan pelanggan
- `customer_company` - Nama perusahaan pelanggan
- `rating` - Rating bintang (1-5)
- `image_url` - Foto pelanggan
- `testimonial_content` - Isi testimoni
- `is_featured` - Testimoni unggulan

### 8. CTA Sections

```sql
CREATE TABLE page_sections_cta (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    cta_type VARCHAR(50) NOT NULL CHECK (cta_type IN ('primary', 'secondary')),
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    button_text VARCHAR(100) NULL,
    button_link VARCHAR(255) NULL,
    secondary_button_text VARCHAR(100) NULL,
    secondary_button_link VARCHAR(255) NULL,
    display_order INT DEFAULT 7,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_page_sections_cta_page_id ON page_sections_cta(page_id);
CREATE INDEX idx_page_sections_cta_cta_type ON page_sections_cta(cta_type);

ALTER TABLE page_sections_cta ADD CONSTRAINT fk_page_sections_cta_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_page_sections_cta_updated_at BEFORE UPDATE ON page_sections_cta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN page_sections_cta.secondary_button_text IS 'For primary CTA only';
COMMENT ON COLUMN page_sections_cta.secondary_button_link IS 'For primary CTA only';
```

**Fields:**
- `cta_type` - Tipe CTA: `primary` atau `secondary`
- `secondary_button_text/link` - Tombol kedua (hanya untuk primary CTA)

---

## API ENDPOINTS

### Public Endpoints

#### Get Homepage Content

```http
GET /api/v1/pages/home
```

**Response:**
```json
{
  "success": true,
  "data": {
    "page": {
      "id": 1,
      "slug": "home",
      "title": "Home Page",
      "publishStatus": "published",
      "publishedAt": "2025-01-01T00:00:00Z"
    },
    "sections": {
      "hero": {
        "typingTexts": ["Welcome", "Discover", "Experience"],
        "subtitle": "Your trusted partner in quality products",
        "carouselImages": [
          {
            "id": 1,
            "imageUrl": "/images/hero/slide1.jpg",
            "altText": "Hero slide 1",
            "displayOrder": 1
          },
          {
            "id": 2,
            "imageUrl": "/images/hero/slide2.jpg",
            "altText": "Hero slide 2",
            "displayOrder": 2
          }
        ],
        "carouselSettings": {
          "autoplayInterval": 5000,
          "showPauseButton": true
        },
        "buttons": {
          "primary": {
            "text": "Get Started",
            "link": "/products"
          },
          "secondary": {
            "text": "Learn More",
            "link": "/about"
          }
        }
      },
      "socialProof": {
        "enabled": true,
        "title": "Trusted by Thousands",
        "subtitle": "Our achievements speak for themselves",
        "stats": [
          {
            "id": 1,
            "iconName": "Users",
            "value": "2000+",
            "label": "Happy Clients",
            "colorClass": "text-blue-500"
          },
          {
            "id": 2,
            "iconName": "Award",
            "value": "15+",
            "label": "Years Experience",
            "colorClass": "text-green-500"
          }
        ]
      },
      "process": {
        "enabled": true,
        "title": "Our Process",
        "subtitle": "Simple and effective workflow",
        "steps": [
          {
            "id": 1,
            "stepNumber": 1,
            "iconName": "FileText",
            "title": "Consultation",
            "description": "We discuss your needs and requirements"
          },
          {
            "id": 2,
            "stepNumber": 2,
            "iconName": "Zap",
            "title": "Design",
            "description": "Create custom design based on your needs"
          }
        ]
      },
      "whyChooseUs": {
        "enabled": true,
        "title": "Why Choose Us",
        "subtitle": "What makes us different from others",
        "features": [
          {
            "id": 1,
            "featureNumber": 1,
            "title": "Quality Assured",
            "description": "Premium quality in every product",
            "colorTheme": "blue"
          }
        ]
      },
      "achievements": {
        "enabled": true,
        "title": "Our Achievements",
        "items": [
          {
            "id": 1,
            "achievementNumber": 1,
            "iconName": "Award",
            "title": "ISO 9001:2015 Certified",
            "description": "International quality management standard",
            "colorTheme": "gold"
          }
        ]
      },
      "services": {
        "enabled": true,
        "title": "Our Services",
        "subtitle": "Comprehensive solutions for your needs",
        "items": [
          {
            "id": 1,
            "serviceNumber": 1,
            "iconName": "Package",
            "title": "Laser Etching",
            "description": "Precision laser etching service"
          }
        ]
      },
      "testimonials": {
        "enabled": true,
        "title": "Client Testimonials",
        "subtitle": "What our clients say about us",
        "items": [
          {
            "id": 1,
            "testimonialNumber": 1,
            "customerName": "John Doe",
            "customerRole": "CEO",
            "customerCompany": "Tech Corp Indonesia",
            "rating": 5,
            "imageUrl": "/images/testimonials/john.jpg",
            "testimonialContent": "Excellent service and quality products!",
            "isFeatured": true
          }
        ]
      },
      "cta": {
        "primary": {
          "title": "Ready to Get Started?",
          "subtitle": "Contact us today for a free consultation",
          "buttonText": "Contact Us",
          "buttonLink": "/contact",
          "secondaryButtonText": "View Portfolio",
          "secondaryButtonLink": "/products"
        },
        "secondary": {
          "title": "Need Help?",
          "subtitle": "Our team is here to assist you",
          "buttonText": "Chat with Us",
          "buttonLink": "/chat"
        }
      }
    },
    "seo": {
      "title": "Home - Stencil CMS",
      "metaDescription": "Welcome to Stencil CMS - Your trusted partner",
      "metaKeywords": ["cms", "etching", "laser", "quality"],
      "imageUrl": "/images/og-home.jpg",
      "metaTags": {
        "og:type": "website",
        "og:locale": "id_ID"
      }
    }
  }
}
```

---

### Admin Endpoints

#### Update Hero Section

```http
POST /api/v1/admin/pages/home/hero
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "typingTexts": ["Welcome to Our Site", "Quality Products", "Fast Service"],
  "subtitle": "Your trusted partner in business",
  "buttons": {
    "primary": {
      "text": "Get Started",
      "link": "/products"
    },
    "secondary": {
      "text": "Learn More",
      "link": "/about"
    }
  },
  "carouselSettings": {
    "autoplayInterval": 5000,
    "showPauseButton": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hero section updated successfully",
  "data": {
    "id": 1,
    "typingTexts": ["Welcome to Our Site", "Quality Products", "Fast Service"],
    "subtitle": "Your trusted partner in business"
  }
}
```

#### Add Carousel Image

```http
POST /api/v1/admin/pages/home/hero/images
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "imageUrl": "/uploads/hero/new-image.jpg",
  "altText": "New hero image",
  "displayOrder": 3
}
```

#### Update Carousel Image

```http
PUT /api/v1/admin/pages/home/hero/images/{id}
Authorization: Bearer {token}
```

#### Delete Carousel Image

```http
DELETE /api/v1/admin/pages/home/hero/images/{id}
Authorization: Bearer {token}
```

#### Update Social Proof Section

```http
POST /api/v1/admin/pages/home/social-proof
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "enabled": true,
  "title": "Trusted by Thousands",
  "subtitle": "Our numbers speak for themselves",
  "stats": [
    {
      "iconName": "Users",
      "value": "2000+",
      "label": "Happy Clients",
      "colorClass": "text-blue-500"
    },
    {
      "iconName": "Award",
      "value": "15+",
      "label": "Years Experience",
      "colorClass": "text-green-500"
    },
    {
      "iconName": "ThumbsUp",
      "value": "99%",
      "label": "Satisfaction Rate",
      "colorClass": "text-orange-500"
    }
  ]
}
```

#### Update Process Section

```http
POST /api/v1/admin/pages/home/process
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "How We Work",
  "subtitle": "Our simple and effective process",
  "steps": [
    {
      "stepNumber": 1,
      "iconName": "FileText",
      "title": "Consultation",
      "description": "We discuss your requirements"
    },
    {
      "stepNumber": 2,
      "iconName": "Pencil",
      "title": "Design",
      "description": "Create custom design"
    },
    {
      "stepNumber": 3,
      "iconName": "Zap",
      "title": "Production",
      "description": "High-quality manufacturing"
    },
    {
      "stepNumber": 4,
      "iconName": "CheckCircle",
      "title": "Delivery",
      "description": "Fast and secure delivery"
    }
  ]
}
```

#### Update Why Choose Us Section

```http
POST /api/v1/admin/pages/home/why-choose-us
Authorization: Bearer {token}
```

#### Update Achievements Section

```http
POST /api/v1/admin/pages/home/achievements
Authorization: Bearer {token}
```

#### Update Services Section

```http
POST /api/v1/admin/pages/home/services
Authorization: Bearer {token}
```

#### Update Testimonials Section

```http
POST /api/v1/admin/pages/home/testimonials
Authorization: Bearer {token}
```

#### Update CTA Sections

```http
POST /api/v1/admin/pages/home/cta
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "primary": {
    "title": "Ready to Start Your Project?",
    "subtitle": "Contact us for a free consultation",
    "buttonText": "Contact Us Now",
    "buttonLink": "/contact",
    "secondaryButtonText": "View Our Work",
    "secondaryButtonLink": "/portfolio"
  },
  "secondary": {
    "title": "Have Questions?",
    "subtitle": "Our support team is ready to help",
    "buttonText": "Chat with Us",
    "buttonLink": "/support"
  }
}
```

---

## VALIDATION RULES

### Hero Section
```
typingTexts: required|array|min:1|max:10
typingTexts.*: required|string|max:100
subtitle: nullable|string|max:500
primary_button_text: nullable|string|max:50
primary_button_link: nullable|string|max:255
carousel_autoplay_interval: integer|min:1000|max:30000
```

### Social Proof Stats
```
icon_name: required|string|max:100
stat_value: required|string|max:50
stat_label: required|string|max:100
color_class: nullable|string|max:100
```

### Process Steps
```
step_number: required|integer|min:1
icon_name: required|string|max:100
title: required|string|max:255
description: nullable|string|max:1000
```

### Testimonials
```
customer_name: required|string|max:255
rating: required|integer|min:1|max:5
testimonial_content: required|string|min:10|max:1000
image_url: nullable|url|max:500
```

---

## BUSINESS RULES

1. **Hero carousel** harus memiliki minimal 1 gambar
2. **Typing texts** maksimal 10 item untuk performa optimal
3. **Rating testimonial** hanya 1-5 bintang
4. **Display order** dimulai dari 0, digunakan untuk sorting
5. **Section enable/disable** mempengaruhi tampilan di frontend
6. **CTA sections** ada 2 tipe: primary (di tengah) dan secondary (di akhir)

---

**Previous:** [01-STANDARDS.md](./01-STANDARDS.md)  
**Next:** [03-ABOUT.md](./03-ABOUT.md)
