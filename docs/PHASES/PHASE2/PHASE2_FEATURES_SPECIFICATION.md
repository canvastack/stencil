# 📋 PHASE 2 FEATURES SPECIFICATION

**Detailed Requirements & Specifications for Enhancement Features**

> **Version**: 1.0  
> **Status**: ✅ Requirements Complete  
> **Target Audience**: Developers, QA, Product Managers  
> **Prerequisites**: Phase 1 Features Completed

---

## 📋 TABLE OF CONTENTS

1. [Menu Management System](#1-menu-management-system)
2. [Package Management System](#2-package-management-system)
3. [License Management System](#3-license-management-system)
4. [Dynamic Content Editor](#4-dynamic-content-editor)
5. [Cross-Feature Requirements](#5-cross-feature-requirements)

---

## 1. MENU MANAGEMENT SYSTEM

### 1.1 Feature Overview

**Purpose**: Allow tenants to customize admin navigation and public website menus through a drag-and-drop interface.

**Business Value**:
- Improve admin user experience with customizable navigation
- Enable packages to inject their own menu items automatically
- Permission-based visibility enhances security
- Foundation for package ecosystem

### 1.2 Functional Requirements

#### FR-MENU-001: Menu Container Management

**As an** admin user  
**I want to** create, edit, and delete menu containers  
**So that** I can organize navigation for different sections of the application

**Acceptance Criteria**:
- ✅ Admin can create menu containers with name, location, and type
- ✅ Menu locations: header, footer, admin_sidebar, admin_topbar
- ✅ Menu types: public, admin
- ✅ One menu per location per tenant (enforced)
- ✅ Deleting menu cascades to delete all menu items
- ✅ System creates default admin sidebar menu on tenant creation

#### FR-MENU-002: Menu Item CRUD

**As an** admin user  
**I want to** add, edit, and remove menu items  
**So that** I can customize navigation structure

**Acceptance Criteria**:
- ✅ Admin can add menu items with title, URL, icon, and permissions
- ✅ Support menu item types: internal, external, custom, divider
- ✅ URL validation for external links
- ✅ Icon picker with Lucide Icons library
- ✅ Permission assignment (roles & specific permissions)
- ✅ Active/inactive toggle
- ✅ Admin can edit all properties
- ✅ Admin can delete items (with confirmation)

#### FR-MENU-003: Hierarchical Menu Structure

**As an** admin user  
**I want to** create nested menus  
**So that** I can organize related items under parent items

**Acceptance Criteria**:
- ✅ Support parent-child relationships (unlimited depth)
- ✅ Maximum nesting depth: 5 levels (configurable)
- ✅ Visual indent indicators in editor
- ✅ Prevent circular references (A → B → A)
- ✅ Collapsible parent items in preview
- ✅ Breadcrumb trail for deeply nested items

#### FR-MENU-004: Drag & Drop Reordering

**As an** admin user  
**I want to** reorder menu items via drag & drop  
**So that** I can quickly arrange navigation structure

**Acceptance Criteria**:
- ✅ Smooth drag & drop interaction (react-beautiful-dnd)
- ✅ Visual feedback during drag (highlight drop zones)
- ✅ Support horizontal and vertical reordering
- ✅ Indent/outdent to change parent
- ✅ Auto-save order changes
- ✅ Undo/redo functionality
- ✅ Touch-friendly for tablets

#### FR-MENU-005: Permission-Based Visibility

**As a** user  
**I want to** see only menu items I have permission to access  
**So that** navigation is relevant to my role

**Acceptance Criteria**:
- ✅ Menu items filtered server-side based on user permissions
- ✅ Support role-based filtering (admin, manager, staff)
- ✅ Support permission-based filtering (view_orders, edit_products)
- ✅ Hidden items don't appear in API response
- ✅ No client-side permission data exposure
- ✅ Cache filtered menus per user role (Redis)

#### FR-MENU-006: Menu Preview

**As an** admin user  
**I want to** preview how menus will look  
**So that** I can verify changes before saving

**Acceptance Criteria**:
- ✅ Live preview panel in editor
- ✅ Toggle between desktop and mobile views
- ✅ Preview for different user roles
- ✅ Real-time updates as items are added/reordered
- ✅ Shows actual menu rendering (not mockup)

### 1.3 Non-Functional Requirements

**Performance**:
- Menu API response time: P95 < 100ms
- Drag & Drop interaction: < 16ms frame time (60 FPS)
- Menu rendering: < 50ms for 100+ items

**Security**:
- Tenant isolation enforced (cannot edit other tenant's menus)
- Permission checks on all API endpoints
- XSS prevention in menu titles/URLs
- SQL injection prevention in menu queries

**Usability**:
- Intuitive drag & drop interface
- Keyboard shortcuts for power users (Ctrl+Z for undo)
- Mobile-responsive editor
- Tooltips for complex features

### 1.4 UI/UX Specifications

**Menu Editor Layout**:
```
┌─────────────────────────────────────────────────┐
│ Menu Editor: Admin Sidebar                  [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────┐  ┌─────────────────────┐   │
│ │  Menu Tree      │  │  Item Details       │   │
│ │                 │  │                      │   │
│ │  📊 Dashboard   │  │  Title: [Dashboard] │   │
│ │  📦 Products    │  │  URL:  [/admin/... ]│   │
│ │    ├─ List     │  │  Icon: [📦]          │   │
│ │    └─ Add New   │  │  Permissions:       │   │
│ │  🛒 Orders      │  │  ☑ admin            │   │
│ │  👥 Customers   │  │  ☐ manager          │   │
│ │  ⚙️  Settings   │  │                      │   │
│ │                 │  │  [Save] [Cancel]     │   │
│ └─────────────────┘  └─────────────────────┘   │
│                                                  │
│ [+ Add Item]  [Preview]  [Save All Changes]    │
└─────────────────────────────────────────────────┘
```

**Icon Picker Modal**:
```
┌─────────────────────────────────────────┐
│ Select Icon                         [×] │
├─────────────────────────────────────────┤
│ Search: [____________]                  │
│                                          │
│ ┌───┬───┬───┬───┬───┬───┐              │
│ │ 📊│ 📦│ 🛒│ 👥│ ⚙️ │ 🏠│              │
│ ├───┼───┼───┼───┼───┼───┤              │
│ │ 💰│ 📈│ 📉│ 📧│ 🔔│ 🔒│              │
│ └───┴───┴───┴───┴───┴───┘              │
│                                          │
│ Preview: 📦                              │
│                                          │
│         [Select]  [Cancel]               │
└─────────────────────────────────────────┘
```

---

## 2. PACKAGE MANAGEMENT SYSTEM

### 2.1 Feature Overview

**Purpose**: WordPress-like package/plugin system for extending platform functionality.

**Business Value**:
- Revenue stream through package marketplace (30% platform fee)
- Ecosystem growth (official + community packages)
- Platform differentiation
- Tenant customization without custom development

### 2.2 Functional Requirements

#### FR-PKG-001: Package Registry

**As a** platform administrator  
**I want to** maintain a registry of available packages  
**So that** tenants can browse and install them

**Acceptance Criteria**:
- ✅ Package registry with metadata (name, description, version, author)
- ✅ Package categories (business-module, payment-gateway, communication, theme)
- ✅ Package ratings & reviews
- ✅ Download statistics
- ✅ Official vs Community package distinction
- ✅ Package screenshots & documentation links
- ✅ Compatibility version tracking

#### FR-PKG-002: Package Installation

**As a** tenant admin  
**I want to** install packages from the marketplace  
**So that** I can add features to my instance

**Acceptance Criteria**:
- ✅ One-click install from marketplace
- ✅ Compatibility check before installation
- ✅ Dependency resolution (auto-install dependencies)
- ✅ Download package ZIP from registry
- ✅ Verify package checksum (security)
- ✅ Extract files to `packages/{slug}/`
- ✅ Run package migrations
- ✅ Register package service providers
- ✅ Execute post-installation hooks
- ✅ Activate package automatically after install
- ✅ Rollback on installation failure
- ✅ Installation progress indicator
- ✅ Success/failure notifications

#### FR-PKG-003: Package Updates

**As a** tenant admin  
**I want to** update installed packages  
**So that** I can get new features and bug fixes

**Acceptance Criteria**:
- ✅ "Update Available" notification in admin
- ✅ View changelog before updating
- ✅ One-click update process
- ✅ Backup old version before updating
- ✅ Run migration diff (new migrations only)
- ✅ Update package files
- ✅ Update package hooks
- ✅ Rollback on update failure
- ✅ Version downgrade protection
- ✅ Automatic security updates (optional)

#### FR-PKG-004: Package Uninstallation

**As a** tenant admin  
**I want to** uninstall packages  
**So that** I can remove unused features

**Acceptance Criteria**:
- ✅ Deactivate package before uninstall
- ✅ Option to keep or delete package data
- ✅ Rollback package migrations (if data deleted)
- ✅ Remove package files
- ✅ Unregister package hooks
- ✅ Remove package menu items
- ✅ Confirmation dialog with data warning
- ✅ Log uninstallation for audit

#### FR-PKG-005: Package Activation/Deactivation

**As a** tenant admin  
**I want to** temporarily disable packages without uninstalling  
**So that** I can troubleshoot issues

**Acceptance Criteria**:
- ✅ Toggle activation status
- ✅ Deactivated packages don't load (no hooks, routes, migrations)
- ✅ Package data remains intact when deactivated
- ✅ Reactivation restores full functionality
- ✅ License check on activation (if required)

#### FR-PKG-006: Package Configuration

**As a** tenant admin  
**I want to** configure package settings  
**So that** I can customize package behavior

**Acceptance Criteria**:
- ✅ Each package has settings page (if defined)
- ✅ Settings stored in `tenant_packages.settings` JSON
- ✅ Validation of setting values
- ✅ Default settings on installation
- ✅ Settings export/import

#### FR-PKG-007: Hook/Event System

**As a** package developer  
**I want to** hook into platform events  
**So that** my package can react to actions

**Acceptance Criteria**:
- ✅ Packages can register event listeners
- ✅ Supported events: `order.created`, `order.updated`, `payment.received`, `invoice.generated`
- ✅ Priority-based execution (1-100, higher = first)
- ✅ Packages can modify data via filters
- ✅ Event payload includes tenant context
- ✅ Async event processing (queue jobs)
- ✅ Event hooks registered in `composer.json`

#### FR-PKG-008: Package Security Scanning

**As a** platform administrator  
**I want to** scan packages for malicious code  
**So that** tenant data is protected

**Acceptance Criteria**:
- ✅ Automated security scan before package approval
- ✅ Scan for common vulnerabilities (SQL injection, XSS, etc.)
- ✅ Detect suspicious function calls (`eval`, `exec`, `system`)
- ✅ Checksum verification on download
- ✅ Code review required for all community packages
- ✅ Package sandboxing (restrict file system access)
- ✅ Report security issues to package author

### 2.3 Package Developer Kit (PDK)

**CLI Commands**:
```bash
# Create new package scaffold
php artisan package:create finance-reporting

# Validate package structure
php artisan package:validate finance-reporting

# Publish package to registry
php artisan package:publish finance-reporting --version=1.0.0

# Test package installation locally
php artisan package:install-local finance-reporting
```

**Package Manifest Example**:
See `PHASE2_STRUCTURE.md` for complete `composer.json` specification.

### 2.4 First Official Package: Finance & Reporting

**Features**:
- Financial dashboard with charts
- Profit/Loss reports
- Revenue tracking by product/customer
- Expense categorization
- Export reports (PDF, Excel)
- Budget vs Actual analysis

**Database Tables**:
- `finance_categories` - Income/Expense categories
- `finance_transactions` - All financial transactions
- `finance_reports` - Saved report configurations

**Menu Items Injected**:
- "Finance" (parent)
  - "Dashboard"
  - "Transactions"
  - "Reports"
  - "Settings"

---

## 3. LICENSE MANAGEMENT SYSTEM

### 3.1 Feature Overview

**Purpose**: Monetize packages through license key validation and activation tracking.

**Business Value**:
- Revenue protection (prevent piracy)
- Track package usage across tenants
- Enable subscription-based pricing
- Enforce activation limits

### 3.2 Functional Requirements

#### FR-LIC-001: License Generation

**As a** platform administrator  
**I want to** generate license keys for packages  
**So that** I can sell package access

**Acceptance Criteria**:
- ✅ Generate unique encrypted license keys
- ✅ License types: free, per-tenant, per-user, lifetime
- ✅ Set max activations (e.g., 1, 5, unlimited)
- ✅ Set expiration date (or never expires)
- ✅ Associate license with package
- ✅ Metadata field for custom data
- ✅ Bulk license generation

**License Key Format**:
```
XXXX-XXXX-XXXX-XXXX (16 characters, alphanumeric)
Example: AG7K-PLM2-98NX-4TBQ
```

#### FR-LIC-002: License Activation

**As a** tenant admin  
**I want to** activate package licenses  
**So that** I can use premium packages

**Acceptance Criteria**:
- ✅ Input license key in activation form
- ✅ Validate license key format
- ✅ Verify license exists and is valid
- ✅ Check license not expired
- ✅ Check max activations not reached
- ✅ Check license for correct package
- ✅ Create activation record (tenant, IP, user agent)
- ✅ Display success/failure message
- ✅ Enable package features after activation

#### FR-LIC-003: License Validation

**As the** system  
**I want to** validate licenses periodically  
**So that** expired/revoked licenses are enforced

**Acceptance Criteria**:
- ✅ Validation on package activation
- ✅ Validation on daily background job
- ✅ Validation on license server (online mode)
- ✅ Offline validation with grace period (7 days)
- ✅ Cache validation results (1 hour)
- ✅ Disable package if license invalid
- ✅ Notify tenant of license expiration (7 days before)
- ✅ Response time: < 50ms (cached)

#### FR-LIC-004: License Revocation

**As a** platform administrator  
**I want to** revoke licenses  
**So that** I can handle abuse or refunds

**Acceptance Criteria**:
- ✅ Mark license as revoked in database
- ✅ Next validation fails for revoked license
- ✅ Package disabled within 24 hours (background job)
- ✅ Notify tenant of revocation
- ✅ Log revocation reason for audit

#### FR-LIC-005: Activation Management

**As a** tenant admin  
**I want to** view and manage my activations  
**So that** I can deactivate unused instances

**Acceptance Criteria**:
- ✅ List all activations for my licenses
- ✅ Show activation date, IP address, last verified
- ✅ Deactivate specific activation
- ✅ Reactivate after deactivation (if under max limit)
- ✅ Display remaining activations

### 3.3 Non-Functional Requirements

**Security**:
- Encrypted license keys (AES-256)
- Server-side validation (cannot be bypassed)
- Rate limiting on activation API (prevent brute force)
- Hardware fingerprinting for self-hosted (optional)
- Domain binding for SaaS (optional)

**Performance**:
- License validation: < 50ms (cached)
- Activation request: < 200ms
- Cache validation results: 1 hour

**Reliability**:
- Offline grace period: 7 days
- Retry logic for failed validations
- Fallback to cached validation if server down

---

## 4. DYNAMIC CONTENT EDITOR

### 4.1 Feature Overview

**Purpose**: Visual page builder (Elementor-like) for creating custom marketing pages without code.

**Business Value**:
- Tenants can create landing pages, about pages, FAQs
- No developer required for content changes
- Template library accelerates page creation
- Competitive advantage over traditional CMSs

### 4.2 Functional Requirements

#### FR-CONTENT-001: Page Management

**As a** tenant admin  
**I want to** create and manage pages  
**So that** I can build custom website content

**Acceptance Criteria**:
- ✅ Create page with title and unique slug
- ✅ Edit page title and slug
- ✅ Delete page (with confirmation)
- ✅ Duplicate page
- ✅ List all pages with status (draft, published, archived)
- ✅ Search/filter pages
- ✅ Bulk actions (publish, unpublish, delete)

#### FR-CONTENT-002: Visual Page Editor

**As a** tenant admin  
**I want to** edit pages visually via drag & drop  
**So that** I don't need to write HTML/CSS

**Acceptance Criteria**:
- ✅ GrapesJS editor integration
- ✅ Drag & Drop components (Hero, Features, Testimonials, CTA, etc.)
- ✅ Inline text editing (click to edit)
- ✅ Image upload & management
- ✅ Responsive design controls (desktop/tablet/mobile views)
- ✅ Style panel (colors, fonts, spacing, borders)
- ✅ Undo/Redo functionality
- ✅ Auto-save every 30 seconds
- ✅ Manual save button

#### FR-CONTENT-003: Component Library

**As a** tenant admin  
**I want to** use pre-built components  
**So that** I can build pages quickly

**Components Required**:
- ✅ Hero section (image, title, subtitle, CTA button)
- ✅ Features grid (3-column features with icons)
- ✅ Testimonials carousel
- ✅ Call-to-Action block
- ✅ FAQ accordion
- ✅ Contact form
- ✅ Image gallery
- ✅ Video embed (YouTube, Vimeo)
- ✅ Pricing table
- ✅ Team members grid

**Component Alignment**:
- All components use shadcn-ui design tokens
- Dark/light mode support
- Fully responsive
- Accessibility compliant (WCAG 2.1 AA)

#### FR-CONTENT-004: Page Publishing

**As a** tenant admin  
**I want to** publish/unpublish pages  
**So that** I can control visibility

**Acceptance Criteria**:
- ✅ Page status: draft, published, archived
- ✅ Publish page (makes publicly accessible)
- ✅ Unpublish page (returns to draft)
- ✅ Schedule publishing (publish at specific date/time)
- ✅ SEO meta fields (title, description, keywords)
- ✅ Open Graph tags for social sharing
- ✅ Canonical URL setting

#### FR-CONTENT-005: Revision History

**As a** tenant admin  
**I want to** view and restore previous versions  
**So that** I can undo changes if needed

**Acceptance Criteria**:
- ✅ Auto-create revision on each save
- ✅ List all revisions with timestamp and author
- ✅ Preview revision
- ✅ Restore revision (creates new current version)
- ✅ Compare two revisions (diff view)
- ✅ Limit revisions to last 50 (configurable)

#### FR-CONTENT-006: Template Library

**As a** tenant admin  
**I want to** start from templates  
**So that** I can create pages faster

**Acceptance Criteria**:
- ✅ Browse templates by category (Landing, About, Contact, etc.)
- ✅ Preview template before applying
- ✅ Apply template to new page
- ✅ Replace current page content with template
- ✅ Save custom templates
- ✅ Export/import templates

**Default Templates**:
- Landing Page (Hero + Features + CTA)
- About Us (Team + Mission + Values)
- Contact Us (Form + Map + Info)
- FAQ Page
- Pricing Page
- Blog Post (single column with sidebar)

### 4.3 Non-Functional Requirements

**Performance**:
- Editor load time: < 2 seconds
- Page render time: < 500ms
- Auto-save latency: < 300ms
- Image optimization on upload

**Security**:
- Content sanitization (XSS prevention)
- CSP headers for editor iframe
- File upload validation (type, size limits)
- User-uploaded images scanned for malware

**Usability**:
- Intuitive drag & drop
- Keyboard shortcuts (Ctrl+S save, Ctrl+Z undo)
- Tooltips for all controls
- Mobile-responsive editor (works on tablets)

---

## 5. CROSS-FEATURE REQUIREMENTS

### 5.1 Multi-Tenancy Isolation

**Applies to**: ALL Phase 2 features

- ✅ Tenant ID in all database tables
- ✅ Global scope on all Eloquent models
- ✅ Middleware tenant context switching
- ✅ API endpoints check tenant ownership
- ✅ Tests verify tenant isolation

### 5.2 Performance Standards

**Applies to**: ALL Phase 2 features

- ✅ API P95 response time: < 500ms
- ✅ Database queries optimized (N+1 prevention)
- ✅ Redis caching for frequently accessed data
- ✅ Lazy loading for lists (pagination)
- ✅ CDN for static assets

### 5.3 Security Standards

**Applies to**: ALL Phase 2 features

- ✅ Input validation on all endpoints
- ✅ XSS prevention (sanitize HTML)
- ✅ CSRF protection
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting on public APIs
- ✅ Authentication via Laravel Sanctum
- ✅ Authorization via spatie/laravel-permission

### 5.4 Accessibility Standards

**Applies to**: ALL Phase 2 frontend

- ✅ WCAG 2.1 Level AA compliance
- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Focus indicators visible
- ✅ Color contrast ratios ≥ 4.5:1

### 5.5 Testing Standards

**Applies to**: ALL Phase 2 features

- ✅ Domain layer: 100% test coverage
- ✅ Use Cases: 100% test coverage
- ✅ API endpoints: 90%+ test coverage
- ✅ Frontend components: 80%+ test coverage
- ✅ E2E tests for critical user flows

---

## 📊 FEATURE COMPARISON MATRIX

| Feature | Menu Mgmt | Package Mgmt | License Mgmt | Content Editor |
|---------|-----------|--------------|--------------|----------------|
| **Priority** | 🔴 CRITICAL | 🔥 HIGH | 🔑 HIGH | 🎨 MEDIUM |
| **Complexity** | Low | High | Medium | Medium |
| **Dev Time** | 4 weeks | 8 weeks | 4 weeks | 4 weeks |
| **Team Size** | 2 devs | 3 devs | 1.5 devs | 2 devs |
| **Dependencies** | None | Menu Mgmt | Package Mgmt | None |
| **Revenue Impact** | Indirect | Direct (30% fee) | Direct (license sales) | Indirect |
| **Tenant Adoption** | 100% | 80% | N/A (platform) | 60% |

---

## ✅ ACCEPTANCE CRITERIA CHECKLIST

Before considering a feature DONE:

### Menu Management
- [ ] All FR-MENU requirements met
- [ ] Drag & Drop smooth (60 FPS)
- [ ] Permission filtering works
- [ ] Tests: 100% Domain, 100% Use Cases, 90%+ API
- [ ] Works with packages (menu injection)

### Package Management
- [ ] All FR-PKG requirements met
- [ ] Finance package deployed
- [ ] Security scanning active
- [ ] Rollback on failure works
- [ ] Tests: 100% Domain, 100% Use Cases, 90%+ API

### License Management
- [ ] All FR-LIC requirements met
- [ ] Online/offline validation works
- [ ] Activation limits enforced
- [ ] Tests: 100% Domain, 100% Use Cases, 90%+ API
- [ ] Response time < 50ms (cached)

### Content Editor
- [ ] All FR-CONTENT requirements met
- [ ] GrapesJS fully integrated
- [ ] Template library populated
- [ ] Content sanitization works
- [ ] Tests: 100% Domain, 100% Use Cases, 90%+ API

---

**Document Version:** 1.0  
**Created:** November 2025  
**Last Updated:** November 2025  
**Status:** ✅ Requirements Complete

**Related Documents:**
- `PHASE2_COMPLETE_ROADMAP.md` - Development timeline
- `PHASE2_STRUCTURE.md` - Architecture reference
- `PHASE2_API_EXAMPLES.md` - API contracts
- `.zencoder/rules` - Development rules

---

**END OF PHASE 2 FEATURES SPECIFICATION**