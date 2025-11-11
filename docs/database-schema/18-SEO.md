# UNIVERSAL SEO SYSTEM
## Database Schema & API Documentation

**Module:** Cross-Module - SEO  
**Total Fields:** 20+  
**Total Tables:** 2  
**Admin Pages:** All admin pages + dedicated SEO Settings

---

## OVERVIEW

Universal SEO system dengan dual-layer approach:
1. **Default/Global SEO Settings** - Fallback untuk seluruh website
2. **Polymorphic SEO Meta** - SEO individual per page/item

### Fallback Hierarchy

```
Individual SEO (page/product/etc) 
    ↓ (if empty)
Default/Global SEO Settings
    ↓ (if empty)
System Default Values
```

**Contoh:**
- **Product A** memiliki custom SEO → gunakan SEO Product A
- **Product B** tanpa custom SEO → gunakan Default SEO Settings
- Jika Default SEO juga kosong → gunakan system default

---

## DATABASE SCHEMA

### 1. Default/Global SEO Settings

```sql
CREATE TABLE seo_default_settings (
    id BIGSERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Stencil CMS',
    default_meta_title VARCHAR(255) NULL,
    default_meta_description TEXT NULL,
    default_meta_keywords TEXT NULL,
    og_type VARCHAR(50) DEFAULT 'website',
    og_site_name VARCHAR(255) NULL,
    og_default_image_url VARCHAR(500) NULL,
    og_locale VARCHAR(10) DEFAULT 'id_ID',
    twitter_card_type VARCHAR(50) DEFAULT 'summary_large_image',
    twitter_site VARCHAR(100) NULL,
    twitter_creator VARCHAR(100) NULL,
    schema_org_type VARCHAR(50) DEFAULT 'Organization',
    schema_org_data JSONB NULL,
    default_robots VARCHAR(100) DEFAULT 'index, follow',
    allow_search_engines BOOLEAN DEFAULT TRUE,
    canonical_base_url VARCHAR(500) NULL,
    google_site_verification VARCHAR(255) NULL,
    bing_site_verification VARCHAR(255) NULL,
    facebook_page_url VARCHAR(500) NULL,
    instagram_url VARCHAR(500) NULL,
    twitter_url VARCHAR(500) NULL,
    linkedin_url VARCHAR(500) NULL,
    youtube_url VARCHAR(500) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT NULL
);

ALTER TABLE seo_default_settings ADD CONSTRAINT fk_seo_default_settings_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TRIGGER update_seo_default_settings_updated_at BEFORE UPDATE ON seo_default_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN seo_default_settings.default_meta_title IS 'Default title template: {page} | {site_name}';
COMMENT ON COLUMN seo_default_settings.default_meta_description IS 'Fallback meta description';
COMMENT ON COLUMN seo_default_settings.default_meta_keywords IS 'Comma-separated keywords';
COMMENT ON COLUMN seo_default_settings.og_type IS 'website, article, product';
COMMENT ON COLUMN seo_default_settings.og_default_image_url IS 'Default OG image';
COMMENT ON COLUMN seo_default_settings.og_locale IS 'id_ID, en_US';
COMMENT ON COLUMN seo_default_settings.twitter_card_type IS 'summary, summary_large_image';
COMMENT ON COLUMN seo_default_settings.twitter_site IS '@username';
COMMENT ON COLUMN seo_default_settings.twitter_creator IS '@username';
COMMENT ON COLUMN seo_default_settings.schema_org_type IS 'Organization, LocalBusiness';
COMMENT ON COLUMN seo_default_settings.default_robots IS 'index/noindex, follow/nofollow';
COMMENT ON COLUMN seo_default_settings.canonical_base_url IS 'Base URL for canonical tags';
COMMENT ON COLUMN seo_default_settings.google_site_verification IS 'Google Search Console verification';
COMMENT ON COLUMN seo_default_settings.bing_site_verification IS 'Bing Webmaster verification';

INSERT INTO seo_default_settings (id, site_name) VALUES (1, 'Stencil CMS');
```

