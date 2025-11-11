# THEME MARKETPLACE SYSTEM
## Complete Theme Engine & Marketplace Architecture

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Complexity:** High  
**Impact:** Critical - Visual Identity & User Experience  
**Status:** 🟢 **Partial Implementation** (Client-Side Engine) + 🚧 **Planned** (Marketplace API)

> **⚠️ IMPLEMENTATION STATUS**  
> **✅ IMPLEMENTED**: Client-side theme engine dengan ThemeManager, dynamic component loading  
> **🚧 PLANNED**: Backend marketplace API, theme registry, licensing system  
> **Current**: React frontend with `src/core/engine/ThemeManager.ts` and `src/themes/` directory  
> **Architecture**: API-First - Frontend theme rendering + Backend theme metadata & marketplace

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Theme Structure & Anatomy](#theme-structure--anatomy)
3. [Theme Engine Architecture](#theme-engine-architecture)
4. [Theme Customization System](#theme-customization-system)
5. [Marketplace Integration](#marketplace-integration)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Security & Sandboxing](#security--sandboxing)
9. [Performance Optimization](#performance-optimization)
10. [Developer SDK](#developer-sdk)
11. [Code Examples](#code-examples)
12. [Migration Strategy](#migration-strategy)

---

## EXECUTIVE SUMMARY

### What is Theme Marketplace System?

Theme Marketplace System adalah **complete platform** untuk:
- **Theme Development**: SDK dan tools untuk developers membuat themes
- **Theme Distribution**: Marketplace untuk discover, purchase, dan install themes
- **Theme Customization**: Visual customizer untuk tenant-specific branding
- **Theme Management**: Lifecycle management (install, activate, update, delete)

### Business Value

**Revenue Opportunities:**
- 💰 **Marketplace Commission**: 20-30% dari setiap theme sale
- 💰 **Premium Themes**: Official themes dijual $49-$199
- 💰 **Developer Ecosystem**: Attract 1,000+ developers untuk contribute
- 💰 **Faster Onboarding**: Pre-built themes = faster tenant activation

**User Benefits:**
- 🎨 **Professional Design**: Access ke 1,000+ professionally designed themes
- 🎨 **No Code Required**: Visual customizer tanpa coding skills
- 🎨 **Brand Consistency**: Maintain brand identity across platform
- 🎨 **Quick Launch**: Go live dalam minutes dengan ready-made theme

### Technical Benefits

- ✅ **Hot Swapping**: Switch themes tanpa downtime
- ✅ **Version Control**: Multiple theme versions dengan rollback
- ✅ **Isolation**: Theme-level CSS/JS isolation (no conflicts)
- ✅ **Performance**: Lazy loading & asset optimization
- ✅ **Security**: Sandboxed theme execution

---

## THEME STRUCTURE & ANATOMY

### Directory Structure

```
my-awesome-theme/
├── theme.json              # Theme manifest
├── screenshot.png          # Preview image (1200x900)
├── README.md              # Documentation
├── LICENSE                # License file
├── 
├── layouts/               # Page layouts
│   ├── DefaultLayout.tsx
│   ├── FullWidthLayout.tsx
│   └── SidebarLayout.tsx
│
├── components/            # Reusable React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   ├── ProductCard.tsx
│   └── HeroSection.tsx
│
├── pages/                 # Page components
│   ├── Home.tsx
│   ├── ProductList.tsx
│   ├── ProductDetail.tsx
│   ├── Cart.tsx
│   └── Checkout.tsx
│
├── assets/
│   ├── css/
│   │   ├── theme.css      # Main theme styles
│   │   └── variables.css  # CSS custom properties
│   ├── images/
│   │   └── placeholders/
│   └── fonts/
│
├── config/
│   ├── settings.json      # Customizable settings schema
│   ├── presets.json       # Color/font presets
│   └── routes.tsx         # Theme-specific routes (optional)
│
├── hooks/                 # Custom React hooks
│   ├── useThemeSettings.ts
│   └── useThemeContext.ts
│
├── types/                 # TypeScript definitions
│   └── index.d.ts
│
└── index.ts               # Theme entry point

```

### Theme Manifest (theme.json)

```json
{
  "name": "Modern Shop",
  "slug": "modern-shop",
  "version": "1.2.0",
  "description": "Clean and modern e-commerce theme with advanced product showcase",
  "author": {
    "name": "Acme Themes",
    "email": "support@canvastencil.com",
    "url": "https://canvastencil.com"
  },
  
  "compatibility": {
  "stencil_version": ">=2.0.0",
  "react_version": ">=18.0.0",
  "typescript_version": ">=5.0.0",
  "required_plugins": []
  },

  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0"
  },
  
  "support": {
    "email": "support@canvastencil.com",
    "docs": "https://docs.canvastencil.com/modern-shop",
    "forum": "https://forum.canvastencil.com"
  },
  
  "pricing": {
    "type": "paid",
    "price": 79.00,
    "currency": "USD",
    "license": "single-site"
  },
  
  "tags": ["e-commerce", "modern", "responsive", "dark-mode"],
  "categories": ["shop", "business"],
  
  "screenshots": [
    "screenshot.png",
    "screenshots/home.png",
    "screenshots/product.png"
  ],
  
  "demo_url": "https://demo.canvastencil.com/modern-shop",
  
  "customizer": {
    "sections": [
      {
        "id": "colors",
        "label": "Colors",
        "settings": [
          {
            "id": "primary_color",
            "type": "color",
            "label": "Primary Color",
            "default": "#3b82f6"
          },
          {
            "id": "secondary_color",
            "type": "color",
            "label": "Secondary Color",
            "default": "#8b5cf6"
          }
        ]
      },
      {
        "id": "typography",
        "label": "Typography",
        "settings": [
          {
            "id": "heading_font",
            "type": "font",
            "label": "Heading Font",
            "default": "Montserrat"
          },
          {
            "id": "body_font",
            "type": "font",
            "label": "Body Font",
            "default": "Inter"
          }
        ]
      },
      {
        "id": "layout",
        "label": "Layout",
        "settings": [
          {
            "id": "container_width",
            "type": "range",
            "label": "Container Width",
            "min": 1024,
            "max": 1920,
            "step": 32,
            "default": 1280,
            "unit": "px"
          },
          {
            "id": "header_style",
            "type": "select",
            "label": "Header Style",
            "options": [
              {"value": "classic", "label": "Classic"},
              {"value": "centered", "label": "Centered"},
              {"value": "minimal", "label": "Minimal"}
            ],
            "default": "classic"
          }
        ]
      }
    ]
  },
  
  "features": [
    "Responsive design",
    "Dark mode support",
    "RTL support",
    "SEO optimized",
    "Performance optimized",
    "Accessibility (WCAG 2.1 AA)"
  ],
  
  "changelog": [
    {
      "version": "1.2.0",
      "date": "2025-11-01",
      "changes": [
        "Added dark mode support",
        "Improved mobile navigation",
        "Fixed checkout page layout"
      ]
    }
  ]
}
```

---

## THEME ENGINE ARCHITECTURE

### Architecture Overview (API-First dengan Client-Side Rendering)

**Current Implementation:**  
✅ Client-side theme engine fully functional  
🚧 Backend theme API planned for marketplace integration

```
┌──────────────────────────────────────────────────────────────┐
│         FRONTEND (React SPA) - ✅ IMPLEMENTED                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  ThemeManager (src/core/engine/ThemeManager.ts)    │     │
│  │  • Initialize theme engine                         │     │
│  │  • Load theme from src/themes/ directory           │     │
│  │  • Dynamic component imports                       │     │
│  │  • Theme validation & packaging                    │     │
│  │  • Theme context management                        │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Theme Loader (Dynamic Imports)                    │     │
│  │  • import(`../../themes/${slug}/index.ts`)         │     │
│  │  • Load theme components (lazy loading)            │     │
│  │  • Load theme styles (CSS/Tailwind)                │     │
│  │  • Validate theme manifest (theme.json)            │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Theme Components (src/themes/default/)            │     │
│  │  • Layouts (DefaultLayout.tsx)                     │     │
│  │  • Components (Header, Footer, etc.)               │     │
│  │  • Pages (Home, Products, etc.)                    │     │
│  │  • Styles (Tailwind classes)                       │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  React App Renders with Active Theme               │     │
│  │  • Component composition                           │     │
│  │  • Dynamic styling                                 │     │
│  │  • Theme-specific behavior                         │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                       ║
                       ║ Future: Fetch theme metadata from API
                       ║
┌──────────────────────▼───────────────────────────────────────┐
│      BACKEND API (Laravel) - 🚧 PLANNED                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Theme Registry API                                │     │
│  │  • GET /api/themes (list available themes)         │     │
│  │  • GET /api/themes/{slug} (theme metadata)         │     │
│  │  • GET /api/tenants/{id}/active-theme              │     │
│  │  • POST /api/themes (upload new theme)             │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Theme Settings API                                │     │
│  │  • GET /api/themes/{slug}/settings                 │     │
│  │  • PUT /api/themes/{slug}/settings                 │     │
│  │  • Tenant-specific customizations                  │     │
│  │  • Merge with theme defaults                       │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Marketplace API                                   │     │
│  │  • GET /api/marketplace/themes (browse)            │     │
│  │  • POST /api/marketplace/themes/purchase           │     │
│  │  • Theme licensing & validation                    │     │
│  │  • Developer theme submissions                     │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│      DATABASE (Supabase/PostgreSQL) - 🚧 PLANNED             │
│                                                              │
│  Tables:                                                     │
│  • themes (registry of all themes)                          │
│  • theme_installations (tenant → theme mapping)             │
│  • theme_settings (tenant-specific customizations)          │
│  • theme_marketplace_listings                               │
│  • theme_purchases, theme_licenses                          │
└──────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Theme Loader (✅ IMPLEMENTED in Frontend)

**Responsibilities:**
- Load theme files dynamically dari `src/themes/` directory
- Validate theme structure and manifest
- Cache loaded themes in memory
- Handle theme initialization hooks

**Frontend Implementation (CURRENT):**

```typescript
// FILE: src/core/engine/ThemeLoader.ts (✅ IMPLEMENTED)
import type { Theme, ThemeManifest } from './types';

export class ThemeLoader {
  private cache: Map<string, Theme> = new Map();
  
  async loadTheme(slug: string): Promise<Theme> {
    // Check cache
    if (this.cache.has(slug)) {
      return this.cache.get(slug)!;
    }
    
    try {
      // Dynamic import of theme bundle (Vite magic import)
      const themeModule = await import(
        /* @vite-ignore */
        `../../themes/${slug}/index.ts`
      );
      
      const theme = themeModule.default;
      
      // Validate theme manifest
      await this.validateTheme(theme);
      
      // Cache theme
      this.cache.set(slug, theme);
      
      // Execute theme lifecycle hooks
      if (theme.hooks?.onActivate) {
        await theme.hooks.onActivate();
      }
      
      return theme;
    } catch (error) {
      console.error(`Failed to load theme: ${slug}`, error);
      throw new Error(`Theme not found: ${slug}`);
    }
  }
  
  private async validateTheme(theme: Theme): Promise<void> {
    if (!theme.manifest) {
      throw new Error('Theme manifest is required');
    }
    
    const requiredFields = ['name', 'version', 'slug'];
    for (const field of requiredFields) {
      if (!theme.manifest[field]) {
        throw new Error(`Theme manifest missing field: ${field}`);
      }
    }
  }
  
  clearCache(): void {
    this.cache.clear();
  }
}
```

**Backend API Implementation (🚧 PLANNED):**

```php
// FILE: app/Services/ThemeService.php (PLANNED)
namespace App\Services;

use App\Models\Theme;
use App\Models\ThemeInstallation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ThemeService
{
    public function getActiveTheme(string $tenantId): ?array
    {
        $cacheKey = "tenant:{$tenantId}:active_theme";
        
        return Cache::remember($cacheKey, 3600, function() use ($tenantId) {
            $installation = ThemeInstallation::where('tenant_id', $tenantId)
                ->where('is_active', true)
                ->with('theme')
                ->first();
            
            if (!$installation) {
                return $this->getDefaultTheme();
            }
            
            return [
                'slug' => $installation->theme->slug,
                'version' => $installation->installed_version,
                'manifest' => $installation->theme->manifest,
                'settings' => $this->getThemeSettings($tenantId, $installation->theme_id),
                'bundle_url' => $this->getBundleUrl($installation->theme),
            ];
        });
    }
    
    public function getThemeSettings(string $tenantId, string $themeId): array
    {
        // Return tenant-specific theme settings from database
        // Merge with theme defaults from manifest
    }
    
    private function getBundleUrl(Theme $theme): string
    {
        // Return Supabase Storage URL or CDN URL for theme assets
        return Storage::disk('supabase')->url("themes/{$theme->slug}/bundle.js");
    }
}
```

#### 2. Theme Manager (✅ IMPLEMENTED in Frontend)

**Responsibilities:**
- Manage theme lifecycle (load, activate, deactivate)
- Handle theme switching
- Provide theme context to React app

**Frontend Implementation:**

```typescript
// FILE: src/core/engine/ThemeManager.ts (✅ IMPLEMENTED)
import { ThemeLoader } from './ThemeLoader';
import type { Theme } from './types';

export class ThemeManager {
  private activeTheme: Theme | null = null;
  private loader: ThemeLoader;
  
  constructor() {
    this.loader = new ThemeLoader();
  }
  
  async activateTheme(slug: string): Promise<void> {
    // Load theme
    const theme = await this.loader.loadTheme(slug);
    
    // Deactivate current theme if any
    if (this.activeTheme?.hooks?.onDeactivate) {
      await this.activeTheme.hooks.onDeactivate();
    }
    
    // Set as active
    this.activeTheme = theme;
    
    // Trigger activation hooks
    if (theme.hooks?.onActivate) {
      await theme.hooks.onActivate();
    }
  }
  
  getActiveTheme(): Theme | null {
    return this.activeTheme;
  }
  
  async validateTheme(theme: Theme): Promise<void> {
    if (!theme.manifest || !theme.components) {
      throw new Error('Invalid theme structure');
    }
  }
}

export const themeLoader = new ThemeLoader();
```

#### 2. Theme Component Resolver (✅ Frontend - React/TypeScript)

**Responsibilities:**
- Resolve React components based on active theme
- Support component overrides (theme → default fallback)
- Handle component lazy loading dengan dynamic imports

**Frontend Implementation:**

```typescript
// FILE: src/core/engine/ThemeComponentResolver.ts (✅ IMPLEMENTED)
import type { Theme, ComponentName } from './types';
import React from 'react';

export class ThemeComponentResolver {
  private activeTheme: Theme | null = null;
  private componentCache: Map<string, React.ComponentType> = new Map();
  
  /**
   * Resolve component from active theme, fallback to default
   */
  async resolveComponent(
    name: ComponentName
  ): Promise<React.ComponentType | null> {
    if (!this->activeTheme) {
      return this.loadDefaultComponent(name);
    }
    
    const cacheKey = `${this.activeTheme.slug}:${name}`;
    
    // Check cache first
    if (this.componentCache.has(cacheKey)) {
      return this.componentCache.get(cacheKey)!;
    }
    
    try {
      // Try theme-specific component first
      const Component = await this.loadThemeComponent(
        this.activeTheme.slug,
        name
      );
      
      // Cache component
      this.componentCache.set(cacheKey, Component);
      return Component;
      
    } catch (error) {
      // Fallback to default component
      console.warn(
        `Component '${name}' not found in theme '${this.activeTheme.slug}', using default`
      );
      return this.loadDefaultComponent(name);
    }
  }
  
  /**
   * Dynamic import from theme directory
   */
  private async loadThemeComponent(
    themeSlug: string,
    name: string
  ): Promise<React.ComponentType> {
    const module = await import(
      /* @vite-ignore */
      `../../themes/${themeSlug}/components/${name}.tsx`
    );
    return module.default || module[name];
  }
  
  /**
   * Fallback to default theme component
   */
  private async loadDefaultComponent(
    name: string
  ): Promise<React.ComponentType> {
    const module = await import(
      /* @vite-ignore */
      `../../themes/default/components/${name}.tsx`
    );
    return module.default || module[name];
  }
  
  /**
   * Set active theme and clear cache
   */
  setActiveTheme(theme: Theme | null): void {
    this.activeTheme = theme;
    this.componentCache.clear(); // Clear cache on theme switch
  }
  
  /**
   * Preload component for performance
   */
  async preloadComponent(name: ComponentName): Promise<void> {
    try {
      await this.resolveComponent(name);
    } catch (error) {
      console.error(`Failed to preload component: ${name}`, error);
    }
  }
}

export const componentResolver = new ThemeComponentResolver();
```

**Usage in React App:**

```typescript
// src/components/ThemedComponent.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { componentResolver } from '@/core/engine/ThemeComponentResolver';
import { Suspense, lazy, useEffect, useState } from 'react';

interface ThemedComponentProps {
  component: 'Header' | 'Footer' | 'ProductCard' | 'HeroSection';
  props?: Record<string, any>;
}

export const ThemedComponent: React.FC<ThemedComponentProps> = ({ 
  component, 
  props = {} 
}) => {
  const { theme } = useTheme();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  
  useEffect(() => {
    componentResolver.setActiveTheme(theme);
    componentResolver.resolveComponent(component).then(setComponent);
  }, [theme, component]);
  
  if (!Component) {
    return <ComponentSkeleton />;
  }
  
  return (
    <Suspense fallback={<ComponentSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
};
```

#### 3. Theme Settings Manager

**Responsibilities:**
- Manage tenant-specific theme settings
- Merge tenant settings with theme defaults
- Validate settings against schema
- Support real-time preview

**Implementation:**

```php
namespace App\Theme\Settings;

class SettingsManager
{
    public function getSettings(string $tenantId, Theme $theme): array
    {
        // Get tenant-specific settings
        $tenantSettings = ThemeSettings::where('tenant_id', $tenantId)
            ->where('theme_slug', $theme->getSlug())
            ->pluck('value', 'key')
            ->toArray();
        
        // Get theme defaults
        $defaults = $theme->getDefaultSettings();
        
        // Merge (tenant settings override defaults)
        return array_merge($defaults, $tenantSettings);
    }
    
    public function updateSetting(
        string $tenantId, 
        Theme $theme, 
        string $key, 
        mixed $value
    ): void {
        // Validate against schema
        $schema = $theme->getSettingsSchema();
        $this->validator->validate($key, $value, $schema);
        
        // Update or create
        ThemeSettings::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'theme_slug' => $theme->getSlug(),
                'key' => $key,
            ],
            [
                'value' => $value,
                'updated_at' => now(),
            ]
        );
        
        // Clear cache
        Cache::forget("theme_settings:{$tenantId}:{$theme->getSlug()}");
        
        // Trigger event
        event(new ThemeSettingUpdated($tenantId, $theme, $key, $value));
    }
}
```

---

## THEME CUSTOMIZATION SYSTEM

### Visual Theme Customizer

**Features:**
- ✅ **Live Preview**: Real-time preview saat customize
- ✅ **Responsive Preview**: Preview di desktop/tablet/mobile
- ✅ **Undo/Redo**: History management untuk changes
- ✅ **Save Presets**: Save custom configurations
- ✅ **Import/Export**: Export settings JSON

### Customizer UI Components

#### 1. Color Picker

```typescript
interface ColorSetting {
  id: string;
  label: string;
  default: string;
  alpha?: boolean;  // Support transparency
}

// Usage in customizer
<ColorPicker
  value={settings.primary_color}
  onChange={(color) => updateSetting('primary_color', color)}
  alpha={true}
/>
```

#### 2. Typography Control

```typescript
interface FontSetting {
  id: string;
  label: string;
  default: {
    family: string;
    weight: number;
    size: string;
    lineHeight: string;
  };
}

<FontSelector
  value={settings.heading_font}
  onChange={(font) => updateSetting('heading_font', font)}
  weights={[300, 400, 600, 700]}
/>
```

#### 3. Layout Options

```typescript
interface LayoutSetting {
  id: string;
  label: string;
  type: 'select' | 'toggle' | 'range';
  options?: Array<{value: string; label: string}>;
  min?: number;
  max?: number;
  default: any;
}

<LayoutControl
  setting={layoutSettings.header_style}
  value={settings.header_style}
  onChange={(value) => updateSetting('header_style', value)}
/>
```

### Settings Schema Validation

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "primary_color": {
      "type": "string",
      "pattern": "^#[0-9A-Fa-f]{6}$",
      "description": "Primary brand color"
    },
    "container_width": {
      "type": "integer",
      "minimum": 1024,
      "maximum": 1920,
      "multipleOf": 32
    },
    "header_style": {
      "type": "string",
      "enum": ["classic", "centered", "minimal"]
    }
  },
  "required": ["primary_color"]
}
```

### React Theme Provider

#### Implementation

```typescript
// src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeLoader } from '@/core/engine/ThemeLoader';
import type { Theme, ThemeConfig } from '@/core/engine/types';

interface ThemeContextValue {
  theme: Theme | null;
  config: ThemeConfig;
  updateSetting: (key: string, value: any) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [config, setConfig] = useState<ThemeConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadActiveTheme();
  }, []);
  
  const loadActiveTheme = async () => {
    try {
      const tenantId = getCurrentTenantId(); // Get from auth context
      const themeManifest = await themeLoader.fetchThemeConfig(tenantId);
      const loadedTheme = await themeLoader.loadTheme(themeManifest.slug);
      
      setTheme(loadedTheme);
      setConfig(themeManifest.settings);
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Fallback to default theme
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateSetting = async (key: string, value: any) => {
    const tenantId = getCurrentTenantId();
    
    // Optimistic update
    setConfig(prev => ({ ...prev, [key]: value }));
    
    // Save to backend
    await fetch(`/api/v1/tenants/${tenantId}/theme/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  };
  
  return (
    <ThemeContext.Provider value={{ theme, config, updateSetting, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

```typescript

// src/core/engine/ThemeComponentRenderer.tsx
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeComponentProps {
  component: string; // 'Header' | 'Footer' | etc
  props?: Record<string, any>;
}

export const ThemeComponent: React.FC<ThemeComponentProps> = ({ component, props = {} }) => {
  const { theme, isLoading } = useTheme();
  
  if (isLoading || !theme) {
    return <ComponentSkeleton />;
  }
  
  const Component = theme.components[component];
  
  if (!Component) {
    console.warn(`Component '${component}' not found in active theme`);
    return null;
  }
  
  return <Component {...props} />;
};

```

---

## MARKETPLACE INTEGRATION

### Marketplace Features

**Discovery:**
- 🔍 **Search & Filter**: Search by category, tags, price, rating
- 🔍 **Featured Themes**: Editor's picks, trending, new releases
- 🔍 **Collections**: Curated theme collections (e.g., "Best for Fashion")

**Purchase Flow:**
- 💳 **One-Click Install**: Buy dan install dalam single flow
- 💳 **License Management**: Single-site vs multi-site licenses
- 💳 **Automatic Updates**: Auto-update dengan license validation

**Quality Control:**
- ✅ **Theme Review Process**: Manual review sebelum publish
- ✅ **Security Scanning**: Automated malware/vulnerability scan
- ✅ **Performance Testing**: Lighthouse score minimum 80
- ✅ **Code Standards**: PSR-12, WCAG 2.1 compliance

### Marketplace API

#### Browse Themes

```http
GET /api/v1/marketplace/themes
```

**Query Parameters:**
- `category` - Filter by category
- `tag` - Filter by tag
- `price_min`, `price_max` - Price range
- `sort` - Sort by (popular, recent, price, rating)
- `page`, `per_page` - Pagination

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "modern-shop",
      "name": "Modern Shop",
      "description": "Clean and modern e-commerce theme...",
      "author": {
        "name": "Acme Themes",
        "avatar": "https://cdn.example.com/avatars/acme.jpg",
        "verified": true
      },
      "version": "1.2.0",
      "price": 79.00,
      "currency": "USD",
      "rating": 4.8,
      "reviews_count": 342,
      "sales_count": 1250,
      "screenshot": "https://cdn.example.com/themes/modern-shop/screenshot.png",
      "demo_url": "https://demo.canvastencil.com/modern-shop",
      "tags": ["e-commerce", "modern", "responsive"],
      "categories": ["shop", "business"],
      "features": ["Dark mode", "RTL", "SEO optimized"],
      "compatibility": {
        "stencil_version": ">=2.0.0"
      },
      "updated_at": "2025-11-01T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 156,
    "last_page": 8
  },
  "filters": {
    "categories": [...],
    "tags": [...],
    "price_range": {"min": 0, "max": 299}
  }
}
```

#### Purchase Theme

```http
POST /api/v1/marketplace/themes/{slug}/purchase
```

**Request:**

```json
{
  "license_type": "single-site",
  "payment_method_id": "pm_xxx",
  "tenant_id": "uuid"
}
```

**Response:**

```json
{
  "purchase_id": "uuid",
  "theme_slug": "modern-shop",
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "license_type": "single-site",
  "amount": 79.00,
  "currency": "USD",
  "activated_for_tenant": "uuid",
  "download_url": "https://api.example.com/downloads/theme/xxx",
  "expires_at": null
}
```

#### Install Theme

```http
POST /api/v1/tenants/{tenantId}/themes/install
```

**Request:**

```json
{
  "theme_slug": "modern-shop",
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "activate": true
}
```

**Response:**

```json
{
  "installation_id": "uuid",
  "status": "completed",
  "theme": {
    "slug": "modern-shop",
    "version": "1.2.0",
    "installed_at": "2025-11-11T10:00:00Z",
    "is_active": true
  }
}
```

---

## DATABASE SCHEMA

### 1. themes

**Description**: Theme registry - all available themes in system

```sql
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    
    -- Author Info
    author_name VARCHAR(200),
    author_email VARCHAR(255),
    author_url VARCHAR(500),
    
    -- Storage
    storage_path TEXT NOT NULL,
    manifest JSONB NOT NULL,
    
    -- Marketplace
    is_marketplace_theme BOOLEAN DEFAULT false,
    marketplace_listing_id UUID,
    
    -- Compatibility
    min_stencil_version VARCHAR(20),
    max_stencil_version VARCHAR(20),
    required_php_version VARCHAR(20),
    required_plugins JSONB DEFAULT '[]',
    
    -- Features
    features JSONB DEFAULT '[]',
    tags VARCHAR(50)[],
    categories VARCHAR(50)[],
    
    -- Media
    screenshot_url TEXT,
    preview_images JSONB DEFAULT '[]',
    demo_url VARCHAR(500),
    
    -- Settings Schema
    customizer_schema JSONB,
    default_settings JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, deprecated, archived
    is_official BOOLEAN DEFAULT false,
    
    -- Stats (denormalized)
    installations_count INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT themes_version_check CHECK (version ~ '^\d+\.\d+\.\d+(-[a-z0-9.]+)?$')
);

CREATE INDEX idx_themes_slug ON themes(slug);
CREATE INDEX idx_themes_status ON themes(status) WHERE status = 'active';
CREATE INDEX idx_themes_marketplace ON themes(is_marketplace_theme) WHERE is_marketplace_theme = true;
CREATE INDEX idx_themes_tags ON themes USING GIN(tags);
CREATE INDEX idx_themes_categories ON themes USING GIN(categories);
CREATE INDEX idx_themes_manifest ON themes USING GIN(manifest);
```

**Fields**: 26 fields

---

### 2. theme_installations

**Description**: Per-tenant theme installations

```sql
CREATE TABLE theme_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    -- Version Info
    installed_version VARCHAR(20) NOT NULL,
    latest_available_version VARCHAR(20),
    
    -- Installation
    installation_source VARCHAR(50) NOT NULL, -- marketplace, upload, git
    installation_method VARCHAR(50), -- one-click, manual, cli
    installed_by UUID REFERENCES users(id),
    
    -- Activation
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP,
    activated_by UUID REFERENCES users(id),
    
    -- License
    license_key VARCHAR(255),
    license_type VARCHAR(50), -- single-site, multi-site, lifetime
    license_valid_until TIMESTAMP,
    
    -- Auto Update
    auto_update_enabled BOOLEAN DEFAULT true,
    last_update_check TIMESTAMP,
    
    -- Storage
    local_storage_path TEXT,
    
    -- Metadata
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uninstalled_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, theme_id),
    CONSTRAINT only_one_active_theme UNIQUE(tenant_id, is_active) 
        WHERE is_active = true
);

CREATE INDEX idx_theme_installations_tenant ON theme_installations(tenant_id);
CREATE INDEX idx_theme_installations_theme ON theme_installations(theme_id);
CREATE INDEX idx_theme_installations_active ON theme_installations(tenant_id, is_active) 
    WHERE is_active = true;
CREATE INDEX idx_theme_installations_license ON theme_installations(license_key) 
    WHERE license_key IS NOT NULL;
```

**Fields**: 20 fields

---

### 3. theme_settings

**Description**: Tenant-specific theme customizations

```sql
CREATE TABLE theme_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    theme_installation_id UUID NOT NULL REFERENCES theme_installations(id) ON DELETE CASCADE,
    
    -- Setting
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    
    -- Type & Validation
    setting_type VARCHAR(50), -- color, font, image, number, text, json
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB,
    
    -- Versioning
    version INT DEFAULT 1,
    previous_value JSONB,
    
    -- Metadata
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, theme_installation_id, setting_key)
);

CREATE INDEX idx_theme_settings_tenant ON theme_settings(tenant_id);
CREATE INDEX idx_theme_settings_installation ON theme_settings(theme_installation_id);
CREATE INDEX idx_theme_settings_key ON theme_settings(setting_key);
CREATE INDEX idx_theme_settings_value ON theme_settings USING GIN(setting_value);
```

**Fields**: 13 fields

---

### 4. theme_marketplace_listings

**Description**: Marketplace theme catalog

```sql
CREATE TABLE theme_marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Theme Reference
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    -- Vendor
    vendor_id UUID NOT NULL REFERENCES users(id),
    vendor_name VARCHAR(200),
    vendor_verified BOOLEAN DEFAULT false,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_type VARCHAR(50), -- free, one-time, subscription
    
    -- License Types Offered
    available_licenses JSONB DEFAULT '[{"type": "single-site", "price": 0}]',
    
    -- Marketing
    tagline VARCHAR(255),
    long_description TEXT,
    features_list JSONB DEFAULT '[]',
    
    -- Media
    gallery_images JSONB DEFAULT '[]',
    video_url VARCHAR(500),
    
    -- Support & Docs
    documentation_url VARCHAR(500),
    support_url VARCHAR(500),
    changelog_url VARCHAR(500),
    
    -- Stats
    view_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    revenue_total DECIMAL(12,2) DEFAULT 0,
    
    -- Rating
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, suspended
    approval_status VARCHAR(50),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Featured
    is_featured BOOLEAN DEFAULT false,
    featured_until TIMESTAMP,
    featured_position INT,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug_override VARCHAR(200),
    
    -- Metadata
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(theme_id)
);

CREATE INDEX idx_marketplace_theme ON theme_marketplace_listings(theme_id);
CREATE INDEX idx_marketplace_vendor ON theme_marketplace_listings(vendor_id);
CREATE INDEX idx_marketplace_status ON theme_marketplace_listings(status) 
    WHERE status = 'approved';
CREATE INDEX idx_marketplace_featured ON theme_marketplace_listings(is_featured, featured_position) 
    WHERE is_featured = true;
CREATE INDEX idx_marketplace_rating ON theme_marketplace_listings(rating_average DESC);
CREATE INDEX idx_marketplace_sales ON theme_marketplace_listings(sales_count DESC);
```

**Fields**: 35 fields

---

### 5. theme_purchases

**Description**: Theme purchase transactions

```sql
CREATE TABLE theme_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    marketplace_listing_id UUID NOT NULL REFERENCES theme_marketplace_listings(id),
    theme_id UUID NOT NULL REFERENCES themes(id),
    buyer_user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    
    -- Purchase Details
    license_type VARCHAR(50) NOT NULL,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    platform_fee DECIMAL(10,2), -- 20-30% commission
    vendor_payout DECIMAL(10,2),
    
    -- Payment
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50), -- stripe, paypal, etc
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50), -- pending, completed, failed, refunded
    
    -- License Activation
    activated_for_tenant UUID REFERENCES tenants(id),
    activation_count INT DEFAULT 0,
    max_activations INT DEFAULT 1,
    
    -- Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP, -- NULL = lifetime
    
    -- Download
    download_count INT DEFAULT 0,
    download_url_token VARCHAR(255),
    download_url_expires_at TIMESTAMP,
    
    -- Refund
    refund_requested_at TIMESTAMP,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(10,2),
    
    -- Metadata
    purchase_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_listing ON theme_purchases(marketplace_listing_id);
