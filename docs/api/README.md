# STENCIL CMS - MODULAR OPENAPI DOCUMENTATION
## REST API Specification v1.0.0

**Last Updated:** November 10, 2025  
**OpenAPI Version:** 3.0.3  
**API Version:** v1

---

## 📖 OVERVIEW

Modular OpenAPI specification untuk Stencil CMS REST API. Dokumentasi ini dibagi menjadi file-file terpisah per modul untuk memudahkan navigasi, maintenance, dan pengembangan.

### Architecture Highlights

- **Multi-Tenancy**: Schema per Tenant (PostgreSQL)
- **Authentication**: Laravel Sanctum Bearer Token
- **Authorization**: Spatie Laravel Permission (tenant-scoped)
- **API Versioning**: `/api/v1`
- **Response Format**: Standardized JSON structure

### Core Immutable Rules

⚠️ **THESE RULES MUST NEVER BE VIOLATED:**
- ✅ Teams enabled: TRUE
- ✅ team_foreign_key: `tenant_id`
- ✅ guard_name: `api`
- ✅ model_morph_key: `model_uuid` (UUID string)
- ✅ Roles & Permissions: Strictly tenant-scoped
- ❌ NO global roles (NULL tenant_id)

---

## 📂 FILE STRUCTURE

```
docs/api/
├── openapi.yaml                    # Main OpenAPI specification file
├── README.md                       # This file
│
├── components/                     # Reusable components
│   ├── schemas/
│   │   └── common.yaml            # Common schemas (responses, pagination, etc.)
│   ├── responses/
│   │   └── common.yaml            # Common responses (errors, success, etc.)
│   └── parameters/
│       └── common.yaml            # Common parameters (pagination, filters, etc.)
│
└── modules/                        # API modules (one file per feature)
    ├── auth.yaml                  # Authentication endpoints
    ├── homepage.yaml              # Homepage content management
    ├── about.yaml                 # About Us page
    ├── contact.yaml               # Contact page & form submissions
    ├── faq.yaml                   # FAQ management
    ├── seo.yaml                   # Universal SEO system
    ├── products.yaml              # Product catalog management
    ├── reviews.yaml               # Product reviews & ratings
    ├── orders.yaml                # Order management
    ├── vendors.yaml               # Vendor management
    ├── inventory.yaml             # Inventory & stock management
    ├── financial.yaml             # Financial reports
    ├── users.yaml                 # User & role management
    ├── media.yaml                 # Media library
    ├── theme.yaml                 # Theme customization
    ├── language.yaml              # Multi-language support
    ├── documentation.yaml         # Help center
    └── settings.yaml              # General settings
```

---

## 🚀 QUICK START

### Viewing the Documentation

**Option 1: Swagger UI (Recommended)**

```bash
# Install Swagger UI
npm install -g swagger-ui-watcher

# Start documentation server
swagger-ui-watcher docs/api/openapi.yaml
```

Access at: http://localhost:8000

**Option 2: Redoc**

```bash
# Install Redoc CLI
npm install -g redoc-cli

# Generate static HTML
redoc-cli bundle docs/api/openapi.yaml -o api-docs.html

# Open in browser
open api-docs.html
```

**Option 3: VS Code Extension**

Install: [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi)

**Option 4: Online Validator**

Upload `openapi.yaml` to: https://editor.swagger.io/

### Testing the API

**Using cURL:**

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@stencilcms.com", "password": "password"}'

# Get homepage (public)
curl http://localhost:8000/api/v1/pages/home

# Update homepage hero (admin - requires token)
curl -X PUT http://localhost:8000/api/v1/admin/pages/home/hero \
  -H "Authorization: Bearer {your_token}" \
  -H "Content-Type: application/json" \
  -d '{"typingTexts": ["Welcome", "Discover"], "subtitle": "Your partner"}'
```

**Using Postman:**

1. Import `openapi.yaml` into Postman
2. Set environment variable `baseUrl` = `http://localhost:8000/api/v1`
3. Set environment variable `token` after login
4. Use {{baseUrl}} and {{token}} in requests

---

## 📋 API MODULES

### 1. Authentication (`auth.yaml`)

**Endpoints:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

**Features:**
- Laravel Sanctum token authentication
- Multi-tenant context resolution
- Role-based access control

---

### 2. Homepage (`homepage.yaml`)

