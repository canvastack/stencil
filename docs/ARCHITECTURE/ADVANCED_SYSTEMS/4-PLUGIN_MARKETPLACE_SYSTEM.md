# PLUGIN MARKETPLACE SYSTEM
## Extensible Plugin Architecture & Marketplace

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Complexity:** Very High  
**Impact:** Critical - Platform Extensibility & Ecosystem  
**Status:** 🚧 **Architecture Blueprint** (Full Backend + Frontend Implementation Planned)

> **⚠️ IMPLEMENTATION NOTE**  
> This document describes the **planned plugin system architecture**.  
> **Current**: No plugin system implemented  
> **Planned**: Frontend plugin loader + Laravel plugin API + Event-driven hooks  
> **Architecture**: API-First dengan client-side plugin execution & server-side registry

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Plugin Architecture](#plugin-architecture)
3. [Plugin Structure & Anatomy](#plugin-structure--anatomy)
4. [Hook & Filter System](#hook--filter-system)
5. [Plugin Categories](#plugin-categories)
6. [Security & Sandboxing](#security--sandboxing)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Marketplace Integration](#marketplace-integration)
10. [Plugin Development Kit (PDK)](#plugin-development-kit-pdk)
11. [Code Examples](#code-examples)
12. [Migration Strategy](#migration-strategy)

---

## EXECUTIVE SUMMARY

### What is Plugin Marketplace System?

Plugin Marketplace System adalah **comprehensive extensibility platform** yang memungkinkan:
- **Plugin Development**: SDK untuk third-party developers extend platform functionality
- **Plugin Distribution**: Marketplace untuk discover, purchase, install plugins
- **Plugin Management**: Lifecycle management (install, activate, configure, update, delete)
- **Event-Driven Architecture**: Hooks & Filters untuk plugin integration tanpa modify core

### Business Value

**Revenue Opportunities:**
- 💰 **Marketplace Commission**: 25-30% dari setiap plugin sale
- 💰 **Premium Plugins**: Payment gateways, advanced analytics, CRM integrations
- 💰 **Subscription Plugins**: Recurring revenue dari SaaS plugin subscriptions
- 💰 **Developer Ecosystem**: Attract 5,000+ developers untuk monetization

**Platform Benefits:**
- 🚀 **Unlimited Extensibility**: Add any feature tanpa fork codebase
- 🚀 **Faster Feature Development**: Community-driven feature additions
- 🚀 **Competitive Advantage**: Ecosystem attracts more users
- 🚀 **Reduced Maintenance**: Third-party plugins maintained by developers

### Technical Benefits

- ✅ **Zero Downtime**: Install/uninstall plugins tanpa restart
- ✅ **Isolated Execution**: Sandboxed plugin environment
- ✅ **Version Control**: Plugin versioning dengan dependency management
- ✅ **Performance**: Lazy loading & resource optimization
- ✅ **Security**: Permission-based API access, code signing

---

## PLUGIN ARCHITECTURE

### Architecture Overview (API-First with Hybrid Execution)

**🚧 PLANNED Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│         FRONTEND (React SPA) - 🚧 PLANNED                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Plugin Loader (Frontend)                          │     │
│  │  • Fetch enabled plugins dari API                  │     │
│  │  • Load plugin scripts (dynamic imports)           │     │
│  │  • Initialize plugin instances                     │     │
│  │  • Register plugin hooks                           │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Frontend Plugin Hooks System                      │     │
│  │  • UI extension points (slots)                     │     │
│  │  • Component injection                             │     │
│  │  • Route additions                                 │     │
│  │  • Event subscriptions                             │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Active Plugins (Client-Side)                      │     │
│  │  • Analytics plugin (tracking)                     │     │
│  │  • Custom widgets                                  │     │
│  │  • UI enhancements                                 │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
                       │
                       │ API Requests
                       ▼
┌──────────────────────────────────────────────────────────────┐
│         BACKEND API (Laravel) - 🚧 PLANNED                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Plugin Registry API                               │     │
│  │  • GET /api/plugins (list available plugins)       │     │
│  │  • GET /api/plugins/enabled (tenant-specific)      │     │
│  │  • POST /api/plugins/{slug}/install                │     │
│  │  • POST /api/plugins/{slug}/activate               │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Plugin Orchestrator                               │     │
│  │  • Plugin discovery & loading                      │     │
│  │  • Dependency resolution                           │     │
│  │  • Lifecycle management (init, boot, shutdown)     │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       ▼                                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Event Dispatcher (Laravel Events)                 │     │
│  │  • Hook registry                                   │     │
│  │  • Event broadcasting                              │     │
│  │  • Filter pipeline                                 │     │
│  └────────┬───────────────────────┬───────────────────┘     │
│           │                       │                          │
│  ┌────────▼─────────┐   ┌────────▼──────────┐              │
│  │  HOOK SYSTEM     │   │  FILTER SYSTEM    │              │
│  │  • Actions       │   │  • Data transform │              │
│  │  • Events        │   │  • Pipelines      │              │
│  └──────────────────┘   └───────────────────┘              │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ Plugin Implementations
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND PLUGINS (Server-Side)              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Payment   │  │  Shipping   │  │  Email      │         │
│  │   Gateway   │  │  Provider   │  │  Marketing  │         │
│  │   Plugin    │  │   Plugin    │  │  Plugin     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  Each backend plugin has:                                   │
│  • Service Provider (Laravel)                               │
│  • Event Listeners & Hooks                                  │
│  • API Routes                                               │
│  • Database Migrations                                      │
│  • Business Logic                                           │
└──────────────────────────────────────────────────────────────┘
```

### Frontend Plugin Architecture (React/TypeScript)

**Plugin Execution Model:**

Frontend plugins run in the **browser** dan dapat:
- ✅ Render UI components (forms, buttons, widgets)
- ✅ Hook into application lifecycle events
- ✅ Modify data via filters
- ✅ Communicate dengan backend API
- ✅ Access localStorage, sessionStorage
- ❌ **TIDAK BISA** akses langsung ke database
- ❌ **TIDAK BISA** execute server-side code

**Plugin Lifecycle:**

```typescript
// 1. Plugin Discovery
PluginLoader.discover() 
  → Fetch enabled plugins from API
  → Download plugin bundles

// 2. Plugin Loading
PluginLoader.load(pluginSlug)
  → Dynamic import plugin bundle
  → Validate plugin manifest
  → Check dependencies

// 3. Plugin Initialization
plugin.init(context)
  → Load plugin settings
  → Register hooks & filters
  → Initialize services

// 4. Plugin Activation
plugin.activate()
  → Mount React components
  → Subscribe to events
  → Start background tasks

// 5. Plugin Execution
HookManager.executeHook('order.created', order)
  → Call plugin callbacks
  → Apply filters
  → Collect results

// 6. Plugin Deactivation
plugin.deactivate()
  → Unmount components
  → Clean up listeners
  → Cancel pending tasks
```

**Plugin Communication Flow:**

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND (React SPA)                                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  User Action (e.g., Click "Pay with Stripe")  │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │  Plugin Hook Triggered                         │     │
│  │  hooks.doAction('payment.process', data)       │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │  Stripe Plugin Callback Executes               │     │
│  │  processor.processPayment(data)                │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │  Call Backend API via Stripe Service           │     │
│  │  POST /api/payments/stripe/process             │     │
│  └──────────────────┬─────────────────────────────┘     │
└────────────────────┼──────────────────────────────────────┘
                     │
                     │ HTTPS Request
                     ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND API (Laravel - PLANNED)                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  API Endpoint: StripeController@processPayment │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │  Stripe Backend Plugin Service                 │     │
│  │  - Validate payment data                       │     │
│  │  - Call Stripe API (server-side)               │     │
│  │  - Store transaction in database               │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │  Return Response (success/failure)             │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

**Example: Analytics Plugin (Frontend Only):**

```typescript
// FILE: src/GoogleAnalyticsPlugin.ts
export class GoogleAnalyticsPlugin implements PluginInterface {
  async init(context: PluginContext): Promise<void> {
    // Load GA script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.settings.tracking_id}`;
    document.head.appendChild(script);
    
    // Register hooks to track events
    context.hooks.addAction('page.view', 'ga-track-page', (url: string) => {
      gtag('event', 'page_view', { page_path: url });
    });
    
    context.hooks.addAction('product.view', 'ga-track-product', (product: any) => {
      gtag('event', 'view_item', {
        items: [{ id: product.id, name: product.name }],
      });
    });
    
    context.hooks.addAction('order.complete', 'ga-track-purchase', (order: any) => {
      gtag('event', 'purchase', {
        transaction_id: order.id,
        value: order.total,
        currency: 'USD',
      });
    });
  }
}
```

### Core Principles

#### 1. Event-Driven Architecture

**Hooks (Actions)**: Execute code at specific points
```php
// Core triggers hook
do_action('order.created', $order);

// Plugin listens to hook
add_action('order.created', function($order) {
    // Send to analytics
    Analytics::track('order_created', $order->toArray());
});
```

**Filters**: Transform data before use
```php
// Core applies filter
$price = apply_filters('product.price', $basePrice, $product);

// Plugin modifies price
add_filter('product.price', function($price, $product) {
    if ($product->on_sale) {
        return $price * 0.9; // 10% discount
    }
    return $price;
}, 10, 2);
```

#### 2. Plugin Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ INSTALL  │ -> │ ACTIVATE │ -> │  ACTIVE  │ -> │DEACTIVATE│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │                │               │
     │               │                │               │
  • Download      • Run           • Listen        • Stop
  • Validate      migrations      to hooks        listeners
  • Extract       • Register      • Execute       • Clear
  • Store         providers       filters         cache
                  • Boot          • Serve
                  plugin          routes
```

#### 3. Dependency Management

```json
{
  "name": "stripe-payment-gateway",
  "version": "2.1.0",
  "dependencies": {
    "stencil": ">=2.0.0",
    "plugins": {
      "payment-gateway-base": "^1.0.0"
    },
    "php_extensions": ["curl", "json"],
    "composer": {
      "stripe/stripe-php": "^10.0"
    }
  }
}
```

---

## PLUGIN STRUCTURE & ANATOMY

### Directory Structure

```
stripe-payment-gateway/
├── plugin.json                 # Plugin manifest
├── package.json               # NPM dependencies (React components)
├── composer.json              # Backend PHP dependencies (optional, for API)
├── README.md                  # Documentation
├── LICENSE                    # License file
├── icon.png                   # Plugin icon (256x256)
├── screenshot.png             # Screenshot (1200x900)
│
├── src/                       # Frontend Plugin Code (React/TypeScript)
│   ├── index.ts              # Plugin entry point
│   ├── StripePaymentPlugin.ts # Main plugin class
│   ├── components/           # React components
│   │   ├── CheckoutForm.tsx
│   │   ├── PaymentButton.tsx
│   │   └── SettingsPanel.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useStripeCheckout.ts
│   │   └── useStripeSettings.ts
│   ├── services/             # Business logic
│   │   ├── StripeApiClient.ts
│   │   └── PaymentProcessor.ts
│   └── types/
│       └── index.d.ts        # TypeScript definitions
│
├── backend/                   # Backend Plugin Code (Laravel API - PLANNED)
│   ├── src/
│   │   ├── StripePaymentServiceProvider.php
│   │   ├── StripePaymentGateway.php
│   │   ├── Webhooks/
│   │   │   └── StripeWebhookHandler.php
│   │   └── Http/
│   │       └── Controllers/
│   │           └── StripeController.php
│   ├── routes/
│   │   ├── api.php           # API routes
│   │   └── webhooks.php      # Webhook routes
│   └── database/
│       └── migrations/
│           └── 2025_01_01_000000_create_stripe_transactions_table.php
│
├── assets/                    # Static assets
│   ├── css/
│   │   └── stripe-styles.css
│   └── images/
│       └── payment-icons/
│
├── config/
│   └── default-settings.json  # Default plugin settings
│
├── hooks/                     # Hook definitions
│   ├── actions.ts            # Action hooks (frontend)
│   └── filters.ts            # Filter hooks (frontend)
│
└── tests/
    ├── unit/                 # Jest unit tests
    ├── integration/          # Integration tests
    └── e2e/                  # Playwright E2E tests
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "Stripe Payment Gateway",
  "slug": "stripe-payment-gateway",
  "version": "2.1.0",
  "description": "Accept credit card payments via Stripe with support for 3D Secure, Apple Pay, and Google Pay",
  
  "author": {
    "name": "Payment Solutions Inc",
    "email": "support@paymentsolutions.com",
    "url": "https://paymentsolutions.com"
  },
  
  "type": "payment-gateway",
  "category": "payments",
  "tags": ["stripe", "payment", "credit-card", "3d-secure"],
  
  "main": "src/StripePaymentServiceProvider.php",
  
  "compatibility": {
    "stencil_version": ">=2.0.0",
    "php_version": ">=8.1",
    "required_plugins": [],
    "conflicts_with": []
  },
  
  "dependencies": {
    "php_extensions": ["curl", "json", "mbstring"],
    "composer": {
      "stripe/stripe-php": "^10.0"
    },
    "npm": {
      "@stripe/stripe-js": "^1.54.0"
    }
  },
  
  "permissions": {
    "required": [
      "orders.read",
      "orders.update",
      "payments.create",
      "webhooks.register"
    ],
    "optional": [
      "customers.read",
      "analytics.track"
    ]
  },
  
  "hooks": {
    "actions": [
      "checkout.payment_method_selected",
      "order.payment_processing",
      "order.payment_completed"
    ],
    "filters": [
      "payment.available_methods",
      "order.total_amount"
    ]
  },
  
  "settings": {
    "schema": {
      "publishable_key": {
        "type": "string",
        "label": "Publishable Key",
        "required": true
      },
      "secret_key": {
        "type": "secret",
        "label": "Secret Key",
        "required": true
      },
      "webhook_secret": {
        "type": "secret",
        "label": "Webhook Secret"
      },
      "enable_3d_secure": {
        "type": "boolean",
        "label": "Enable 3D Secure",
        "default": true
      },
      "capture_method": {
        "type": "select",
        "label": "Capture Method",
        "options": [
          {"value": "automatic", "label": "Automatic"},
          {"value": "manual", "label": "Manual"}
        ],
        "default": "automatic"
      }
    }
  },
  
  "pricing": {
    "type": "paid",
    "price": 49.00,
    "currency": "USD",
    "billing": "one-time",
    "license": "single-site"
  },
  
  "support": {
    "email": "support@paymentsolutions.com",
    "docs": "https://docs.paymentsolutions.com/stripe",
    "forum": "https://forum.paymentsolutions.com"
  },
  
  "changelog": [
    {
      "version": "2.1.0",
      "date": "2025-11-01",
      "changes": [
        "Added Apple Pay support",
        "Added Google Pay support",
        "Improved 3D Secure flow",
        "Fixed refund webhook handling"
      ]
    }
  ]
}
```

### Plugin Implementation

**Frontend Plugin Class (React/TypeScript):**

```typescript
// FILE: src/StripePaymentPlugin.ts
import type { PluginInterface, PluginHooks, PluginContext } from '@/core/plugins/types';
import CheckoutForm from './components/CheckoutForm';
import PaymentButton from './components/PaymentButton';
import SettingsPanel from './components/SettingsPanel';
import { StripeApiClient } from './services/StripeApiClient';
import { PaymentProcessor } from './services/PaymentProcessor';

/**
 * Stripe Payment Gateway Plugin (Frontend)
 * Handles Stripe payment integration for checkout flow
 */
export class StripePaymentPlugin implements PluginInterface {
  public readonly slug = 'stripe-payment-gateway';
  public readonly version = '2.1.0';
  
  private apiClient: StripeApiClient;
  private processor: PaymentProcessor;
  private settings: Record<string, any> = {};
  
  /**
   * Initialize plugin
   */
  async init(context: PluginContext): Promise<void> {
    // Load plugin settings from API
    this.settings = await context.api.get(`/plugins/${this.slug}/settings`);
    
    // Initialize Stripe API client
    this.apiClient = new StripeApiClient(
      this.settings.publishable_key
    );
    
    // Initialize payment processor
    this.processor = new PaymentProcessor(this.apiClient);
    
    // Register hooks
    this.registerHooks(context.hooks);
    
    // Register filters
    this.registerFilters(context.hooks);
  }
  
  /**
   * Register action hooks
   */
  private registerHooks(hooks: PluginHooks): void {
    // Add Stripe to available payment methods
    hooks.addAction(
      'payment.methods.register',
      'stripe-register-method',
      (registry: any) => {
        registry.add('stripe', {
          name: 'Credit/Debit Card',
          description: 'Pay securely with Stripe',
          icon: '/plugins/stripe/icon.svg',
          component: PaymentButton,
        });
      }
    );
    
    // Process payment on checkout
    hooks.addAction(
      'checkout.payment.process',
      'stripe-process-payment',
      async (paymentData: any) => {
        if (paymentData.method === 'stripe') {
          return await this.processor.processPayment(paymentData);
        }
      }
    );
    
    // Handle payment success
    hooks.addAction(
      'payment.success',
      'stripe-payment-success',
      async (result: any) => {
        console.log('Stripe payment succeeded:', result);
      }
    );
  }
  
  /**
   * Register filter hooks
   */
  private registerFilters(hooks: PluginHooks): void {
    // Add Stripe to payment method dropdown
    hooks.addFilter(
      'payment.available_methods',
      'stripe-available-method',
      (methods: any[]) => {
        return [
          ...methods,
          {
            id: 'stripe',
            name: 'Credit/Debit Card',
            description: 'Pay securely with Stripe (Visa, Mastercard, Amex)',
            icon: '/plugins/stripe/icon.svg',
            enabled: this.settings.enabled ?? true,
          },
        ];
      }
    );
    
    // Apply Stripe payment processing fee
    hooks.addFilter(
      'checkout.calculate_total',
      'stripe-processing-fee',
      (total: number) => {
        if (this.settings.add_processing_fee) {
          const fee = total * 0.029 + 0.30;
          return total + fee;
        }
        return total;
      }
    );
  }
  
  /**
   * Register React components for plugin UI
   */
  getComponents(): Record<string, React.ComponentType> {
    return {
      CheckoutForm,
      PaymentButton,
      SettingsPanel,
    };
  }
  
  /**
   * Plugin activation callback
   */
  async activate(): Promise<void> {
    console.log('Stripe Payment Gateway activated');
    
    // Verify API keys
    const isValid = await this.apiClient.verifyKeys();
    if (!isValid) {
      throw new Error('Invalid Stripe API keys. Please check your settings.');
    }
    
    // Register webhook endpoint with Stripe (via backend API)
    await this.registerWebhook();
  }
  
  /**
   * Plugin deactivation callback
   */
  async deactivate(): Promise<void> {
    console.log('Stripe Payment Gateway deactivated');
    
    // Unregister webhook endpoint
    await this.unregisterWebhook();
  }
  
  /**
   * Register webhook with Stripe via backend API
   */
  private async registerWebhook(): Promise<void> {
    const response = await fetch('/api/plugins/stripe/webhooks/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${window.location.origin}/api/webhooks/stripe`,
        events: [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'charge.refunded',
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to register Stripe webhook');
    }
  }
  
  /**
   * Unregister webhook from Stripe
   */
  private async unregisterWebhook(): Promise<void> {
    await fetch('/api/plugins/stripe/webhooks/unregister', {
      method: 'POST',
    });
  }
}

// Export plugin instance
export default new StripePaymentPlugin();
```

**Backend Service Provider (🚧 PLANNED - Laravel API):**

```php
// FILE: backend/src/StripePaymentServiceProvider.php (PLANNED)
namespace StripePaymentGateway;

use Illuminate\Support\ServiceProvider;
use Stencil\Plugin\Contracts\PluginInterface;

class StripePaymentServiceProvider extends ServiceProvider implements PluginInterface
{
    public function register(): void
    {
        // Merge plugin config
        $this->mergeConfigFrom(__DIR__.'/../config/stripe.php', 'stripe');
        
        // Register Stripe gateway service
        $this->app->singleton(StripePaymentGateway::class, function ($app) {
            return new StripePaymentGateway(config('stripe.secret_key'));
        });
    }
    
    public function boot(): void
    {
        // Load API routes (webhook handlers)
        $this->loadRoutesFrom(__DIR__.'/../routes/api.php');
        $this->loadRoutesFrom(__DIR__.'/../routes/webhooks.php');
        
        // Load database migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
    
    public function activate(): void
    {
        // Run plugin database migrations
        Artisan::call('migrate', ['--path' => 'plugins/stripe/migrations', '--force' => true]);
    }
    
    public function deactivate(): void
    {
        // Plugin cleanup on deactivation
    }
}
```

---

## HOOK & FILTER SYSTEM

### Hook System Architecture

```php
namespace Stencil\Plugin\Hooks;

class HookManager
{
    protected array $actions = [];
    protected array $filters = [];
    
    /**
     * Register action hook
     */
    public function addAction(
        string $hook,
        callable $callback,
        int $priority = 10,
        int $acceptedArgs = 1
    ): void {
        $this->actions[$hook][$priority][] = [
            'callback' => $callback,
            'accepted_args' => $acceptedArgs,
        ];
    }
    
    /**
     * Execute action hook
     */
    public function doAction(string $hook, ...$args): void
    {
        if (!isset($this->actions[$hook])) {
            return;
        }
        
        // Sort by priority
        ksort($this->actions[$hook]);
        
        foreach ($this->actions[$hook] as $priority => $callbacks) {
            foreach ($callbacks as $callback) {
                $callbackArgs = array_slice(
                    $args, 
                    0, 
                    $callback['accepted_args']
                );
                
                call_user_func_array(
                    $callback['callback'], 
                    $callbackArgs
                );
            }
        }
    }
    
    /**
     * Register filter hook
     */
    public function addFilter(
        string $hook,
        callable $callback,
        int $priority = 10,
        int $acceptedArgs = 1
    ): void {
        $this->filters[$hook][$priority][] = [
            'callback' => $callback,
            'accepted_args' => $acceptedArgs,
        ];
    }
    
    /**
     * Apply filter hook
     */
    public function applyFilters(string $hook, $value, ...$args): mixed
    {
        if (!isset($this->filters[$hook])) {
            return $value;
        }
        
        // Sort by priority
        ksort($this->filters[$hook]);
        
        foreach ($this->filters[$hook] as $priority => $callbacks) {
            foreach ($callbacks as $callback) {
                $callbackArgs = array_merge(
                    [$value],
                    array_slice($args, 0, $callback['accepted_args'] - 1)
                );
                
                $value = call_user_func_array(
                    $callback['callback'],
                    $callbackArgs
                );
            }
        }
        
        return $value;
    }
}
```

### Global Helper Functions

```php
/**
 * Register action hook
 */
function add_action(string $hook, callable $callback, int $priority = 10, int $args = 1): void
{
    app('plugin.hooks')->addAction($hook, $callback, $priority, $args);
}

/**
 * Execute action hook
 */
function do_action(string $hook, ...$args): void
{
    app('plugin.hooks')->doAction($hook, ...$args);
}

/**
 * Register filter hook
 */
function add_filter(string $hook, callable $callback, int $priority = 10, int $args = 1): void
{
    app('plugin.hooks')->addFilter($hook, $callback, $priority, $args);
}

/**
 * Apply filter hook
 */
function apply_filters(string $hook, $value, ...$args): mixed
{
    return app('plugin.hooks')->applyFilters($hook, $value, ...$args);
}
```

### Core Hooks Reference

#### Order Hooks

```php
// Order lifecycle
do_action('order.creating', $orderData);           // Before order created
do_action('order.created', $order);                // After order created
do_action('order.updating', $order, $changes);     // Before update
do_action('order.updated', $order, $oldOrder);     // After update
do_action('order.status_changed', $order, $oldStatus, $newStatus);

// Payment hooks
do_action('order.payment_processing', $order);
do_action('order.payment_completed', $order, $payment);
do_action('order.payment_failed', $order, $error);

// Fulfillment hooks
do_action('order.fulfillment_started', $order);
do_action('order.shipped', $order, $tracking);
do_action('order.delivered', $order);
do_action('order.cancelled', $order, $reason);
```

#### Product Hooks

```php
do_action('product.created', $product);
do_action('product.updated', $product);
do_action('product.deleted', $product);
do_action('product.stock_updated', $product, $oldStock, $newStock);
do_action('product.price_changed', $product, $oldPrice, $newPrice);
```

#### User Hooks

```php
do_action('user.registered', $user);
do_action('user.login', $user);
do_action('user.logout', $user);
do_action('user.profile_updated', $user);
```

#### Core Filters

```php
// Price filters
$price = apply_filters('product.price', $basePrice, $product);
$total = apply_filters('cart.total', $subtotal, $cart);
$tax = apply_filters('order.tax_amount', $calculatedTax, $order);

// Content filters
$description = apply_filters('product.description', $rawDescription, $product);
$title = apply_filters('product.title', $rawTitle, $product);

// Email filters
$subject = apply_filters('email.subject', $defaultSubject, $emailType);
$body = apply_filters('email.body', $defaultBody, $emailType, $data);

// Validation filters
$errors = apply_filters('validation.errors', $errors, $validator);
$rules = apply_filters('validation.rules', $rules, $model);
```

---

## PLUGIN CATEGORIES

> **📌 PLUGIN EXECUTION MODEL:**  
> Plugins di Stencil menggunakan **Hybrid Execution Model**:
> - **Frontend Plugins** (React/TypeScript): UI components, client-side logic, analytics
> - **Backend Plugins** (Laravel/PHP - PLANNED): Server-side processing, webhooks, database operations
> - **Full-Stack Plugins**: Kombinasi frontend + backend untuk fitur kompleks (e.g., payment gateways)

### Frontend Plugin Categories

Plugins yang dijalankan di **browser** (React):
- 🎨 **UI Enhancements**: Custom widgets, themes, animations
- 📊 **Analytics & Tracking**: Google Analytics, Facebook Pixel, Hotjar
- 🔔 **Notifications**: Toast messages, browser push notifications
- 🌐 **Localization**: Multi-language support, RTL layouts
- ♿ **Accessibility**: Screen reader support, keyboard navigation

### Backend Plugin Categories (🚧 PLANNED)

Plugins yang dijalankan di **server** (Laravel):
- 💳 **Payment Gateways**: Stripe, PayPal, Midtrans, Xendit
- 🚚 **Shipping Providers**: JNE, J&T, SiCepat, custom calculators
- 📧 **Email Marketing**: Mailchimp, SendGrid, custom SMTP
- 📱 **SMS Providers**: Twilio, Vonage, custom gateways
- 🔗 **CRM/ERP Integration**: Salesforce, Odoo, Zoho, custom APIs

### Full-Stack Plugin Categories

Plugins yang memerlukan **frontend + backend**:
- 💳 **Payment Gateways**: Frontend checkout UI + Backend payment processing
- 🔐 **Social Login**: Frontend OAuth buttons + Backend token verification
- 💬 **Live Chat**: Frontend chat widget + Backend message routing
- 📊 **Advanced Reports**: Frontend dashboard + Backend data aggregation

---

### 1. Payment Gateway Plugins (Full-Stack)

**Frontend Responsibilities:**
- Render checkout form
- Collect payment details (securely)
- Display payment status
- Handle 3D Secure flows

**Backend Responsibilities (🚧 PLANNED):**
- Process payment via gateway API
- Handle webhooks
- Store transaction records
- Manage refunds

**Examples:**
- ✅ Stripe Payment Gateway
- ✅ PayPal Express Checkout
- ✅ Midtrans (Indonesian payment gateway)
- ✅ Xendit (Southeast Asia payment gateway)
- ✅ Razorpay (India)
- ✅ Mollie (Europe)

**Interface:**

```php
interface PaymentGatewayInterface
{
    public function createPaymentIntent(Order $order): PaymentIntent;
    public function capturePayment(string $intentId): Payment;
    public function refundPayment(string $paymentId, float $amount): Refund;
    public function handleWebhook(Request $request): WebhookResponse;
}
```

### 2. Shipping Provider Plugins

**Examples:**
- ✅ JNE (Indonesia)
- ✅ J&T Express
- ✅ SiCepat
- ✅ FedEx
- ✅ DHL
- ✅ Custom rate calculator

**Interface:**

```php
interface ShippingProviderInterface
{
    public function calculateRates(Address $origin, Address $destination, Package $package): array;
    public function createShipment(Order $order): Shipment;
    public function trackShipment(string $trackingNumber): TrackingInfo;
    public function cancelShipment(string $shipmentId): bool;
}
```

### 3. Analytics Plugins

**Examples:**
- ✅ Google Analytics 4
- ✅ Facebook Pixel
- ✅ TikTok Pixel
- ✅ Hotjar
- ✅ Mixpanel
- ✅ Custom analytics

**Interface:**

```php
interface AnalyticsProviderInterface
{
    public function trackPageView(string $url, array $meta): void;
    public function trackEvent(string $event, array $data): void;
    public function trackConversion(Order $order): void;
    public function identifyUser(User $user): void;
}
```

### 4. Marketing Plugins

**Examples:**
- ✅ Mailchimp integration
- ✅ SendGrid email marketing
- ✅ SMS notifications (Twilio)
- ✅ Push notifications (OneSignal)
- ✅ WhatsApp Business API

### 5. Inventory Management Plugins

**Examples:**
- ✅ Multi-warehouse management
- ✅ Stock alerts & notifications
- ✅ Barcode/SKU management
- ✅ Stock forecasting

### 6. CRM/ERP Integration Plugins

**Examples:**
- ✅ Salesforce integration
- ✅ Odoo ERP
- ✅ Zoho CRM
- ✅ Custom API integrations

### 7. Discount & Loyalty Plugins

**Examples:**
- ✅ Advanced coupon system
- ✅ Loyalty points program
- ✅ Referral system
- ✅ Volume pricing

### 8. SEO & Marketing Tools

**Examples:**
- ✅ SEO metadata manager
- ✅ Sitemap generator
- ✅ Schema.org markup
- ✅ Social media auto-post

---

## SECURITY & SANDBOXING

### Security Layers

#### 1. Permission-Based API Access

```php
class PluginApiMiddleware
{
    public function handle($request, Closure $next)
    {
        $plugin = $request->plugin();
        $requiredPermission = $request->route()->permission;
        
        if (!$plugin->hasPermission($requiredPermission)) {
            throw new UnauthorizedException(
                "Plugin '{$plugin->slug}' does not have permission '{$requiredPermission}'"
            );
        }
        
        return $next($request);
    }
}

// Usage in plugin routes
Route::middleware(['plugin.auth', 'plugin.permission:orders.read'])
    ->get('/orders', [OrderController::class, 'index']);
```

#### 2. Resource Limits

```php
class PluginResourceMonitor
{
    protected array $limits = [
        'max_execution_time' => 30,      // seconds
        'max_memory' => 128 * 1024 * 1024, // 128MB
        'max_api_calls_per_minute' => 100,
        'max_database_queries' => 1000,
        'max_http_requests' => 50,
    ];
    
    public function monitor(Plugin $plugin, Closure $callback)
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();
        
        try {
            // Set limits
            set_time_limit($this->limits['max_execution_time']);
            ini_set('memory_limit', $this->limits['max_memory']);
            
            // Execute plugin code
            $result = $callback();
            
            // Log usage
            $this->logResourceUsage($plugin, [
                'execution_time' => microtime(true) - $startTime,
                'memory_used' => memory_get_usage() - $startMemory,
            ]);
            
            return $result;
            
        } catch (\Throwable $e) {
            // Log error and notify
            $this->handlePluginError($plugin, $e);
            throw $e;
        }
    }
}
```

#### 3. Code Signing & Verification

```php
class PluginVerifier
{
    public function verify(Plugin $plugin): bool
    {
        // 1. Check digital signature
        if (!$this->verifySignature($plugin)) {
            throw new SecurityException('Invalid plugin signature');
        }
        
        // 2. Scan for malware
        if (!$this->scanMalware($plugin)) {
            throw new SecurityException('Malware detected in plugin');
        }
        
        // 3. Check for vulnerable dependencies
        if ($vulnerabilities = $this->checkVulnerabilities($plugin)) {
            throw new SecurityException(
                'Vulnerable dependencies: ' . implode(', ', $vulnerabilities)
            );
        }
        
        return true;
    }
    
    protected function verifySignature(Plugin $plugin): bool
    {
        $signature = $plugin->getManifest()['signature'] ?? null;
        $publicKey = $this->getPublisherPublicKey($plugin->author_id);
        
        return openssl_verify(
            $plugin->getChecksumData(),
            base64_decode($signature),
            $publicKey,
            OPENSSL_ALGO_SHA256
        ) === 1;
    }
}
```

#### 4. Sandboxed Execution

```php
class PluginSandbox
{
    protected array $allowedFunctions = [
        'array_*',
        'str_*',
        'json_*',
        'date',
        'time',
        // ... safe functions
    ];
    
    protected array $blockedFunctions = [
        'exec',
        'shell_exec',
        'system',
        'passthru',
        'eval',
        'assert',
        'file_put_contents',
        'unlink',
        // ... dangerous functions
    ];
    
    public function execute(Plugin $plugin, callable $code)
    {
        // Disable dangerous functions
        ini_set('disable_functions', implode(',', $this->blockedFunctions));
        
        // Restrict file system access
        $this->restrictFileAccess($plugin);
        
        // Execute in isolated context
        try {
            return $code();
        } finally {
            // Restore settings
            $this->restoreSettings();
        }
    }
}
```

---

## DATABASE SCHEMA

### 1. plugins

**Description**: Plugin registry - all available plugins

```sql
CREATE TABLE plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    
    -- Type & Category
    type VARCHAR(50) NOT NULL, -- payment-gateway, shipping, analytics, etc
    category VARCHAR(50),
    tags VARCHAR(50)[],
    
    -- Author
    author_name VARCHAR(200),
    author_email VARCHAR(255),
    author_url VARCHAR(500),
    author_verified BOOLEAN DEFAULT false,
    
    -- Storage
    storage_path TEXT NOT NULL,
    manifest JSONB NOT NULL,
    main_file VARCHAR(500), -- Entry point (ServiceProvider)
    
    -- Marketplace
    is_marketplace_plugin BOOLEAN DEFAULT false,
    marketplace_listing_id UUID,
    
    -- Compatibility
    min_stencil_version VARCHAR(20),
    max_stencil_version VARCHAR(20),
    required_php_version VARCHAR(20),
    required_php_extensions VARCHAR(50)[],
    required_plugins JSONB DEFAULT '[]',
    conflicts_with JSONB DEFAULT '[]',
    
    -- Dependencies
    composer_dependencies JSONB DEFAULT '{}',
    npm_dependencies JSONB DEFAULT '{}',
    
    -- Permissions
    required_permissions VARCHAR(100)[],
    optional_permissions VARCHAR(100)[],
    
    -- Hooks & Filters
    registered_hooks JSONB DEFAULT '[]',
    registered_filters JSONB DEFAULT '[]',
    
    -- Media
    icon_url TEXT,
    screenshot_url TEXT,
    screenshots JSONB DEFAULT '[]',
    demo_url VARCHAR(500),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, deprecated, suspended
    is_official BOOLEAN DEFAULT false,
    security_scanned BOOLEAN DEFAULT false,
    security_scan_date TIMESTAMP,
    
    -- Stats (denormalized)
    installations_count INT DEFAULT 0,
    active_installations INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deprecated_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT plugins_version_check CHECK (version ~ '^\d+\.\d+\.\d+')
);

CREATE INDEX idx_plugins_slug ON plugins(slug);
CREATE INDEX idx_plugins_type ON plugins(type);
CREATE INDEX idx_plugins_category ON plugins(category);
CREATE INDEX idx_plugins_status ON plugins(status) WHERE status = 'active';
CREATE INDEX idx_plugins_marketplace ON plugins(is_marketplace_plugin) WHERE is_marketplace_plugin = true;
CREATE INDEX idx_plugins_tags ON plugins USING GIN(tags);
CREATE INDEX idx_plugins_manifest ON plugins USING GIN(manifest);
```

**Fields**: 37 fields

---

### 2. plugin_installations

**Description**: Per-tenant plugin installations

```sql
CREATE TABLE plugin_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    
    -- Version
    installed_version VARCHAR(20) NOT NULL,
    latest_available_version VARCHAR(20),
    
    -- Installation
    installation_source VARCHAR(50), -- marketplace, upload, git
    installed_by UUID REFERENCES users(id),
    
    -- Activation
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP,
    activated_by UUID REFERENCES users(id),
    
    -- License
    license_key VARCHAR(255),
    license_type VARCHAR(50),
    license_valid_until TIMESTAMP,
    
    -- Auto Update
    auto_update_enabled BOOLEAN DEFAULT false,
    last_update_check TIMESTAMP,
    
    -- Health
    health_status VARCHAR(50) DEFAULT 'healthy', -- healthy, warning, error
    last_error TEXT,
    error_count INT DEFAULT 0,
    
    -- Resource Usage
    last_execution_time FLOAT, -- milliseconds
    avg_execution_time FLOAT,
    total_executions BIGINT DEFAULT 0,
    
    -- Metadata
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uninstalled_at TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, plugin_id)
);

CREATE INDEX idx_plugin_installations_tenant ON plugin_installations(tenant_id);
CREATE INDEX idx_plugin_installations_plugin ON plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_active ON plugin_installations(tenant_id, is_active) 
    WHERE is_active = true;
CREATE INDEX idx_plugin_installations_health ON plugin_installations(health_status) 
    WHERE health_status != 'healthy';
```

**Fields**: 25 fields

---

### 3. plugin_settings

**Description**: Tenant-specific plugin configurations

```sql
CREATE TABLE plugin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plugin_installation_id UUID NOT NULL REFERENCES plugin_installations(id) ON DELETE CASCADE,
    
    -- Setting
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50), -- string, number, boolean, secret, json
    
    -- Encryption
    is_encrypted BOOLEAN DEFAULT false,
    
    -- Validation
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB,
    
    -- Metadata
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tenant_id, plugin_installation_id, setting_key)
);