CREATE INDEX idx_purchases_buyer ON theme_purchases(buyer_user_id);
CREATE INDEX idx_purchases_tenant ON theme_purchases(tenant_id);
CREATE INDEX idx_purchases_license ON theme_purchases(license_key);
CREATE INDEX idx_purchases_status ON theme_purchases(payment_status);
CREATE INDEX idx_purchases_activation ON theme_purchases(activated_for_tenant);
```

**Fields**: 29 fields

---

### 6. theme_licenses

**Description**: License management and validation

```sql
CREATE TABLE theme_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    purchase_id UUID NOT NULL REFERENCES theme_purchases(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES themes(id),
    
    -- License
    license_key VARCHAR(255) UNIQUE NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    
    -- Holder
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    
    -- Activation
    is_active BOOLEAN DEFAULT true,
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activation_ip VARCHAR(45),
    activation_domain VARCHAR(255),
    
    -- Usage Limits
    max_activations INT DEFAULT 1,
    current_activations INT DEFAULT 0,
    
    -- Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    -- Revocation
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    
    -- Verification
    last_verified_at TIMESTAMP,
    verification_failures INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_licenses_key ON theme_licenses(license_key);
CREATE INDEX idx_licenses_purchase ON theme_licenses(purchase_id);
CREATE INDEX idx_licenses_theme ON theme_licenses(theme_id);
CREATE INDEX idx_licenses_tenant ON theme_licenses(tenant_id);
CREATE INDEX idx_licenses_active ON theme_licenses(is_active, is_revoked) 
    WHERE is_active = true AND is_revoked = false;
CREATE INDEX idx_licenses_validity ON theme_licenses(valid_from, valid_until);
```

**Fields**: 23 fields

---

### 7. theme_versions

**Description**: Theme version history and changelog

```sql
CREATE TABLE theme_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    
    -- Version
    version VARCHAR(20) NOT NULL,
    version_major INT,
    version_minor INT,
    version_patch INT,
    version_prerelease VARCHAR(50),
    
    -- Release Info
    release_type VARCHAR(50), -- major, minor, patch, hotfix
    release_notes TEXT,
    breaking_changes TEXT,
    
    -- Storage
    storage_path TEXT NOT NULL,
    download_url TEXT,
    file_size BIGINT,
    file_checksum VARCHAR(64),
    
    -- Compatibility
    min_stencil_version VARCHAR(20),
    max_stencil_version VARCHAR(20),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- draft, beta, active, deprecated
    is_latest BOOLEAN DEFAULT false,
    
    -- Downloads
    download_count INT DEFAULT 0,
    
    -- Metadata
    released_by UUID REFERENCES users(id),
    released_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(theme_id, version),
    CONSTRAINT only_one_latest UNIQUE(theme_id, is_latest) WHERE is_latest = true
);

