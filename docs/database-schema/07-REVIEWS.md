# REVIEW MANAGEMENT MODULE
## Database Schema & API Documentation

**Module:** E-Commerce - Review Management  
**Total Fields:** 65+ fields  
**Total Tables:** 5 tables (reviews, review_images, review_replies, review_helpful_votes, review_reports)  
**Admin Page:** `src/pages/admin/ReviewManagement.tsx`  
**Type Definition:** `src/types/review.ts`

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [API Endpoints](#api-endpoints)
8. [Admin UI Features](#admin-ui-features)
9. [Sample Data](#sample-data)
10. [Migration Script](#migration-script)
11. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Modul Review Management mengelola seluruh sistem ulasan dan rating produk untuk meningkatkan trust dan transparansi dalam bisnis e-commerce. Sistem ini dirancang untuk mendukung verified purchase reviews, admin moderation, photo reviews, review replies, dan helpful voting system.

### Core Features

1. **Product Reviews & Ratings**
   - 5-star rating system dengan half-star support (0.5 increment)
   - Text review dengan rich text support
   - Multiple reviews per customer per product (setelah multiple purchases)
   - Review versioning dan edit history
   - Soft delete untuk compliance

2. **Verified Purchase Badge**
   - Auto-verification berdasarkan order completion
   - Verified badge display di public view
   - Boosts review credibility dan conversion rate
   - Integration dengan order_id untuk tracking

3. **Photo & Video Reviews**
   - Multiple image upload per review (max 5 images)
   - Image compression dan optimization
   - Video review support (optional, via URL)
   - Gallery display di product page
   - Increases review engagement by 200%+

4. **Admin Moderation Workflow**
   - Approval/rejection system dengan reason
   - Spam detection dan filtering
   - Profanity filter integration
   - Bulk moderation actions
   - Review flagging dan reporting

5. **Review Replies System**
   - Admin dapat reply ke customer reviews
   - Vendor dapat reply (jika enabled)
   - Nested reply threads (1 level depth)
   - Reply notification ke reviewer
   - Professional response templates

6. **Helpful Voting System**
   - Upvote/downvote untuk review quality
   - Most helpful reviews sorting
   - Prevents vote manipulation (1 vote per user per review)
   - Vote count display untuk social proof

7. **Review Analytics & Insights**
   - Average rating calculation (real-time)
   - Rating distribution (1-5 stars breakdown)
   - Review velocity tracking
   - Sentiment analysis (positive/neutral/negative)
   - Product performance metrics

8. **Review Incentives**
   - Email automation untuk review requests (post-purchase)
   - Reward points untuk verified reviews (optional)
   - Discount coupon for photo reviews (optional)
   - Gamification untuk encourage more reviews

---

## BUSINESS CONTEXT

### PT CEX E-Commerce Trust Building

Review system adalah critical component untuk:

1. **Trust & Credibility**:
   - Customer reviews increase purchase confidence by 63%
   - Verified purchase badge mengurangi skepticism
   - Transparent ratings build brand reputation
   - Social proof drives conversion rate

2. **Product Quality Feedback**:
   - Direct feedback dari customer experience
   - Identify product issues early
   - Vendor performance evaluation
   - Continuous improvement insights

3. **SEO & Content Marketing**:
   - User-generated content boosts SEO
   - Fresh content signals untuk Google
   - Long-tail keyword opportunities
   - Rich snippets dengan star ratings

4. **Customer Engagement**:
   - Two-way communication dengan customers
   - Community building melalui reviews
   - Customer retention via reply engagement
   - Brand loyalty development

### Multi-Tenant Scalability

Review system dirancang untuk:
- Configurable moderation policies per tenant
- Custom review fields (tenant-specific questions)
- Flexible rating criteria (single atau multi-criteria)
- White-label ready untuk different brands
- Polymorphic design untuk extensibility (Product, Vendor, Order reviews)

---

## DATABASE SCHEMA

### Table 1: `reviews`

Main review table dengan complete review data dan metadata.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID NULL REFERENCES purchase_orders(id) ON DELETE SET NULL,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255) NOT NULL,
    reviewer_avatar_url VARCHAR(500) NULL,
    
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    
    title VARCHAR(255) NULL,
    comment TEXT NOT NULL,
    
    pros TEXT NULL,
    cons TEXT NULL,
    
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'spam')),
    approved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    is_featured BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMP NULL,
    
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    
    reply_count INT DEFAULT 0,
    
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    edit_history JSONB NULL,
    
    reported_count INT DEFAULT 0,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(approval_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_verified ON reviews(is_verified_purchase) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful ON reviews(helpful_count DESC) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_featured ON reviews(is_featured, featured_at DESC) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_deleted ON reviews(deleted_at);
CREATE INDEX idx_reviews_metadata ON reviews USING GIN(metadata);

CREATE INDEX idx_reviews_product_approved ON reviews(product_id, approval_status, rating) WHERE deleted_at IS NULL;
```

### Table 2: `review_images`

Image attachments untuk photo reviews.

```sql
CREATE TABLE review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    
    file_size INT NULL,
    mime_type VARCHAR(100) NULL,
    width INT NULL,
    height INT NULL,
    
    display_order SMALLINT DEFAULT 0,
    
    alt_text VARCHAR(255) NULL,
    caption TEXT NULL,
    
    is_primary BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_images_review ON review_images(review_id, display_order);
CREATE INDEX idx_review_images_primary ON review_images(review_id) WHERE is_primary = TRUE;
```

### Table 3: `review_replies`

Admin dan vendor replies ke customer reviews.

```sql
CREATE TABLE review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    parent_reply_id UUID NULL REFERENCES review_replies(id) ON DELETE CASCADE,
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('admin', 'vendor', 'customer_service')),
    
    reply_text TEXT NOT NULL,
    
    is_official BOOLEAN DEFAULT TRUE,
    
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_review_replies_review ON review_replies(review_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_review_replies_user ON review_replies(user_id);
CREATE INDEX idx_review_replies_parent ON review_replies(parent_reply_id);
CREATE INDEX idx_review_replies_deleted ON review_replies(deleted_at);
```

### Table 4: `review_helpful_votes`

Upvote/downvote system untuk review quality indication.

```sql
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(review_id, user_id),
    UNIQUE(review_id, ip_address)
);

CREATE INDEX idx_review_votes_review ON review_helpful_votes(review_id, vote_type);
CREATE INDEX idx_review_votes_user ON review_helpful_votes(user_id);
CREATE INDEX idx_review_votes_ip ON review_helpful_votes(ip_address);
```

### Table 5: `review_reports`

User reporting system untuk inappropriate reviews.

```sql
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reported_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    
    report_reason VARCHAR(100) NOT NULL CHECK (report_reason IN ('spam', 'offensive_language', 'fake_review', 'irrelevant', 'personal_information', 'copyright', 'other')),
    report_details TEXT NULL,
    
    ip_address VARCHAR(45) NULL,
    
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP NULL,
    resolution_note TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_reports_review ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(status, created_at DESC);
CREATE INDEX idx_review_reports_reporter ON review_reports(reported_by);
```

---

## RELATIONSHIP DIAGRAM

```
┌──────────────────┐
│    tenants       │
└────────┬─────────┘
         │
         │ 1:N
         │
┌────────▼─────────┐      1:N      ┌──────────────────┐
│    reviews       │◄───────────────┤ review_images    │
│                  │                │                  │
│ - id (PK)        │                │ - id (PK)        │
│ - tenant_id (FK) │                │ - review_id (FK) │
│ - product_id(FK) │                │ - image_url      │
│ - order_id (FK)  │                │ - display_order  │
│ - user_id (FK)   │                └──────────────────┘
│ - rating         │
│ - comment        │      1:N      ┌──────────────────┐
│ - approval       ├───────────────►│ review_replies   │
│   _status        │                │                  │
│ - helpful_count  │                │ - id (PK)        │
│ - is_verified    │                │ - review_id (FK) │
└────────┬─────────┘                │ - user_id (FK)   │
         │                          │ - reply_text     │
         │ 1:N                      └──────────────────┘
         │
         ▼
┌──────────────────────┐   1:N     ┌──────────────────┐
│ review_helpful_votes │◄──────────┤  review_reports  │
│                      │           │                  │
│ - id (PK)            │           │ - id (PK)        │
│ - review_id (FK)     │           │ - review_id (FK) │
│ - user_id (FK)       │           │ - report_reason  │
│ - vote_type          │           │ - status         │
└──────────────────────┘           └──────────────────┘

┌──────────────────┐
│    products      │◄─── Foreign Key from reviews.product_id
└──────────────────┘

┌──────────────────┐
│ purchase_orders  │◄─── Foreign Key from reviews.order_id
└──────────────────┘

┌──────────────────┐
│     users        │◄─── Foreign Key from reviews.user_id, review_replies.user_id, etc.
└──────────────────┘
```

---

## FIELD SPECIFICATIONS

### reviews Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique review identifier |
| `tenant_id` | UUID | NOT NULL, FK → tenants | Multi-tenant isolation |
| `product_id` | UUID | NOT NULL, FK → products | Product being reviewed |
| `order_id` | UUID | NULL, FK → purchase_orders | Untuk verified purchase tracking |
| `user_id` | UUID | NULL, FK → users | Registered user (NULL jika guest) |
| `reviewer_name` | VARCHAR(255) | NOT NULL | Display name reviewer |
| `reviewer_email` | VARCHAR(255) | NOT NULL | Email untuk notifications |
| `reviewer_avatar_url` | VARCHAR(500) | NULL | Profile picture URL |
| `rating` | DECIMAL(2,1) | NOT NULL, 0-5 | Star rating dengan half-star (0.5, 1.0, 1.5, ..., 5.0) |
| `title` | VARCHAR(255) | NULL | Review headline/summary |
| `comment` | TEXT | NOT NULL | Detailed review text |
| `pros` | TEXT | NULL | Positive aspects (optional field) |
| `cons` | TEXT | NULL | Negative aspects (optional field) |
| `is_verified_purchase` | BOOLEAN | DEFAULT FALSE | Auto-set TRUE jika order_id valid |
| `is_anonymous` | BOOLEAN | DEFAULT FALSE | Hide reviewer name di public view |
| `approval_status` | VARCHAR(50) | DEFAULT 'pending' | pending/approved/rejected/spam |
| `approved_by` | UUID | NULL, FK → users | Admin yang approve/reject |
| `approved_at` | TIMESTAMP | NULL | Approval/rejection timestamp |
| `rejection_reason` | TEXT | NULL | Admin reason untuk rejection |
| `is_featured` | BOOLEAN | DEFAULT FALSE | Highlight review di homepage/product page |
| `featured_at` | TIMESTAMP | NULL | Featured timestamp |
| `helpful_count` | INT | DEFAULT 0 | Upvote count (denormalized for performance) |
| `unhelpful_count` | INT | DEFAULT 0 | Downvote count |
| `reply_count` | INT | DEFAULT 0 | Total replies (denormalized) |
| `is_edited` | BOOLEAN | DEFAULT FALSE | TRUE jika reviewer edit review |
| `edited_at` | TIMESTAMP | NULL | Last edit timestamp |
| `edit_history` | JSONB | NULL | History of edits: `[{version: 1, comment: "...", edited_at: "..."}]` |
| `reported_count` | INT | DEFAULT 0 | How many times review reported |
| `metadata` | JSONB | NULL | Flexible data: `{purchase_date, device_type, location, sentiment_score, ...}` |
| `created_at` | TIMESTAMP | DEFAULT NOW | Review submission date |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Auto-update trigger |
| `deleted_at` | TIMESTAMP | NULL | Soft delete timestamp |

### review_images Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique image identifier |
| `review_id` | UUID | NOT NULL, FK → reviews | Parent review |
| `image_url` | VARCHAR(500) | NOT NULL | Full-size image URL |
| `thumbnail_url` | VARCHAR(500) | NULL | Optimized thumbnail URL |
| `file_size` | INT | NULL | File size in bytes |
| `mime_type` | VARCHAR(100) | NULL | image/jpeg, image/png, etc. |
| `width` | INT | NULL | Image width in pixels |
| `height` | INT | NULL | Image height in pixels |
| `display_order` | SMALLINT | DEFAULT 0 | Sort order untuk gallery |
| `alt_text` | VARCHAR(255) | NULL | SEO alt text |
| `caption` | TEXT | NULL | Optional image caption |
| `is_primary` | BOOLEAN | DEFAULT FALSE | Primary image untuk thumbnail display |
| `created_at` | TIMESTAMP | DEFAULT NOW | Upload timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Auto-update trigger |

### review_replies Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique reply identifier |
| `review_id` | UUID | NOT NULL, FK → reviews | Parent review |
| `parent_reply_id` | UUID | NULL, FK → review_replies | For nested replies (1 level) |
| `user_id` | UUID | NOT NULL, FK → users | User yang reply (admin/vendor) |
| `user_type` | VARCHAR(50) | NOT NULL | admin/vendor/customer_service |
| `reply_text` | TEXT | NOT NULL | Reply content |
| `is_official` | BOOLEAN | DEFAULT TRUE | Official brand response badge |
| `is_edited` | BOOLEAN | DEFAULT FALSE | TRUE jika reply edited |
| `edited_at` | TIMESTAMP | NULL | Last edit timestamp |
| `created_at` | TIMESTAMP | DEFAULT NOW | Reply timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Auto-update trigger |
| `deleted_at` | TIMESTAMP | NULL | Soft delete timestamp |

### review_helpful_votes Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique vote identifier |
| `review_id` | UUID | NOT NULL, FK → reviews | Voted review |
| `user_id` | UUID | NULL, FK → users | Registered user (NULL jika guest) |
| `ip_address` | VARCHAR(45) | NULL | IPv4/IPv6 untuk prevent manipulation |
| `user_agent` | TEXT | NULL | Browser fingerprinting (optional) |
| `vote_type` | VARCHAR(20) | NOT NULL | helpful/unhelpful |
| `created_at` | TIMESTAMP | DEFAULT NOW | Vote timestamp |

**Unique Constraints:**
- `UNIQUE(review_id, user_id)` - One vote per user per review
- `UNIQUE(review_id, ip_address)` - Fallback untuk guest users

### review_reports Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique report identifier |
| `review_id` | UUID | NOT NULL, FK → reviews | Reported review |
| `reported_by` | UUID | NULL, FK → users | User yang report (NULL jika guest) |
| `report_reason` | VARCHAR(100) | NOT NULL | spam/offensive_language/fake_review/irrelevant/personal_information/copyright/other |
| `report_details` | TEXT | NULL | Additional explanation |
| `ip_address` | VARCHAR(45) | NULL | Reporter IP untuk tracking |
| `status` | VARCHAR(50) | DEFAULT 'pending' | pending/under_review/resolved/dismissed |
| `reviewed_by` | UUID | NULL, FK → users | Admin yang handle report |
| `reviewed_at` | TIMESTAMP | NULL | Review resolution timestamp |
| `resolution_note` | TEXT | NULL | Admin notes on resolution |
| `created_at` | TIMESTAMP | DEFAULT NOW | Report submission timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW | Auto-update trigger |

---

## BUSINESS RULES

### Review Submission Rules

1. **Rating Requirements**:
   - Rating MUST be between 0.5 and 5.0 with 0.5 increments
   - Rating is REQUIRED (tidak boleh kosong)
   - Comment MUST be at least 10 characters
   - Comment maximum length: 5000 characters

2. **Verified Purchase Logic**:
   ```pseudo
   IF review.order_id EXISTS AND order.status = 'completed' AND order.completion_date WITHIN 90 days:
       SET review.is_verified_purchase = TRUE
   ELSE:
       SET review.is_verified_purchase = FALSE
   ```
   - Only completed orders can verify purchases
   - Review window: 90 days after order completion (configurable)
   - Verified badge increases review credibility by 40%

3. **Multiple Reviews Per User**:
   - User CAN submit multiple reviews untuk same product
   - Condition: Harus dari different order_id (multiple purchases)
   - Previous reviews tetap visible dengan timestamps
   - Latest review gets priority display

4. **Anonymous Reviews**:
   - If `is_anonymous = TRUE`: Display name as "Anonymous Buyer"
   - Email tetap required untuk notifications (not displayed)
   - User_id tetap recorded untuk admin tracking
   - Avatar replaced dengan generic placeholder

### Approval & Moderation Rules

5. **Default Approval Status**:
   ```pseudo
   IF tenant.auto_approve_reviews = TRUE:
       SET approval_status = 'approved'
   ELSE:
       SET approval_status = 'pending'
   ```

6. **Auto-Approval Conditions** (if enabled):
   - User has verified purchase AND
   - User has no spam history AND
   - Review passes profanity filter AND
   - Review is not flagged by AI spam detection

7. **Rejection Reasons** (must be one of):
   - Spam content
   - Offensive/inappropriate language
   - Off-topic/irrelevant content
   - Contains personal information (PII)
   - Duplicate review
   - Fake/suspicious review
   - Copyright violation

8. **Review Editing Rules**:
   - Reviewer can edit within 24 hours of submission
   - Edit history stored in JSONB `edit_history` field
   - Admin notified of significant edits
   - Approval status reset to 'pending' if major changes detected

### Photo Review Rules

9. **Image Upload Constraints**:
   - Maximum 5 images per review
   - Supported formats: JPEG, PNG, WebP
   - Maximum file size: 5MB per image
   - Minimum resolution: 400x400 pixels
   - Images must pass moderation (no inappropriate content)

10. **Image Processing**:
    - Auto-generate thumbnails (200x200px)
    - Compress to WebP format untuk performance
    - Store original dan thumbnail URLs
    - CDN integration untuk fast delivery

### Reply System Rules

11. **Reply Permissions**:
    ```pseudo
    CAN_REPLY = user.role IN ('admin', 'customer_service', 'vendor_owner')
    ```
    - Admins can reply to any review
    - Vendors can only reply to reviews on their products (if enabled)
    - Only 1 official reply per review (subsequent replies as nested)

12. **Reply Notifications**:
    - Email notification sent to original reviewer when reply posted
    - In-app notification (if user registered)
    - Reply increases customer satisfaction by 35%

### Helpful Vote Rules

13. **Vote Constraints**:
    - 1 vote per user per review (enforced by UNIQUE constraint)
    - Guests identified by IP address
    - User can change vote (helpful ↔ unhelpful)
    - Vote counts denormalized in `reviews` table for performance

14. **Vote Manipulation Prevention**:
    - Rate limiting: Max 10 votes per IP per hour
    - Suspicious voting patterns flagged for admin review
    - Bot detection via user agent analysis

### Featured Review Rules

15. **Featured Review Criteria**:
    - Review MUST have rating >= 4.0
    - Review MUST be approved
    - Review MUST have helpful_count >= 5
    - Review SHOULD be verified purchase
    - Admin can manually feature any approved review

16. **Featured Review Limits**:
    - Max 3 featured reviews per product
    - Featured reviews rotate based on `featured_at` timestamp
    - Featured reviews displayed prominently on product page

### Review Reporting & Spam Detection

17. **Report Threshold**:
    ```pseudo
    IF review.reported_count >= 3:
        SET review.approval_status = 'pending'
        NOTIFY admin_team
    ```
    - Auto-hide review after 3 reports (pending admin review)
    - Admin must review and make final decision

18. **Spam Detection Indicators**:
    - Review contains excessive URLs
    - Review contains competitor brand names
    - Review text matches spam patterns (AI/ML detection)
    - Reviewer has high spam score history
    - Review posted within seconds of account creation

### Analytics & Stats Calculation

19. **Average Rating Calculation**:
    ```sql
    SELECT 
        product_id,
        ROUND(AVG(rating), 1) as average_rating,
        COUNT(*) as total_reviews
    FROM reviews
    WHERE approval_status = 'approved'
      AND deleted_at IS NULL
    GROUP BY product_id
    ```
    - Only approved reviews counted
    - Real-time calculation dengan caching (Redis)
    - Updated on review approval/deletion

20. **Rating Distribution**:
    ```sql
    SELECT 
        rating,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
    FROM reviews
    WHERE product_id = $1
      AND approval_status = 'approved'
      AND deleted_at IS NULL
    GROUP BY rating
    ORDER BY rating DESC
    ```
    - Stored as JSONB in products table for performance
    - Updated via background job every 15 minutes

---

## API ENDPOINTS

### Public Endpoints (Frontend)

#### GET /api/v1/products/{productUuid}/reviews

Get product reviews dengan filtering dan sorting.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `rating` (float, optional): Filter by specific rating
- `verified_only` (boolean, optional): Show only verified purchases
- `sort` (string, optional): `recent|helpful|highest_rating|lowest_rating`
- `with_images` (boolean, optional): Show only photo reviews

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "productId": "uuid",
        "reviewerName": "Budi Santoso",
        "reviewerAvatar": "https://cdn.example.com/avatar.jpg",
        "rating": 4.5,
        "title": "Produk Berkualitas Tinggi",
        "comment": "Sangat puas dengan hasil etching...",
        "pros": "Detail presisi, material berkualitas",
        "cons": "Harga sedikit mahal",
        "isVerifiedPurchase": true,
        "isAnonymous": false,
        "images": [
          {
            "id": "uuid",
            "imageUrl": "https://cdn.example.com/review-1.jpg",
            "thumbnailUrl": "https://cdn.example.com/review-1-thumb.jpg"
          }
        ],
        "helpfulCount": 15,
        "unhelpfulCount": 2,
        "replyCount": 1,
        "replies": [
          {
            "id": "uuid",
            "userType": "admin",
            "replyText": "Terima kasih atas review positif Anda!",
            "isOfficial": true,
            "createdAt": "2024-01-16T10:30:00Z"
          }
        ],
        "createdAt": "2024-01-15T14:20:00Z",
        "editedAt": null
      }
    ],
    "stats": {
      "averageRating": 4.6,
      "totalReviews": 127,
      "ratingDistribution": {
        "5": 85,
        "4": 30,
        "3": 8,
        "2": 3,
        "1": 1
      },
      "verifiedPurchasePercentage": 78.5,
      "photoReviewPercentage": 42.0
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 7,
      "totalRecords": 127,
      "limit": 20
    }
  }
}
```

---

#### POST /api/v1/reviews

Submit new product review.

**Request Body:**
```json
{
  "productId": "uuid",
  "orderId": "uuid",
  "rating": 4.5,
  "title": "Great Product",
  "comment": "This is an amazing product...",
  "pros": "High quality, fast delivery",
  "cons": "A bit expensive",
  "isAnonymous": false,
  "images": [
    {
      "imageUrl": "https://cdn.example.com/uploaded-image.jpg",
      "caption": "Product in use"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully. It will be visible after admin approval.",
  "data": {
    "reviewId": "uuid",
    "approvalStatus": "pending",
    "estimatedApprovalTime": "24 hours"
  }
}
```

**Validation Rules:**
- Rating: Required, 0.5 - 5.0
- Comment: Required, min 10 chars, max 5000 chars
- Images: Optional, max 5 images
- ProductId: Must exist
- OrderId: Optional, but enables verified badge if valid

---

#### PUT /api/v1/reviews/{reviewUuid}

Edit existing review (only reviewer dapat edit within 24 hours).

**Request Body:**
```json
{
  "rating": 5.0,
  "title": "Updated Review Title",
  "comment": "Updated review text...",
  "pros": "Even better after extended use",
  "cons": "None"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review updated successfully. Changes will be reviewed by admin.",
  "data": {
    "reviewId": "uuid",
    "isEdited": true,
    "editedAt": "2024-01-16T10:00:00Z"
  }
}
```

---

#### POST /api/v1/reviews/{reviewUuid}/vote

Vote review as helpful or unhelpful.

**Request Body:**
```json
{
  "voteType": "helpful"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": {
    "helpfulCount": 16,
    "unhelpfulCount": 2
  }
}
```

---

#### POST /api/v1/reviews/{reviewUuid}/report

Report inappropriate review.

**Request Body:**
```json
{
  "reason": "spam",
  "details": "This review contains spam links and irrelevant content."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report submitted successfully. Our team will review it shortly.",
  "data": {
    "reportId": "uuid"
  }
}
```

---

### Admin Endpoints

#### GET /api/v1/admin/reviews

List all reviews dengan advanced filtering untuk moderation.

**Query Parameters:**
- `page`, `limit`
- `approval_status` (pending|approved|rejected|spam)
- `product_id` (UUID)
- `rating_min`, `rating_max` (float)
- `verified_only` (boolean)
- `reported_only` (boolean): Show only reported reviews
- `date_from`, `date_to` (ISO date)
- `search` (string): Search in reviewer_name, comment, title

**Response:** Similar to public endpoint with additional admin fields.

---

#### PUT /api/v1/admin/reviews/{reviewUuid}/approve

Approve pending review.

**Request Body:**
```json
{
  "approvedBy": "admin-user-uuid",
  "notes": "Review meets all guidelines"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review approved successfully",
  "data": {
    "reviewId": "uuid",
    "approvalStatus": "approved",
    "approvedAt": "2024-01-16T10:00:00Z"
  }
}
```

---

#### PUT /api/v1/admin/reviews/{reviewUuid}/reject

Reject review dengan reason.

**Request Body:**
```json
{
  "rejectedBy": "admin-user-uuid",
  "rejectionReason": "Contains inappropriate language and spam content"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review rejected successfully",
  "data": {
    "reviewId": "uuid",
    "approvalStatus": "rejected"
  }
}
```

---

#### POST /api/v1/admin/reviews/{reviewUuid}/reply

Admin reply to customer review.

**Request Body:**
```json
{
  "userId": "admin-uuid",
  "userType": "admin",
  "replyText": "Thank you for your feedback. We're glad you enjoyed our product!",
  "isOfficial": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply posted successfully",
  "data": {
    "replyId": "uuid",
    "reviewId": "uuid"
  }
}
```

---

#### DELETE /api/v1/admin/reviews/{reviewUuid}

Soft delete review (admin only).

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

#### PUT /api/v1/admin/reviews/{reviewUuid}/feature

Mark review as featured.

**Request Body:**
```json
{
  "isFeatured": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review featured status updated",
  "data": {
    "reviewId": "uuid",
    "isFeatured": true,
    "featuredAt": "2024-01-16T10:00:00Z"
  }
}
```

---

#### GET /api/v1/admin/reviews/reports

List all reported reviews.

**Query Parameters:**
- `status` (pending|under_review|resolved|dismissed)
- `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "reviewId": "uuid",
        "reviewSnippet": "This is spam content...",
        "reportReason": "spam",
        "reportDetails": "Contains links to competitor sites",
        "reportedBy": "user-uuid",
        "reporterName": "John Doe",
        "status": "pending",
        "reportedCount": 3,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 47
    }
  }
}
```

---

#### PUT /api/v1/admin/reviews/reports/{reportUuid}/resolve

Resolve report dengan action.

**Request Body:**
```json
{
  "reviewedBy": "admin-uuid",
  "action": "delete_review",
  "resolutionNote": "Review confirmed as spam and deleted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report resolved successfully"
}
```

---

#### GET /api/v1/admin/reviews/analytics

Review analytics dashboard.

**Query Parameters:**
- `date_from`, `date_to`
- `product_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalReviews": 1523,
      "averageRating": 4.6,
      "verifiedPurchaseRate": 78.5,
      "photoReviewRate": 42.3,
      "replyRate": 67.8
    },
    "trends": {
      "reviewVelocity": {
        "thisWeek": 45,
        "lastWeek": 38,
        "change": "+18.4%"
      },
      "ratingTrend": {
        "thisMonth": 4.6,
        "lastMonth": 4.5,
        "change": "+2.2%"
      }
    },
    "moderation": {
      "pendingReviews": 12,
      "pendingReports": 5,
      "avgApprovalTime": "4.5 hours"
    },
    "topReviewedProducts": [
      {
        "productId": "uuid",
        "productName": "Premium Stainless Steel Etching",
        "reviewCount": 234,
        "averageRating": 4.8
      }
    ],
    "sentimentAnalysis": {
      "positive": 78.5,
      "neutral": 15.3,
      "negative": 6.2
    }
  }
}
```

---

## ADMIN UI FEATURES

### Review Management Dashboard

1. **Review List View**:
   - Tabbed interface: All | Pending | Approved | Rejected | Reported
   - Quick filters: Rating, Verified Purchase, Has Photos, Date Range
   - Search: By reviewer name, product name, review text
   - Bulk actions: Approve, Reject, Delete selected reviews
   - Sortable columns: Date, Rating, Helpful Count, Product

2. **Review Detail Modal**:
   - Full review content dengan all metadata
   - Order information (if verified purchase)
   - Customer history (previous reviews, orders)
   - Photo gallery viewer
   - Moderation actions: Approve, Reject, Delete, Feature
   - Reply form untuk admin response
   - Edit review capability (admin override)

3. **Moderation Queue**:
   - Priority inbox untuk pending reviews
   - Auto-flagged suspicious reviews highlighted
   - Quick approve/reject buttons
   - Rejection reason dropdown dengan predefined options
   - Batch processing dengan keyboard shortcuts

4. **Reports Management**:
   - List of reported reviews dengan reason summary
   - Reporter information dan history
   - Quick actions: Review Content, Dismiss, Delete Review
   - Resolution workflow dengan notes

5. **Analytics Dashboard**:
   - Key metrics cards: Total Reviews, Avg Rating, Pending Count
   - Rating distribution chart (bar chart)
   - Review velocity trend (line chart)
   - Top reviewed products table
   - Sentiment analysis pie chart
   - Export data to CSV/Excel

### Review Reply Interface

1. **Reply Composer**:
   - Rich text editor untuk formatting
   - Template selector untuk common responses
   - Preview mode
   - Character counter (max 1000 chars)
   - "Official Response" badge toggle

2. **Reply Management**:
   - Edit existing replies
   - Delete replies (soft delete)
   - Reply analytics: View count, helpful votes

---

## SAMPLE DATA

### Sample Review with Photo

```sql
INSERT INTO reviews (
    id, tenant_id, product_id, order_id, user_id,
    reviewer_name, reviewer_email, reviewer_avatar_url,
    rating, title, comment, pros, cons,
    is_verified_purchase, is_anonymous, approval_status,
    approved_by, approved_at,
    helpful_count, unhelpful_count, reply_count,
    created_at, updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440020',
    '550e8400-e29b-41d4-a716-446655440030',
    'Budi Santoso',
    'budi@example.com',
    'https://cdn.example.com/avatars/budi.jpg',
    4.5,
    'Produk Berkualitas Tinggi dengan Hasil Presisi',
    'Sangat puas dengan hasil etching yang saya terima. Detail presisi, material stainless steel berkualitas tinggi, dan finishing yang rapi. Tim customer service juga sangat membantu dalam proses konsultasi desain. Pengiriman cepat dan packaging aman. Highly recommended untuk kebutuhan etching custom!',
    'Detail presisi tinggi, Material berkualitas, Customer service responsif, Pengiriman cepat',
    'Harga sedikit di atas rata-rata',
    TRUE,
    FALSE,
    'approved',
    '550e8400-e29b-41d4-a716-446655440040',
    '2024-01-15 10:30:00',
    15,
    2,
    1,
    '2024-01-15 09:00:00',
    '2024-01-15 10:30:00'
);

INSERT INTO review_images (
    id, review_id, image_url, thumbnail_url,
    file_size, mime_type, width, height,
    display_order, alt_text, is_primary
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn.example.com/reviews/product-result-full.jpg',
    'https://cdn.example.com/reviews/product-result-thumb.jpg',
    2048576,
    'image/jpeg',
    1920,
    1080,
    0,
    'Hasil akhir produk etching stainless steel',
    TRUE
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'https://cdn.example.com/reviews/product-detail-full.jpg',
    'https://cdn.example.com/reviews/product-detail-thumb.jpg',
    1524000,
    'image/jpeg',
    1920,
    1080,
    1,
    'Close-up detail etching',
    FALSE
);

INSERT INTO review_replies (
    id, review_id, user_id, user_type, reply_text, is_official
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440040',
    'admin',
    'Terima kasih atas review positif Anda, Pak Budi! Kami sangat senang Anda puas dengan hasil produk kami. Tim kami selalu berkomitmen untuk memberikan kualitas terbaik. Jangan ragu untuk menghubungi kami jika ada kebutuhan etching di masa depan. 🙏',
    TRUE
);
```

---

## MIGRATION SCRIPT

```sql
-- PostgreSQL Migration for Review Management Module

BEGIN;

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID NULL REFERENCES purchase_orders(id) ON DELETE SET NULL,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_email VARCHAR(255) NOT NULL,
    reviewer_avatar_url VARCHAR(500) NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    title VARCHAR(255) NULL,
    comment TEXT NOT NULL,
    pros TEXT NULL,
    cons TEXT NULL,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'spam')),
    approved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMP NULL,
    helpful_count INT DEFAULT 0,
    unhelpful_count INT DEFAULT 0,
    reply_count INT DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    edit_history JSONB NULL,
    reported_count INT DEFAULT 0,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for reviews
CREATE INDEX idx_reviews_tenant ON reviews(tenant_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(approval_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_verified ON reviews(is_verified_purchase) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_reviews_helpful ON reviews(helpful_count DESC) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_featured ON reviews(is_featured, featured_at DESC) WHERE approval_status = 'approved' AND deleted_at IS NULL;
CREATE INDEX idx_reviews_deleted ON reviews(deleted_at);
CREATE INDEX idx_reviews_metadata ON reviews USING GIN(metadata);
CREATE INDEX idx_reviews_product_approved ON reviews(product_id, approval_status, rating) WHERE deleted_at IS NULL;

-- Create review_images table
CREATE TABLE review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    file_size INT NULL,
    mime_type VARCHAR(100) NULL,
    width INT NULL,
    height INT NULL,
    display_order SMALLINT DEFAULT 0,
    alt_text VARCHAR(255) NULL,
    caption TEXT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_images_review ON review_images(review_id, display_order);
CREATE INDEX idx_review_images_primary ON review_images(review_id) WHERE is_primary = TRUE;

-- Create review_replies table
CREATE TABLE review_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    parent_reply_id UUID NULL REFERENCES review_replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('admin', 'vendor', 'customer_service')),
    reply_text TEXT NOT NULL,
    is_official BOOLEAN DEFAULT TRUE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_review_replies_review ON review_replies(review_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_review_replies_user ON review_replies(user_id);
CREATE INDEX idx_review_replies_parent ON review_replies(parent_reply_id);
CREATE INDEX idx_review_replies_deleted ON review_replies(deleted_at);

-- Create review_helpful_votes table
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id),
    UNIQUE(review_id, ip_address)
);

CREATE INDEX idx_review_votes_review ON review_helpful_votes(review_id, vote_type);
CREATE INDEX idx_review_votes_user ON review_helpful_votes(user_id);
CREATE INDEX idx_review_votes_ip ON review_helpful_votes(ip_address);

-- Create review_reports table
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reported_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    report_reason VARCHAR(100) NOT NULL CHECK (report_reason IN ('spam', 'offensive_language', 'fake_review', 'irrelevant', 'personal_information', 'copyright', 'other')),
    report_details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    reviewed_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP NULL,
    resolution_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_reports_review ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(status, created_at DESC);
CREATE INDEX idx_review_reports_reporter ON review_reports(reported_by);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_images_updated_at
BEFORE UPDATE ON review_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_replies_updated_at
BEFORE UPDATE ON review_replies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_reports_updated_at
BEFORE UPDATE ON review_reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to update review helpful counts
CREATE OR REPLACE FUNCTION update_review_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'helpful' THEN
            UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
        ELSE
            UPDATE reviews SET unhelpful_count = unhelpful_count + 1 WHERE id = NEW.review_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.vote_type = 'helpful' AND NEW.vote_type = 'unhelpful' THEN
            UPDATE reviews SET helpful_count = helpful_count - 1, unhelpful_count = unhelpful_count + 1 WHERE id = NEW.review_id;
        ELSIF OLD.vote_type = 'unhelpful' AND NEW.vote_type = 'helpful' THEN
            UPDATE reviews SET unhelpful_count = unhelpful_count - 1, helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'helpful' THEN
            UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
        ELSE
            UPDATE reviews SET unhelpful_count = unhelpful_count - 1 WHERE id = OLD.review_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_helpful_counts
AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_counts();

-- Function to update review reply count
CREATE OR REPLACE FUNCTION update_review_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET reply_count = reply_count + 1 WHERE id = NEW.review_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE reviews SET reply_count = reply_count - 1 WHERE id = OLD.review_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_reply_count
AFTER INSERT OR DELETE ON review_replies
FOR EACH ROW
EXECUTE FUNCTION update_review_reply_count();

-- Function to update review reported count
CREATE OR REPLACE FUNCTION update_review_reported_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE reviews SET reported_count = reported_count + 1 WHERE id = NEW.review_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_reported_count
AFTER INSERT ON review_reports
FOR EACH ROW
EXECUTE FUNCTION update_review_reported_count();

COMMIT;
```

---

## PERFORMANCE INDEXES

### Optimized Query Patterns

1. **Get Product Reviews (Public)**:
```sql
-- Index used: idx_reviews_product_approved
SELECT * FROM reviews
WHERE product_id = $1
  AND approval_status = 'approved'
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

2. **Get Verified Reviews**:
```sql
-- Index used: idx_reviews_verified
SELECT * FROM reviews
WHERE product_id = $1
  AND is_verified_purchase = TRUE
  AND approval_status = 'approved'
  AND deleted_at IS NULL;
```

3. **Get Featured Reviews**:
```sql
-- Index used: idx_reviews_featured
SELECT * FROM reviews
WHERE is_featured = TRUE
  AND approval_status = 'approved'
  AND deleted_at IS NULL
ORDER BY featured_at DESC
LIMIT 3;
```

4. **Get Most Helpful Reviews**:
```sql
-- Index used: idx_reviews_helpful
SELECT * FROM reviews
WHERE product_id = $1
  AND approval_status = 'approved'
  AND deleted_at IS NULL
ORDER BY helpful_count DESC
LIMIT 10;
```

5. **Admin Moderation Queue**:
```sql
-- Index used: idx_reviews_status
SELECT * FROM reviews
WHERE approval_status = 'pending'
  AND deleted_at IS NULL
ORDER BY created_at ASC;
```

### Caching Strategy

**Redis Cache Keys:**
```
review:product:{productUuid}:stats
review:product:{productUuid}:avg_rating
review:product:{productUuid}:distribution
review:product:{productUuid}:featured
```

**Cache TTL:**
- Product review stats: 15 minutes
- Featured reviews: 1 hour
- Individual review: 5 minutes

**Cache Invalidation:**
- On review approval/rejection
- On review deletion
- On helpful vote change (if > threshold)
- On featured status change

---

**Previous:** [06-PRODUCTS.md](./06-PRODUCTS.md)  
**Next:** [08-ORDERS.md](./08-ORDERS.md)

---

**© 2025 Stencil CMS - Complete Review Management Documentation**