CREATE INDEX idx_plugin_settings_tenant ON plugin_settings(tenant_id);
CREATE INDEX idx_plugin_settings_installation ON plugin_settings(plugin_installation_id);
CREATE INDEX idx_plugin_settings_key ON plugin_settings(setting_key);
```

**Fields**: 13 fields

---

### 4. plugin_hooks

**Description**: Hook registry - tracks registered hooks

```sql
CREATE TABLE plugin_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Hook Info
    hook_name VARCHAR(200) NOT NULL,
    hook_type VARCHAR(20) NOT NULL, -- action, filter
    
    -- Plugin
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    plugin_installation_id UUID REFERENCES plugin_installations(id) ON DELETE CASCADE,
    
    -- Callback
    callback_class VARCHAR(500),
    callback_method VARCHAR(200),
    callback_priority INT DEFAULT 10,
    accepted_args INT DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Stats
    execution_count BIGINT DEFAULT 0,
    total_execution_time FLOAT DEFAULT 0, -- milliseconds
    avg_execution_time FLOAT DEFAULT 0,
    last_execution_at TIMESTAMP,
    
    -- Errors
    error_count INT DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMP,
    
    -- Metadata
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(hook_name, plugin_id, callback_class, callback_method)
);

CREATE INDEX idx_hooks_name ON plugin_hooks(hook_name);
CREATE INDEX idx_hooks_type ON plugin_hooks(hook_type);
CREATE INDEX idx_hooks_plugin ON plugin_hooks(plugin_id);
CREATE INDEX idx_hooks_active ON plugin_hooks(is_active) WHERE is_active = true;
CREATE INDEX idx_hooks_priority ON plugin_hooks(hook_name, callback_priority);
```

**Fields**: 20 fields

---

### 5. plugin_events

**Description**: Plugin event logs

```sql
CREATE TABLE plugin_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    plugin_installation_id UUID REFERENCES plugin_installations(id) ON DELETE CASCADE,
    
    -- Event
    event_type VARCHAR(50) NOT NULL, -- installed, activated, deactivated, updated, error
    event_name VARCHAR(200),
    
    -- Data
    event_data JSONB,
    
    -- Context
    user_id UUID REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Performance
    execution_time FLOAT, -- milliseconds
    memory_used BIGINT, -- bytes
    
    -- Error
    is_error BOOLEAN DEFAULT false,
    error_message TEXT,
    error_trace TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plugin_events_plugin ON plugin_events(plugin_id);