CREATE INDEX idx_versions_theme ON theme_versions(theme_id);
CREATE INDEX idx_versions_version ON theme_versions(version);
CREATE INDEX idx_versions_status ON theme_versions(status);
CREATE INDEX idx_versions_latest ON theme_versions(theme_id, is_latest) WHERE is_latest = true;
CREATE INDEX idx_versions_released ON theme_versions(released_at DESC);
```

**Fields**: 26 fields

---

## DATABASE SCHEMA SUMMARY

| Table | Fields | Purpose |
|-------|--------|---------|
| `themes` | 26 | Theme registry |
| `theme_installations` | 20 | Per-tenant installations |
| `theme_settings` | 13 | Tenant customizations |
| `theme_marketplace_listings` | 35 | Marketplace catalog |
| `theme_purchases` | 29 | Purchase transactions |
| `theme_licenses` | 23 | License management |
| `theme_versions` | 26 | Version history |
| **TOTAL** | **172 fields** | **7 tables** |

---

## API ENDPOINTS

### Public/Marketplace APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/themes` | Browse themes |
| GET | `/api/v1/marketplace/themes/{slug}` | Get theme details |
| GET | `/api/v1/marketplace/themes/{slug}/versions` | List versions |
| GET | `/api/v1/marketplace/themes/{slug}/reviews` | Get reviews |
| POST | `/api/v1/marketplace/themes/{slug}/purchase` | Purchase theme |
| GET | `/api/v1/marketplace/themes/{slug}/demo` | Get demo URL |

