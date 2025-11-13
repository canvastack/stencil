# OpenAPI Schema Documentation

## Comprehensive Database Schema to OpenAPI 3.1+ Conversion Project

**Status:** 🚧 **IN DEVELOPMENT**  
**Last Updated:** November 12, 2025  
**Source:** 22 Database Schema Documentation Files  
**Target:** Complete OpenAPI 3.1+ Specification with YAML/JSON formats  
**Architecture:** Multi-tenant, JWT Authentication, Comprehensive CRUD Operations

---

## 📋 PROJECT OVERVIEW

This project converts all documented database schemas from `docs/database-schema/` into comprehensive OpenAPI 3.1+ specifications with:

- **Complete CRUD Operations** for all entities
- **Multi-tenant Architecture** with proper tenant isolation
- **JWT Authentication** and role-based authorization
- **Comprehensive Error Handling** with standardized response formats
- **Pagination, Validation, and Search** capabilities
- **Enterprise-grade Documentation** with examples and use cases

### 📊 Conversion Scope

| **Source Documentation** | **Fields** | **Tables** | **API Endpoints** | **Status** |
|--------------------------|------------|------------|-------------------|------------|
| **Total Modules:** 22 | **1,800+** | **130+** | **400+** | **Planning** |

---

## 🗂️ FOLDER STRUCTURE

### **🏗️ Architecture Overview**

This OpenAPI implementation follows a **separation of concerns** approach with two main directories:

- **`schemas/`** - **Data Models & Entities** (database structure representation)
- **`paths/`** - **API Endpoints & Operations** (HTTP operations that reference schemas)

This architecture provides:
- ✅ **Clear separation** between data structure and API operations
- ✅ **Reusable schemas** across multiple endpoints
- ✅ **Maintainable codebase** with modular organization
- ✅ **Consistent validation** through centralized schema definitions

```
openapi/
├── README.md                          # This file - Project overview
├── ROADMAP.md                         # Detailed development roadmap
├── openapi.yaml                       # Main OpenAPI 3.1+ specification file
├── 
├── schemas/                           # 📊 DATA MODELS & ENTITIES
│   ├── common/                        # Shared schemas
│   │   ├── base.yaml                  # Base entity schemas (BaseEntity, timestamps)
│   │   └── pagination.yaml            # Pagination and filtering schemas
│   │
│   ├── content-management/            # Content Management Module Group
│   │   ├── homepage.yaml              # Homepage schemas (240+ fields)
│   │   ├── about.yaml                 # About Us schemas (80+ fields)
│   │   ├── contact.yaml               # Contact schemas (150+ fields)
│   │   ├── faq.yaml                   # FAQ schemas (150+ fields)
│   │   └── seo.yaml                   # SEO schemas (20+ fields)
│   │
│   ├── e-commerce/                    # E-commerce Module Group
│   │   ├── products.yaml              # Product schemas (68+ fields)
│   │   ├── reviews.yaml               # Review schemas (65+ fields)
│   │   ├── orders.yaml                # Order schemas (164+ fields)
│   │   └── inventory.yaml             # Inventory schemas (180+ fields)
│   │
│   ├── user-management/               # User Management Module Group
│   │   ├── users.yaml                 # User schemas (180+ fields)
│   │   ├── customers.yaml             # Customer schemas (120+ fields)
│   │   ├── vendors.yaml               # Vendor schemas (97+ fields)
│   │   └── suppliers.yaml             # Supplier schemas (180+ fields)
│   │
│   ├── system-administration/         # System Administration Module Group
│   │   ├── financial.yaml             # Financial schemas (120+ fields)
│   │   ├── settings.yaml              # Settings schemas (85+ fields)
│   │   └── plugins.yaml               # Plugin schemas (varied)
│   │
│   └── assets-localization/           # Assets & Localization Module Group
│       ├── media.yaml                 # Media schemas (80+ fields)
│       ├── documentation.yaml         # Documentation schemas (65+ fields)
│       ├── theme.yaml                 # Theme schemas (165+ fields)
│       └── language.yaml              # Language schemas (45+ fields)
│
├── paths/                             # 🚀 API ENDPOINTS & OPERATIONS
│   ├── content-management/            # Content Management API paths
│   │   ├── homepage.yaml              # Homepage CRUD endpoints
│   │   ├── about.yaml                 # About Us CRUD endpoints
│   │   ├── contact.yaml               # Contact CRUD endpoints
│   │   ├── faq.yaml                   # FAQ CRUD endpoints
│   │   └── seo.yaml                   # SEO CRUD endpoints
│   │
│   ├── e-commerce/                    # E-commerce API paths
│   │   ├── products.yaml              # Product CRUD endpoints
│   │   ├── reviews.yaml               # Review CRUD endpoints
│   │   ├── orders.yaml                # Order CRUD endpoints
│   │   └── inventory.yaml             # Inventory CRUD endpoints
│   │
│   ├── user-management/               # User Management API paths
│   │   ├── users.yaml                 # User CRUD endpoints
│   │   ├── customers.yaml             # Customer CRUD endpoints
│   │   ├── vendors.yaml               # Vendor CRUD endpoints
│   │   └── suppliers.yaml             # Supplier CRUD endpoints
│   │
│   ├── system-administration/         # System Administration API paths
│   │   ├── financial.yaml             # Financial CRUD endpoints
│   │   ├── settings.yaml              # Settings CRUD endpoints
│   │   └── plugins.yaml               # Plugin CRUD endpoints
│   │
│   └── assets-localization/           # Assets & Localization API paths
│       ├── media.yaml                 # Media CRUD endpoints
│       ├── documentation.yaml         # Documentation CRUD endpoints
│       ├── theme.yaml                 # Theme CRUD endpoints
│       └── language.yaml              # Language CRUD endpoints
│
├── components/                        # Reusable OpenAPI components
│   ├── parameters.yaml                # Common parameters (pagination, filtering, auth)
│   ├── responses.yaml                 # Standard response templates (error & success)
│   └── schemas.yaml                   # Common schemas (validation, pagination, audit)
│
├── validation/                        # Validation and testing
│   ├── swagger-validate.js            # Validation script
│   ├── postman-collection.json        # Generated Postman collection
│   └── test-cases.yaml                # API test cases
│
├── output/                            # Generated files
│   ├── openapi.json                   # JSON format of main spec
│   ├── openapi-resolved.yaml          # Resolved (no refs) YAML spec
│   ├── openapi-resolved.json          # Resolved (no refs) JSON spec
│   └── api-docs/                      # Generated HTML documentation
│       └── index.html                 # Swagger UI documentation
│
└── tools/                             # Development tools
    ├── generator-config.yaml          # OpenAPI generator configuration
    ├── package.json                   # Node.js dependencies for validation
    ├── validate.sh                    # Validation shell script
    └── generate-docs.sh               # Documentation generation script
```