CREATE INDEX idx_plugin_events_type ON plugin_events(event_type);
CREATE INDEX idx_plugin_events_tenant ON plugin_events(tenant_id);
CREATE INDEX idx_plugin_events_errors ON plugin_events(is_error) WHERE is_error = true;
CREATE INDEX idx_plugin_events_created ON plugin_events(created_at DESC);
```

**Fields**: 17 fields

---

### 6. plugin_marketplace_listings

**Description**: Marketplace plugin catalog

```sql
CREATE TABLE plugin_marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plugin
    plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    
    -- Vendor
    vendor_id UUID NOT NULL REFERENCES users(id),
    vendor_name VARCHAR(200),
    vendor_verified BOOLEAN DEFAULT false,
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    pricing_type VARCHAR(50), -- free, one-time, subscription-monthly, subscription-yearly
    trial_period_days INT,
    
    -- License
    available_licenses JSONB DEFAULT '[{"type": "single-site", "price": 0}]',
    
    -- Marketing
    tagline VARCHAR(255),
    long_description TEXT,
    features_list JSONB DEFAULT '[]',
    
    -- Media
    gallery_images JSONB DEFAULT '[]',
    video_url VARCHAR(500),
    
    -- Support
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
    
    UNIQUE(plugin_id)
);