### Theme Bundle Delivery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/themes/{slug}/bundle` | Get theme JavaScript bundle |
| GET | `/api/v1/themes/{slug}/styles` | Get compiled theme CSS |
| GET | `/api/v1/themes/{slug}/manifest` | Get theme manifest JSON |
| GET | `/api/v1/tenants/{id}/theme/active` | Get active theme config for tenant |

**Response Example:**

```json
{
  "slug": "modern-shop",
  "version": "1.2.0",
  "manifest": {
    "name": "Modern Shop",
    "components": ["Header", "Footer", "ProductCard"],
    "entry": "/themes/modern-shop/dist/bundle.js"
  },
  "settings": {
    "primary_color": "#3b82f6",
    "secondary_color": "#8b5cf6",
    "container_width": 1280,
    "header_style": "classic"
  },
  "assets": {
    "bundle": "https://cdn.example.com/themes/modern-shop/v1.2.0/bundle.js",
    "styles": "https://cdn.example.com/themes/modern-shop/v1.2.0/styles.css",
    "fonts": "https://cdn.example.com/themes/modern-shop/v1.2.0/fonts.css"
  }
}

```

### Tenant Theme Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenants/{id}/themes` | List installed themes |
| POST | `/api/v1/tenants/{id}/themes/install` | Install theme |
| DELETE | `/api/v1/tenants/{id}/themes/{themeId}` | Uninstall theme |
| POST | `/api/v1/tenants/{id}/themes/{themeId}/activate` | Activate theme |
| PUT | `/api/v1/tenants/{id}/themes/{themeId}/update` | Update theme version |

