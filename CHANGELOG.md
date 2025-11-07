# Changelog

All notable changes to CanvaStack Multi-Tenant CMS Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planning
- Complete Purchase Order Workflow implementation
- Backend Laravel 10 integration dengan PostgreSQL
- Multi-tenant database architecture (Schema per Tenant)
- Authentication & Authorization dengan Laravel Sanctum
- Payment gateway integration (Midtrans, Xendit)
- Email notification system
- SMS gateway integration
- Vendor management portal

---

## [2.0.0-alpha] - 2025-11-07

### 🎯 Major: Multi-Tenant CMS Platform Architecture

Platform telah ditransformasi dari single-tenant application menjadi **WordPress-Like Multi-Tenant CMS Platform** dengan Hexagonal Architecture dan Domain-Driven Design.

#### Architecture Changes
- **Multi-Tenant Foundation**: Schema per Tenant approach menggunakan PostgreSQL
- **Hexagonal Architecture**: Clean separation antara Domain, Application, dan Infrastructure layers
- **Configuration-Driven Logic**: Business rules yang dapat dikustomisasi per tenant via `settings` table
- **Dynamic Theme Engine**: Theming system yang memungkinkan setiap tenant memiliki tampilan unik
- **Authentication System**: Centralized auth dengan tenant context resolution

### ✨ Added - Theme Engine Phase 5+ (Advanced Editor Enhancement)

#### **FileTreeExplorer Component**
- **Expand/Collapse All**: Batch operations untuk tree navigation efficiency
- **Refresh Button**: Manual tree refresh untuk sync dengan file system
- **Drag & Drop File Reordering**: Native HTML5 drag events dengan visual feedback
- **Drag & Drop Upload**: Desktop file upload via drag & drop ke tree explorer
- **Resizable Width Adjuster**: Dynamic panel resizing (200px-600px) dengan mouse event handling
- **forwardRef API**: Exposed imperative methods (expandAll, collapseAll, refresh) untuk parent control
- **Responsive Design**: Proper scrolling dengan nested scroll containers (overflow-hidden → overflow-y-auto)

#### **Theme Code Editor (Simple Mode) - Complete Rebuild**
- **Monaco Editor Integration**: Full-featured code editor dengan 30+ configuration options
  - Syntax highlighting untuk multiple languages
  - IntelliSense autocomplete dengan bracket pair colorization
  - Quick suggestions dan parameter hints
  - Auto-formatting (formatOnPaste, formatOnType)
  - Smooth scrolling dengan GPU acceleration
- **Advanced Editor Features**:
  - Line wrapping toggle dengan viewport-based soft wrapping
  - Code folding untuk collapsible code blocks
  - Multiple cursors & multi-line selections (Alt+Click)
  - Go to Line command (Ctrl+G)
  - Toggle Comment (Ctrl+/) untuk single/multi-line comments
  - Minimap untuk code navigation
  - Word wrap indicators
- **Theme Selection**: Light/Dark mode switcher dengan VS Code themes
- **Font Controls**: Zoom in/out (12px-24px) untuk code readability
- **Fullscreen Mode**: All features work properly dalam fullscreen mode
- **Layout Enhancement**: 
  - Responsive flex layout dengan proper height management
  - File explorer: `w-full lg:w-80` dengan resizable handle
  - Editor: `flex-1 overflow-hidden` untuk proper content containment

#### **Theme Advanced Editor - Layout Refactoring**
- **Horizontal Split Layout**: Code editor (top) + Live Preview (bottom)
  - Previous: Vertical split (editor left, preview right)
  - Current: Horizontal split dengan better screen real estate usage
- **Multi-tab Interface**: 4 tabs untuk comprehensive theme management
  1. **Code Editor Tab**: Full Monaco editor dengan FileTreeExplorer integration
  2. **Visual Editor Tab**: WYSIWYG interface (placeholder untuk future implementation)
  3. **Version Control Tab**: Git-like diff viewer dengan version history
  4. **Settings Tab**: Theme configuration dan metadata management
- **Responsive Controls**: All control buttons work seamlessly dalam horizontal layout
- **Height Optimization**: Dynamic height calculation untuk optimal viewing experience

#### **LivePreview Component - Major Enhancements**
- **Device Mode Switcher**: 
  - Desktop (100% width), Tablet (768px), Mobile (375px)
  - Responsive dimensions dengan CSS transform
  - Fixed unlimited loading bug saat switching devices (300ms setTimeout debounce)
- **Zoom Controls**: 
  - Range: 50% - 200% dengan 10% increments
  - CSS transform-based scaling (GPU-accelerated)
  - Reset view button untuk instant 100% zoom
  - Visual zoom indicator
- **Fullscreen Toggle**: 
  - Immersive preview mode
  - Proper height calculation: `calc(100vh - 300px)` untuk fullscreen
  - Maintained zoom level saat toggle
- **Dynamic Height Management**:
  - Compact mode: 500px height
  - Normal mode: 700px height
  - Fullscreen mode: calc(100vh - 300px)
  - Auto-adjusting based on viewport