**Endpoints:**
- `GET /pages/home` - Get homepage content (public)
- `GET /admin/pages/home` - Get homepage admin data
- `PUT /admin/pages/home` - Update page settings
- `PUT /admin/pages/home/hero` - Update hero section
- `PUT /admin/pages/home/social-proof` - Update social proof stats
- `PUT /admin/pages/home/process` - Update process workflow
- `PUT /admin/pages/home/why-choose-us` - Update features
- `PUT /admin/pages/home/achievements` - Update achievements
- `PUT /admin/pages/home/services` - Update services
- `PUT /admin/pages/home/testimonials` - Update testimonials
- `PUT /admin/pages/home/cta` - Update CTA sections

**Features:**
- 8 customizable sections
- Hero carousel with typing animation
- Social proof statistics
- Process workflow
- Dynamic CTA sections

---

### 3. About Us (`about.yaml`)

**Endpoints:**
- `GET /pages/about` - Get about page (public)
- `GET /admin/pages/about` - Get about page admin data
- `PUT /admin/pages/about/company-info` - Update company info
- `PUT /admin/pages/about/mission-vision` - Update mission & vision
- `PUT /admin/pages/about/values` - Update company values
- `GET/POST/PUT /admin/pages/about/team` - Manage team members
- `PUT /admin/pages/about/timeline` - Update company timeline

**Features:**
- Company profile management
- Team member directory
- Company timeline
- Certifications & awards

---

### 4. Contact (`contact.yaml`)

**Endpoints:**
- `GET /pages/contact` - Get contact page (public)
- `POST /contact/submit` - Submit contact form
- `GET /admin/pages/contact` - Get contact page admin
- `PUT /admin/pages/contact` - Update contact page
- `GET /admin/contact/forms` - List contact forms
- `GET /admin/contact/submissions` - List form submissions

**Features:**
- Dynamic form builder
- Contact information management
- Map integration (lat/long)
- Quick contacts (WhatsApp, Telegram, etc.)
- Form submission tracking with status workflow

---

### 5. FAQ (`faq.yaml`)

**Endpoints:**
- `GET /faq` - Get FAQ page (public)
- `GET /faq/categories` - List categories
- `GET /faq/search` - Search FAQ
- `POST /faq/{id}/helpful` - Mark FAQ as helpful
- `GET/POST/PUT /admin/faq/categories` - Manage categories
- `GET/POST /admin/faq/questions` - Manage questions

**Features:**
- Category-based organization
- Full-text search
- Analytics (view count, helpful count)
- Search analytics tracking
- Featured FAQ support

---

### 6. SEO (`seo.yaml`)

**Endpoints:**
- `GET /seo` - Get SEO metadata for frontend
- `GET /sitemap.xml` - XML sitemap
- `GET /robots.txt` - Robots.txt
- `GET/PUT /admin/seo/settings` - Default SEO settings
- `GET/PUT/DELETE /admin/seo/{type}/{id}` - Item-specific SEO

**Features:**
- Dual-layer SEO system (Global + Per-item)
- Fallback hierarchy (Custom → Default → System)
- Open Graph support
- Twitter Cards support
- Schema.org JSON-LD
- Sitemap generation
- Meta verification tags

---

### 7. Products (`products.yaml`)

**Endpoints:**
- `GET /products` - List all products (public)
- `GET /products/{id}` - Get product details
- `POST /products` - Create product (admin)
- `PUT /products/{id}` - Update product (admin)
- `DELETE /products/{id}` - Delete product (admin)
- `GET /admin/products` - List all products with drafts (admin)
- `GET/POST/PUT/DELETE /products/categories` - Manage categories
- `GET/POST/PUT/DELETE /products/{id}/variations` - Manage variations

**Features:**
- Product catalog with categories
- Product variations (size, material, etc.)
- Custom order form fields
- Dynamic pricing based on options
- Stock management
- Image gallery
- SEO per product

---

### 8. Reviews (`reviews.yaml`)

**Endpoints:**
- `GET /products/{productId}/reviews` - Get product reviews (public)
- `POST /products/{productId}/reviews` - Submit review
- `PUT /reviews/{id}` - Update review
- `DELETE /reviews/{id}` - Delete review
- `POST /reviews/{id}/helpful` - Vote review as helpful
- `GET /admin/reviews` - List all reviews (admin)
- `POST /admin/reviews/{id}/approve` - Approve review
- `POST /admin/reviews/{id}/reject` - Reject review
- `POST /admin/reviews/{id}/response` - Add admin response