### Theme Customization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenants/{id}/theme/settings` | Get current settings |
| PUT | `/api/v1/tenants/{id}/theme/settings` | Update settings (batch) |
| PUT | `/api/v1/tenants/{id}/theme/settings/{key}` | Update single setting |
| POST | `/api/v1/tenants/{id}/theme/settings/reset` | Reset to defaults |
| GET | `/api/v1/tenants/{id}/theme/preview` | Get preview URL |

### License Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/licenses/validate` | Validate license key |
| GET | `/api/v1/licenses/{key}` | Get license details |
| POST | `/api/v1/licenses/{key}/activate` | Activate license |
| POST | `/api/v1/licenses/{key}/deactivate` | Deactivate license |

### Theme Developer APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/themes` | Submit new theme |
| PUT | `/api/v1/themes/{id}` | Update theme |
| POST | `/api/v1/themes/{id}/versions` | Upload new version |
| GET | `/api/v1/themes/{id}/sales` | Get sales analytics |
| GET | `/api/v1/themes/{id}/revenue` | Get revenue report |

### Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/themes` | List all themes |
| POST | `/api/v1/admin/themes/{id}/approve` | Approve marketplace listing |
| POST | `/api/v1/admin/themes/{id}/reject` | Reject theme |
| POST | `/api/v1/admin/themes/{id}/feature` | Feature theme |
| GET | `/api/v1/admin/themes/analytics` | Platform analytics |