### **🔗 Schema-Path Relationship**

Each module has **two corresponding files** that work together:

| **Schema File** | **Path File** | **Purpose** |
|----------------|---------------|-------------|
| `schemas/content-management/contact.yaml` | `paths/content-management/contact.yaml` | **Contact Module** |
| Contains: ContactForm, ContactSubmission, etc. | References: `$ref: '../../schemas/.../contact.yaml#/ContactForm'` | **Data structures** ↔ **API operations** |

**Example Reference Pattern:**
```yaml
# In paths/content-management/contact.yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: '../../schemas/content-management/contact.yaml#/ContactFormSubmissionInput'
```

**Benefits:**
- ✅ **Single source of truth** for data models
- ✅ **Reusable schemas** across multiple endpoints  
- ✅ **Easier maintenance** - update schema once, affects all references
- ✅ **Clear separation** - data structure vs API behavior
- ✅ **Type safety** - consistent validation across all operations

---

## 🎯 MODULE GROUPINGS

### **1. Content Management** (5 modules)
- **02-HOMEPAGE.md** → `schemas/content-management/homepage.yaml`
- **03-ABOUT.md** → `schemas/content-management/about.yaml`  
- **04-CONTACT.md** → `schemas/content-management/contact.yaml`
- **05-FAQ.md** → `schemas/content-management/faq.yaml`
- **18-SEO.md** → `schemas/content-management/seo.yaml`

### **2. E-commerce** (4 modules)
- **06-PRODUCTS.md** → `schemas/e-commerce/products.yaml`
- **07-REVIEWS.md** → `schemas/e-commerce/reviews.yaml`
- **08-ORDERS.md** → `schemas/e-commerce/orders.yaml`
- **10-INVENTORY.md** → `schemas/e-commerce/inventory.yaml`

### **3. User Management** (4 modules)
- **12-USERS.md** → `schemas/user-management/users.yaml`
- **20-CUSTOMERS.md** → `schemas/user-management/customers.yaml`
- **09-VENDORS.md** → `schemas/user-management/vendors.yaml`
- **21-SUPPLIERS.md** → `schemas/user-management/suppliers.yaml`