**Fields Explanation:**
- `default_meta_title` - Template untuk title (contoh: "{page} | {site_name}")
- `og_default_image_url` - Default image jika page tidak punya custom image
- `schema_org_data` - Complete JSON-LD untuk organization/business
- `default_robots` - Default robots meta tag behavior
- `canonical_base_url` - Base URL untuk canonical links (contoh: https://yoursite.com)

### 2. Polymorphic SEO Meta (Per Page/Item)

```sql
CREATE TABLE seo_meta (
    id BIGSERIAL PRIMARY KEY,
    seo_metable_type VARCHAR(255) NOT NULL,
    seo_metable_id BIGINT NOT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT NULL,
    og_title VARCHAR(255) NULL,
    og_description TEXT NULL,
    og_image_url VARCHAR(500) NULL,
    og_type VARCHAR(50) NULL,
    twitter_title VARCHAR(255) NULL,
    twitter_description TEXT NULL,
    twitter_image_url VARCHAR(500) NULL,
    twitter_card_type VARCHAR(50) NULL,
    canonical_url VARCHAR(500) NULL,
    robots VARCHAR(100) NULL,
    schema_type VARCHAR(50) NULL,
    schema_data JSONB NULL,
    custom_meta_tags JSONB NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE seo_meta ADD CONSTRAINT unique_seo_meta_metable UNIQUE (seo_metable_type, seo_metable_id);

CREATE INDEX idx_seo_meta_metable_type ON seo_meta(seo_metable_type);
CREATE INDEX idx_seo_meta_is_enabled ON seo_meta(is_enabled);

CREATE TRIGGER update_seo_meta_updated_at BEFORE UPDATE ON seo_meta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN seo_meta.seo_metable_type IS 'App\Models\Page, App\Models\Product, etc.';
COMMENT ON COLUMN seo_meta.seo_metable_id IS 'ID of the related model';
COMMENT ON COLUMN seo_meta.meta_title IS 'Custom title (max 60 chars recommended)';
COMMENT ON COLUMN seo_meta.meta_description IS 'Custom description (max 160 chars recommended)';
COMMENT ON COLUMN seo_meta.meta_keywords IS 'Comma-separated keywords';
COMMENT ON COLUMN seo_meta.og_title IS 'OG title (can differ from meta_title)';
COMMENT ON COLUMN seo_meta.og_description IS 'OG description';
COMMENT ON COLUMN seo_meta.og_image_url IS 'OG image URL';
COMMENT ON COLUMN seo_meta.og_type IS 'website, article, product';
COMMENT ON COLUMN seo_meta.twitter_card_type IS 'summary, summary_large_image';
COMMENT ON COLUMN seo_meta.canonical_url IS 'Custom canonical URL';
COMMENT ON COLUMN seo_meta.robots IS 'Custom robots directive: index/noindex, follow/nofollow';
COMMENT ON COLUMN seo_meta.schema_type IS 'Article, Product, Event, etc.';
COMMENT ON COLUMN seo_meta.is_enabled IS 'Enable/disable SEO for this item';
```

**Supported Models (seo_metable_type):**
- `App\Models\Page` - Homepage, About, Contact, FAQ, custom pages
- `App\Models\Product` - Individual products
- `App\Models\ProductCategory` - Product categories
- `App\Models\BlogPost` - Blog articles
- `App\Models\FaqCategory` - FAQ categories
- Dan model lainnya yang perlu SEO

**Custom Meta Tags Example (JSON):**
```json
{
  "article:author": "John Doe",
  "article:published_time": "2025-01-01T00:00:00Z",
  "article:section": "Technology",
  "product:price:amount": "100000",
  "product:price:currency": "IDR"
}
```

### 3. SEO Sitemap Table (Optional)

```sql
CREATE TABLE seo_sitemap_entries (
    id BIGSERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL UNIQUE,
    priority DECIMAL(2,1) DEFAULT 0.5,
    changefreq VARCHAR(20) DEFAULT 'weekly' CHECK (changefreq IN ('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never')),
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_seo_sitemap_entries_is_active ON seo_sitemap_entries(is_active);
CREATE INDEX idx_seo_sitemap_entries_last_modified ON seo_sitemap_entries(last_modified);

CREATE TRIGGER update_seo_sitemap_entries_last_modified BEFORE UPDATE ON seo_sitemap_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN seo_sitemap_entries.priority IS '0.0 to 1.0';
```

---

## API ENDPOINTS

### Global/Default SEO Settings

#### Get Default SEO Settings

```http
GET /api/v1/admin/seo/settings
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "siteName": "Stencil CMS",
    "defaultMetaTitle": "{page} | {siteName}",
    "defaultMetaDescription": "Leading provider of laser etching and custom engraving services in Indonesia",
    "defaultMetaKeywords": "laser etching, engraving, custom products, Indonesia",
    "openGraph": {
      "type": "website",
      "siteName": "Stencil CMS",
      "defaultImageUrl": "/images/og-default.jpg",
      "locale": "id_ID"
    },
    "twitter": {
      "cardType": "summary_large_image",
      "site": "@stencilcms",
      "creator": "@stencilcms"
    },
    "schemaOrg": {
      "type": "Organization",
      "data": {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Stencil CMS",
        "url": "https://stencilcms.com",
        "logo": "https://stencilcms.com/images/logo.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+62-21-1234567",
          "contactType": "customer service"
        },
        "sameAs": [
          "https://facebook.com/stencilcms",
          "https://instagram.com/stencilcms",
          "https://twitter.com/stencilcms"
        ]
      }
    },
    "robots": {
      "default": "index, follow",
      "allowSearchEngines": true
    },
    "canonicalBaseUrl": "https://stencilcms.com",
    "verification": {
      "googleSiteVerification": "abc123xyz",
      "bingSiteVerification": "def456uvw"
    },
    "socialMedia": {
      "facebook": "https://facebook.com/stencilcms",
      "instagram": "https://instagram.com/stencilcms",
      "twitter": "https://twitter.com/stencilcms",
      "linkedin": "https://linkedin.com/company/stencilcms",
      "youtube": "https://youtube.com/@stencilcms"
    }
  }
}
```

#### Update Default SEO Settings

```http
PUT /api/v1/admin/seo/settings
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "siteName": "Stencil CMS",
  "defaultMetaTitle": "{page} | {siteName}",
  "defaultMetaDescription": "Your trusted partner for laser etching services",
  "defaultMetaKeywords": "laser etching, custom engraving, Indonesia",
  "openGraph": {
    "type": "website",
    "siteName": "Stencil CMS",
    "defaultImageUrl": "/uploads/og-default.jpg",
    "locale": "id_ID"
  },
  "twitter": {
    "cardType": "summary_large_image",
    "site": "@stencilcms",
    "creator": "@stencilcms"
  },
  "schemaOrg": {
    "type": "Organization",
    "data": {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Stencil CMS",
      "url": "https://stencilcms.com"
    }
  },
  "robots": {
    "default": "index, follow",
    "allowSearchEngines": true
  },
  "canonicalBaseUrl": "https://stencilcms.com",
  "verification": {
    "googleSiteVerification": "abc123xyz",
    "bingSiteVerification": "def456uvw"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/stencilcms",
    "instagram": "https://instagram.com/stencilcms"
  }
}
```

---

### Per-Page/Item SEO Management

#### Get SEO for Specific Page/Item

```http
GET /api/v1/admin/seo/{type}/{id}
Authorization: Bearer {token}
```

**Parameters:**
- `type`: Model type (`page`, `product`, `category`, etc.)
- `id`: Model ID

**Example:**
```http
GET /api/v1/admin/seo/page/1
GET /api/v1/admin/seo/product/123
GET /api/v1/admin/seo/category/5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "metableType": "App\\Models\\Page",
    "metableId": 1,
    "isEnabled": true,
    "basicMeta": {
      "title": "Home - Premium Laser Etching Services",
      "description": "Discover our professional laser etching services for acrylic, glass, metal, and wood. Quality guaranteed.",
      "keywords": "laser etching, custom engraving, acrylic etching, glass engraving"
    },
    "openGraph": {
      "title": "Premium Laser Etching Services | Stencil CMS",
      "description": "Professional laser etching and custom engraving services",
      "imageUrl": "/uploads/og-home.jpg",
      "type": "website"
    },
    "twitter": {
      "title": "Premium Laser Etching Services",
      "description": "Professional laser etching and custom engraving",
      "imageUrl": "/uploads/twitter-home.jpg",
      "cardType": "summary_large_image"
    },
    "advanced": {
      "canonicalUrl": "https://stencilcms.com/",
      "robots": "index, follow"
    },
    "schema": {
      "type": "WebPage",
      "data": {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Home",
        "description": "Homepage of Stencil CMS"
      }
    },
    "customMetaTags": {
      "geo.region": "ID-JK",
      "geo.placename": "Jakarta"
    }
  }
}
```

#### Update SEO for Specific Page/Item

```http
PUT /api/v1/admin/seo/{type}/{id}
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "isEnabled": true,
  "basicMeta": {
    "title": "About Us - Stencil CMS History & Team",
    "description": "Learn about our journey, mission, values, and meet our talented team",
    "keywords": "about us, company history, team, mission, vision"
  },
  "openGraph": {
    "title": "About Us | Stencil CMS",
    "description": "Discover our story and meet the team",
    "imageUrl": "/uploads/og-about.jpg",
    "type": "website"
  },
  "twitter": {
    "title": "About Us | Stencil CMS",
    "description": "Our story and team",
    "imageUrl": "/uploads/twitter-about.jpg",
    "cardType": "summary_large_image"
  },
  "advanced": {
    "canonicalUrl": "https://stencilcms.com/about",
    "robots": "index, follow"
  }
}
```

#### Delete SEO for Page/Item (Revert to Default)

```http
DELETE /api/v1/admin/seo/{type}/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "SEO settings deleted. Page will now use default SEO settings."
}
```

---

### Public Endpoints (Frontend)

#### Get Complete SEO for Public Page

```http
GET /api/v1/seo?url=/about
GET /api/v1/seo?type=product&id=123
```

**Query Parameters:**
- `url`: Page URL (for URL-based lookup)
- OR `type` + `id`: For model-based lookup

**Response:**
```json
{
  "success": true,
  "data": {
    "meta": {
      "title": "About Us - Stencil CMS History & Team | Stencil CMS",
      "description": "Learn about our journey, mission, values, and meet our talented team",
      "keywords": "about us, company history, team, mission, vision",
      "robots": "index, follow",
      "canonical": "https://stencilcms.com/about"
    },
    "openGraph": {
      "og:type": "website",
      "og:title": "About Us | Stencil CMS",
      "og:description": "Discover our story and meet the team",
      "og:image": "https://stencilcms.com/uploads/og-about.jpg",
      "og:url": "https://stencilcms.com/about",
      "og:site_name": "Stencil CMS",
      "og:locale": "id_ID"
    },
    "twitter": {
      "twitter:card": "summary_large_image",
      "twitter:title": "About Us | Stencil CMS",
      "twitter:description": "Our story and team",
      "twitter:image": "https://stencilcms.com/uploads/twitter-about.jpg",
      "twitter:site": "@stencilcms",
      "twitter:creator": "@stencilcms"
    },
    "schema": {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "About Us",
      "description": "Learn about our journey and team",
      "url": "https://stencilcms.com/about"
    },
    "verification": {
      "google-site-verification": "abc123xyz",
      "msvalidate.01": "def456uvw"
    },
    "source": "custom"
  }
}
```

**Note:** `source` field indicates:
- `custom` - Using custom SEO from seo_meta table
- `default` - Using default SEO settings
- `system` - Using system defaults (nothing configured)

---

## INTEGRATION DENGAN ADMIN PAGES

Setiap halaman admin harus memiliki **SEO Settings Tab/Section**.

### Homepage Admin Integration

**Location:** `src/pages/admin/PageHome.tsx`

Add SEO tab with fields:
```typescript
<Tabs>
  <Tab label="Content">...</Tab>
  <Tab label="SEO Settings">
    <SEOEditor 
      type="page" 
      id={pageId}
      defaultTitle="Home | {siteName}"
    />
  </Tab>
</Tabs>
```

### Product Editor Integration

**Location:** `src/pages/admin/ProductEditor.tsx`

Add SEO section:
```typescript
<Tabs>
  <Tab label="General">...</Tab>
  <Tab label="Customization">...</Tab>
  <Tab label="SEO">
    <SEOEditor 
      type="product" 
      id={productId}
      defaultTitle="{productName} | Products | {siteName}"
      defaultDescription="Buy {productName} - {shortDescription}"
    />
  </Tab>
</Tabs>
```

---

## SEO COMPONENT STRUCTURE

### Reusable SEO Editor Component

```typescript
interface SEOEditorProps {
  type: 'page' | 'product' | 'category';
  id: number;
  defaultTitle?: string;
  defaultDescription?: string;
}

const SEOEditor: React.FC<SEOEditorProps> = ({ type, id, defaultTitle, defaultDescription }) => {
  // Fetch current SEO or use defaults
  // Provide form with:
  // - Basic Meta (title, description, keywords)
  // - Open Graph settings
  // - Twitter Card settings
  // - Advanced (canonical, robots)
  // - Preview of how it will look in search results
  // - Character count indicators (60 for title, 160 for description)
  // - Button to "Use Default SEO" (delete custom SEO)
}
```

---

## FALLBACK LOGIC IMPLEMENTATION

### Backend Logic (Laravel Example)

```php
class SEOService
{
    public function getSEOForPage($type, $id)
    {
        // 1. Try to get custom SEO
        $customSEO = SEOMeta::where('seo_metable_type', $type)
            ->where('seo_metable_id', $id)
            ->where('is_enabled', true)
            ->first();
        
        if ($customSEO && $customSEO->meta_title) {
            return $this->formatSEO($customSEO, 'custom');
        }
        
        // 2. Fallback to default SEO
        $defaultSEO = SEODefaultSettings::first();
        
        if ($defaultSEO) {
            return $this->formatSEO($defaultSEO, 'default');
        }
        
        // 3. System defaults
        return $this->getSystemDefaults();
    }
    
    private function formatSEO($seo, $source)
    {
        // Process template variables
        // {page} -> current page name
        // {siteName} -> site name
        // {productName} -> product name (if product)
        // etc.
    }
}
```

### Frontend Meta Tags Rendering

```typescript
// In Next.js or React Helmet
import { Helmet } from 'react-helmet';

const SEOHead: React.FC<{ seoData: SEOData }> = ({ seoData }) => {
  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{seoData.meta.title}</title>
      <meta name="description" content={seoData.meta.description} />
      <meta name="keywords" content={seoData.meta.keywords} />
      <meta name="robots" content={seoData.meta.robots} />
      <link rel="canonical" href={seoData.meta.canonical} />
      
      {/* Open Graph */}
      {Object.entries(seoData.openGraph).map(([key, value]) => (
        <meta key={key} property={key} content={value} />
      ))}
      
      {/* Twitter Card */}
      {Object.entries(seoData.twitter).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
      
      {/* Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify(seoData.schema)}
      </script>
      
      {/* Verification */}
      {seoData.verification && Object.entries(seoData.verification).map(([key, value]) => (
        <meta key={key} name={key} content={value} />
      ))}
    </Helmet>
  );
};
```

---

## VALIDATION RULES

### Default SEO Settings
```
site_name: required|string|max:255
default_meta_title: nullable|string|max:255
default_meta_description: nullable|string|max:500
og_default_image_url: nullable|url|max:500
canonical_base_url: nullable|url|max:500
```

### Per-Page SEO
```
meta_title: nullable|string|max:60 (recommended for SEO)
meta_description: nullable|string|max:160 (recommended for SEO)
meta_keywords: nullable|string|max:500
og_image_url: nullable|url|max:500
canonical_url: nullable|url|max:500
robots: nullable|in:index follow,index nofollow,noindex follow,noindex nofollow
```

---

## BUSINESS RULES

1. **Default SEO Settings** hanya ada 1 record (singleton pattern)
2. **Polymorphic SEO** dapat diterapkan ke model apapun
3. **Fallback hierarchy** harus jelas: Custom → Default → System
4. **Title template** menggunakan placeholder `{page}`, `{siteName}`, `{productName}`, dll
5. **Character limits** untuk SEO best practices:
   - Title: 50-60 characters
   - Description: 150-160 characters
6. **OG Image** minimal 1200x630px untuk optimal display
7. **Canonical URL** harus absolute URL (bukan relative)
8. **Robots tag** mempengaruhi indexing di search engines
9. **Delete custom SEO** akan revert ke default settings
10. **Schema.org** disesuaikan dengan page type (WebPage, Product, Article, etc.)

---

## SITEMAP GENERATION

### Generate Sitemap Endpoint

```http
GET /sitemap.xml
```

**Response (XML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://stencilcms.com/</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://stencilcms.com/about</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Dynamic products -->
  <url>
    <loc>https://stencilcms.com/products/acrylic-laser-cutting</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

### Robots.txt Endpoint

```http
GET /robots.txt
```

**Response:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://stencilcms.com/sitemap.xml
```

---

## EXAMPLE SCENARIOS

### Scenario 1: Homepage dengan Custom SEO

```
Request: GET /
Custom SEO exists for Page(id=1, type='home')
→ Use custom SEO from seo_meta table
→ Title: "Home - Premium Laser Etching Services"
→ Source: "custom"
```

### Scenario 2: About Page tanpa Custom SEO

```
Request: GET /about
No custom SEO for Page(id=2, type='about')
→ Use default SEO settings
→ Title: "About | Stencil CMS" (from template "{page} | {siteName}")
→ Source: "default"
```

### Scenario 3: Product dengan Custom SEO

```
Request: GET /products/acrylic-etching
Custom SEO exists for Product(id=15)
→ Use custom SEO
→ Title: "Acrylic Laser Etching - High Precision Custom Engraving"
→ Description: "Professional acrylic laser etching service..."
→ Schema: Product type with price and availability
→ Source: "custom"
```

### Scenario 4: New Product tanpa SEO

```
Request: GET /products/new-item
No custom SEO for Product(id=99)
→ Use default SEO with auto-generated values
→ Title: "New Item | Products | Stencil CMS"
→ Description: (first 160 chars of product description)
→ Source: "default"
```

---

## RECOMMENDED TEMPLATE VARIABLES

### Available Variables
- `{siteName}` - From default settings
- `{page}` - Page name/title from page data
- `{productName}` - Product name
- `{categoryName}` - Category name
- `{year}` - Current year
- `{price}` - Product price (formatted)

### Template Examples
```
Homepage: "{siteName} - {tagline}"
About: "About Us | {siteName}"
Products: "{productName} | Products | {siteName}"
Categories: "{categoryName} Products | {siteName}"
Blog: "{postTitle} | Blog | {siteName}"
```

---

**Previous:** [17-SETTINGS.md](./17-SETTINGS.md)  
**Back to Index:** [00-INDEX.md](./00-INDEX.md)

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** System Architect