- **Loading States Optimization**:
  - Intelligent loading indicator dengan transition timing
  - Device switch loading fix (prevent infinite spinner)
  - Smooth 300ms transitions antar states
- **Responsive Controls**: Flex-wrap controls untuk mobile compatibility

### 🔧 Fixed

#### **FileTreeExplorer**
- Vertical/horizontal scroll issues (nested overflow containers)
- Unresponsive design pada small screens
- Messy layout dengan proper spacing dan padding
- Border highlighting visual feedback untuk drag operations

#### **LivePreview**
- **Critical**: Unlimited loading spinner saat switching device tabs
  - Root cause: Device switch only changes CSS, not iframe src, so `onLoad` never fires
  - Solution: Added 300ms setTimeout to clear loading state after device change
- Desktop mode height not auto-adjusting properly
- Lag dalam real-time theme changes (optimized iframe reloading)
- Zoom controls not maintaining state on device switch

#### **ThemeCodeEditor**
- Layout breaking pada small screens
- File tree width not persisting dalam fullscreen mode
- Editor not taking full available height
- Theme switcher (Light/Dark) not applying correctly to Monaco editor

### 🏗️ Architecture & Structure

#### **Component Refactoring**
- **FileTreeExplorer.tsx**: 258 lines → Converted to forwardRef with exposed API
- **ThemeCodeEditor.tsx**: 579 lines → Complete rebuild dengan responsive layout
- **ThemeAdvancedEditor.tsx**: Layout change dari vertical ke horizontal split
- **LivePreview.tsx**: 320 lines → Enhanced dengan zoom, device modes, dan optimizations

#### **Design Patterns Applied**
- **forwardRef Pattern**: Imperative API untuk component control
- **Native HTML5 Drag Events**: Built-in browser drag & drop tanpa external library
- **CSS Transform for Performance**: GPU-accelerated zoom dan scaling
- **Nested Scroll Containers**: Proper overflow management untuk complex layouts
- **Mouse Event Handling**: Custom resizable panel tanpa external dependencies
- **Debounce Pattern**: Optimized loading states dengan setTimeout

### 📊 Build Performance

**Production Build Stats**:
- Total modules transformed: 3,144
- Build time: 64 seconds
- Theme Code Editor chunk: 91.24 KB (26.99 KB gzipped)
- Theme Advanced Editor chunk: 15.80 KB (5.36 KB gzipped)
- Total CSS: 101.12 KB (16.92 KB gzipped)

### 🔍 System Audit Completed

Comprehensive audit meliputi:
1. **File Explorer Design**: Scroll, responsiveness, layout cleanliness
2. **Code Editor Verification**: All basic features (line numbers, syntax highlighting, auto indent, auto close tags, search & replace, theme toggle)
3. **Live Preview Functionality**: Height management, device switching, loading states, real-time updates

### 📚 Documentation

#### **Updated**
- **README.md**: Complete rewrite focusing on Multi-Tenant CMS Platform Architecture
  - Platform Vision dan Multi-Tenant Architecture diagrams
  - Hexagonal Architecture (Ports & Adapters) explanation
  - Authentication & Authorization flow
  - Complete feature documentation
  - Planned features roadmap dari BUSINESS_CYCLE_PLAN.md
  - Technology stack details
  - Project structure untuk Backend (Laravel) dan Frontend (React)

#### **Referenced Planning Documents**
- `docs/BUSINESS_AND_HEXAGONAL_APPLICATION_PLAN/BUSINESS_CYCLE_PLAN.md`
- `docs/BUSINESS_AND_HEXAGONAL_APPLICATION_PLAN/HEXAGONAL_AND_ARCHITECTURE_PLAN.md`

### 🎯 Current Focus

**Tenant**: PT Custom Etching Xenial (PT CEX) - Bisnis etching untuk logam, kaca, dan plakat

**Completed**: 
- ✅ Theme Engine System (Code Editor, Advanced Editor, File Management)
- ✅ Theme Dashboard dengan Marketplace, Upload, Export
- ✅ Admin Panel Foundation (Dashboard, Product Management, Order Management)
- ✅ Public Frontend (Home, Products, Product Detail, About, Contact, FAQ)

**Next Steps**:
- 🔄 Backend Laravel 10 setup dengan Hexagonal Architecture
- 🔄 PostgreSQL multi-tenant database implementation
- 🔄 Purchase Order workflow (Customer → Vendor Negotiation → Payment → Production)

---

## [1.3.0] - 2024-01-15

### Added
- **Review Sorting Feature**: Added sorting functionality untuk customer reviews
  - Sort by rating (tertinggi/terendah)
  - Sort by date (terbaru/terlama)
  - Dynamic review statistics dengan percentage calculation
- **Related Products Section**: Menampilkan produk terkait di sidebar
  - Card design responsif
  - Quick navigation ke produk terkait
  - Sticky positioning untuk better UX
- **ScrollToTop Component**: Floating button untuk scroll ke atas halaman
  - Auto show/hide berdasarkan scroll position
  - Smooth scroll animation
  - Accessible dengan aria-label