### **4. System Administration** (3 modules)
- **11-FINANCIAL.md** → `schemas/system-administration/financial.yaml`
- **17-SETTINGS.md** → `schemas/system-administration/settings.yaml`
- **19-PLUGINS.md** → `schemas/system-administration/plugins.yaml`

### **5. Assets & Localization** (4 modules)
- **13-MEDIA.md** → `schemas/assets-localization/media.yaml`
- **14-DOCUMENTATION.md** → `schemas/assets-localization/documentation.yaml`
- **15-THEME.md** → `schemas/assets-localization/theme.yaml`
- **16-LANGUAGE.md** → `schemas/assets-localization/language.yaml`

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation Setup** (Week 1)
1. **Project Structure Creation** - Complete folder hierarchy
2. **Common Components** - Base schemas, authentication, error handling
3. **Security Schemes** - JWT authentication, OAuth2 flows
4. **Validation Pipeline** - Automated validation with Swagger Editor

### **Phase 2: Core Module Implementation** (Week 2-3)
1. **Content Management Group** - Homepage, About, Contact, FAQ, SEO
2. **E-commerce Group** - Products, Reviews, Orders, Inventory
3. **Complete CRUD Operations** - GET, POST, PUT, DELETE for all endpoints
4. **Tenant Isolation** - Proper tenant_id integration in all operations

### **Phase 3: Advanced Features** (Week 4)
1. **User Management Group** - Users, Customers, Vendors, Suppliers
2. **System Administration Group** - Financial, Settings, Plugins
3. **Assets & Localization Group** - Media, Documentation, Theme, Language
4. **Advanced Features** - Search, filtering, bulk operations

### **Phase 4: Validation & Documentation** (Week 5)
1. **Comprehensive Testing** - All endpoints validated
2. **Documentation Generation** - Swagger UI, Postman collections
3. **CI/CD Integration** - Automated validation pipeline
4. **Performance Optimization** - Response time benchmarks

### **Phase 5: Integration & Deployment** (Week 6)
1. **Backend Integration** - Laravel API alignment
2. **Frontend Integration** - React/TypeScript type generation
3. **Production Readiness** - Security audit, performance testing
4. **Versioning Strategy** - Semantic versioning, changelog automation

---

## 🔒 AUTHENTICATION & SECURITY

### **JWT Authentication**
```yaml
# components/parameters.yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
    description: |
      JWT Bearer token authentication.
      Format: Authorization: Bearer {token}
      
  tenantHeader:
    type: apiKey
    in: header
    name: X-Tenant-ID
    description: Tenant UUID for multi-tenant isolation
```

### **Multi-Tenant Isolation**
All API endpoints require proper tenant context:
- **Header**: `X-Tenant-ID: {tenant_uuid}` (required)
- **Database Level**: Automatic `tenant_id` filtering in all queries
- **Security**: Tenant-scoped permissions and data isolation

### **Standardized Response Format**
```yaml
# components/responses.yaml - Available responses:
# - Unauthorized (401)    - Invalid/missing auth token
# - Forbidden (403)       - Insufficient permissions
# - NotFound (404)        - Resource doesn't exist
# - ValidationError (400) - Request validation failed
# - Conflict (409)        - Resource conflicts
# - ServerError (500)     - Internal server errors
```

---

## 📊 FEATURES & CAPABILITIES

### **🔍 Advanced Search & Filtering**
- **Full-text search** across all text fields
- **Advanced filtering** with multiple criteria
- **Sorting** by any field with direction control
- **Faceted search** with aggregations

### **📄 Pagination**
```yaml
# components/schemas.yaml
PaginationMeta:
  type: object
  properties:
    page: { type: integer, minimum: 1, example: 1 }
    limit: { type: integer, minimum: 1, maximum: 100, example: 20 }
    total: { type: integer, minimum: 0, example: 150 }
    totalPages: { type: integer, minimum: 0, example: 8 }
    hasNext: { type: boolean, example: true }
    hasPrev: { type: boolean, example: false }
```

### **✅ Input Validation**
- **JSON Schema validation** for all request bodies
- **Parameter validation** with constraints
- **Business rule validation** with custom error messages
- **Localized error messages** for international users

### **📈 Performance Features**
- **Response caching** with ETags
- **Conditional requests** with If-Modified-Since
- **Bulk operations** for batch processing
- **Async operations** for long-running tasks