**Features:**
- 5-star rating system
- Review approval workflow
- Admin responses to reviews
- Helpful voting
- Verified purchase badges
- Image attachments
- Rating analytics

---

### 9. Orders (`orders.yaml`)

**Endpoints:**
- `POST /orders` - Create new order
- `GET /orders/my` - Get my orders
- `GET /orders/{id}` - Get order details
- `POST /orders/{id}/cancel` - Cancel order
- `GET /admin/orders` - List all orders (admin)
- `PUT /admin/orders/{id}` - Update order (admin)
- `PATCH /admin/orders/{id}/status` - Update order status
- `PATCH /admin/orders/{id}/payment` - Update payment status
- `POST /admin/orders/{id}/notes` - Add internal note

**Features:**
- Order creation with customizations
- Payment tracking
- Status workflow (pending → processing → completed)
- Shipping information
- Order history
- Internal notes
- Statistics dashboard

---

### 10. Vendors (`vendors.yaml`)

**Endpoints:**
- `GET /admin/vendors` - List all vendors
- `POST /admin/vendors` - Create vendor
- `GET /admin/vendors/{id}` - Get vendor details
- `PUT /admin/vendors/{id}` - Update vendor
- `DELETE /admin/vendors/{id}` - Delete vendor
- `GET /admin/vendors/{id}/products` - List vendor products
- `GET /admin/vendors/{id}/orders` - List vendor purchase orders

**Features:**
- Vendor profile management
- Contact information
- Bank account details
- Product catalog per vendor
- Purchase order tracking
- Vendor ratings

---

### 11. Inventory (`inventory.yaml`)

**Endpoints:**
- `GET /admin/inventory` - Get inventory overview
- `GET /admin/inventory/{productId}` - Get product inventory
- `PUT /admin/inventory/{productId}` - Update inventory
- `GET/POST /admin/inventory/movements` - Manage stock movements
- `GET /admin/inventory/alerts` - Get stock alerts

**Features:**
- Real-time stock tracking
- Stock movements (in/out/adjustment)
- Low stock alerts
- Out of stock notifications
- Inventory valuation
- Movement history

---

### 12. Financial (`financial.yaml`)

**Endpoints:**
- `GET /admin/financial/dashboard` - Financial dashboard
- `GET /admin/financial/revenue` - Revenue report
- `GET/POST /admin/financial/expenses` - Manage expenses
- `PUT/DELETE /admin/financial/expenses/{id}` - Update/delete expense
- `GET /admin/financial/profit-loss` - Profit & loss report
- `POST /admin/financial/export` - Export reports (PDF/Excel)

**Features:**
- Revenue tracking
- Expense management by category
- Profit/loss reports
- Financial analytics
- Export to PDF/Excel
- Customizable date ranges
- Growth metrics

---

### 13. Users (`users.yaml`)

**Endpoints:**
- `GET/POST /admin/users` - Manage users
- `GET/PUT/DELETE /admin/users/{id}` - User CRUD
- `POST /admin/users/{id}/suspend` - Suspend user
- `POST /admin/users/{id}/activate` - Activate user
- `GET/POST /admin/roles` - Manage roles
- `GET/PUT/DELETE /admin/roles/{id}` - Role CRUD
- `GET /admin/permissions` - List all permissions
- `GET /admin/customers` - List customers
- `GET /admin/customers/{id}` - Customer details

**Features:**
- User management with roles
- Tenant-scoped permissions
- Role-based access control (RBAC)
- Customer profiles
- Order history
- Activity logs
- Account suspension

---

### 14. Media (`media.yaml`)

**Endpoints:**
- `GET/POST /media` - List/upload media
- `GET/PUT/DELETE /media/{id}` - Media CRUD
- `GET/POST /media/folders` - Manage folders
- `PUT/DELETE /media/folders/{id}` - Folder CRUD

**Features:**
- File upload with validation
- Image optimization
- Folder organization
- File metadata (title, alt, description)
- Usage tracking
- Storage quota management
- Thumbnail generation

---

### 15. Theme (`theme.yaml`)

