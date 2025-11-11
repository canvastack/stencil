# FAQ/SERING DITANYAKAN MODULE
## Database Schema & API Documentation

**Module:** Content Management - FAQ  
**Total Fields:** 20+  
**Total Tables:** 5  
**Admin Page:** `src/pages/admin/PageFAQ.tsx`

---

## OVERVIEW

Modul FAQ mengelola halaman Frequently Asked Questions dengan fitur:
1. **Hero Section** - Banner halaman FAQ
2. **Categories** - Kategorisasi pertanyaan
3. **FAQ Items** - Pertanyaan dan jawaban
4. **Search Functionality** - Pencarian FAQ
5. **Analytics** - Tracking pencarian dan FAQ populer
6. **CTA Section** - Call-to-action untuk kontak lebih lanjut

---

## DATABASE SCHEMA

### 1. FAQ Hero Section

```sql
CREATE TABLE page_faq_hero (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Frequently Asked Questions',
    subtitle TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_faq_hero ADD CONSTRAINT fk_page_faq_hero_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_faq_hero ADD CONSTRAINT unique_page_faq_hero_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_faq_hero_updated_at BEFORE UPDATE ON page_faq_hero
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. FAQ Categories

```sql
CREATE TABLE faq_categories (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    icon_name VARCHAR(100) NULL,
    description TEXT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faq_categories_page_id ON faq_categories(page_id);
CREATE INDEX idx_faq_categories_display_order ON faq_categories(display_order);

ALTER TABLE faq_categories ADD CONSTRAINT fk_faq_categories_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

CREATE TRIGGER update_faq_categories_updated_at BEFORE UPDATE ON faq_categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN faq_categories.icon_name IS 'Lucide icon name';
```

**Fields:**
- `category_name` - Nama kategori (contoh: "General", "Products", "Shipping", "Payment")
- `icon_name` - Icon untuk kategori (contoh: "HelpCircle", "Package", "Truck", "CreditCard")
- `description` - Deskripsi singkat kategori

### 3. FAQ Items

```sql
CREATE TABLE faq_items (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faq_items_category_id ON faq_items(category_id);
CREATE INDEX idx_faq_items_is_featured ON faq_items(is_featured);
CREATE INDEX idx_faq_items_display_order ON faq_items(display_order);
CREATE INDEX idx_faq_items_view_count ON faq_items(view_count);

ALTER TABLE faq_items ADD CONSTRAINT fk_faq_items_category_id 
    FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE;

CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN faq_items.is_featured IS 'Show in featured/top FAQ section';
COMMENT ON COLUMN faq_items.view_count IS 'How many times viewed';
COMMENT ON COLUMN faq_items.helpful_count IS 'How many found this helpful';

CREATE INDEX idx_faq_items_search ON faq_items USING GIN(to_tsvector('indonesian', question || ' ' || answer));
```

**Fields:**
- `question` - Pertanyaan lengkap
- `answer` - Jawaban lengkap (bisa HTML untuk formatting)
- `is_featured` - FAQ unggulan yang tampil di atas
- `view_count` - Jumlah view (analytics)
- `helpful_count` - Jumlah user yang menandai "helpful"

**Full-Text Search:**
- Menggunakan FULLTEXT index untuk pencarian cepat
- Search pada kolom `question` dan `answer`

### 4. FAQ CTA Section

```sql
CREATE TABLE page_faq_cta (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL,
    title VARCHAR(255) NULL DEFAULT 'Still have questions?',
    subtitle TEXT NULL,
    button_text VARCHAR(100) NULL DEFAULT 'Contact Us',
    button_link VARCHAR(255) NULL DEFAULT '/contact',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE page_faq_cta ADD CONSTRAINT fk_page_faq_cta_page_id 
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

ALTER TABLE page_faq_cta ADD CONSTRAINT unique_page_faq_cta_page_id UNIQUE (page_id);

CREATE TRIGGER update_page_faq_cta_updated_at BEFORE UPDATE ON page_faq_cta
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. FAQ Search Analytics

```sql
CREATE TABLE faq_search_analytics (
    id BIGSERIAL PRIMARY KEY,
    search_query VARCHAR(255) NOT NULL,
    result_count INT DEFAULT 0,
    has_clicked_result BOOLEAN DEFAULT FALSE,
    user_ip VARCHAR(45) NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faq_search_analytics_search_query ON faq_search_analytics(search_query);
CREATE INDEX idx_faq_search_analytics_searched_at ON faq_search_analytics(searched_at);
CREATE INDEX idx_faq_search_analytics_result_count ON faq_search_analytics(result_count);

COMMENT ON COLUMN faq_search_analytics.result_count IS 'Number of results found';
COMMENT ON COLUMN faq_search_analytics.has_clicked_result IS 'Did user click any result';
```

**Purpose:**
- Track what users are searching for
- Identify popular search terms
- Find queries with no results (opportunity to add new FAQs)
- Analyze user behavior

---

## API ENDPOINTS

### Public Endpoints

#### Get FAQ Page Content

```http
GET /api/v1/pages/faq
```

**Response:**
```json
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
      "subtitle": "Find answers to the most common questions about our services"
    },
    "categories": [
      {
        "id": 1,
        "categoryName": "General",
        "iconName": "HelpCircle",
        "description": "General questions about our company",
        "questions": [
          {
            "id": 1,
            "question": "What are your business hours?",
            "answer": "We are open Monday to Friday, 9:00 AM - 5:00 PM, and Saturday 9:00 AM - 1:00 PM. We are closed on Sundays and public holidays.",
            "isFeatured": true,
            "viewCount": 245,
            "helpfulCount": 189
          },
          {
            "id": 2,
            "question": "Where is your office located?",
            "answer": "Our main office is located at Jl. Sudirman No. 123, Jakarta Pusat 10220, Indonesia.",
            "isFeatured": false,
            "viewCount": 156,
            "helpfulCount": 142
          }
        ]
      },
      {
        "id": 2,
        "categoryName": "Products",
        "iconName": "Package",
        "description": "Questions about our products and services",
        "questions": [
          {
            "id": 3,
            "question": "What materials can you work with?",
            "answer": "We can work with various materials including acrylic, glass, metal (stainless steel, aluminum, brass), wood, and leather.",
            "isFeatured": true,
            "viewCount": 312,
            "helpfulCount": 287
          }
        ]
      },
      {
        "id": 3,
        "categoryName": "Shipping",
        "iconName": "Truck",
        "description": "Delivery and shipping information",
        "questions": [
          {
            "id": 4,
            "question": "How long does shipping take?",
            "answer": "Shipping typically takes 3-5 business days for local delivery and 7-14 days for international orders.",
            "isFeatured": false,
            "viewCount": 198,
            "helpfulCount": 176
          }
        ]
      },
      {
        "id": 4,
        "categoryName": "Payment",
        "iconName": "CreditCard",
        "description": "Payment methods and billing",
        "questions": [
          {
            "id": 5,
            "question": "What payment methods do you accept?",
            "answer": "We accept bank transfer, credit/debit cards (Visa, MasterCard), and e-wallets (GoPay, OVO, DANA).",
            "isFeatured": true,
            "viewCount": 278,
            "helpfulCount": 251
          }
        ]
      }
    ],
    "cta": {
      "title": "Still have questions?",
      "subtitle": "Can't find the answer you're looking for? Contact our support team",
      "buttonText": "Contact Us",
      "buttonLink": "/contact"
    },
    "seo": {
      "title": "FAQ - Frequently Asked Questions",
      "metaDescription": "Find answers to common questions about our products and services",
      "metaKeywords": ["faq", "questions", "help", "support"]
    }
  }
}
```

#### Search FAQ

```http
GET /api/v1/faq/search?q=shipping&categoryId=3
```

**Query Parameters:**
- `q` - Search query (required)
- `categoryId` - Filter by category (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "shipping",
    "totalResults": 5,
    "results": [
      {
        "id": 4,
        "categoryId": 3,
        "categoryName": "Shipping",
        "question": "How long does shipping take?",
        "answer": "Shipping typically takes 3-5 business days...",
        "relevanceScore": 0.95
      },
      {
        "id": 7,
        "categoryId": 3,
        "categoryName": "Shipping",
        "question": "Do you offer international shipping?",
        "answer": "Yes, we ship to most countries worldwide...",
        "relevanceScore": 0.87
      }
    ]
  }
}
```

#### Mark FAQ as Helpful

```http
POST /api/v1/faq/{id}/helpful
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback",
  "data": {
    "helpfulCount": 252
  }
}
```

**Note:** Implementasi bisa menggunakan cookie/IP untuk mencegah spam

---

### Admin Endpoints

#### Update Hero Section

```http
PUT /api/v1/admin/pages/faq/hero
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Frequently Asked Questions",
  "subtitle": "Find quick answers to your questions"
}
```

#### Update CTA Section

```http
PUT /api/v1/admin/pages/faq/cta
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Still have questions?",
  "subtitle": "Contact our support team",
  "buttonText": "Get Support",
  "buttonLink": "/support"
}
```

#### Categories CRUD

```http
GET /api/v1/admin/faq/categories
Authorization: Bearer {token}
```

```http
POST /api/v1/admin/faq/categories
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "categoryName": "Technical Support",
  "iconName": "Settings",
  "description": "Technical questions and troubleshooting"
}
```

```http
PUT /api/v1/admin/faq/categories/{id}
Authorization: Bearer {token}
```

```http
DELETE /api/v1/admin/faq/categories/{id}
Authorization: Bearer {token}
```

#### Reorder Categories

```http
PUT /api/v1/admin/faq/categories/{id}/reorder
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "displayOrder": 2
}
```

#### FAQ Items CRUD

```http
GET /api/v1/admin/faq/items?categoryId=1
Authorization: Bearer {token}
```

```http
POST /api/v1/admin/faq/items
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "categoryId": 1,
  "question": "How do I track my order?",
  "answer": "You can track your order using the tracking number sent to your email...",
  "isFeatured": false
}
```

```http
PUT /api/v1/admin/faq/items/{id}
Authorization: Bearer {token}
```

```http
DELETE /api/v1/admin/faq/items/{id}
Authorization: Bearer {token}
```

#### Reorder FAQ Items

```http
PUT /api/v1/admin/faq/items/{id}/reorder
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "displayOrder": 3
}
```

#### Search Analytics

```http
GET /api/v1/admin/faq/analytics/search-terms?dateFrom=2025-01-01&dateTo=2025-01-31
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "searchQuery": "shipping cost",
      "searchCount": 156,
      "avgResultCount": 4,
      "clickRate": 0.78
    },
    {
      "searchQuery": "payment methods",
      "searchCount": 134,
      "avgResultCount": 3,
      "clickRate": 0.85
    },
    {
      "searchQuery": "custom design",
      "searchCount": 89,
      "avgResultCount": 0,
      "clickRate": 0
    }
  ]
}
```

**Note:** Query dengan `avgResultCount: 0` menunjukkan gap yang perlu ditambahkan FAQ baru

#### Popular Questions

```http
GET /api/v1/admin/faq/analytics/popular-questions?limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "question": "What materials can you work with?",
      "viewCount": 312,
      "helpfulCount": 287,
      "helpfulRate": 0.92
    },
    {
      "id": 5,
      "question": "What payment methods do you accept?",
      "viewCount": 278,
      "helpfulCount": 251,
      "helpfulRate": 0.90
    }
  ]
}
```

---

## VALIDATION RULES

### Categories
```
category_name: required|string|max:255
icon_name: nullable|string|max:100
description: nullable|string|max:1000
display_order: integer|min:0
```

### FAQ Items
```
category_id: required|exists:faq_categories,id
question: required|string|min:10|max:500
answer: required|string|min:10|max:5000
is_featured: boolean
```

### CTA Section
```
title: nullable|string|max:255
subtitle: nullable|string|max:1000
button_text: nullable|string|max:100
button_link: nullable|string|max:255
```

---

## BUSINESS RULES

1. **Featured FAQs** ditampilkan di bagian atas, sebelum kategori
2. **Full-text search** menggunakan MySQL FULLTEXT untuk performa optimal
3. **View count** increment otomatis saat FAQ dibuka/di-expand
4. **Helpful count** bisa di-vote sekali per user (tracking via cookie/IP)
5. **Search analytics** menyimpan setiap query untuk analisis
6. **Display order** menentukan urutan tampilan dalam kategori
7. **Delete category** dengan FAQ items harus ditangani (CASCADE atau prevent)

---

## SEARCH IMPLEMENTATION

### Full-Text Search Query
```sql
SELECT 
    f.id,
    f.question,
    f.answer,
    c.category_name,
    MATCH(f.question, f.answer) AGAINST ('search term' IN NATURAL LANGUAGE MODE) AS relevance