### Changed
- **Product Detail Layout**: Restrukturisasi layout halaman detail produk
  - Reviews dipindah ke kolom kiri (2/3 width)
  - Related products di kolom kanan (1/3 width)
  - Improved mobile responsiveness
- **Button Padding**: Ditambahkan padding horizontal (px-6) pada tombol "Tambah ke Keranjang"
  - Text tidak lagi mepet ke tepi tombol
  - Better visual hierarchy

### Fixed
- Review count calculation now dynamic based on actual data
- Star rating distribution now accurately reflects review data
- Mobile layout issues pada review section

---

## [1.2.0] - 2024-01-10

### Added
- **Authentication Pages**: Login, Register, dan Forgot Password
  - Form validation menggunakan dummy data
  - Consistent design dengan tema situs
  - Password strength indicator pada register page
  - "Remember me" checkbox pada login page
  - Password visibility toggle
- **Cart Context**: State management untuk shopping cart
  - Add/remove items functionality
  - Persistent cart state
  - Cart item counter
- **Customer Reviews System**: Review section di product detail
  - Rating summary dengan star distribution
  - Verified buyer badges
  - Individual review cards
  - Rating breakdown chart

### Changed
- Header navigation: Dashboard button diganti dengan Login button
- Product detail page: Added breadcrumb navigation
- Image gallery: Added zoom functionality on click
- Product specifications: More detailed technical information

### Fixed
- Mobile menu closing issue
- Image carousel navigation on small screens
- Form validation error messages

---

## [1.1.0] - 2024-01-05

### Added
- **Hero Carousel Component**: Auto-sliding background images
  - 5 high-resolution hero images
  - Auto-play dengan interval 5 detik
  - Pause/Play button untuk user control
  - Smooth fade transitions
  - Responsive untuk semua screen sizes
- **Typing Effect Component**: Animated typing text
  - Unlimited loop dengan multiple teks
  - Smooth typing dan deleting animation
  - Configurable delay dan speed
  - 2 detik delay setelah text selesai
- **Full-height Hero Section**: Hero section menyesuaikan viewport height
  - Minimum height 100vh
  - Centered content alignment
  - Gradient overlay untuk readability

### Changed
- Home page hero section menggunakan HeroCarousel
- Hero text menggunakan TypingEffect untuk tagline
- Improved loading performance dengan lazy loading
- Enhanced animation smoothness

### Fixed
- Hero section height inconsistency pada berbagai devices
- Text readability pada background images
- Mobile responsiveness pada hero section

---

## [1.0.0] - 2024-01-01

### Added
- **Initial Release**: Platform e-commerce untuk produk etching (PT Custom Etching Xenial)
- **Product Pages**: 
  - Product listing dengan grid/list view
  - Advanced filtering (type, category, rating)
  - Search functionality
  - Pagination
  - Sticky filter sidebar
- **Product Detail Page**:
  - Image carousel dengan multiple views
  - 360° view dialog
  - Zoom functionality
  - Custom order form dengan:
    - File upload untuk desain
    - Custom text dengan color picker
    - WYSIWYG editor untuk notes
    - Material dan size selection
  - WhatsApp integration untuk quick order
- **Navigation Components**:
  - Responsive header dengan mobile menu
  - Footer dengan links dan information
  - Breadcrumb navigation
- **UI Components**: shadcn-ui integration
  - Button, Card, Input, Select
  - Dialog, Carousel, Tooltip
  - Form components
  - Color picker
- **Pages**:
  - Home/Landing page
  - Products listing
  - Product detail
  - About page
  - Contact page
  - FAQ page
  - 404 Not Found page
- **Styling System**:
  - Tailwind CSS configuration
  - Dark/Light theme support
  - Custom color tokens
  - Responsive design utilities
  - Animation utilities
- **3D Viewer**: Three.js integration untuk product visualization
- **Routing**: React Router DOM setup dengan route definitions

### Technical
- React 18.3.1 setup
- TypeScript 5.5 configuration
- Vite build tool
- ESLint configuration
- Git repository initialization

---

## Version Format

- **Major version (X.0.0)**: Breaking changes, major architecture changes, atau major features
- **Minor version (0.X.0)**: New features, backward compatible
- **Patch version (0.0.X)**: Bug fixes dan small improvements
- **Alpha/Beta suffix**: Pre-release versions untuk testing

---

## Links

- [Repository](https://github.com/yourusername/canvastack-cms)
- [Business Plan Documentation](docs/BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN/BUSINESS_CYCLE_PLAN.md)
- [Architecture Documentation](docs/BUSEINESS_AND_HEXAGONAL_APPLICATION_PLAN/HEXAGONAL_AND_ARCHITECTURE_PLAN.md)
- [CanvaStack Project](https://canvastack.dev/projects/5c3d9d8a-2c15-4499-9cb5-318fefc8b737)

---

**Note**: Dates in changelog mengikuti format YYYY-MM-DD (ISO 8601)

**Current Platform Status**: 🚧 Active Development - Multi-Tenant Architecture Implementation Phase 🚧
