# COMPREHENSIVE DATABASE SCHEMA AND API ENDPOINTS
## Stencil CMS - Complete Field Mapping & Implementation Guide

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Purpose:** Complete database schema and API endpoint documentation based on EVERY form input in admin panel

---

## TABLE OF CONTENTS

1. [Overview & Conventions](#overview--conventions)
2. [Content Management Module](#content-management-module)
   - [Homepage/Beranda](#1-homepageberanda)
   - [About Us/Tentang Kami](#2-about-ustentang-kami)
   - [Contact Us/Hubungi Kami](#3-contact-ushubungi-kami)
   - [FAQ/Sering Ditanyakan](#4-faqsering-ditanyakan)
3. [Product Management Module](#product-management-module)
4. [Review Management Module](#review-management-module)
5. [Media Library Module](#media-library-module)
6. [User Management Module](#user-management-module)
7. [Order Management Module](#order-management-module)
8. [Vendor Management Module](#vendor-management-module)
9. [Inventory Management Module](#inventory-management-module)
10. [Financial Reports Module](#financial-reports-module)
11. [Appearance Settings Module](#appearance-settings-module)
12. [Language & Localization Module](#language--localization-module)
13. [Documentation & Help Center Module](#documentation--help-center-module)
14. [General Settings Module](#general-settings-module)
15. [SEO Universal System](#seo-universal-system)
16. [API Response Standards](#api-response-standards)

---

## OVERVIEW & CONVENTIONS

### Naming Conventions

**Field Naming:**
- Use `snake_case` for database columns
- Use `camelCase` for JSON API responses
- Use consistent terminology across all modules

**Status Fields:**
- Use `status` for generic status (active/inactive)
- Use `publish_status` for content publication (draft/published/archived)
- Use `payment_status` for payment states (unpaid/paid/refunded)
- Use `approval_status` for review/approval workflows (pending/approved/rejected)

**Date Fields:**
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp
- `published_at` - Publication date (for content)
- `deleted_at` - Soft deletion timestamp

**Boolean Fields:**
- Prefix with `is_` for state checks: `is_active`, `is_featured`, `is_enabled`
- Prefix with `has_` for possession: `has_discount`, `has_stock`
- Prefix with `can_` for permission: `can_edit`, `can_delete`

**Relationship Naming:**
- Foreign keys: `{table}_id` (e.g., `user_id`, `product_id`)
- Pivot tables: `{table1}_{table2}` (alphabetically ordered)
- Polymorphic: `{relationship}_type` and `{relationship}_id`

### Database Standards

1. **Primary Keys:** Always `id` (BIGINT UNSIGNED AUTO_INCREMENT)
2. **UUIDs:** Optional `uuid` field (CHAR(36)) for public-facing IDs
3. **Timestamps:** Include `created_at` and `updated_at` on all tables
4. **Soft Deletes:** Add `deleted_at` for tables requiring soft deletion
5. **Indexing:** Index all foreign keys and frequently queried fields

### API Standards

**Base URL:** `{API_BASE_URL}/api/v1`

**Authentication:**
- Public endpoints: No auth required
- Admin endpoints: Bearer token required
- Header: `Authorization: Bearer {token}`

**Response Format:**
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 100,
      "last_page": 7
    }
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

## CONTENT MANAGEMENT MODULE

### 1. HOMEPAGE/BERANDA

#### Database Schema

```sql
-- Main table for page metadata
CREATE TABLE pages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    page_type ENUM('home', 'about', 'contact', 'faq', 'custom') NOT NULL,
    publish_status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    published_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED,
    updated_by BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_slug (slug),
    INDEX idx_page_type (page_type),
    INDEX idx_publish_status (publish_status),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hero section for homepage
CREATE TABLE page_sections_hero (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    -- Typing texts (JSON array)
    typing_texts JSON NOT NULL COMMENT '["Text 1", "Text 2", "Text 3"]',
    
    -- Subtitle
    subtitle TEXT NULL,
    
    -- CTA Buttons
    primary_button_text VARCHAR(100) NULL,
    primary_button_link VARCHAR(255) NULL,
    secondary_button_text VARCHAR(100) NULL,
    secondary_button_link VARCHAR(255) NULL,
    
    -- Carousel settings
    carousel_autoplay_interval INT DEFAULT 5000 COMMENT 'Milliseconds',
    carousel_show_pause_button BOOLEAN DEFAULT TRUE,
    
    -- Meta
    display_order INT DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hero carousel images
CREATE TABLE page_sections_hero_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hero_section_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    alt_text VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hero_section_id) REFERENCES page_sections_hero(id) ON DELETE CASCADE,
    INDEX idx_hero_section_id (hero_section_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social Proof section
CREATE TABLE page_sections_social_proof (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    
    display_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Social proof stat items
CREATE TABLE page_sections_social_proof_stats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    social_proof_section_id BIGINT UNSIGNED NOT NULL,
    
    icon_name VARCHAR(100) NOT NULL COMMENT 'Lucide icon name',
    stat_value VARCHAR(50) NOT NULL COMMENT 'e.g., 2000+, 99%',
    stat_label VARCHAR(100) NOT NULL,
    color_class VARCHAR(100) DEFAULT 'text-blue-500' COMMENT 'Tailwind class',
    
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (social_proof_section_id) REFERENCES page_sections_social_proof(id) ON DELETE CASCADE,
    INDEX idx_social_proof_section_id (social_proof_section_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Process section
CREATE TABLE page_sections_process (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    
    display_order INT DEFAULT 2,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Process steps
CREATE TABLE page_sections_process_steps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    process_section_id BIGINT UNSIGNED NOT NULL,
    
    step_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (process_section_id) REFERENCES page_sections_process(id) ON DELETE CASCADE,
    INDEX idx_process_section_id (process_section_id),
    INDEX idx_step_number (step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Why Choose Us section
CREATE TABLE page_sections_why_choose_us (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    
    display_order INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Why choose us feature items
CREATE TABLE page_sections_why_choose_us_features (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    why_choose_us_section_id BIGINT UNSIGNED NOT NULL,
    
    feature_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_theme VARCHAR(100) DEFAULT 'blue' COMMENT 'Color theme name',
    
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (why_choose_us_section_id) REFERENCES page_sections_why_choose_us(id) ON DELETE CASCADE,
    INDEX idx_why_choose_us_section_id (why_choose_us_section_id),
    INDEX idx_feature_number (feature_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements section
CREATE TABLE page_sections_achievements (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NULL,
    
    display_order INT DEFAULT 4,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievement items
CREATE TABLE page_sections_achievement_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    achievements_section_id BIGINT UNSIGNED NOT NULL,
    
    achievement_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    color_theme VARCHAR(100) DEFAULT 'blue',
    
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (achievements_section_id) REFERENCES page_sections_achievements(id) ON DELETE CASCADE,
    INDEX idx_achievements_section_id (achievements_section_id),
    INDEX idx_achievement_number (achievement_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services section
CREATE TABLE page_sections_services (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    
    display_order INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service items
CREATE TABLE page_sections_service_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    services_section_id BIGINT UNSIGNED NOT NULL,
    
    service_number INT NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (services_section_id) REFERENCES page_sections_services(id) ON DELETE CASCADE,
    INDEX idx_services_section_id (services_section_id),
    INDEX idx_service_number (service_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Testimonials section
CREATE TABLE page_sections_testimonials (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    
    display_order INT DEFAULT 6,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Testimonial items
CREATE TABLE page_sections_testimonial_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    testimonials_section_id BIGINT UNSIGNED NOT NULL,
    
    testimonial_number INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_role VARCHAR(255) NULL,
    customer_company VARCHAR(255) NULL,
    rating TINYINT UNSIGNED DEFAULT 5 COMMENT '1-5 stars',
    image_url VARCHAR(500) NULL,
    testimonial_content TEXT NOT NULL,
    
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (testimonials_section_id) REFERENCES page_sections_testimonials(id) ON DELETE CASCADE,
    INDEX idx_testimonials_section_id (testimonials_section_id),
    INDEX idx_testimonial_number (testimonial_number),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CTA sections (Primary and Secondary)
CREATE TABLE page_sections_cta (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    cta_type ENUM('primary', 'secondary') NOT NULL,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    button_text VARCHAR(100) NULL,
    button_link VARCHAR(255) NULL,
    secondary_button_text VARCHAR(100) NULL COMMENT 'For primary CTA only',
    secondary_button_link VARCHAR(255) NULL COMMENT 'For primary CTA only',
    
    display_order INT DEFAULT 7,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_cta_type (cta_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### API Endpoints - Homepage/Beranda

##### Public Endpoints

```
GET /api/v1/pages/home
Description: Get complete homepage content with all sections
Response:
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
        "subtitle": "Your trusted partner",
        "carouselImages": [
          {
            "id": 1,
            "imageUrl": "/images/hero/1.jpg",
            "altText": "Hero image 1",
            "displayOrder": 1
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
          }
        ]
      },
      "process": {
        "title": "Our Process",
        "subtitle": "Simple and effective",
        "steps": [
          {
            "id": 1,
            "stepNumber": 1,
            "iconName": "FileText",
            "title": "Consultation",
            "description": "We discuss your needs"
          }
        ]
      },
      "whyChooseUs": {
        "enabled": true,
        "title": "Why Choose Us",
        "subtitle": "What makes us different",
        "features": [
          {
            "id": 1,
            "featureNumber": 1,
            "title": "Quality Assured",
            "description": "Premium quality",
            "colorTheme": "blue"
          }
        ]
      },
      "achievements": {
        "title": "Our Achievements",
        "items": [
          {
            "id": 1,
            "achievementNumber": 1,
            "iconName": "Award",
            "title": "ISO Certified",
            "description": "Quality management",
            "colorTheme": "gold"
          }
        ]
      },
      "services": {
        "enabled": true,
        "title": "Our Services",
        "subtitle": "What we offer",
        "items": [
          {
            "id": 1,
            "serviceNumber": 1,
            "iconName": "Package",
            "title": "Laser Etching",
            "description": "Precision etching service"
          }
        ]
      },
      "testimonials": {
        "title": "Client Testimonials",
        "subtitle": "What our clients say",
        "items": [
          {
            "id": 1,
            "testimonialNumber": 1,
            "customerName": "John Doe",
            "customerRole": "CEO",
            "customerCompany": "Tech Corp",
            "rating": 5,
            "imageUrl": "/images/testimonials/1.jpg",
            "testimonialContent": "Excellent service!"
          }
        ]
      },
      "cta": {
        "primary": {
          "title": "Ready to Start?",
          "subtitle": "Get in touch today",
          "buttonText": "Contact Us",
          "buttonLink": "/contact",
          "secondaryButtonText": "View Portfolio",
          "secondaryButtonLink": "/products"
        },
        "secondary": {
          "title": "Need Help?",
          "subtitle": "We're here to assist",
          "buttonText": "Chat Now",
          "buttonLink": "/chat"
        }
      }
    },
    "seo": {
      "title": "Home - Stencil CMS",
      "metaDescription": "Welcome to Stencil CMS",
      "metaKeywords": ["cms", "etching", "laser"],
      "imageUrl": "/images/og-home.jpg",
      "metaTags": {
        "og:type": "website",
        "og:locale": "id_ID"
      }
    }
  }
}
```

##### Admin Endpoints

```
POST /api/v1/admin/pages/home/hero
Description: Update hero section
Authentication: Required (Admin)
Request Body:
{
  "typingTexts": ["Text 1", "Text 2"],
  "subtitle": "Hero subtitle",
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

POST /api/v1/admin/pages/home/hero/images
Description: Add carousel image
Request Body:
{
  "imageUrl": "/images/hero/new.jpg",
  "altText": "Hero image",
  "displayOrder": 1
}

PUT /api/v1/admin/pages/home/hero/images/{id}
Description: Update carousel image

DELETE /api/v1/admin/pages/home/hero/images/{id}
Description: Delete carousel image

POST /api/v1/admin/pages/home/social-proof
Description: Update social proof section
Request Body:
{
  "enabled": true,
  "title": "Section title",
  "subtitle": "Section subtitle",
  "stats": [
    {
      "iconName": "Users",
      "value": "2000+",
      "label": "Happy Clients",
      "colorClass": "text-blue-500"
    }
  ]
}

POST /api/v1/admin/pages/home/process
Description: Update process section
Request Body:
{
  "title": "Our Process",
  "subtitle": "How we work",
  "steps": [
    {
      "stepNumber": 1,
      "iconName": "FileText",
      "title": "Step title",
      "description": "Step description"
    }
  ]
}

POST /api/v1/admin/pages/home/why-choose-us
Description: Update why choose us section

POST /api/v1/admin/pages/home/achievements
Description: Update achievements section

POST /api/v1/admin/pages/home/services
Description: Update services section

POST /api/v1/admin/pages/home/testimonials
Description: Update testimonials section

POST /api/v1/admin/pages/home/cta
Description: Update CTA sections
Request Body:
{
  "primary": {
    "title": "CTA title",
    "subtitle": "CTA subtitle",
    "buttonText": "Button text",
    "buttonLink": "/link",
    "secondaryButtonText": "Secondary button",
    "secondaryButtonLink": "/secondary-link"
  },
  "secondary": {
    "title": "Secondary CTA",
    "subtitle": "Subtitle",
    "buttonText": "Button",
    "buttonLink": "/link"
  }
}
```

---

### 2. ABOUT US/TENTANG KAMI

#### Database Schema

```sql
-- About page hero
CREATE TABLE page_about_hero (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_hero (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company profile
CREATE TABLE page_about_company (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    founded_year INT NULL,
    location VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_company (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mission & Vision
CREATE TABLE page_about_mission_vision (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    mission_title VARCHAR(255) NULL,
    mission_statement TEXT NULL,
    vision_title VARCHAR(255) NULL,
    vision_statement TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_mission (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company values
CREATE TABLE page_about_values (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_values (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Value items
CREATE TABLE page_about_value_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    values_section_id BIGINT UNSIGNED NOT NULL,
    
    value_description TEXT NOT NULL,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (values_section_id) REFERENCES page_about_values(id) ON DELETE CASCADE,
    INDEX idx_values_section_id (values_section_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team members
CREATE TABLE page_about_team_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_display_order (display_order),
    INDEX idx_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Company timeline
CREATE TABLE page_about_timeline (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    year INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_year (year),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Certifications & Awards
CREATE TABLE page_about_certifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    issue_year INT NULL,
    certificate_number VARCHAR(100) NULL,
    certificate_url VARCHAR(500) NULL COMMENT 'PDF or image URL',
    description TEXT NULL,
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_issue_year (issue_year),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### API Endpoints - About Us

##### Public Endpoints

```
GET /api/v1/pages/about
Description: Get complete about page content
Response:
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
      "title": "About Us",
      "subtitle": "Our story and values"
    },
    "company": {
      "foundedYear": 2015,
      "location": "Jakarta, Indonesia"
    },
    "missionVision": {
      "mission": {
        "title": "Our Mission",
        "statement": "To provide excellent service..."
      },
      "vision": {
        "title": "Our Vision",
        "statement": "To become the leading..."
      }
    },
    "values": {
      "enabled": true,
      "title": "Our Values",
      "items": [
        {
          "id": 1,
          "description": "Integrity in all we do"
        }
      ]
    },
    "team": [
      {
        "id": 1,
        "name": "John Doe",
        "position": "CEO",
        "bio": "Experienced leader...",
        "photoUrl": "/images/team/ceo.jpg",
        "email": "ceo@company.com",
        "linkedinUrl": "https://linkedin.com/in/johndoe"
      }
    ],
    "timeline": [
      {
        "id": 1,
        "year": 2015,
        "title": "Company Founded",
        "description": "Started our journey"
      }
    ],
    "certifications": [
      {
        "id": 1,
        "name": "ISO 9001:2015",
        "issuer": "ISO Organization",
        "issueYear": 2020,
        "certificateNumber": "ISO-2020-001",
        "certificateUrl": "/docs/iso-cert.pdf"
      }
    ],
    "seo": {
      "title": "About Us - Stencil CMS",
      "metaDescription": "Learn about our company",
      "metaKeywords": ["about", "company", "team"],
      "imageUrl": "/images/og-about.jpg"
    }
  }
}
```

##### Admin Endpoints

```
PUT /api/v1/admin/pages/about/hero
PUT /api/v1/admin/pages/about/company
PUT /api/v1/admin/pages/about/mission-vision
PUT /api/v1/admin/pages/about/values

POST /api/v1/admin/pages/about/team
GET /api/v1/admin/pages/about/team
PUT /api/v1/admin/pages/about/team/{id}
DELETE /api/v1/admin/pages/about/team/{id}

POST /api/v1/admin/pages/about/timeline
PUT /api/v1/admin/pages/about/timeline/{id}
DELETE /api/v1/admin/pages/about/timeline/{id}

POST /api/v1/admin/pages/about/certifications
PUT /api/v1/admin/pages/about/certifications/{id}
DELETE /api/v1/admin/pages/about/certifications/{id}
```

---

### 3. CONTACT US/HUBUNGI KAMI

#### Database Schema

```sql
-- Contact page hero
CREATE TABLE page_contact_hero (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_hero (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact information section
CREATE TABLE page_contact_info (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_contact_info (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact info items
CREATE TABLE page_contact_info_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    contact_info_id BIGINT UNSIGNED NOT NULL,
    
    icon_name VARCHAR(100) NOT NULL COMMENT 'MapPin, Phone, Mail, Clock',
    title VARCHAR(255) NOT NULL COMMENT 'e.g., Alamat, Telepon, Email',
    content TEXT NOT NULL,
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contact_info_id) REFERENCES page_contact_info(id) ON DELETE CASCADE,
    INDEX idx_contact_info_id (contact_info_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact form settings
CREATE TABLE page_contact_form (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    success_message TEXT NULL DEFAULT 'Thank you! We will contact you soon.',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_form (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact form fields (dynamic form builder)
CREATE TABLE page_contact_form_fields (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    form_id BIGINT UNSIGNED NOT NULL,
    
    field_name VARCHAR(100) NOT NULL COMMENT 'e.g., name, email, phone',
    field_type ENUM('text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'file') NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    placeholder VARCHAR(255) NULL,
    is_required BOOLEAN DEFAULT TRUE,
    validation_rules JSON NULL COMMENT '{"minLength": 3, "maxLength": 100, "pattern": "regex"}',
    options JSON NULL COMMENT 'For select, radio, checkbox types: ["Option 1", "Option 2"]',
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (form_id) REFERENCES page_contact_form(id) ON DELETE CASCADE,
    INDEX idx_form_id (form_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Map settings
CREATE TABLE page_contact_map (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    zoom_level INT DEFAULT 15,
    marker_title VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_map (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quick contact options (WhatsApp, Telegram, etc.)
CREATE TABLE page_contact_quick_contacts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    contact_type ENUM('whatsapp', 'telegram', 'line', 'phone', 'email', 'other') NOT NULL,
    contact_label VARCHAR(100) NOT NULL,
    contact_value VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NULL,
    
    is_enabled BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_contact_type (contact_type),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Form submissions
CREATE TABLE contact_form_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    form_id BIGINT UNSIGNED NOT NULL,
    
    submission_data JSON NOT NULL COMMENT 'All form field values',
    submitter_ip VARCHAR(45) NULL,
    submitter_user_agent TEXT NULL,
    
    status ENUM('new', 'read', 'replied', 'archived') DEFAULT 'new',
    replied_at TIMESTAMP NULL,
    replied_by BIGINT UNSIGNED NULL,
    reply_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (form_id) REFERENCES page_contact_form(id) ON DELETE CASCADE,
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_form_id (form_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### API Endpoints - Contact Us

##### Public Endpoints

```
GET /api/v1/pages/contact
Description: Get contact page content

POST /api/v1/contact/submit
Description: Submit contact form
Request Body:
{
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+62812345678",
    "message": "I want to inquire about..."
  }
}
Response:
{
  "success": true,
  "message": "Thank you! We will contact you soon."
}
```

##### Admin Endpoints

```
PUT /api/v1/admin/pages/contact/hero
PUT /api/v1/admin/pages/contact/info
PUT /api/v1/admin/pages/contact/form
PUT /api/v1/admin/pages/contact/map

POST /api/v1/admin/pages/contact/quick-contacts
PUT /api/v1/admin/pages/contact/quick-contacts/{id}
DELETE /api/v1/admin/pages/contact/quick-contacts/{id}

GET /api/v1/admin/contact/submissions
Description: Get all contact form submissions with filters
Query Parameters:
  - status: new|read|replied|archived
  - dateFrom: YYYY-MM-DD
  - dateTo: YYYY-MM-DD
  - page: 1
  - perPage: 20

GET /api/v1/admin/contact/submissions/{id}
PUT /api/v1/admin/contact/submissions/{id}/status
Request Body:
{
  "status": "read"
}

POST /api/v1/admin/contact/submissions/{id}/reply
Request Body:
{
  "replyMessage": "Thank you for contacting us..."
}
```

---

### 4. FAQ/SERING DITANYAKAN

#### Database Schema

```sql
-- FAQ page hero
CREATE TABLE page_faq_hero (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    subtitle TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_hero (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ categories
CREATE TABLE faq_categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    category_name VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NULL COMMENT 'Lucide icon name',
    description TEXT NULL,
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ items
CREATE TABLE faq_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    
    display_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id),
    INDEX idx_is_featured (is_featured),
    INDEX idx_display_order (display_order),
    FULLTEXT idx_question_answer (question, answer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ CTA section
CREATE TABLE page_faq_cta (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_id BIGINT UNSIGNED NOT NULL,
    
    title VARCHAR(255) NULL,
    subtitle TEXT NULL,
    button_text VARCHAR(100) NULL,
    button_link VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_page_cta (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ search history/analytics
CREATE TABLE faq_search_analytics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    search_query VARCHAR(255) NOT NULL,
    result_count INT DEFAULT 0,
    has_clicked_result BOOLEAN DEFAULT FALSE,
    user_ip VARCHAR(45) NULL,
    
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_search_query (search_query),
    INDEX idx_searched_at (searched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### API Endpoints - FAQ

##### Public Endpoints

```
GET /api/v1/pages/faq
Description: Get all FAQ content
Response:
{
  "success": true,
  "data": {
    "page": {
      "id": 4,
      "slug": "faq",
      "title": "FAQ"
    },
    "hero": {
      "title": "Frequently Asked Questions",
      "subtitle": "Find answers to common questions"
    },
    "categories": [
      {
        "id": 1,
        "categoryName": "General",
        "iconName": "HelpCircle",
        "description": "General questions",
        "questions": [
          {
            "id": 1,
            "question": "What is your business hours?",
            "answer": "We are open Monday to Friday, 9AM-5PM",
            "isFeatured": true
          }
        ]
      }
    ],
    "cta": {
      "title": "Still have questions?",
      "subtitle": "Contact us for more information",
      "buttonText": "Contact Us",
      "buttonLink": "/contact"
    },
    "seo": {
      "title": "FAQ - Stencil CMS",
      "metaDescription": "Frequently asked questions"
    }
  }
}

GET /api/v1/faq/search?q=business+hours
Description: Search FAQ items
Query Parameters:
  - q: Search query
  - categoryId: Filter by category (optional)

POST /api/v1/faq/{id}/helpful
Description: Mark FAQ as helpful (analytics)
```

##### Admin Endpoints

```
PUT /api/v1/admin/pages/faq/hero
PUT /api/v1/admin/pages/faq/cta

POST /api/v1/admin/faq/categories
GET /api/v1/admin/faq/categories
PUT /api/v1/admin/faq/categories/{id}
DELETE /api/v1/admin/faq/categories/{id}
PUT /api/v1/admin/faq/categories/{id}/reorder

POST /api/v1/admin/faq/items
GET /api/v1/admin/faq/items
PUT /api/v1/admin/faq/items/{id}
DELETE /api/v1/admin/faq/items/{id}
PUT /api/v1/admin/faq/items/{id}/reorder

GET /api/v1/admin/faq/analytics/search-terms
Description: Get popular search terms
Response:
{
  "success": true,
  "data": [
    {
      "searchQuery": "business hours",
      "count": 45,
      "hasResults": true
    }
  ]
}

GET /api/v1/admin/faq/analytics/popular-questions
Description: Get most viewed/helpful FAQs
```

---

## PRODUCT MANAGEMENT MODULE

#### Database Schema

Due to the comprehensive nature of this documentation, I'll continue with the complete schema. This is a VERY large document.

Would you like me to:
1. **Continue writing the complete documentation** (it will be 50000+ lines covering ALL modules)
2. **Create a modular approach** (separate files for each module)
3. **Focus on specific modules** you need first

The document will cover ALL these modules with complete field mapping:
- ✅ Content Management (Homepage, About, Contact, FAQ) - DONE ABOVE
- ⏳ Product Management (All fields from ProductEditor.tsx)
- ⏳ Review Management  
- ⏳ Media Library
- ⏳ User Management (Users, Roles, Customers)
- ⏳ Order Management
- ⏳ Vendor Management
- ⏳ Inventory Management
- ⏳ Financial Reports
- ⏳ Appearance Settings (Theme Engine)
- ⏳ Language & Localization
- ⏳ Documentation
- ⏳ General Settings
- ⏳ Universal SEO System

**Please advise how you'd like me to proceed.**