**Total API Endpoints**: 30+

---

## SECURITY & SANDBOXING

### Theme Security Measures

#### 1. Code Scanning

**Automated Scans:**
- ✅ Malware detection (ClamAV integration)
- ✅ Vulnerable dependencies (npm audit, composer audit)
- ✅ SQL injection patterns
- ✅ XSS vulnerabilities
- ✅ CSRF token usage
- ✅ Hardcoded credentials

**Implementation:**

```php
class ThemeSecurityScanner
{
    public function scan(Theme $theme): ScanResult
    {
        $results = [];
        
        // Scan for malicious patterns
        $results['malware'] = $this->scanMalware($theme);
        
        // Check for vulnerable dependencies
        $results['dependencies'] = $this->checkDependencies($theme);
        
        // Scan for common vulnerabilities
        $results['vulnerabilities'] = $this->scanVulnerabilities($theme);
        
        // Check coding standards
        $results['standards'] = $this->checkStandards($theme);
        
        return new ScanResult($results);
    }
}
```

#### 2. Resource Isolation

**CSS Isolation:**
```css
/* Each theme gets scoped CSS */
.theme-modern-shop {
    --primary-color: #3b82f6;
}

.theme-modern-shop .header {
    background: var(--primary-color);
}
```

**JavaScript Isolation:**
```javascript
// Theme JS wrapped in IIFE
(function(window, theme) {
    'use strict';
    
    // Theme code isolated in closure
    const ThemeApp = {
        init() {
            // Theme initialization
        }
    };
    
    theme.register('modern-shop', ThemeApp);
})(window, window.StencilTheme);
```