**Endpoints:**
- `GET /theme/current` - Get current theme (public)
- `GET/PUT /admin/theme` - Manage theme settings
- `POST /admin/theme/reset` - Reset to defaults
- `GET /admin/theme/presets` - List theme presets
- `POST /admin/theme/presets/{id}/apply` - Apply preset
- `GET/PUT /admin/theme/custom-css` - Manage custom CSS

**Features:**
- Color customization (primary, secondary, accent)
- Typography settings
- Layout configuration
- Button styles
- Feature toggles (dark mode, animations)
- Theme presets
- Custom CSS injection

---

### 16. Language (`language.yaml`)

**Endpoints:**
- `GET /languages` - List available languages (public)
- `GET /translations/{locale}` - Get translations
- `GET/POST /admin/languages` - Manage languages
- `PUT/DELETE /admin/languages/{locale}` - Language CRUD
- `GET/POST /admin/translations` - Manage translations
- `PUT/DELETE /admin/translations/{id}` - Translation CRUD
- `POST /admin/translations/import` - Import translations
- `POST /admin/translations/export` - Export translations

**Features:**
- Multi-language support (ID/EN)
- Translation management
- Translation progress tracking
- Import/export JSON
- Namespace organization
- RTL support (future)

---

### 17. Documentation (`documentation.yaml`)

**Endpoints:**
- `GET /docs/articles` - List help articles (public)
- `GET /docs/articles/{slug}` - Get article
- `GET /docs/categories` - List categories
- `GET /docs/search` - Search articles
- `GET/POST /admin/docs/articles` - Manage articles
- `PUT/DELETE /admin/docs/articles/{id}` - Article CRUD
- `GET/POST /admin/docs/categories` - Manage categories
- `PUT/DELETE /admin/docs/categories/{id}` - Category CRUD

**Features:**
- Help center articles
- Category organization
- Full-text search
- Rich text editor
- Related articles
- View tracking
- Draft/publish workflow

---

### 18. Settings (`settings.yaml`)

**Endpoints:**
- `GET /settings/public` - Get public settings
- `GET/PUT /admin/settings` - Manage all settings
- `GET/PUT /admin/settings/site` - Site configuration
- `GET/PUT /admin/settings/email` - Email/SMTP settings
- `POST /admin/settings/email/test` - Test email
- `GET/PUT /admin/settings/integrations` - Third-party integrations
- `GET/PUT /admin/settings/maintenance` - Maintenance mode
- `POST /admin/settings/cache/clear` - Clear cache

**Features:**
- Site configuration (name, tagline, contact)
- Email/SMTP settings with test
- Social media links
- Analytics integration (Google Analytics, Facebook Pixel)
- Payment gateway integration (Stripe, Midtrans)
- Maps API integration
- Maintenance mode
- Cache management

---

## 🔐 AUTHENTICATION

### Getting a Token

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@stencilcms.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "1|abcdefghijklmnopqrstuvwxyz",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": { ... },
    "tenant": { ... },
    "role": { ... }
  }
}
```

### Using the Token

Add to request headers:

```http
Authorization: Bearer 1|abcdefghijklmnopqrstuvwxyz
```

### Token Expiration

- **Regular token**: 24 hours (86400 seconds)
- **Remember me**: 30 days (2592000 seconds)

---

## 📊 RESPONSE FORMAT

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["The email field is required."]
    }
  },
  "meta": {
    "timestamp": "2025-01-01T12:00:00Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "meta": {
    "currentPage": 1,
    "perPage": 15,
    "total": 150,
    "lastPage": 10,
    "from": 1,
    "to": 15,
    "links": {
      "first": "/api/v1/products?page=1",
      "last": "/api/v1/products?page=10",
      "prev": null,
      "next": "/api/v1/products?page=2"
    }
  }
}
```

---

## 🔍 COMMON QUERY PARAMETERS

### Pagination

- `page` - Page number (default: 1)
- `perPage` - Items per page (default: 15, max: 100)

**Example:**
```
GET /api/v1/admin/faq/questions?page=2&perPage=20
```

### Sorting

- `sort` - Sort field and order (format: `field:order`)

**Example:**
```
GET /api/v1/products?sort=createdAt:desc
```

### Filtering

- `filter` - Filter criteria (format: `field:operator:value`)

**Operators:**
- `eq` - Equals
- `ne` - Not equals
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `like` - Contains (case-insensitive)
- `in` - In array (comma-separated)