CREATE INDEX idx_marketplace_plugin ON plugin_marketplace_listings(plugin_id);
CREATE INDEX idx_marketplace_vendor ON plugin_marketplace_listings(vendor_id);
CREATE INDEX idx_marketplace_status ON plugin_marketplace_listings(status);
CREATE INDEX idx_marketplace_featured ON plugin_marketplace_listings(is_featured, featured_position);
CREATE INDEX idx_marketplace_rating ON plugin_marketplace_listings(rating_average DESC);
```

**Fields**: 36 fields

---

### 7. plugin_purchases

**Description**: Plugin purchase transactions

```sql
CREATE TABLE plugin_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    marketplace_listing_id UUID NOT NULL REFERENCES plugin_marketplace_listings(id),
    plugin_id UUID NOT NULL REFERENCES plugins(id),
    buyer_user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    
    -- Purchase
    license_type VARCHAR(50) NOT NULL,
    license_key VARCHAR(255) UNIQUE NOT NULL,
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    platform_fee DECIMAL(10,2),
    vendor_payout DECIMAL(10,2),
    
    -- Payment
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50), -- pending, completed, failed, refunded
    
    -- License
    activated_for_tenant UUID REFERENCES tenants(id),
    activation_count INT DEFAULT 0,
    max_activations INT DEFAULT 1,
    
    -- Subscription (if applicable)
    is_subscription BOOLEAN DEFAULT false,
    subscription_interval VARCHAR(20), -- monthly, yearly
    subscription_starts_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    subscription_renews_at TIMESTAMP,
    subscription_cancelled_at TIMESTAMP,
    
    -- Validity
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    
    -- Refund
    refund_requested_at TIMESTAMP,
    refund_reason TEXT,
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plugin_purchases_listing ON plugin_purchases(marketplace_listing_id);
CREATE INDEX idx_plugin_purchases_buyer ON plugin_purchases(buyer_user_id);
CREATE INDEX idx_plugin_purchases_tenant ON plugin_purchases(tenant_id);
CREATE INDEX idx_plugin_purchases_license ON plugin_purchases(license_key);
CREATE INDEX idx_plugin_purchases_subscription ON plugin_purchases(is_subscription, subscription_ends_at);
```

**Fields**: 32 fields

---

### 8. plugin_api_keys

**Description**: API keys for plugin authentication

```sql
CREATE TABLE plugin_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relations
    plugin_installation_id UUID NOT NULL REFERENCES plugin_installations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Key
    key_name VARCHAR(200),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255),
    
    -- Permissions
    scopes VARCHAR(100)[], -- Array of allowed permissions
    
    -- Rate Limiting
    rate_limit_per_minute INT DEFAULT 60,
    rate_limit_per_hour INT DEFAULT 1000,
    
    -- Usage
    last_used_at TIMESTAMP,
    usage_count BIGINT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id)
);

