# CanvaStack Stencil - Repository Documentation

> **Comprehensive Multi-Tenant CMS Platform with WordPress-like Architecture**

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)](https://tailwindcss.com/)
[![Laravel](https://img.shields.io/badge/Laravel-10-red)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)

**Version**: 2.0.0-alpha  
**Last Updated**: November 7, 2025  
**Platform Status**: 🚧 In Active Development  

---

## 📖 Table of Contents

1. [Platform Overview](#-platform-overview)
2. [Business Context](#-business-context)
3. [Architecture & Design](#-architecture--design)
4. [Technology Stack](#-technology-stack)
5. [Core Features](#-core-features)
6. [Development Plan](#-development-plan)
7. [Multi-Tenancy Strategy](#-multi-tenancy-strategy)
8. [Enhancement Features](#-enhancement-features)
9. [Implementation Roadmap](#-implementation-roadmap)
10. [Project Structure](#-project-structure)
11. [Current Status](#-current-status)
12. [Documentation Index](#-documentation-index)

---

## 🎯 Platform Overview

**CanvaStencil** adalah platform Content Management System (CMS) multi-tenant yang dikembangkan oleh **CanvaStack** dengan arsitektur yang terinspirasi dari WordPress. Platform ini dirancang untuk mendukung multiple bisnis dengan data, konfigurasi, dan tampilan yang terisolasi secara sempurna.

### Vision

Menyediakan infrastruktur SaaS yang memungkinkan setiap tenant (unit bisnis) untuk beroperasi secara independen dengan:
- **Isolated Data**: Setiap tenant memiliki schema database tersendiri
- **Custom Themes**: Dynamic theming engine dengan visual editor
- **Flexible Configuration**: Business logic yang dapat dikonfigurasi tanpa perubahan kode
- **Scalable Architecture**: Hexagonal architecture untuk easy integration dan expansion

### Current Focus

**PT Custom Etching Xenial (PT CEX)** - Platform etching berkualitas tinggi untuk logam, kaca, dan plakat penghargaan sebagai tenant pertama dan pilot project.

---

## 💼 Business Context

### Business Model: Makelar/Broker System

PT CEX beroperasi sebagai perantara antara customer dan vendor untuk menghasilkan produk etching. Alur bisnis utama:

#### 1. Order Intake (Customer → System)
- Customer submit order via website/telepon/walk-in
- Admin input data order ke sistem
- Auto-generated order code
- Dynamic form dengan custom fields per tenant

#### 2. Production Type Selection
- **Internal Production** (Future): Workshop sendiri
- **Vendor Production** (Current Focus): Outsource ke vendor

#### 3. Vendor Sourcing & Negotiation
- Admin mencari vendor berdasarkan specializations
- Multi-vendor quotation request
- Price negotiation tracking
- Email automation ke vendor

#### 4. Customer Quotation
- Auto markup calculation dari vendor price
- PPN/Tax handling
- Multiple quote versions tracking
- Email penawaran ke customer

#### 5. Payment Processing

**Payment Options:**
- **Cash**: Direct payment tracking
- **Bank Transfer**: Upload bukti transfer + manual verification
- **Payment Gateway**: Midtrans, Xendit, Stripe integration

**Payment Terms:**
- **DP Minimum 50%**: Account Payable status
- **Full Payment 100%**: Account Receivable status
- Automated invoice generation
- Payment verification workflow

#### 6. Vendor Payment Management
- DP to vendor (< 50% dari customer DP atau custom)
- Full payment options
- Accounting records untuk semua transactions
- Vendor invoice tracking

#### 7. Production Monitoring
- Status tracking: Designing → Etching → Finishing → QC → Ready
- Vendor communication log
- Estimated completion date updates
- Admin update capabilities

#### 8. Final Payment & Delivery
- Remaining payment collection (jika DP)
- Shipping integration dengan tracking number
- Auto notification ke customer
- Quality assurance

#### 9. Order Completion
- Customer review request
- Profitability report (customer price - vendor price)
- Transaction archival untuk historical data

### Scalability Scenarios

**Skenario "Not Deal":**
- **Vendor Rejected**: Re-sourcing ke vendor lain, reason logging
- **Customer Rejected**: Re-negotiation atau order cancellation
- **Price Mismatch**: Adjustment flow dengan approval tracking

**Future Expansion:**
- Multiple business types (bukan hanya etching)
- Internal production capabilities
- B2B marketplace antar tenants
- White-label solutions

---

## 🏗️ Architecture & Design

### Hexagonal Architecture (Ports & Adapters)

Platform mengimplementasikan clean separation antara domain logic dan infrastructure:

```
┌─────────────────────────────────────────────┐
│             Presentation Layer              │
│    ┌──────────────┐    ┌──────────────┐     │
│    │  API Routes  │    │   Console    │     │
│    └──────────────┘    └──────────────┘     │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│              Application Layer              │
│    ┌──────────────────────────────────┐     │
│    │ Use Cases / Application Services │     │
│    └──────────────────────────────────┘     │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│                 Domain Layer                │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │ Entities │  │  Value   │  │ Business │  │
│   │          │  │ Objects  │  │  Rules   │  │
│   └──────────┘  └──────────┘  └──────────┘  │
│   ┌──────────────────────────────────────┐  │
│   │    Repository Interfaces (Ports)     │  │
│   └──────────────────────────────────────┘  │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────┴───────────────────────┐
│            Infrastructure Layer             │
│   ┌──────────┐  ┌──────────┐  ┌─────────┐   │
│   │ Eloquent │  │   Mail   │  │ Payment │   │
│   │  Models  │  │ Adapters │  │ Gateway │   │
│   └──────────┘  └──────────┘  └─────────┘   │
└─────────────────────────────────────────────┘
```

### Multi-Tenant Architecture

Platform mengimplementasikan **Schema per Tenant** approach menggunakan PostgreSQL:

```
┌─────────────────────────────────────────────┐
│             LANDLORD DATABASE               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │ tenants  │  │  users   │  │  themes  │  │
│   └──────────┘  └──────────┘  └──────────┘  │
│  ┌────────────────────────────────────────┐ │
│  │      tenant_user (Pivot Table)         │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         TENANT DATABASE (Per Schema)        │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │ products │  │  orders  │  │customers │  │
│   └──────────┘  └──────────┘  └──────────┘  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │ invoices │  │ payments │  │ settings │  │
│   └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────┐
│  1. User Login → Centralized Auth           │
│     (Landlord Database - users table)       │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│  2. Tenant Context Resolution               │
│     Query: tenant_user → Get Tenant + Role  │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│  3. Token Generation (Laravel Sanctum)      │
│     Claims: user_id, tenant_id, role        │
└─────────────────────┬───────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│  4. Database Schema Switching               │
│     Middleware: Switch to tenant schema     │
└─────────────────────────────────────────────┘
```

### Domain-Driven Design Principles

**Ubiquitous Language:**
- `PurchaseOrder` (bukan "Order")
- `VendorNegotiation` (bukan "Quote Request")
- `PriceCalculator` service
- `OrderStatus` enum dengan business-meaningful states

**Bounded Contexts:**
- Order Management
- Product Catalog
- Vendor Management
- Customer Management
- Financial/Accounting
- Theme Engine
- User Management

---

## 📦 Technology Stack

### Backend Framework

**Laravel 10** - Selected based on comprehensive analysis

**Why Laravel over Node.js/NestJS?**

✅ **Multi-Tenancy Proven**
- `spatie/laravel-multitenancy` industry standard
- Schema-per-tenant pattern mature
- Automatic tenant context switching
- Tenant data leakage prevention

✅ **Faster MVP Development**
- Laravel conventions reduce decision-making
- Built-in auth, authorization, validation
- Eloquent ORM superior untuk complex relationships
- Rich ecosystem

✅ **Mobile API Excellence**
- Laravel Sanctum: simple, secure token auth
- API Resources: standardized responses
- Built-in rate limiting
- CORS handling straightforward

✅ **Business Logic Complexity**
- E-commerce dengan complex PO workflow
- Multiple payment methods
- Vendor management & negotiation
- Eloquent relationships sangat membantu

### Backend Technology

```yaml
Framework: Laravel 10
Architecture: Hexagonal (Ports & Adapters)
Language: PHP 8.1+
Database: PostgreSQL 15+
ORM: Eloquent
Authentication: Laravel Sanctum
Multi-tenancy: spatie/laravel-multitenancy
Permissions: spatie/laravel-permission
Cache: Redis 7+
Queue: Redis / Amazon SQS
Search: MeiliSearch
API Documentation: Modular OpenAPI 3.0
```

### Frontend Web

```yaml
Framework: React 18.3.1 with TypeScript 5.5
Build Tool: Vite
Styling: Tailwind CSS 3.4
UI Components: shadcn-ui (Radix UI)
State Management: Redux Toolkit + Zustand
Code Editor: Monaco Editor (@monaco-editor/react)
3D Graphics: Three.js + React Three Fiber
Form Handling: React Hook Form + Zod
Routing: React Router DOM
Icons: Lucide React
Data Visualization: Recharts
File Export: xlsx, jspdf, file-saver
```

### Frontend Mobile (Planned)

```yaml
Framework: React Native (iOS + Android)
Alternative: Flutter
State: Redux Toolkit
API: Axios
Auth: Laravel Sanctum tokens
Push Notifications: Firebase
```

### Infrastructure

```yaml
Web Server: Nginx
Application Server: PHP-FPM / Laravel Octane
File Storage: Amazon S3 / MinIO
CDN: CloudFlare
Monitoring: Laravel Telescope + Sentry
Analytics: Plausible / Matomo (self-hosted)
CI/CD: GitHub Actions
Containerization: Docker + Docker Compose
```

---

## 🌟 Core Features

### 1. Dynamic Theme Engine

**Theme Code Editor (Simple Mode):**
- Monaco Editor integration dengan 30+ features
- File Tree Explorer dengan drag & drop
- Advanced editor features:
  - Line wrapping, code folding, multiple cursors
  - Go to Line (Ctrl+G), Toggle Comment (Ctrl+/)
  - IntelliSense autocomplete
  - Bracket colorization
- Light/Dark theme switcher
- Font zoom controls (12px-24px)
- Live preview dengan real-time updates

**Theme Advanced Editor:**
- Horizontal split layout (Code + Preview)
- Multi-tab interface:
  - **Code Editor**: Full Monaco dengan file tree
  - **Visual Editor**: WYSIWYG (future)
  - **Version Control**: Git-like diff viewer
  - **Settings**: Theme configuration
- Live Preview enhancements:
  - Device modes (Desktop/Tablet/Mobile)
  - Zoom controls (50%-200%)
  - Fullscreen toggle

**Theme Management Dashboard:**
- Theme marketplace
- Package & export system (ZIP)
- Upload & validation
- Version management dengan rollback
- Theme customization interface

### 2. Multi-Tenant Management

**Landlord (Platform) Level:**
- Super Admin dashboard
- Tenant provisioning automation
- Global user management
- Theme management
- Billing & subscriptions

**Tenant Level:**
- Isolated admin panel
- Configuration-driven logic via `settings` table
- Custom fields (JSONB columns)
- Workflow customization per tenant

### 3. Content Management

- **Page Builder**: Visual editor untuk public pages
- **Product Management**: 
  - CRUD dengan image gallery
  - 3D model viewer (Three.js)
  - Category & tag management
  - Custom attributes per tenant
- **Media Library**: Upload, crop, resize
- **Review System**: Customer reviews dengan ratings

### 4. E-Commerce Foundation

- Shopping cart (Context-based state)
- Order management workflow
- Customer database dengan history
- Vendor management dengan specializations
- Inventory tracking & alerts

### 5. Admin Panel

**Dashboard:**
- Analytics widgets
- Recent activity feed
- Quick actions
- Performance metrics

**Order Processing:**
- Advanced filtering
- Status tracking
- Invoice generation
- Payment verification
- Shipping integration

**Financial Reports:**
- Revenue tracking
- Profit margin analysis
- Payment history
- Export Excel/PDF

**Settings:**
- Email templates (customizable)
- SMTP configuration
- Payment gateway integration
- SMS gateway
- Multi-language support
- Multi-currency with exchange rates

---

## 📋 Development Plan

### Phase 1: Purchase Order Workflow (Planning)

**1. Customer Order Submission**
- Dynamic form dengan custom fields
- File upload untuk design
- Auto-generated order code

**2. Production Type Selection**
- Internal production (future)
- Vendor production (current)

**3. Vendor Sourcing & Negotiation**
- Vendor matching by specializations
- Multi-vendor quotation
- Price negotiation tracking

**4. Customer Quotation**
- Auto markup calculation
- PPN/Tax handling
- Multiple quote versions

**5. Payment Processing**
- DP/Full payment options
- Multiple methods: Cash, Transfer, Gateway
- Payment verification workflow

**6. Production Monitoring**
- Status tracking (Designing → QC)
- Vendor communication log
- Estimated completion updates

**7. Final Payment & Delivery**
- Remaining payment collection
- Shipping with tracking
- Auto notifications

**8. Order Completion**
- Customer review request
- Profitability reporting
- Transaction archival

### Phase 2: Internal Production (Future)

- Workshop management
- Material inventory
- Production scheduling
- Machine/workstation management
- Labor cost calculation
- Quality control workflow

### Phase 3: Advanced Multi-Tenant Features (Future)

- Tenant marketplace
- REST API access
- Webhook system
- Advanced analytics & BI
- Mobile app (React Native)

### Phase 4: Platform Expansion (Future)

- Multiple business types
- White-label solutions
- Franchise management
- B2B vendor portal

---

## 🔄 Multi-Tenancy Strategy

### Recommended Model: **Hybrid SaaS-Platform**

#### Primary: SaaS Multi-Tenant (80% market)

**Target:** SME & Startups

**Architecture:**
```
Platform: stencil.com
Tenants:
  - tenant1.stencil.com (PT CEX)
  - tenant2.stencil.com (PT ABC)
  - customdomain.com → Tenant mapping
```

**Pricing Tiers:**
```yaml
Starter: $29/month
  - 1 subdomain
  - 100 orders/month
  - 5 admin users
  - Basic themes

Business: $79/month
  - Custom domain
  - 1000 orders/month
  - Unlimited users
  - Premium themes

Enterprise: $299/month
  - Multiple domains
  - Unlimited orders
  - White-label option
  - SLA guarantee
```

#### Secondary: Self-Hosted Enterprise (20% market)

**Target:** Large enterprises, regulated industries

**Pricing:**
```yaml
Enterprise License: $5,000 one-time
  - Unlimited installations
  - 1 year support
  - Source code access

White-Label: $15,000 one-time
  - Remove branding
  - Lifetime updates
  - Dedicated support
```

### Data Isolation Strategy

**SaaS:**
- Automatic tenant scoping
- Middleware validation
- Query logging untuk audit
- Tenant-specific encryption

**Self-Hosted:**
- Complete database isolation
- No network connections
- Client-managed security

### Role & Permission Architecture

**Platform Level (Landlord):**
- Super Admin (CanvaStack team)
- Tenant Owner (business owners)

**Tenant Level:**
- Admin (full access)
- Manager (order, customer, vendor management)
- Staff (order processing, limited access)
- Customer (public access)

**Implementation:**
- Spatie Laravel Permission
- Permission-based menu visibility
- Role-based feature access
- Granular permission control

---

## ⚡ Enhancement Features

### Priority 1: Menu Management (Months 1-2) ✅ CRITICAL

**Features:**
- Drag & Drop menu builder
- Nested menus (unlimited depth)
- Admin & public menu separation
- Permission-based visibility
- Custom URLs, internal/external links
- Icon selection untuk admin
- Active/inactive toggle

**Technical:**
- Database: `menus`, `menu_items` tables
- Backend: Laravel API endpoints
- Frontend: react-beautiful-dnd
- Redis caching

### Priority 2: Package Management (Months 3-5) ✅ HIGH

**Package Types:**
- Business Modules (Finance, Inventory, POS)
- Payment Gateways (Midtrans, Xendit, Stripe)
- Communication (SMS, Email, WhatsApp)
- Themes & UI Extensions

**Architecture:**
- Modular self-contained structure
- Hook system (events & listeners)
- Dependency management
- Version control
- Auto-update capability

**Marketplace:**
- Package discovery & search
- Ratings & reviews
- Install/update/uninstall flows
- License validation integration

### Priority 3: License Management (Month 6) ✅ HIGH

**License Types:**
- Trial (14-30 days)
- Standard (single domain)
- Professional (up to 5 domains)
- Enterprise (unlimited)

**Features:**
- License key generation
- Activation tracking
- Domain validation
- Feature flag system
- Expiration handling
- Grace period management

### Priority 4: Dynamic Content Editor (Months 7-8) ✅ MEDIUM

**GrapesJS Integration:**
- Visual drag & drop builder
- Custom component library
- Responsive design tools
- Custom CSS/HTML support
- Template library
- Revision system
- Preview modes

---

## 🗓️ Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Month 1:**
- ✅ React frontend foundation
- ✅ Theme engine system
- 🔄 Laravel backend setup
- 🔄 Database schema design
- 🔄 Authentication implementation

**Month 2:**
- Menu Management system
- Basic API endpoints
- Admin dashboard foundation
- Multi-tenant middleware

**Month 3:**
- User & role management
- Permission system
- Settings management
- Testing framework

### Phase 2: Enhancement Features (Months 4-8)

**Months 4-5:**
- Package Management system
- Package marketplace
- First official packages
- Hook system

**Month 6:**
- License Management
- License validation service
- Activation tracking
- Feature flags

**Months 7-8:**
- Dynamic Content Editor
- GrapesJS integration
- Component library
- Template system

### Phase 3: Business Features (Months 9-11)

**Month 9:**
- Purchase Order workflow
- Vendor management
- Customer management

**Month 10:**
- Payment integration
- Invoice system
- Financial reporting

**Month 11:**
- Email automation
- SMS integration
- Production monitoring

### Phase 4: Launch & Growth (Month 12+)

**Month 12:**
- Production deployment
- Performance optimization
- Security audit
- Beta testing

**Beyond:**
- Mobile app development
- Advanced analytics
- Platform expansion
- Community building

---

## 📁 Project Structure

### Backend (Laravel - Hexagonal)

```
app/
├── Application/             # Use Cases / Application Services
│   ├── Order/
│   │   ├── Command/         # Write operation DTOs
│   │   ├── Query/           # Read operation DTOs
│   │   └── UseCase/
│   │       ├── CreatePurchaseOrderUseCase.php
│   │       ├── NegotiateWithVendorUseCase.php
│   │       └── VerifyCustomerPaymentUseCase.php
│   ├── Product/
│   ├── Customer/
│   └── Vendor/
├── Domain/                   # Core Business Logic
│   ├── Order/
│   │   ├── Entity/
│   │   │   └── PurchaseOrder.php
│   │   ├── Enum/
│   │   │   └── OrderStatus.php
│   │   ├── Repository/      # Interfaces (Ports)
│   │   │   └── PurchaseOrderRepositoryInterface.php
│   │   └── Service/         # Domain Services
│   │       └── PriceCalculatorService.php
│   ├── Product/
│   ├── Customer/
│   └── Vendor/
├── Infrastructure/           # Technical Implementations
│   ├── Persistence/
│   │   └── Eloquent/
│   │       ├── Model/
│   │       └── Repository/
│   ├── Adapters/
│   │   ├── Mail/
│   │   ├── PaymentGateway/
│   │   └── VendorAPI/
│   └── Presentation/
│       ├── Http/Controllers/
│       └── Console/Commands/
└── Providers/
    └── AppServiceProvider.php  # DI Container Bindings
```

### Frontend (React + TypeScript)

```
src/
├── components/              # Reusable UI Components
│   ├── ui/                  # Atomic Components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Dialog.tsx
│   ├── admin/               # Admin-specific
│   │   ├── AdminLayout.tsx
│   │   ├── FileTreeExplorer.tsx
│   │   ├── CodeEditor.tsx
│   │   └── ThemeCodeEditor.tsx
│   └── ...
├── pages/                   # Page Components
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── ProductList.tsx
│   │   ├── ThemeCodeEditor.tsx
│   │   └── Settings.tsx
│   ├── Home.tsx
│   └── Products.tsx
├── contexts/                # React Contexts
│   ├── CartContext.tsx
│   └── ContentContext.tsx
├── stores/                  # Redux/Zustand Stores
│   └── adminStore.ts
├── themes/                  # Dynamic Theme System
│   ├── default/
│   └── etching/
├── core/                    # Core Engine
│   └── engine/
└── lib/                     # Utilities
    └── utils.ts
```

---

## 📊 Current Status

### Version: 2.0.0-alpha (November 7, 2025)

**Completed:** ✅
- Theme Engine System (Code Editor, Advanced Editor)
- Theme Dashboard (Marketplace, Upload, Export)
- Admin Panel Foundation
- Public Frontend (Home, Products, Detail, About, Contact, FAQ)
- FileTreeExplorer dengan Drag & Drop
- Monaco Editor integration
- LivePreview dengan device modes & zoom

**In Progress:** 🔄
- Backend Laravel 10 setup
- PostgreSQL multi-tenant implementation
- Purchase Order workflow planning
- API endpoint design

**Next Steps:** ⏳
- Database schema implementation
- Authentication & authorization
- Vendor management system
- Payment integration
- Menu Management system

### Recent Updates (2.0.0-alpha)

**Theme Engine Phase 5+:**
- FileTreeExplorer: Expand/collapse all, refresh, drag & drop reordering, resizable width
- Monaco Editor: 30+ configuration options, IntelliSense, code folding
- ThemeCodeEditor: Complete rebuild dengan responsive layout
- ThemeAdvancedEditor: Horizontal split layout
- LivePreview: Device switcher, zoom controls, fullscreen mode
- **Critical Bug Fix**: Unlimited loading spinner pada device switch

**Build Performance:**
- Total modules: 3,144
- Build time: 64 seconds
- Theme Code Editor chunk: 91.24 KB (26.99 KB gzipped)
- Total CSS: 101.12 KB (16.92 KB gzipped)

---

## 📚 Documentation Index

### Core Documentation

1. **[README.md](README.md)**
   - Platform overview
   - Features & capabilities
   - Installation guide
   - Technology stack

2. **[CHANGELOG.md](CHANGELOG.md)**
   - Version history
   - Release notes
   - Breaking changes
   - Migration guides

### Business & Architecture Planning

3. **[BUSINESS_CYCLE_PLAN.md](docs/DEVELOPMENTS/BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN/BUSINESS_CYCLE_PLAN.md)**
   - Complete business flow
   - PT CEX etching business model
   - Order workflow dari customer ke vendor
   - Payment & production process
   - Scalability scenarios

4. **[HEXAGONAL_AND_ARCHITECTURE_PLAN.md](docs/DEVELOPMENTS/BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN/HEXAGONAL_AND_ARCHITECTURE_PLAN.md)**
   - Hexagonal Architecture explanation
   - Domain-Driven Design principles
   - Project structure planning
   - Use case definitions
   - AI development prompt (comprehensive)

### Comprehensive Analysis Documents

5. **[INDEX_COMPREHENSIVE_ANALYSIS.md](docs/DEVELOPMENTS/PLAN/INDEX_COMPREHENSIVE_ANALYSIS.md)**
   - Document overview & navigation
   - Reading guide per role
   - Key decisions summary
   - Implementation status

6. **[1_BACKEND_TECHNOLOGY_ANALYSIS.md](docs/DEVELOPMENTS/PLAN/1_BACKEND_TECHNOLOGY_ANALYSIS.md)**
   - Laravel vs Node.js vs NestJS comparison
   - Mobile API scalability analysis
   - Performance considerations
   - Technology justification
   - Mobile development strategy

7. **[2_MULTI_TENANCY_ARCHITECTURE_SAAS_VS_PAAS.md](docs/DEVELOPMENTS/PLAN/2_MULTI_TENANCY_ARCHITECTURE_SAAS_VS_PAAS.md)**
   - SaaS Model (Centralized Multi-Tenant)
   - PaaS Model (Self-Hosted)
   - WordPress comparison
   - Data isolation strategies
   - Role & permission architecture
   - Pricing models

8. **[3_ENHANCEMENT_FEATURES_IMPLEMENTATION.md](docs/DEVELOPMENTS/PLAN/3_ENHANCEMENT_FEATURES_IMPLEMENTATION.md)**
   - Menu Management System (detailed specs)
   - Package Management (WordPress-like plugins)
   - License Management
   - Dynamic Content Editor (Elementor-like)
   - Database schemas
   - API designs
   - Implementation guides

9. **[4_COMPREHENSIVE_RECOMMENDATIONS_AND_ROADMAP.md](docs/DEVELOPMENTS/PLAN/4_COMPREHENSIVE_RECOMMENDATIONS_AND_ROADMAP.md)**
   - Executive summary
   - Final technology stack
   - 12-month implementation roadmap
   - Business decisions checklist
   - Risk mitigation strategies
   - Success metrics & KPIs

### Quick Reference

**For Product Owners:**
- Start with Document 4 (Comprehensive Recommendations)
- Read Document 2 (Multi-Tenancy Architecture)
- Review pricing strategy & timeline

**For Technical Leads:**
- Read all documents in order (1→2→3→4)
- Focus on architecture & scalability sections

**For Developers:**
- Focus on Document 3 (Enhancement Features)
- Reference Document 1 (Backend Technology)
- Follow roadmap in Document 4

**For QA Engineers:**
- Review success metrics in Document 4
- Security testing in Document 2
- Test scenarios in Document 3

---

## 🎯 Key Differentiators

### vs WordPress
- **Type-safe**: Full TypeScript/PHP type safety
- **Modern Stack**: React + Laravel vs PHP templating
- **True Multi-tenancy**: Database isolation vs shared tables
- **Hexagonal Architecture**: Clean separation vs monolithic

### vs Shopify
- **Open Source**: Full code ownership
- **Unlimited Customization**: No platform restrictions
- **Multi-business Support**: Not just e-commerce
- **Self-hosted Option**: Complete data control

### vs Custom Development
- **Pre-built Foundation**: 80% platform ready
- **Best Practices**: Enterprise architecture included
- **Scalable from Day 1**: Multi-tenant ready
- **Active Development**: Continuous improvements

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- PHP 8.1+
- Composer
- Git

### Installation

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd stencil

# Frontend Setup
npm install
npm run dev

# Backend Setup (when available)
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

**Code Standards:**
- Hexagonal Architecture principles
- Test-Driven Development (TDD)
- TypeScript strict mode
- PSR-12 untuk PHP
- Semantic commit messages

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

- [CanvaStack Documentation](https://docs.canvastack.com)
- [Discord Community](https://discord.com/channels/#)
- [Project URL](https://stencil.canvastack.com/)

---

## 🙏 Acknowledgments

- [shadcn-ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling system
- [Laravel](https://laravel.com/) - Backend framework
- [Spatie](https://spatie.be/) - Multi-tenancy packages
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Lucide](https://lucide.dev/) - Icon system

---

**Built with ❤️ by CanvaStack Team**

**Platform Status**: 🚧 **In Active Development** 🚧

**Current Phase**: Theme Engine Complete ✅ | Order Workflow Planning 📋 | Backend Integration 🔄

---

*Last Generated: November 7, 2025*
*Repository Documentation Version: 1.0*