### **🔗 Component Integration Pattern**
All modules follow standardized component usage:
```yaml
# In paths files - consistent response references
responses:
  '401': { $ref: '../../components/responses.yaml#/Unauthorized' }
  '403': { $ref: '../../components/responses.yaml#/Forbidden' }
  '404': { $ref: '../../components/responses.yaml#/NotFound' }
  '400': { $ref: '../../components/responses.yaml#/ValidationError' }
  '409': { $ref: '../../components/responses.yaml#/Conflict' }
  '500': { $ref: '../../components/responses.yaml#/ServerError' }

# In main openapi.yaml - component references
components:
  responses:
    $ref: './components/responses.yaml'
  schemas:
    ValidationErrorResponse:
      $ref: './components/schemas.yaml#/ValidationErrorResponse'
    PaginationMeta:
      $ref: './components/schemas.yaml#/PaginationMeta'
```

---

## 🛠️ DEVELOPMENT TOOLS & PATTERNS

### **File Organization Pattern**
Each module follows a consistent structure:
```bash
# Schema files (data models)
schemas/[module-group]/[module-name].yaml
└── Contains: entities, relationships, validation rules

# Path files (API endpoints) 
paths/[module-group]/[module-name].yaml  
└── Contains: CRUD operations, business logic endpoints

# Component references
$ref: '../../components/responses.yaml#/[ResponseType]'
$ref: '../../components/schemas.yaml#/[SchemaType]'
```

### **Standard Response Usage Pattern**
```yaml
# All endpoints use standardized responses
responses:
  '200': # Success with data
  '201': { $ref: '../../components/responses.yaml#/CreatedResponse' }
  '400': { $ref: '../../components/responses.yaml#/ValidationError' }
  '401': { $ref: '../../components/responses.yaml#/Unauthorized' }
  '403': { $ref: '../../components/responses.yaml#/Forbidden' }
  '404': { $ref: '../../components/responses.yaml#/NotFound' }
  '409': { $ref: '../../components/responses.yaml#/Conflict' }
  '500': { $ref: '../../components/responses.yaml#/ServerError' }
```

### **Validation Tools**
```bash
# Located in /tools/ directory
npm run validate:all     # Validate entire specification
npm run validate:schema  # Validate schemas only  
npm run validate:paths   # Validate API paths only
npm run generate:docs    # Generate Swagger UI
```

---

## 📋 QUALITY CHECKLIST

### **✅ OpenAPI 3.1+ Compliance**
- [ ] Valid OpenAPI 3.1+ specification
- [ ] All schemas properly defined
- [ ] All endpoints documented
- [ ] Request/response examples provided

### **✅ Multi-tenant Architecture**
- [ ] Tenant isolation in all operations
- [ ] tenant_id in all database schemas
- [ ] Proper tenant context validation
- [ ] Cross-tenant security testing

### **✅ Authentication & Authorization**
- [ ] JWT authentication implemented
- [ ] Role-based access control
- [ ] Permission-level granularity
- [ ] Security vulnerability testing

### **✅ Documentation Quality**
- [ ] Clear endpoint descriptions
- [ ] Complete parameter documentation
- [ ] Request/response examples
- [ ] Error handling documentation

---

## 🚨 COMMON SCHEMA REFERENCE ERRORS & FIXES

### **❌ Invalid Parameter References**

These parameter references are **INVALID** and will cause validation errors:

```yaml
# ❌ WRONG - These don't exist in parameters.yaml
- $ref: '../../components/parameters.yaml#/PageQuery'
- $ref: '../../components/parameters.yaml#/PerPageQuery' 
- $ref: '../../components/parameters.yaml#/SortQuery'
- $ref: '../../components/parameters.yaml#/LimitQuery'
- $ref: '../../components/parameters.yaml#/Page'
- $ref: '../../components/parameters.yaml#/Limit'
- $ref: '../../components/parameters.yaml#/Sort'
- $ref: '../../components/parameters.yaml#/Order'
```

### **✅ Valid Parameter References**

Use these **CORRECT** parameter references from `components/parameters.yaml`:

```yaml
# ✅ CORRECT - These exist and are properly defined
- $ref: '../../components/parameters.yaml#/PageParam'       # Page number (page=1)
- $ref: '../../components/parameters.yaml#/PerPageParam'    # Items per page (per_page=20)
- $ref: '../../components/parameters.yaml#/SortParam'       # Sort field (sort=name)
- $ref: '../../components/parameters.yaml#/OrderParam'      # Sort direction (order=asc/desc)
- $ref: '../../components/parameters.yaml#/SearchParam'     # Search query (search=text)
- $ref: '../../components/parameters.yaml#/TenantHeader'    # X-Tenant-ID header
- $ref: '../../components/parameters.yaml#/UUIDParam'       # Path UUID parameter
```