CREATE INDEX idx_api_keys_plugin ON plugin_api_keys(plugin_installation_id);
CREATE INDEX idx_api_keys_tenant ON plugin_api_keys(tenant_id);
CREATE INDEX idx_api_keys_key ON plugin_api_keys(api_key);
CREATE INDEX idx_api_keys_active ON plugin_api_keys(is_active) WHERE is_active = true;
```

**Fields**: 19 fields

---

## DATABASE SCHEMA SUMMARY

| Table | Fields | Purpose |
|-------|--------|---------|
| `plugins` | 37 | Plugin registry |
| `plugin_installations` | 25 | Per-tenant installations |
| `plugin_settings` | 13 | Plugin configurations |
| `plugin_hooks` | 20 | Hook registry |
| `plugin_events` | 17 | Event logs |
| `plugin_marketplace_listings` | 36 | Marketplace catalog |
| `plugin_purchases` | 32 | Purchase transactions |
| `plugin_api_keys` | 19 | API authentication |
| **TOTAL** | **199 fields** | **8 tables** |

---

## API ENDPOINTS

### Marketplace APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/plugins` | Browse plugins |
| GET | `/api/v1/marketplace/plugins/{slug}` | Get plugin details |
| GET | `/api/v1/marketplace/plugins/{slug}/versions` | List versions |
| GET | `/api/v1/marketplace/plugins/{slug}/reviews` | Get reviews |
| POST | `/api/v1/marketplace/plugins/{slug}/purchase` | Purchase plugin |

