# CanvaStack - Stencil: Multi-Tenant CMS Platform

[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)](https://tailwindcss.com/)
[![Laravel](https://img.shields.io/badge/Laravel-10-red)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)

**CanvaStencil** adalah platform Content Management System (CMS) multi-tenant yang dikembangkan oleh **CanvaStack** berbasis WordPress-like architecture yang dirancang untuk mendukung multiple bisnis dengan data, konfigurasi, dan tampilan yang terisolasi. Platform ini menggunakan **Hexagonal Architecture** dan **Domain-Driven Design (DDD)** untuk memastikan skalabilitas, maintainability, dan fleksibilitas tingkat enterprise.

## 🎯 Platform Vision

Platform ini dibangun dengan visi untuk menyediakan infrastruktur SaaS yang memungkinkan setiap tenant (unit bisnis) untuk beroperasi secara independen dengan:
- **Isolated Data**: Setiap tenant memiliki schema database tersendiri
- **Custom Themes**: Dynamic theming engine dengan visual editor
- **Flexible Configuration**: Business logic yang dapat dikonfigurasi tanpa perubahan kode
- **Scalable Architecture**: Hexagonal architecture untuk easy integration dan expansion

**Current Focus Tenant**: PT Custom Etching Xenial (PT CEX) - Platform etching berkualitas tinggi untuk logam, kaca, dan plakat penghargaan.

---

## 🏗️ Platform Architecture

### **Multi-Tenant Architecture**

Platform mengimplementasikan **Schema per Tenant** approach menggunakan PostgreSQL:

```
┌─────────────────────────────────────────────┐
│           LANDLORD DATABASE                 │
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

### **Hexagonal Architecture (Ports & Adapters)**

Backend menggunakan clean separation antara domain logic dan infrastructure:

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

### **Authentication & Authorization**

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

---

## 🌟 Core Platform Features

### **1. Dynamic Theme Engine**

Platform menyediakan comprehensive theming system yang memungkinkan setiap tenant untuk memiliki tampilan unik:

#### **Theme Code Editor (Simple Mode)**
- **Monaco Editor Integration**: Full-featured code editor dengan syntax highlighting
- **File Tree Explorer**: 
  - Hierarchical file navigation dengan expand/collapse all
  - Drag & drop file reordering
  - Desktop file upload via drag & drop
  - Resizable width adjuster (200px-600px)
- **Advanced Editor Features**:
  - Line wrapping, code folding, multiple cursors
  - Go to Line (Ctrl+G), Toggle Comment (Ctrl+/)
  - IntelliSense autocomplete dengan bracket colorization
  - Quick suggestions dan auto-formatting
- **Theme Selection**: Light/Dark mode switcher
- **Font Controls**: Zoom in/out untuk code readability
- **Live Preview**: Real-time theme preview dengan device switching

#### **Theme Advanced Editor**
- **Horizontal Split Layout**: Code editor (top) + Live preview (bottom)
- **Multi-tab Interface**:
  - Code Editor: Full Monaco editor dengan file tree
  - Visual Editor: WYSIWYG interface untuk non-technical users
  - Version Control: Git-like version history dengan diff viewer
  - Settings: Theme configuration dan metadata
- **Live Preview Enhancements**:
  - Device mode switcher (Desktop/Tablet/Mobile) dengan responsive dimensions
  - Zoom controls (50%-200%) dengan reset view
  - Fullscreen toggle untuk immersive preview
  - Auto-adjusting height based on mode
  - Optimized loading states dengan 300ms transition

#### **Theme Management Dashboard**
- Theme marketplace untuk browse & install themes
- Theme packaging & export system (ZIP dengan metadata)
- Theme upload & validation
- Version management dengan rollback capability
- Theme customization interface

### **2. Multi-Tenant Management**

#### **Landlord (Platform) Level**
- **Super Admin Dashboard**: Manage all tenants from single interface
- **Tenant Provisioning**: 
  - Automatic schema creation
  - Theme assignment
  - Domain configuration
  - Migration execution per tenant
- **User Management**: Global user management dengan tenant assignment
- **Theme Management**: Create, update, delete platform themes

#### **Tenant Level**
- **Isolated Admin Panel**: Each tenant has dedicated admin interface
- **Configuration-Driven Logic**: Business rules defined via `settings` table
- **Custom Fields**: Dynamic form fields stored in JSONB columns
- **Workflow Customization**: Status transitions configured per tenant

### **3. Content Management**

- **Page Builder**: Visual editor untuk homepage, about, contact, FAQ
- **Product Management**: 
  - CRUD operations dengan image gallery
  - 3D model viewer integration (Three.js)
  - Category & tag management
  - Custom attributes per tenant
- **Media Library**: Centralized asset management dengan upload, crop, resize
- **Review System**: Customer reviews dengan sorting, rating distribution

### **4. E-Commerce Foundation**

- **Shopping Cart**: Context-based state management
- **Order Management**: Complete purchase order workflow
- **Customer Management**: Customer database dengan order history
- **Vendor Management**: Vendor directory dengan specializations
- **Inventory System**: Stock tracking dan alerts

### **5. Admin Panel Features**

#### **Dashboard**
- Analytics widgets (orders, revenue, customers)
- Recent activity feed
- Quick action shortcuts
- Performance metrics

#### **Content Management**
- Page management untuk all public pages
- WYSIWYG editor dengan media insertion
- SEO metadata per page
- Multilingual support

#### **Order Processing**
- Order list dengan advanced filtering
- Order detail dengan status tracking
- Invoice generation
- Payment verification
- Shipping integration

#### **Financial Reports**
- Revenue tracking
- Profit margin analysis (vendor price vs customer price)
- Payment history
- Export to Excel/PDF

#### **Settings**
- **Email Templates**: Customizable transactional emails
- **SMTP Configuration**: Email gateway settings
- **Payment Gateway**: Integration dengan Midtrans, Xendit, etc.
- **SMS Gateway**: Notification via SMS
- **Language Settings**: Multi-language support
- **Currency Settings**: Multi-currency dengan exchange rates
- **Notification Settings**: Email/SMS/Push preferences

---

## 📦 Technology Stack

### **Backend**
- **Framework**: Laravel 10
- **Database**: PostgreSQL 15+
- **ORM**: Eloquent
- **Authentication**: Laravel Sanctum
- **Multi-tenancy**: spatie/laravel-multitenancy
- **Permissions**: spatie/laravel-permission
- **API Documentation**: Modular OpenAPI 3.0

### **Frontend**
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn-ui (Radix UI)
- **State Management**: Redux Toolkit + Zustand
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **3D Graphics**: Three.js + React Three Fiber
- **Form Handling**: React Hook Form + Zod
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **File Export**: xlsx, jspdf, file-saver

---

## 🚀 Project Structure

### **Backend Structure (Laravel Hexagonal)**

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

### **Frontend Structure (React + TypeScript)**

```
src/
├── components/              # Reusable UI Components
│   ├── ui/                  # Atomic Components (Single Source)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   └── Dialog.tsx
│   ├── admin/               # Admin-specific components
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── FileTreeExplorer.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── LivePreview.tsx
│   │   └── ThemeCodeEditor.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── pages/                   # Page Components
│   ├── admin/
│   │   ├── Dashboard.tsx
│   │   ├── ProductList.tsx
│   │   ├── OrderManagement.tsx
│   │   ├── ThemeDashboard.tsx
│   │   ├── ThemeCodeEditor.tsx
│   │   ├── ThemeAdvancedEditor.tsx
│   │   └── Settings.tsx
│   ├── Home.tsx
│   ├── Products.tsx
│   ├── ProductDetail.tsx
│   └── ...
├── contexts/                # React Contexts
│   ├── CartContext.tsx
│   ├── ContentContext.tsx
│   └── LanguageContext.tsx
├── stores/                  # Redux/Zustand Stores
│   └── adminStore.ts
├── themes/                  # Dynamic Theme System
│   ├── default/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── styles.css
│   │   └── config.json
│   └── etching/            # PT CEX Theme
│       └── ...
├── core/                    # Core Engine
│   └── engine/
│       └── utils/
│           └── themeFileScanner.ts
└── lib/                     # Utilities & Helpers
    ├── utils.ts
    └── constants.ts
```

---

## 🎯 Current Development Status

### **Phase 5: System Administration Group** (91% Complete)
- ✅ **Financial Management System** - OpenAPI schema completed (120+ fields, 23 operations, audit trails)
- ✅ **OpenAPI Security Enhancement** - Production-ready security posture achieved
  - **Overall Security Score**: 91/100 (112% improvement from 43/100)
  - **OWASP Compliance**: 80/100 (220% improvement from 25/100)
  - **Authentication Security**: 100/100 (maintained perfect score)
  - **Multi-Tenant Isolation**: 100% compliance with proper tenant parameter implementation
  - **Sensitive Data Protection**: Comprehensive encryption markers and PII protection
- 🔄 **Settings Management System** - In Progress (85+ fields, hierarchical configuration)
- 📋 **Plugin System Architecture** - Planned (extensibility foundation)

### **Completed Phases (100%)**
- ✅ **Phase 1**: Foundation Setup - Project structure, base schemas
- ✅ **Phase 2**: Content Management - Homepage, About, Contact, FAQ, SEO  
- ✅ **Phase 3**: E-commerce Group - Orders, Products, Inventory, Reviews
- ✅ **Phase 4**: User Management - Users, RBAC, Customers, Vendors, Suppliers

### **🔧 Development Automation & Security System**
Platform equipped with **automated progress tracking** and **production-ready security**:
- **`.zencoder/update-progress.js`** - Automated progress update tool
- **`.zencoder/rules`** - Comprehensive development guidelines  
- **`.zencoder/context.md`** - Real-time project status tracking
- **`.zencoder/development-phases.md`** - Phase-based development roadmap
- **`security-audit.cjs`** - Advanced security validation system

**Security Features:**
- **91/100 Overall Security Score** - Production-ready security posture
- **98% OpenAPI Validation Success** (48/49 files) - Enterprise-grade schema compliance
- **100% Multi-Tenant Isolation** - Zero cross-tenant data leakage
- **Advanced Threat Detection** - OWASP Top 10 compliance with refined patterns

**Usage:** `node .zencoder/update-progress.js "Module Name" "completed" "Implementation details"`

---

## 📋 Planned Features (Roadmap)

### **Phase 6-10: Backend & Integration** (Planning)

Platform akan mengimplementasikan complete purchase order workflow untuk bisnis makelar:

1. **Customer Order Submission**
   - Dynamic form dengan custom fields per tenant
   - File upload untuk design
   - Auto-generated order code
   
2. **Production Type Selection**
   - Internal production (future)
   - Vendor production (current focus)
   
3. **Vendor Sourcing & Negotiation**
   - Vendor matching berdasarkan specializations
   - Multi-vendor quotation
   - Price negotiation tracking
   
4. **Customer Quotation**
   - Auto markup calculation
   - PPN/Tax handling
   - Multiple quote versions
   
5. **Payment Processing**
   - Down payment (DP) flow
   - Full payment option
   - Multiple payment methods: Cash, Bank Transfer, Payment Gateway
   - Payment verification workflow
   
6. **Production Monitoring**
   - Status tracking (Designing, Etching, Finishing, QC)
   - Vendor communication log
   - Estimated completion date updates
   
7. **Final Payment & Delivery**
   - Remaining payment collection
   - Shipping integration dengan tracking number
   - Auto email notification
   
8. **Order Completion**
   - Customer review request
   - Profitability report (customer price - vendor price)
   - Transaction archival

### **Phase 2: Internal Production Management** (Future)

- Workshop management system
- Material inventory tracking
- Production scheduling & queue
- Machine/workstation management
- Labor cost calculation
- Quality control workflow

### **Phase 3: Advanced Multi-Tenant Features** (Future)

- **Tenant Marketplace**: Allow tenants to sell to each other
- **API Access**: REST API untuk third-party integrations
- **Webhook System**: Real-time event notifications
- **Advanced Analytics**: BI dashboards dengan custom reports
- **Mobile App**: React Native companion app

### **Phase 4: Platform Expansion** (Future)

- **Multiple Business Types**: Percetakan, Konveksi, Jasa Lainnya
- **White Label**: Custom branding per tenant
- **Franchise Management**: Parent-child tenant relationships
- **B2B Portal**: Vendor/supplier self-service portal

---

## 🔧 Configuration & Setup

### **Prerequisites**
- Node.js 18+ dan npm
- PostgreSQL 15+
- PHP 8.1+ (Laravel 10)
- Composer
- Git

### **Installation**

```bash
# Clone repository
git clone <YOUR_GIT_URL>
cd canvastack-cms

# Frontend Setup
cd design/theme/default
npm install

# Backend Setup (when available)
cd ../../../backend
composer install
cp .env.example .env
php artisan key:generate

# Database Setup
php artisan migrate --seed

# Run Development Servers
npm run dev          # Frontend (port 8080)
php artisan serve    # Backend (port 8000)
```

### **Build untuk Production**

```bash
# Frontend Build
npm run build

# Preview Production Build
npm run preview
```

---

## 🎨 Design System

### **Color Tokens (HSL Format)**
Semua warna menggunakan semantic tokens dari `index.css`:
- `--primary`: Orange (#FFA500) - Brand color
- `--secondary`: Secondary brand color
- `--accent`: Accent highlights
- `--background`: Main background
- `--foreground`: Main text
- `--card`: Card backgrounds
- `--muted`: Subtle elements

### **Typography**
- **Headings**: font-bold dengan responsive sizing
- **Body**: font-normal dengan optimal line-height
- **Code**: font-mono untuk technical content

### **Responsive Breakpoints**
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

## 📚 API Documentation

API documentation menggunakan **Modular OpenAPI 3.0** structure:

```
docs/openapi/
├── openapi.yaml              # Main file dengan references
├── paths/                    # Endpoint definitions
│   ├── products.yaml
│   ├── orders.yaml
│   ├── admin/
│   │   ├── users.yaml
│   │   └── tenants.yaml
│   └── ...
├── components/
│   ├── schemas/             # Data models (DTOs)
│   │   ├── Product.yaml
│   │   ├── Order.yaml
│   │   └── Customer.yaml
│   ├── responses/           # Standard responses
│   ├── parameters/          # Reusable parameters
│   └── securitySchemes/     # Auth schemes
└── tags.yaml                # API grouping tags
```

**Key API Endpoints** (Planned):
- `POST /api/orders` - Create purchase order
- `GET /api/products` - List products
- `POST /api/admin/orders/{id}/assign-vendor` - Vendor assignment
- `POST /api/admin/orders/{id}/quote` - Create quotation
- `POST /api/admin/payments/verify` - Payment verification

---

## 🧪 Testing Strategy

```bash
# Backend Tests (Laravel)
php artisan test                    # All tests
php artisan test --filter=OrderTest # Specific tests

# Frontend Tests (Future)
npm run test                        # Unit tests
npm run test:e2e                    # E2E tests
```

---

## 🌐 Deployment

### **Docker Deployment** (Recommended)
```yaml
# docker-compose.yml structure
services:
  app:        # Laravel application
  frontend:   # React application
  postgres:   # PostgreSQL database
  redis:      # Caching & queues
  nginx:      # Web server
```

### **Manual Deployment**
1. Build frontend: `npm run build`
2. Deploy `dist` folder to web server
3. Configure Laravel on production server
4. Setup PostgreSQL database
5. Run migrations per tenant
6. Configure domain/subdomain routing

---

## 📄 Documentation Links

Dokumentasi lengkap tersedia di folder `/docs`:
- [Business Cycle Plan](docs/DEVELOPMENTS/BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN/BUSINESS_CYCLE_PLAN.md)
- [Hexagonal Architecture Plan](docs/DEVELOPMENTS/BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN/HEXAGONAL_AND_ARCHITECTURE_PLAN.md)

---

## 🔄 Changelog

Lihat [CHANGELOG.md](CHANGELOG.md) untuk history perubahan lengkap.

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

**Code Standards**:
- Follow Hexagonal Architecture principles
- Write tests untuk semua business logic
- Use TypeScript strict mode
- Follow PSR-12 untuk PHP code
- Use semantic commit messages

---

## 📄 License

Project ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail.

---

## 🆘 Support

- [CanvaStack Documentation](https://docs.canvastack.com)
- [CanvaStack Discord Community](https://discord.com/channels/#)
- [Project URL](https://stencil.canvastack.com/)

---

## 🙏 Acknowledgments

- [shadcn-ui](https://ui.shadcn.com/) untuk UI components
- [Tailwind CSS](https://tailwindcss.com/) untuk styling system
- [Laravel](https://laravel.com/) untuk backend framework
- [Spatie](https://spatie.be/) untuk multi-tenancy packages
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) untuk code editor
- [Lucide](https://lucide.dev/) untuk icon system

---

## 🎯 Key Differentiators

### **vs WordPress**
- **Type-safe**: Full TypeScript/PHP type safety
- **Modern Stack**: React + Laravel vs PHP templating
- **True Multi-tenancy**: Database isolation vs shared tables
- **Hexagonal Architecture**: Clean separation vs monolithic

### **vs Shopify**
- **Open Source**: Full code ownership
- **Unlimited Customization**: No platform restrictions
- **Multi-business Support**: Not just e-commerce
- **Self-hosted Option**: Complete data control

### **vs Custom Development**
- **Pre-built Foundation**: 80% platform ready
- **Best Practices**: Enterprise architecture included
- **Scalable from Day 1**: Multi-tenant ready
- **Active Development**: Continuous improvements

---

**Platform Status**: 🚧 **In Active Development** 🚧

**Current Phase**: Theme Engine Complete ✅ | Order Workflow Planning 📋 | Backend Integration 🔄


---

**Built with ❤️ by CanvaStack Team**

**Current Version**: 2.0.0-alpha (Multi-Tenant Architecture Implementation)