**Example:**
```
GET /api/v1/products?filter=status:eq:active&filter=price:gte:100000
```

### Search

- `search` - Search query string

**Example:**
```
GET /api/v1/faq/search?q=shipping
```

---

## ⚡ RATE LIMITING

- **Public endpoints**: 60 requests/minute per IP
- **Admin endpoints**: 120 requests/minute per user
- **Form submissions**: 5 submissions/hour per IP

**Rate limit headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

**429 Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## 🧪 TESTING

### Validation

**Validate OpenAPI spec:**

```bash
# Using Swagger CLI
swagger-cli validate docs/api/openapi.yaml

# Using Spectral (more strict)
spectral lint docs/api/openapi.yaml
```

### Generating Code

**Client SDKs:**

```bash
# JavaScript/TypeScript
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g typescript-axios \
  -o src/api/generated

# PHP
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g php \
  -o api-client-php

# Python
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g python \
  -o api-client-python
```

**Server Stubs:**

```bash
# Laravel
openapi-generator-cli generate \
  -i docs/api/openapi.yaml \
  -g php-laravel \
  -o backend/app/Http/Controllers/Generated
```

---

## 📚 ADDITIONAL RESOURCES

### Related Documentation

- **Database Schema**: [../database-schema/README.md](../database-schema/README.md)
- **Architecture Plan**: [../README.md](../../README.md)
- **Frontend Structure**: [../FRONTEND_STRUCTURE_UPDATE_PLAN.md](../FRONTEND_STRUCTURE_UPDATE_PLAN.md)

### Tools & Resources

- **Swagger Editor**: https://editor.swagger.io/
- **Redoc**: https://redocly.com/redoc/
- **OpenAPI Generator**: https://openapi-generator.tech/
- **Spectral Linter**: https://stoplight.io/open-source/spectral
- **Postman**: https://www.postman.com/

### OpenAPI Learning

- **OpenAPI 3.0 Specification**: https://swagger.io/specification/
- **OpenAPI Guide**: https://swagger.io/docs/specification/about/
- **Best Practices**: https://swagger.io/resources/articles/best-practices-in-api-design/

---

## 🤝 CONTRIBUTING

### Adding New Endpoints

1. Identify the module (e.g., `homepage.yaml`)
2. Add path and operation to module file
3. Define request/response schemas in module's `components/schemas`
4. Reference common schemas when applicable
5. Update module summary in `openapi.yaml`
6. Update this README with new endpoints

### Module Template

```yaml
paths:
  /your-endpoint:
    get:
      tags:
        - YourModule
      summary: Brief description
      description: Detailed description
      operationId: uniqueOperationId
      security: []  # or - BearerAuth: []
      parameters:
        - name: param1
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Success response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/YourSchema'
        '401':
          $ref: '../components/responses/common.yaml#/Unauthorized'

components:
  schemas:
    YourSchema:
      type: object
      properties:
        field1:
          type: string
        field2:
          type: integer
```

### Validation Checklist

- [ ] All required fields documented
- [ ] Response examples provided
- [ ] Error responses included
- [ ] Authentication requirements specified
- [ ] Query parameters documented
- [ ] Schema types correct
- [ ] References resolve correctly
- [ ] OpenAPI validation passes

---

## 📝 CHANGELOG

### Version 1.0.0 (November 10, 2025)

**Initial Release:**
- ✅ Authentication module (login, register, logout)
- ✅ Homepage module (8 sections)
- ✅ About Us module (company info, team, timeline)
- ✅ Contact module (dynamic forms, submissions)
- ✅ FAQ module (categories, search, analytics)
- ✅ SEO module (global + per-item, sitemap, robots.txt)
- ✅ Common components (schemas, responses, parameters)
- ✅ Complete request/response examples
- ✅ Error handling documentation
- ✅ Authentication flow documentation

**Stats:**
- **6 modules** documented
- **50+ endpoints** defined
- **100+ schemas** documented
- **15+ error responses** standardized

---

## 📞 SUPPORT

**For API questions or issues:**
- Check this README and module files first
- Review database schema documentation: `../database-schema/`
- Check source code: `backend/app/` (Laravel) or `src/` (React)
- Contact development team: dev@canvastack.com

---

**© 2025 Stencil CMS - OpenAPI Documentation**  
**Version 1.0.0 - Complete Modular API Specification**