### Tenant Plugin Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tenants/{id}/plugins` | List installed plugins |
| POST | `/api/v1/tenants/{id}/plugins/install` | Install plugin |
| DELETE | `/api/v1/tenants/{id}/plugins/{pluginId}` | Uninstall plugin |
| POST | `/api/v1/tenants/{id}/plugins/{pluginId}/activate` | Activate plugin |
| POST | `/api/v1/tenants/{id}/plugins/{pluginId}/deactivate` | Deactivate plugin |
| PUT | `/api/v1/tenants/{id}/plugins/{pluginId}/update` | Update version |
| GET | `/api/v1/tenants/{id}/plugins/{pluginId}/settings` | Get settings |
| PUT | `/api/v1/tenants/{id}/plugins/{pluginId}/settings` | Update settings |

### Plugin Developer APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/plugins` | Submit new plugin |
| PUT | `/api/v1/plugins/{id}` | Update plugin |
| POST | `/api/v1/plugins/{id}/versions` | Upload new version |
| GET | `/api/v1/plugins/{id}/analytics` | Get analytics |
| GET | `/api/v1/plugins/{id}/revenue` | Get revenue |

### Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/plugins` | List all plugins |
| POST | `/api/v1/admin/plugins/{id}/approve` | Approve plugin |
| POST | `/api/v1/admin/plugins/{id}/reject` | Reject plugin |
| POST | `/api/v1/admin/plugins/{id}/suspend` | Suspend plugin |
| GET | `/api/v1/admin/plugins/{id}/security-scan` | Run security scan |