FROM faq_items f
JOIN faq_categories c ON f.category_id = c.id
WHERE MATCH(f.question, f.answer) AGAINST ('search term' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC, f.view_count DESC
LIMIT 10;
```

### Search Analytics Tracking
```sql
INSERT INTO faq_search_analytics (search_query, result_count, user_ip)
VALUES ('search term', 5, '192.168.1.1');
```

---

## RECOMMENDED ANALYTICS QUERIES

### Popular Search Terms (Last 30 Days)
```sql
SELECT 
    search_query,
    COUNT(*) as search_count,
    AVG(result_count) as avg_results,
    SUM(CASE WHEN has_clicked_result THEN 1 ELSE 0 END) / COUNT(*) as click_rate
FROM faq_search_analytics
WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY search_query
ORDER BY search_count DESC
LIMIT 20;
```

### Queries with No Results
```sql
SELECT search_query, COUNT(*) as count
FROM faq_search_analytics
WHERE result_count = 0
    AND searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY search_query
ORDER BY count DESC
LIMIT 20;
```

### Most Helpful FAQs
```sql
SELECT 
    id,
    question,
    view_count,
    helpful_count,
    (helpful_count / view_count) as helpful_rate
FROM faq_items
WHERE view_count >= 50
ORDER BY helpful_rate DESC, helpful_count DESC
LIMIT 20;
```

---

**Previous:** [04-CONTACT.md](./04-CONTACT.md)  
**Next:** [06-PRODUCTS.md](./06-PRODUCTS.md) *(To Be Continued)*