#### 3. Permission-Based Asset Access

```php
class ThemeAssetController
{
    public function serveAsset(Request $request, $themeSlug, $assetPath)
    {
        // Verify tenant has access to theme
        $tenant = $request->tenant();
        $installation = ThemeInstallation::where('tenant_id', $tenant->id)
            ->where('theme_slug', $themeSlug)
            ->firstOrFail();
        
        // Validate asset path (prevent directory traversal)
        if (!$this->isValidAssetPath($assetPath)) {
            abort(404);
        }
        
        // Serve asset
        $fullPath = $installation->theme->getAssetPath($assetPath);
        return response()->file($fullPath);
    }
}
```

---

## PERFORMANCE OPTIMIZATION

### Caching Strategy

#### 1. Theme Metadata Cache

```php
// Cache theme metadata for 1 hour
$theme = Cache::remember("theme:{$slug}", 3600, function() use ($slug) {
    return Theme::where('slug', $slug)->first();
});
```

#### 2. Compiled Component Cache (Frontend + Backend)

**Frontend - React Component Bundles:**

```typescript
// Vite compiles React components to optimized bundles
// Cache busting via content hash in filename
// Example: bundle-[hash].js

// Clear component cache on theme update
export function clearThemeCache(themeSlug: string): void {
  // Clear React Query cache
  queryClient.invalidateQueries(['theme', themeSlug]);
  
  // Clear browser cache via service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_THEME_CACHE',
      themeSlug,
    });
  }
  
  // Clear component resolver cache
  componentResolver.clearCache();
}
```

**Backend API - Theme Metadata Cache (🚧 PLANNED):**

```php
// Laravel: Cache theme metadata from database
use Illuminate\Support\Facades\Cache;

// Cache theme metadata for 1 hour
$themeData = Cache::remember("theme:{$slug}:metadata", 3600, function() use ($slug) {
    return Theme::where('slug', $slug)
        ->with(['installations', 'settings'])
        ->first()
        ->toArray();
});

// Clear cache on theme update
Event::listen(ThemeUpdated::class, function($event) {
    Cache::tags(['theme', $event->theme->slug])->flush();
    
    // Notify frontend via websocket (Supabase Realtime)
    broadcast(new ThemeCacheInvalidated($event->theme));
});
```

#### 3. Asset Compilation Cache

```php
// Cache compiled CSS/JS
$compiledCSS = Cache::rememberForever(
    "theme:{$slug}:css:{$version}:{$settingsHash}",
    function() use ($theme, $settings) {
        return $this->compiler->compileCSS($theme, $settings);
    }
);
```

### Asset Optimization

#### 1. Lazy Loading (React + Vite)

**Component Lazy Loading:**

```typescript
// Lazy load theme components for performance
import { lazy, Suspense } from 'react';

const Header = lazy(() => import('@/themes/default/components/Header'));
const Footer = lazy(() => import('@/themes/default/components/Footer'));
const ProductCard = lazy(() => import('@/themes/default/components/ProductCard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Header />
      {/* ... */}
      <Footer />
    </Suspense>
  );
}
```

**Asset Preloading:**