### **🔧 Entity Reference Fixes Applied**

These fixes were applied to all schema files:

#### **1. Multi-Tenant Compliance**
```yaml
# ❌ BEFORE - Invalid reference (TenantEntity doesn't exist)
allOf:
  - $ref: '../common/base.yaml#/TenantEntity'

# ✅ AFTER - Correct reference with proper inheritance
allOf:
  - $ref: '../common/base.yaml#/AuditableEntity'  # Includes BaseEntity + audit fields
```

#### **2. Base Entity Usage**
```yaml
# ✅ Available base entities in base.yaml:
BaseEntity:           # Core entity (id, tenant_id, timestamps)
AuditableEntity:      # BaseEntity + created_by, updated_by
SoftDeletableEntity:  # BaseEntity + deleted_at
StatusEntity:         # BaseEntity + status field
OrderableEntity:      # BaseEntity + sort_order
```

### **📝 Parameter Definition Reference**

From `components/parameters.yaml`, these are the **available parameters**:

| Parameter Name | Purpose | Type | Example |
|----------------|---------|------|---------|
| `PageParam` | Page number | integer | `page=1` |
| `PerPageParam` | Items per page | integer | `per_page=20` |
| `SortParam` | Sort field | string | `sort=name` |
| `OrderParam` | Sort direction | enum | `order=asc` |
| `SearchParam` | Search query | string | `search=product` |
| `TenantHeader` | Tenant ID header | uuid | `X-Tenant-ID: uuid` |
| `UUIDParam` | UUID path param | uuid | `/resource/{id}` |
| `StatusParam` | Status filter | string | `status=active` |
| `DateFromParam` | Date range start | date | `date_from=2025-01-01` |
| `DateToParam` | Date range end | date | `date_to=2025-12-31` |

### **🎯 Development Guidelines**

#### **Before adding parameter references:**
1. **Check** `components/parameters.yaml` for existing parameters
2. **Use** exact parameter names (case-sensitive)
3. **Test** reference validity with OpenAPI validator
4. **Follow** the `#/ParameterName` format exactly

#### **For schema references:**
1. **Always use** BaseEntity or its derivatives for tenant isolation
2. **Never reference** non-existent entities like "TenantEntity"
3. **Check** `schemas/common/base.yaml` for available base entities
4. **Validate** all `$ref` paths are correct

#### **Common validation commands:**
```bash
# Validate specific files
swagger-codegen validate -i paths/content-management/orders.yaml
swagger-codegen validate -i schemas/content-management/orders.yaml

# Validate entire specification 
swagger-codegen validate -i openapi.yaml
```

---

## 📞 SUPPORT & MAINTENANCE

### **🔄 Version Management**
- **Semantic Versioning**: Major.Minor.Patch (e.g., 1.0.0)
- **Changelog**: Automated generation from commit messages
- **Breaking Changes**: Clearly documented migration guides
- **Backwards Compatibility**: Maintained for at least 2 major versions

### **🚀 CI/CD Integration**
```yaml
# GitHub Actions workflow
name: OpenAPI Validation
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate OpenAPI specs
        run: npm run validate:all
```

### **📊 Monitoring & Analytics**
- **API Usage Analytics**: Track endpoint usage patterns
- **Performance Monitoring**: Response time tracking
- **Error Rate Monitoring**: Track API error rates
- **Documentation Access**: Track documentation usage

---

## 🎯 SUCCESS METRICS

### **📈 Quality Metrics**
- **Schema Coverage**: 100% of documented database fields covered
- **Endpoint Coverage**: Complete CRUD operations for all entities
- **Validation Coverage**: 100% of endpoints validated
- **Documentation Coverage**: All endpoints fully documented

### **🚀 Performance Metrics**
- **Validation Speed**: < 5 seconds for full specification validation
- **Documentation Generation**: < 30 seconds for complete docs
- **API Response Time**: < 200ms for simple CRUD operations
- **Multi-tenant Isolation**: 0% cross-tenant data leakage

---

**© 2025 Stencil CMS - Comprehensive OpenAPI 3.1+ Specification Project**  
**🚧 Status: In Development | Target Completion: 6 weeks**