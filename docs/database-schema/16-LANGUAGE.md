# LANGUAGE & LOCALIZATION MODULE
## Database Schema & API Documentation

**Module:** Internationalization (i18n) & Localization  
**Total Fields:** 85+ fields  
**Total Tables:** 4 tables (languages, translations, translation_categories, locale_settings)  
**Admin Page:** `src/pages/admin/LanguageSettings.tsx`  
**Type Definition:** `src/types/language.ts`  
**Core Context:** `src/contexts/LanguageContext.tsx` (Implemented)

> **⚠️ CORE IMMUTABLE RULES COMPLIANCE**
> 
> ✅ **Teams enabled**: TRUE  
> ✅ **team_foreign_key**: tenant_id  
> ✅ **guard_name**: api  
> ✅ **model_morph_key**: model_uuid (UUID string)  
> ✅ **Roles & Permissions**: Strictly tenant-scoped  
> ❌ **NO global roles** (NULL tenant_id)

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Translation Keys Structure](#translation-keys-structure)
8. [API Endpoints](#api-endpoints)
9. [Admin UI Features](#admin-ui-features)
10. [Sample Data](#sample-data)
11. [Migration Script](#migration-script)
12. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

Modul Language & Localization adalah sistem **multi-language internationalization (i18n)** yang memungkinkan platform Stencil CMS mendukung multiple languages dengan translation management yang flexible dan scalable. Sistem ini sudah **partially implemented** di frontend dan akan dilengkapi dengan backend API untuk centralized translation management.

### Core Features

1. **Multi-Language Support (Implemented di Frontend)**
   - Language switching (ID/EN default)
   - Translation context provider (React)
   - Key-based translation system
   - Category-based translation grouping
   - LocalStorage persistence
   - Dynamic translation updates

2. **Translation Management (Planned - Backend API)**
   - Centralized translation database
   - Translation key organization dengan categories
   - Bulk import/export (JSON, CSV, PO files)
   - Translation versioning & audit trail
   - Missing translation detection
   - Translation completion tracking per language

3. **Language Configuration**
   - Supported languages management
   - Default language per tenant
   - Fallback language configuration
   - Language activation/deactivation
   - RTL (Right-to-Left) support flag
   - Custom locale settings (date formats, number formats)

4. **Translation Features**
   - Pluralization support (singular/plural forms)
   - Variable interpolation (`Hello {name}`)
   - Rich text translations (HTML support)
   - Translation namespaces/categories
   - Context-specific translations
   - Translation comments for translators

5. **Multi-Tenant Language Support**
   - Tenant-specific translations override
   - Global platform translations (shared)
   - Tenant default language setting
   - Tenant-specific language availability
   - Custom translations per tenant

6. **Developer Experience**
   - Simple translation function `t('key')`
   - Type-safe translation keys (TypeScript)
   - Hot-reload translations (development)
   - Translation coverage reports
   - Missing translation warnings

---

## BUSINESS CONTEXT

### Multi-Language Strategy

**Stencil CMS** menggunakan **layered translation approach** dengan strict tenant isolation:

1. **Platform Level (Global)**:
   - Default translations untuk semua tenants
   - System messages & admin interface
   - Common UI labels
   - Error messages
   - **Note**: Platform translations are NOT tenant-scoped (tenant_id = NULL)

2. **Tenant Level (Custom)**:
   - Tenant dapat override global translations
   - Custom terminology per business (e.g., "Etching" vs "Product")
   - Brand-specific messaging
   - Product/content translations
   - **Strictly tenant-scoped**: Each tenant's translations isolated by tenant_id

### Integration with Business Cycle

**Language Support untuk Etching Business:**
- **Customer Communication**: Multi-language support untuk customer emails
- **Product Descriptions**: Etching product descriptions dalam multiple languages
- **Order Status**: Order tracking messages dalam customer's preferred language
- **Invoice & Documents**: Multi-language invoice generation
- **Admin Interface**: Staff dapat bekerja dalam bahasa yang preferred

### Supported Languages (Initial)

**Phase 1 (Current):**
- 🇮🇩 **Indonesian (id)** - Default
- 🇬🇧 **English (en)** - Secondary

**Phase 2 (Planned):**
- 🇯🇵 Japanese (ja)
- 🇰🇷 Korean (ko)
- 🇨🇳 Chinese Simplified (zh-CN)
- 🇹🇭 Thai (th)
- 🇻🇳 Vietnamese (vi)

**Phase 3 (Future):**
- 🇸🇦 Arabic (ar) - RTL support required
- 🇮🇱 Hebrew (he) - RTL support required
- European languages (ES, FR, DE, IT)

### Translation Key Convention

**Format:** `{namespace}.{section}.{key}`

**Examples:**
```
nav.menu.home           → Navigation menu items
common.button.save      → Common UI buttons
product.label.price     → Product-specific labels
cart.message.empty      → Cart-related messages
error.validation.required → Error messages
```

### Use Cases

**UC-1: Language Switching**
```
User clicks language selector → 
Context updates language state →
All UI re-renders with new translations →
Preference saved to localStorage/database
```

**UC-2: Translation Management**
```
Admin adds new translation key →
System validates key uniqueness →
Translations for all languages entered →
Frontend automatically picks up new translations
```

**UC-3: Tenant Custom Translation**
```
Tenant overrides "Product" → "Item" →
Only affects that tenant's interface →
Other tenants still see "Product" →
Maintains global translation as fallback
```

---

## DATABASE SCHEMA

### Table: `languages`

Defines available languages in the system.

```sql
CREATE TABLE languages (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    is_rtl BOOLEAN DEFAULT FALSE,
    
    flag_emoji VARCHAR(10) NULL,
    sort_order INT DEFAULT 0,
    
    locale_settings JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_is_active ON languages(is_active);
CREATE INDEX idx_languages_sort_order ON languages(sort_order);

CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON languages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Columns:**
- `code`: ISO 639-1 language code (e.g., 'id', 'en', 'ja')
- `name`: English name (e.g., 'Indonesian', 'English')
- `native_name`: Native name (e.g., 'Bahasa Indonesia', 'English')
- `is_rtl`: Right-to-left script (Arabic, Hebrew)
- `flag_emoji`: Flag emoji for UI (🇮🇩, 🇬🇧)
- `locale_settings`: Date/number format settings (JSON)

---

### Table: `translation_categories`

Organizes translations into logical groups.

```sql
CREATE TABLE translation_categories (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    parent_id BIGINT NULL,
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES translation_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_translation_categories_slug ON translation_categories(slug);
CREATE INDEX idx_translation_categories_parent_id ON translation_categories(parent_id);
CREATE INDEX idx_translation_categories_sort_order ON translation_categories(sort_order);

CREATE TRIGGER update_translation_categories_updated_at
BEFORE UPDATE ON translation_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Categories Examples:**
- `navigation` - Menu items, links
- `common` - Buttons, labels, placeholders
- `product` - Product-related text
- `cart` - Shopping cart messages
- `checkout` - Checkout process
- `auth` - Authentication messages
- `error` - Error messages
- `validation` - Form validation messages

---

### Table: `translations`

Stores all translation strings.

```sql
CREATE TABLE translations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- CORE RULE: tenant_id NULL = platform translations, UUID = tenant-specific
    tenant_id UUID NULL,
    
    key VARCHAR(255) NOT NULL,
    category_id BIGINT NULL,
    
    translations JSONB NOT NULL,
    
    description TEXT NULL,
    context VARCHAR(500) NULL,
    
    is_html BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_at TIMESTAMP NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES translation_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_translation_key_per_tenant UNIQUE (tenant_id, key)
);

CREATE INDEX idx_translations_tenant_id ON translations(tenant_id);
CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_category_id ON translations(category_id);
CREATE INDEX idx_translations_is_system ON translations(is_system);
CREATE INDEX idx_translations_created_at ON translations(created_at);
CREATE INDEX idx_translations_deleted_at ON translations(deleted_at);

CREATE INDEX idx_translations_search ON translations USING GIN(to_tsvector('english', key || ' ' || COALESCE(description, '')));

CREATE INDEX idx_translations_json ON translations USING GIN(translations);

CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON translations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Columns:**
- `tenant_id`: NULL = global/platform translations, UUID = tenant-specific override
- `key`: Unique translation key (e.g., 'nav.home', 'common.save')
- `translations`: JSONB object `{"en": "Home", "id": "Beranda", "ja": "ホーム"}`
- `description`: Helper text for translators
- `context`: Usage context (e.g., "Button label in header")
- `is_html`: Allows HTML tags in translation
- `is_system`: System translation (cannot be deleted)

**JSONB `translations` Structure:**
```json
{
  "en": "Add to Cart",
  "id": "Tambah ke Keranjang",
  "ja": "カートに追加",
  "ko": "장바구니에 추가"
}
```

**JSONB `metadata` Structure:**
```json
{
  "variables": ["name", "count"],
  "pluralization": {
    "en": {
      "one": "1 item",
      "other": "{count} items"
    },
    "id": {
      "other": "{count} item"
    }
  },
  "max_length": 50,
  "screen": "ProductDetailPage",
  "component": "AddToCartButton"
}
```

---

### Table: `locale_settings`

Stores locale-specific settings per tenant.

```sql
CREATE TABLE locale_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- CORE RULE: tenant_id is REQUIRED (no global locale settings)
    tenant_id UUID NOT NULL,
    
    default_language VARCHAR(10) NOT NULL DEFAULT 'id',
    fallback_language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    available_languages JSONB NOT NULL DEFAULT '["id", "en"]',
    
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
    
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(50) DEFAULT 'HH:mm:ss',
    datetime_format VARCHAR(50) DEFAULT 'DD/MM/YYYY HH:mm',
    
    number_format JSONB DEFAULT '{"decimal": ",", "thousand": ".", "precision": 2}',
    currency_format JSONB DEFAULT '{"symbol": "Rp", "position": "before", "spacing": true}',
    
    first_day_of_week INT DEFAULT 1,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    
    CONSTRAINT unique_locale_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_locale_settings_tenant_id ON locale_settings(tenant_id);
CREATE INDEX idx_locale_settings_default_language ON locale_settings(default_language);

CREATE TRIGGER update_locale_settings_updated_at
BEFORE UPDATE ON locale_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Columns:**
- `default_language`: Primary language for tenant
- `fallback_language`: Fallback if translation missing
- `available_languages`: Array of enabled language codes
- `timezone`: IANA timezone (e.g., 'Asia/Jakarta', 'UTC', 'America/New_York')
- `date_format`: Date display format

---

## BUSINESS INTEGRATION

### RBAC Integration

**Permission-Based Language Management:**

```sql
-- Language management permissions
INSERT INTO permissions (code, name, description) VALUES
('languages.view', 'View Languages', 'Can view language settings'),
('languages.manage', 'Manage Languages', 'Can add/edit/delete languages'),
('translations.view', 'View Translations', 'Can view translations'),
('translations.edit', 'Edit Translations', 'Can modify translations'),
('translations.import', 'Import Translations', 'Can import translation files'),
('translations.export', 'Export Translations', 'Can export translation files'),
('locale.configure', 'Configure Locale', 'Can configure locale settings');
```

**Role-Based Access Examples:**
- **Admin**: Full language management access
- **Content Manager**: Can edit translations but not manage languages
- **Translator**: Can edit translations only
- **Viewer**: Read-only access to view current translations

### Integration with Multi-Tenant Architecture

**Translation Hierarchy:**
1. **Platform Translations** (tenant_id = NULL): Base translations for all tenants
2. **Tenant Overrides** (tenant_id = UUID): Tenant-specific customizations
3. **Fallback Logic**: Tenant translation → Platform translation → Default language

**Example Translation Override:**
```json
// Platform translation (tenant_id = NULL)
{
  "key": "product.label.name",
  "translations": {
    "en": "Product Name",
    "id": "Nama Produk"
  }
}

// Tenant override for etching business (tenant_id = "abc-123")
{
  "key": "product.label.name", 
  "translations": {
    "en": "Etching Design Name",
    "id": "Nama Desain Etching"
  }
}
```
- `number_format`: Decimal/thousand separator settings
- `currency_format`: Currency display settings
- `first_day_of_week`: 0=Sunday, 1=Monday

**JSONB `number_format` Example:**
```json
{
  "decimal": ",",
  "thousand": ".",
  "precision": 2
}
```
→ 1234.56 displays as "1.234,56"

**JSONB `currency_format` Example:**
```json
{
  "symbol": "Rp",
  "position": "before",
  "spacing": true
}
```
→ 50000 displays as "Rp 50.000"

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANGUAGE & LOCALIZATION                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   languages      │
│                  │
│ PK: id           │
│     code (UNIQUE)│◄──────┐
│     name         │       │
│     native_name  │       │
│     is_active    │       │
│     is_rtl       │       │
└──────────────────┘       │
                           │
                           │ Referenced by
                           │ default_language
                           │ fallback_language
                           │
┌──────────────────────────┴──────────────────┐
│           locale_settings                   │
│                                             │
│ PK: id                                      │
│ FK: tenant_id → tenants.uuid                │
│     default_language (VARCHAR)              │
│     fallback_language (VARCHAR)             │
│     available_languages (JSONB array)       │
│     timezone                                │
│     date_format, time_format                │
│     number_format (JSONB)                   │
│     currency_format (JSONB)                 │
└─────────────────────────────────────────────┘


┌──────────────────────────┐
│  translation_categories  │
│                          │
│ PK: id                   │
│     slug (UNIQUE)        │
│     name                 │
│ FK: parent_id (self)     │◄──────┐
│     sort_order           │       │
└──────────────────────────┘       │
        ▲                          │
        │                          │
        │ FK: category_id          │
        │                          │
┌───────┴──────────────────────────┴──────┐
│            translations                 │
│                                         │
│ PK: id                                  │
│ FK: tenant_id → tenants.uuid (NULL OK)  │
│ FK: category_id → categories.id         │
│     key (VARCHAR)                       │
│     translations (JSONB)                │
│       {"en": "...", "id": "..."}       │
│     description                         │
│     context                             │
│     is_html                             │
│     is_system                           │
│     metadata (JSONB)                    │
│ FK: created_by → users.id               │
│ FK: updated_by → users.id               │
│                                         │
│ UNIQUE(tenant_id, key)                  │
└─────────────────────────────────────────┘
```

**Key Relationships:**

1. **languages** → **locale_settings**
   - One-to-many reference via language code
   - `locale_settings.default_language` references `languages.code`

2. **translation_categories** → **translation_categories** (Self-referencing)
   - Hierarchical categories
   - `parent_id` references own `id`

3. **translation_categories** → **translations**
   - One-to-many relationship
   - Each translation belongs to one category

4. **tenants** → **translations**
   - One-to-many relationship
   - `tenant_id` NULL = global/platform translations
   - `tenant_id` NOT NULL = tenant-specific overrides

5. **tenants** → **locale_settings**
   - One-to-one relationship
   - Each tenant has one locale configuration

---

## FIELD SPECIFICATIONS

### Table: `languages`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `code` | VARCHAR(10) | Yes | Unique, ISO 639-1 | Language code (e.g., 'id', 'en') |
| `name` | VARCHAR(100) | Yes | Min 2 chars | English name |
| `native_name` | VARCHAR(100) | Yes | Min 2 chars | Native language name |
| `is_active` | BOOLEAN | Yes | Default TRUE | Language enabled |
| `is_default` | BOOLEAN | Yes | Default FALSE | System default language |
| `is_rtl` | BOOLEAN | Yes | Default FALSE | Right-to-left script |
| `flag_emoji` | VARCHAR(10) | No | - | Flag emoji (🇮🇩, 🇬🇧) |
| `sort_order` | INT | Yes | >= 0 | Display order |
| `locale_settings` | JSONB | No | Valid JSON | Locale-specific config |

### Table: `translation_categories`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `slug` | VARCHAR(100) | Yes | Unique, slug format | URL-friendly identifier |
| `name` | VARCHAR(100) | Yes | Min 3 chars | Display name |
| `description` | TEXT | No | - | Category description |
| `parent_id` | BIGINT | No | FK to self | Parent category |
| `sort_order` | INT | Yes | >= 0 | Display order |

### Table: `translations`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | No | FK to tenants | NULL = global |
| `key` | VARCHAR(255) | Yes | Dot notation | Translation key |
| `category_id` | BIGINT | No | FK to categories | Category |
| `translations` | JSONB | Yes | Valid JSON object | All language versions |
| `description` | TEXT | No | - | Helper for translators |
| `context` | VARCHAR(500) | No | - | Usage context |
| `is_html` | BOOLEAN | Yes | Default FALSE | Contains HTML |
| `is_system` | BOOLEAN | Yes | Default FALSE | System translation |
| `metadata` | JSONB | No | Valid JSON | Additional data |
| `created_by` | BIGINT | No | FK to users | Creator |
| `updated_by` | BIGINT | No | FK to users | Last editor |

### Table: `locale_settings`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants, Unique | Tenant reference |
| `default_language` | VARCHAR(10) | Yes | FK to languages.code | Primary language |
| `fallback_language` | VARCHAR(10) | Yes | FK to languages.code | Fallback language |
| `available_languages` | JSONB | Yes | Array of codes | Enabled languages |
| `timezone` | VARCHAR(100) | Yes | IANA timezone | Tenant timezone |
| `date_format` | VARCHAR(50) | Yes | Date format string | Date display |
| `time_format` | VARCHAR(50) | Yes | Time format string | Time display |
| `datetime_format` | VARCHAR(50) | Yes | DateTime format | DateTime display |
| `number_format` | JSONB | Yes | Valid JSON object | Number formatting |
| `currency_format` | JSONB | Yes | Valid JSON object | Currency formatting |
| `first_day_of_week` | INT | Yes | 0-6 (0=Sunday) | Week start day |
| `metadata` | JSONB | No | Valid JSON | Additional settings |

---

## BUSINESS RULES

### BR-1: Language Management

```typescript
const languageRules = {
  // Rule 1: Only one default language allowed
  ensureSingleDefault: async (code: string) => {
    await db.query(`
      UPDATE languages 
      SET is_default = FALSE 
      WHERE code != $1
    `, [code]);
  },
  
  // Rule 2: Cannot delete default language
  cannotDeleteDefault: (language: Language) => {
    if (language.is_default) {
      throw new Error('Cannot delete default language');
    }
  },
  
  // Rule 3: Cannot deactivate language if used as default by any tenant
  checkTenantUsage: async (code: string) => {
    const usage = await db.query(`
      SELECT COUNT(*) FROM locale_settings 
      WHERE default_language = $1 OR fallback_language = $1
    `, [code]);
    
    if (usage.count > 0) {
      throw new Error(`Language ${code} is in use by ${usage.count} tenant(s)`);
    }
  }
};
```

### BR-2: Translation Key Validation

```typescript
const translationKeyRules = {
  // Rule 1: Key must follow dot notation
  validateKeyFormat: (key: string) => {
    const pattern = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9_]*)+$/;
    if (!pattern.test(key)) {
      throw new Error('Key must follow format: namespace.section.key');
    }
  },
  
  // Rule 2: System translations cannot be deleted
  cannotDeleteSystem: (translation: Translation) => {
    if (translation.is_system) {
      throw new Error('Cannot delete system translation');
    }
  },
  
  // Rule 3: Must have at least default language translation
  requireDefaultLanguage: (translations: Record<string, string>) => {
    const defaultLang = getDefaultLanguage();
    if (!translations[defaultLang.code]) {
      throw new Error(`Translation for default language (${defaultLang.code}) is required`);
    }
  }
};
```

### BR-3: Translation Fallback Logic

```typescript
const translationFallback = {
  // Priority: Tenant override → Global translation → Fallback language → Key
  getTranslation: (key: string, language: string, tenantId?: string) => {
    // 1. Try tenant-specific translation in requested language
    let text = findTranslation(key, language, tenantId);
    if (text) return text;
    
    // 2. Try global translation in requested language
    text = findTranslation(key, language, null);
    if (text) return text;
    
    // 3. Try fallback language (global)
    const fallbackLang = getFallbackLanguage();
    text = findTranslation(key, fallbackLang, null);
    if (text) return text;
    
    // 4. Return key as last resort
    return key;
  }
};
```

### BR-4: Locale Settings Validation

```typescript
const localeRules = {
  // Rule 1: Available languages must include default language
  validateAvailableLanguages: (settings: LocaleSettings) => {
    if (!settings.available_languages.includes(settings.default_language)) {
      throw new Error('Default language must be in available languages');
    }
  },
  
  // Rule 2: Fallback language must be different from default
  validateFallback: (settings: LocaleSettings) => {
    if (settings.fallback_language === settings.default_language) {
      throw new Error('Fallback language must differ from default language');
    }
  },
  
  // Rule 3: Timezone must be valid IANA timezone
  validateTimezone: (timezone: string) => {
    const valid = Intl.supportedValuesOf('timeZone');
    if (!valid.includes(timezone)) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
  }
};
```

### BR-5: Translation Interpolation

```typescript
const interpolate = (template: string, variables: Record<string, any>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
};

// Usage:
t('cart.items_count', { count: 5 })
// Template: "You have {count} items"
// Result: "You have 5 items"
```

### BR-6: Pluralization Support

```typescript
const pluralize = (
  key: string, 
  count: number, 
  language: string
): string => {
  const translation = getTranslation(key, language);
  const pluralRules = new Intl.PluralRules(language);
  const form = pluralRules.select(count); // 'zero', 'one', 'two', 'few', 'many', 'other'
  
  if (translation.metadata?.pluralization?.[language]?.[form]) {
    return interpolate(
      translation.metadata.pluralization[language][form],
      { count }
    );
  }
  
  return interpolate(translation.translations[language], { count });
};

// Example:
// EN: "one" → "1 item", "other" → "{count} items"
// ID: "other" → "{count} item" (Indonesian no plural distinction)
```

---

## TRANSLATION KEYS STRUCTURE

### Recommended Key Organization

```
{namespace}.{section}.{element}

Examples:
nav.menu.home
nav.menu.products
nav.breadcrumb.home

common.button.save
common.button.cancel
common.button.delete
common.label.email
common.placeholder.search

product.title.details
product.label.price
product.label.stock
product.button.add_to_cart
product.message.out_of_stock

cart.title.shopping_cart
cart.message.empty
cart.button.checkout
cart.label.subtotal

auth.title.login
auth.label.email
auth.label.password
auth.button.login
auth.error.invalid_credentials

error.validation.required
error.validation.email
error.validation.min_length
error.network.timeout
error.server.internal

success.product.created
success.order.submitted
success.profile.updated
```

### Category Structure

```
navigation/
  menu/
  breadcrumb/
  footer/

common/
  button/
  label/
  placeholder/
  tooltip/

product/
  title/
  label/
  button/
  message/

cart/
checkout/
order/
user/
auth/
error/
success/
```

---

## API ENDPOINTS

### Language Management

```yaml
# Get all languages
GET /api/languages
Response: Language[]
Query: ?active_only=true

# Get language by code
GET /api/languages/{code}
Response: Language

# Create language (Admin only)
POST /api/admin/languages
Body: {
  code: string
  name: string
  native_name: string
  is_active: boolean
  is_rtl: boolean
  flag_emoji: string
  locale_settings: object
}

# Update language
PUT /api/admin/languages/{code}
Body: Partial<Language>

# Delete language
DELETE /api/admin/languages/{code}

# Set default language
POST /api/admin/languages/{code}/set-default
```

### Translation Management

```yaml
# Get translations for specific language
GET /api/translations/{language_code}
Response: Record<string, string> (flat key-value pairs)
Query: 
  ?category=navigation
  &tenant_id=xxx (optional, for tenant overrides)

# Get all translations (Admin)
GET /api/admin/translations
Response: Translation[]
Query:
  ?language=en
  &category_id=1
  &search=keyword
  &tenant_id=xxx
  &page=1&per_page=50

# Get translation by key
GET /api/admin/translations/key/{key}
Response: Translation
Query: ?tenant_id=xxx

# Create translation
POST /api/admin/translations
Body: {
  key: string
  category_id: number
  translations: { en: string, id: string }
  description: string
  context: string
  is_html: boolean
  tenant_id: string (optional)
}

# Update translation
PUT /api/admin/translations/{uuid}
Body: Partial<Translation>

# Delete translation
DELETE /api/admin/translations/{uuid}

# Bulk import translations
POST /api/admin/translations/import
Body: FormData (file: .json|.csv|.po)
Query: ?format=json&tenant_id=xxx

# Export translations
GET /api/admin/translations/export
Query: 
  ?format=json|csv|po
  &language=en
  &category_id=1
  &tenant_id=xxx

# Get missing translations report
GET /api/admin/translations/missing
Response: {
  language: string
  missing_keys: string[]
  completion_percentage: number
}[]

# Get translation coverage
GET /api/admin/translations/coverage
Response: {
  total_keys: number
  by_language: {
    [code]: {
      translated: number
      missing: number
      percentage: number
    }
  }
  by_category: {
    [name]: {
      translated: number
      missing: number
    }
  }
}
```

### Translation Categories

```yaml
# Get all categories
GET /api/admin/translation-categories
Response: TranslationCategory[]
Query: ?parent_id=null (for root categories)

# Create category
POST /api/admin/translation-categories
Body: {
  slug: string
  name: string
  description: string
  parent_id: number
}

# Update category
PUT /api/admin/translation-categories/{uuid}

# Delete category
DELETE /api/admin/translation-categories/{uuid}

# Reorder categories
POST /api/admin/translation-categories/reorder
Body: { uuid: string, sort_order: number }[]
```

### Locale Settings

```yaml
# Get tenant locale settings
GET /api/tenant/locale-settings
Response: LocaleSettings

# Update tenant locale settings
PUT /api/tenant/locale-settings
Body: {
  default_language: string
  fallback_language: string
  available_languages: string[]
  timezone: string
  date_format: string
  time_format: string
  number_format: object
  currency_format: object
  first_day_of_week: number
}

# Get supported timezones
GET /api/timezones
Response: string[]

# Get date format options
GET /api/date-formats
Response: { format: string, example: string }[]
```

---

## ADMIN UI FEATURES

### 1. Language Settings Page

**Location:** `src/pages/admin/LanguageSettings.tsx` (Implemented)

**Features:**
- ✅ Translation list grouped by category
- ✅ Add new translation
- ✅ Edit existing translation
- ✅ Delete translation
- ✅ Search/filter translations
- ⏳ Import/export translations (planned)
- ⏳ Translation coverage indicator (planned)
- ⏳ Missing translation warnings (planned)

**UI Components:**
```typescript
// Translation table with categories
<TranslationTable 
  translations={translations}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// Add/Edit dialog
<TranslationDialog
  mode="add" | "edit"
  translation={currentTranslation}
  onSave={handleSave}
/>

// Language selector
<LanguageSelector
  current={language}
  onChange={setLanguage}
/>
```

### 2. Language Manager (Planned)

**Features:**
- Language list with activation status
- Add new language support
- Configure locale settings per language
- RTL support toggle
- Language priority/sorting

### 3. Translation Editor (Planned)

**Features:**
- Side-by-side translation editing
- Visual context (screenshots)
- Translation memory suggestions
- Character count limits
- HTML preview for rich text
- Variable highlighting
- Pluralization forms editor

### 4. Locale Configuration (Planned)

**Features:**
- Default language selection
- Available languages management
- Timezone configuration
- Date/time format customization
- Number format settings
- Currency format settings
- Preview of formatted values

---

## SAMPLE DATA

### Sample Languages

```sql
INSERT INTO languages (code, name, native_name, is_active, is_default, is_rtl, flag_emoji, sort_order) VALUES
('id', 'Indonesian', 'Bahasa Indonesia', TRUE, TRUE, FALSE, '🇮🇩', 1),
('en', 'English', 'English', TRUE, FALSE, FALSE, '🇬🇧', 2),
('ja', 'Japanese', '日本語', FALSE, FALSE, FALSE, '🇯🇵', 3),
('ko', 'Korean', '한국어', FALSE, FALSE, FALSE, '🇰🇷', 4),
('zh', 'Chinese', '中文', FALSE, FALSE, FALSE, '🇨🇳', 5),
('ar', 'Arabic', 'العربية', FALSE, FALSE, TRUE, '🇸🇦', 6);
```

### Sample Translation Categories

```sql
INSERT INTO translation_categories (slug, name, description, parent_id, sort_order) VALUES
('navigation', 'Navigation', 'Menu items, breadcrumbs, links', NULL, 1),
('common', 'Common', 'Buttons, labels, placeholders', NULL, 2),
('product', 'Product', 'Product-related text', NULL, 3),
('cart', 'Shopping Cart', 'Cart and checkout', NULL, 4),
('auth', 'Authentication', 'Login, register, password', NULL, 5),
('error', 'Error Messages', 'Validation and error text', NULL, 6),
('success', 'Success Messages', 'Success notifications', NULL, 7);
```

### Sample Translations

```sql
INSERT INTO translations (tenant_id, key, category_id, translations, description, is_system) VALUES
(NULL, 'nav.menu.home', 1, '{"en": "Home", "id": "Beranda"}', 'Homepage link', TRUE),
(NULL, 'nav.menu.products', 1, '{"en": "Products", "id": "Produk"}', 'Products page link', TRUE),
(NULL, 'common.button.save', 2, '{"en": "Save", "id": "Simpan"}', 'Save button', TRUE),
(NULL, 'common.button.cancel', 2, '{"en": "Cancel", "id": "Batal"}', 'Cancel button', TRUE),
(NULL, 'product.label.price', 3, '{"en": "Price", "id": "Harga"}', 'Product price label', TRUE),
(NULL, 'cart.message.empty', 4, '{"en": "Your cart is empty", "id": "Keranjang Anda kosong"}', 'Empty cart message', TRUE),
(NULL, 'error.validation.required', 6, '{"en": "This field is required", "id": "Field ini wajib diisi"}', 'Required field error', TRUE);
```

### Sample Locale Settings

```sql
INSERT INTO locale_settings (tenant_id, default_language, fallback_language, available_languages, timezone, date_format, time_format, number_format, currency_format) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'id', 'en', '["id", "en"]', 'Asia/Jakarta', 'DD/MM/YYYY', 'HH:mm:ss', 
'{"decimal": ",", "thousand": ".", "precision": 2}',
'{"symbol": "Rp", "position": "before", "spacing": true}');
```

---

## MIGRATION SCRIPT

```sql
-- Migration: Create language and localization tables
-- Version: 1.0
-- Date: 2025-11-11

BEGIN;

-- Create languages table
CREATE TABLE languages (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    is_rtl BOOLEAN DEFAULT FALSE,
    flag_emoji VARCHAR(10) NULL,
    sort_order INT DEFAULT 0,
    locale_settings JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_is_active ON languages(is_active);
CREATE INDEX idx_languages_sort_order ON languages(sort_order);

CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON languages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create translation_categories table
CREATE TABLE translation_categories (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    parent_id BIGINT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES translation_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_translation_categories_slug ON translation_categories(slug);
CREATE INDEX idx_translation_categories_parent_id ON translation_categories(parent_id);
CREATE INDEX idx_translation_categories_sort_order ON translation_categories(sort_order);

CREATE TRIGGER update_translation_categories_updated_at
BEFORE UPDATE ON translation_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create translations table
CREATE TABLE translations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NULL,
    key VARCHAR(255) NOT NULL,
    category_id BIGINT NULL,
    translations JSONB NOT NULL,
    description TEXT NULL,
    context VARCHAR(500) NULL,
    is_html BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_by BIGINT NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES translation_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_translation_key_per_tenant UNIQUE (tenant_id, key)
);

CREATE INDEX idx_translations_tenant_id ON translations(tenant_id);
CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_category_id ON translations(category_id);
CREATE INDEX idx_translations_is_system ON translations(is_system);
CREATE INDEX idx_translations_created_at ON translations(created_at);
CREATE INDEX idx_translations_deleted_at ON translations(deleted_at);
CREATE INDEX idx_translations_search ON translations USING GIN(to_tsvector('english', key || ' ' || COALESCE(description, '')));
CREATE INDEX idx_translations_json ON translations USING GIN(translations);

CREATE TRIGGER update_translations_updated_at
BEFORE UPDATE ON translations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create locale_settings table
CREATE TABLE locale_settings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    default_language VARCHAR(10) NOT NULL DEFAULT 'id',
    fallback_language VARCHAR(10) NOT NULL DEFAULT 'en',
    available_languages JSONB NOT NULL DEFAULT '["id", "en"]',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
    date_format VARCHAR(50) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(50) DEFAULT 'HH:mm:ss',
    datetime_format VARCHAR(50) DEFAULT 'DD/MM/YYYY HH:mm',
    number_format JSONB DEFAULT '{"decimal": ",", "thousand": ".", "precision": 2}',
    currency_format JSONB DEFAULT '{"symbol": "Rp", "position": "before", "spacing": true}',
    first_day_of_week INT DEFAULT 1,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    CONSTRAINT unique_locale_per_tenant UNIQUE (tenant_id)
);

CREATE INDEX idx_locale_settings_tenant_id ON locale_settings(tenant_id);
CREATE INDEX idx_locale_settings_default_language ON locale_settings(default_language);

CREATE TRIGGER update_locale_settings_updated_at
BEFORE UPDATE ON locale_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default languages
INSERT INTO languages (code, name, native_name, is_active, is_default, is_rtl, flag_emoji, sort_order) VALUES
('id', 'Indonesian', 'Bahasa Indonesia', TRUE, TRUE, FALSE, '🇮🇩', 1),
('en', 'English', 'English', TRUE, FALSE, FALSE, '🇬🇧', 2);

-- Insert default categories
INSERT INTO translation_categories (slug, name, description, sort_order) VALUES
('navigation', 'Navigation', 'Menu items, breadcrumbs, links', 1),
('common', 'Common', 'Buttons, labels, placeholders', 2),
('product', 'Product', 'Product-related text', 3),
('cart', 'Shopping Cart', 'Cart and checkout', 4),
('auth', 'Authentication', 'Login, register, password', 5),
('error', 'Error Messages', 'Validation and error text', 6),
('success', 'Success Messages', 'Success notifications', 7);

-- Insert default translations
INSERT INTO translations (key, category_id, translations, description, is_system) VALUES
('nav.menu.home', 1, '{"en": "Home", "id": "Beranda"}', 'Homepage link', TRUE),
('nav.menu.products', 1, '{"en": "Products", "id": "Produk"}', 'Products page link', TRUE),
('nav.menu.about', 1, '{"en": "About", "id": "Tentang"}', 'About page link', TRUE),
('nav.menu.contact', 1, '{"en": "Contact", "id": "Kontak"}', 'Contact page link', TRUE),
('common.button.save', 2, '{"en": "Save", "id": "Simpan"}', 'Save button', TRUE),
('common.button.cancel', 2, '{"en": "Cancel", "id": "Batal"}', 'Cancel button', TRUE),
('common.button.delete', 2, '{"en": "Delete", "id": "Hapus"}', 'Delete button', TRUE),
('common.button.edit', 2, '{"en": "Edit", "id": "Edit"}', 'Edit button', TRUE),
('common.button.add', 2, '{"en": "Add", "id": "Tambah"}', 'Add button', TRUE),
('common.placeholder.search', 2, '{"en": "Search...", "id": "Cari..."}', 'Search placeholder', TRUE),
('product.label.price', 3, '{"en": "Price", "id": "Harga"}', 'Product price label', TRUE),
('product.label.stock', 3, '{"en": "Stock", "id": "Stok"}', 'Product stock label', TRUE),
('product.button.add_to_cart', 3, '{"en": "Add to Cart", "id": "Tambah ke Keranjang"}', 'Add to cart button', TRUE),
('cart.title.shopping_cart', 4, '{"en": "Shopping Cart", "id": "Keranjang Belanja"}', 'Cart title', TRUE),
('cart.message.empty', 4, '{"en": "Your cart is empty", "id": "Keranjang Anda kosong"}', 'Empty cart message', TRUE),
('error.validation.required', 6, '{"en": "This field is required", "id": "Field ini wajib diisi"}', 'Required field error', TRUE),
('error.validation.email', 6, '{"en": "Please enter a valid email", "id": "Mohon masukkan email yang valid"}', 'Email validation error', TRUE);

COMMIT;
```

---

## PERFORMANCE INDEXES

### Index Strategy

```sql
-- Languages table indexes
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_is_active ON languages(is_active);
CREATE INDEX idx_languages_sort_order ON languages(sort_order);

-- Translation categories indexes
CREATE INDEX idx_translation_categories_slug ON translation_categories(slug);
CREATE INDEX idx_translation_categories_parent_id ON translation_categories(parent_id);
CREATE INDEX idx_translation_categories_sort_order ON translation_categories(sort_order);

-- Translations table indexes (critical for performance)
CREATE INDEX idx_translations_tenant_id ON translations(tenant_id);
CREATE INDEX idx_translations_key ON translations(key);
CREATE INDEX idx_translations_category_id ON translations(category_id);
CREATE INDEX idx_translations_is_system ON translations(is_system);

-- Composite index for most common query (tenant + key lookup)
CREATE INDEX idx_translations_tenant_key ON translations(tenant_id, key) 
WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_translations_search ON translations 
USING GIN(to_tsvector('english', key || ' ' || COALESCE(description, '')));

-- JSONB index for translations object
CREATE INDEX idx_translations_json ON translations USING GIN(translations);

-- Locale settings indexes
CREATE INDEX idx_locale_settings_tenant_id ON locale_settings(tenant_id);
CREATE INDEX idx_locale_settings_default_language ON locale_settings(default_language);
```

### Query Performance Benchmarks

**Expected Performance (10,000 translations, 1,000 tenants):**

| Query Type | Expected Time | Index Used |
|------------|---------------|------------|
| Get all translations for language | < 50ms | idx_translations_json |
| Get translation by key (global) | < 5ms | idx_translations_key |
| Get translation by key (tenant) | < 5ms | idx_translations_tenant_key |
| Search translations | < 100ms | idx_translations_search (GIN) |
| Get translations by category | < 20ms | idx_translations_category_id |
| Get locale settings | < 5ms | idx_locale_settings_tenant_id |

### Optimization Techniques

**1. Translation Caching Strategy:**
```typescript
// Cache translations in Redis for 1 hour
const cacheKey = `translations:${tenantId}:${language}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const translations = await db.getTranslations(tenantId, language);
await redis.setex(cacheKey, 3600, JSON.stringify(translations));
return translations;
```

**2. Lazy Loading Translations:**
```typescript
// Load only required namespace
const translations = await getTranslations(language, {
  categories: ['navigation', 'common']
});
```

**3. Pre-compiled Translation Bundles:**
```typescript
// Generate static JSON files per language during build
// /public/translations/en.json
// /public/translations/id.json
```

---

**Previous:** [15-THEME.md](./15-THEME.md)  
**Next:** [17-SETTINGS.md](./17-SETTINGS.md)

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** System Architect