```tsx
// Preload critical theme assets
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function useThemeAssetPreload() {
  const { theme } = useTheme();
  
  useEffect(() => {
    if (!theme) return;
    
    // Preload theme CSS
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = `/themes/${theme.slug}/assets/theme.css`;
    document.head.appendChild(link);
    
    // Preload critical fonts
    if (theme.fonts) {
      theme.fonts.forEach((font: string) => {
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.as = 'font';
        fontLink.href = font;
        fontLink.crossOrigin = 'anonymous';
        document.head.appendChild(fontLink);
      });
    }
  }, [theme]);
}
```

**Code Splitting via Vite:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'theme-core': ['/src/core/engine/ThemeManager.ts'],
          'theme-default': ['/src/themes/default/index.ts'],
        },
      },
    },
  },
});
```

#### 2. CDN Integration

```php
// Serve assets from CDN
public function assetUrl(string $path): string
{
    if (config('themes.cdn_enabled')) {
        $cdnUrl = config('themes.cdn_url');
        return "{$cdnUrl}/themes/{$this->slug}/{$this->version}/{$path}";
    }
    
    return route('theme.asset', ['slug' => $this->slug, 'path' => $path]);
}
```

#### 3. Image Optimization

```php
// Optimize theme images on upload
$optimized = ImageOptimizer::optimize($image)
    ->resize(1200, 900)
    ->quality(85)
    ->format('webp')
    ->save();
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Theme Load Time | < 200ms | Server-side render |
| Theme Switch | < 2s | Complete activation |
| Asset Load | < 1s | All CSS/JS loaded |
| Customizer Update | < 100ms | Setting change → preview |
| Cache Hit Rate | > 95% | Redis cache hits |

---

## DEVELOPER SDK

### Theme CLI Tool

```bash
# Install Stencil Theme CLI
composer global require stencil/theme-cli

# Create new theme
stencil-theme create my-awesome-theme

# Development mode (watch & compile)
stencil-theme dev

# Build for production
stencil-theme build

# Validate theme
stencil-theme validate

# Package theme
stencil-theme package

# Publish to marketplace
stencil-theme publish --marketplace
```

### Theme Helper Functions

```php
// Available in Blade templates

// Get theme asset URL
{{ theme_asset('images/logo.png') }}

// Get theme setting
{{ theme_setting('primary_color', '#3b82f6') }}

// Check if setting exists
@if(theme_has_setting('show_breadcrumbs'))
    <nav class="breadcrumbs">...</nav>
@endif

// Get theme metadata
{{ theme_meta('name') }}
{{ theme_meta('version') }}
{{ theme_meta('author.name') }}
```

### React Components for Customizer

```typescript
import { ThemeCustomizer } from '@stencil/theme-customizer';

function ThemeSettings() {
  return (
    <ThemeCustomizer
      theme={currentTheme}
      settings={currentSettings}
      onUpdate={(key, value) => updateSetting(key, value)}
      onSave={() => saveSettings()}
      preview={true}
    />
  );
}
```

---

## CODE EXAMPLES

### Complete Theme Installation Flow

```php
namespace App\Services\Theme;

class ThemeInstallationService
{
    public function installTheme(
        Tenant $tenant,
        string $themeSlug,
        ?string $licenseKey = null,
        bool $activate = false
    ): ThemeInstallation {
        DB::beginTransaction();
        
        try {
            // 1. Find theme
            $theme = Theme::where('slug', $themeSlug)->firstOrFail();
            
            // 2. Validate license if required
            if ($theme->isMarketplaceTheme()) {
                $this->validateLicense($tenant, $theme, $licenseKey);
            }
            
            // 3. Create installation record
            $installation = ThemeInstallation::create([
                'tenant_id' => $tenant->id,
                'theme_id' => $theme->id,
                'installed_version' => $theme->version,
                'installation_source' => 'marketplace',
                'license_key' => $licenseKey,
                'is_active' => false,
            ]);
            
            // 4. Copy theme files to tenant-specific location
            $this->copyThemeFiles($theme, $tenant);
            
            // 5. Initialize default settings
            $this->initializeSettings($installation, $theme);
            
            // 6. Activate if requested
            if ($activate) {
                $this->activateTheme($installation);
            }
            
            // 7. Update stats
            $theme->increment('installations_count');
            
            DB::commit();
            
            // 8. Trigger event
            event(new ThemeInstalled($tenant, $installation));
            
            return $installation;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw new ThemeInstallationException(
                "Failed to install theme: {$e->getMessage()}"
            );
        }
    }
    
    protected function activateTheme(ThemeInstallation $installation): void
    {
        // Deactivate current theme
        ThemeInstallation::where('tenant_id', $installation->tenant_id)
            ->where('is_active', true)
            ->update(['is_active' => false]);
        
        // Activate new theme
        $installation->update([
            'is_active' => true,
            'activated_at' => now(),
        ]);
        
        // Clear relevant caches
        Cache::tags(['theme', "tenant:{$installation->tenant_id}"])->flush();
    }
}
```

---

## MIGRATION STRATEGY

### Phase 1: Foundation (Week 1-2)

**Tasks:**
- ✅ Create database tables
- ✅ Implement Theme model & relationships
- ✅ Build theme loader system
- ✅ Create theme view resolver
- ✅ Basic theme switching

**Deliverable**: Can load and switch between themes

### Phase 2: Customization System (Week 3-4)

**Tasks:**
- ✅ Build settings manager
- ✅ Implement customizer UI
- ✅ Create real-time preview
- ✅ Add preset management

**Deliverable**: Visual theme customizer working

### Phase 3: Marketplace Integration (Week 5-6)

**Tasks:**
- ✅ Build marketplace API
- ✅ Implement purchase flow
- ✅ Create license system
- ✅ Add payment integration

**Deliverable**: Can browse and purchase themes

### Phase 4: Developer Tools (Week 7)

**Tasks:**
- ✅ Create CLI tool
- ✅ Build SDK
- ✅ Write documentation
- ✅ Create starter themes

**Deliverable**: Developers can create themes

---

## CONCLUSION

Theme Marketplace System provides **complete infrastructure** untuk:

✅ **Theme Management**: Install, activate, update, delete themes  
✅ **Visual Customization**: No-code theme customizer dengan live preview  
✅ **Marketplace**: Discover, purchase, dan distribute themes  
✅ **Developer Ecosystem**: SDK dan tools untuk theme development  
✅ **Security**: Sandboxed execution dengan automated scanning  
✅ **Performance**: Optimized caching dan asset delivery  

**Revenue Potential**: $50K+ Year 1 dari marketplace commission  
**Development Time**: 7 weeks dengan 2 developers  
**Risk Level**: Medium - requires solid testing  

**Next Steps**: Start with Phase 1 implementation ✨