### Hook Management APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/hooks` | List available hooks |
| GET | `/api/v1/hooks/{name}` | Get hook details |
| GET | `/api/v1/hooks/{name}/listeners` | List hook listeners |

**Total API Endpoints**: 35+

---

## PLUGIN DEVELOPMENT KIT (PDK)

### CLI Tool

```bash
# Install Stencil Plugin CLI
composer global require stencil/plugin-cli

# Create new plugin
stencil-plugin create payment-gateway/stripe

# Scaffold components
stencil-plugin make:service-provider StripeServiceProvider
stencil-plugin make:controller PaymentController
stencil-plugin make:migration create_stripe_transactions_table

# Development
stencil-plugin dev    # Watch & hot reload
stencil-plugin test   # Run tests

# Build
stencil-plugin build  # Build for production
stencil-plugin package # Create .zip

# Publish
stencil-plugin publish --marketplace
```

### SDK Helper Functions

```php
// Available in plugin code

// Get plugin setting
$apiKey = plugin_setting('stripe.api_key');

// Store plugin data
plugin_data_set('last_sync', now());
$lastSync = plugin_data_get('last_sync');

// Make API request with tracking
$response = plugin_http_request('GET', 'https://api.stripe.com/charges');

// Queue background job
plugin_queue_job(ProcessPaymentJob::class, $data);

// Log plugin event
plugin_log('Payment processed', ['order_id' => $order->id]);
```

---

## MIGRATION STRATEGY

### Phase 1: Foundation (Week 1-2)
- ✅ Database schema
- ✅ Hook & Filter system
- ✅ Plugin loader
- ✅ Basic CRUD APIs

### Phase 2: Security (Week 3-4)
- ✅ Permission system
- ✅ Resource monitoring
- ✅ Code signing
- ✅ Security scanner

### Phase 3: Marketplace (Week 5-7)
- ✅ Marketplace UI
- ✅ Purchase flow
- ✅ License system
- ✅ Payment integration

### Phase 4: Developer Tools (Week 8-10)
- ✅ CLI tool
- ✅ SDK
- ✅ Documentation
- ✅ Starter plugins

---

## CONCLUSION

**Revenue Potential**: $100K+ Year 1  
**Development Time**: 10 weeks  
**Risk**: High - requires extensive testing

**Next Steps**: Begin Phase 1 ✨