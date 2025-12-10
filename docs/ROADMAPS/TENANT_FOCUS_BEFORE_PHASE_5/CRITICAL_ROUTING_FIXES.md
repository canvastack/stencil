# CRITICAL ROUTING AND API FIXES

## URGENT ISSUES IDENTIFIED

### 1. **URL Structure Confusion**
**Problem**: URLs changed from `http://localhost:5173/[pagename]` to `http://localhost:5173/[tenant_slug]/[pagename]` but routing logic is inconsistent.

**Current Broken Behavior**:
- `/about` → Tries to call tenant API with tenant="about"
- `/etchinx/products` → Works but processes as anonymous then tenant
- All non-product pages fail with 404s

### 2. **ContentContext Processing Logic Issues**

**File**: `src/contexts/ContentContext.tsx`

**Problem**: Slug processing logic is breaking simple page routes.

**Current Logic (BROKEN)**:
```typescript
// Lines 55-65: This logic treats "about" as tenant slug
const slugParts = slug.split('/');
if (slugParts.length > 1 && (providedTenantSlug || slugParts[0] !== slug)) {
  actualTenantSlug = actualTenantSlug || slugParts[0];
  pageSlug = slugParts.slice(1).join('/');
} else {
  pageSlug = slug;
  actualTenantSlug = null; // This should clear tenant but doesn't work
}
```

### 3. **API Route Mapping Issues**

**Backend Routes** (Working):
```
GET /api/v1/public/content/pages/{slug}                    ✓ Works
GET /api/v1/public/content/pages/{tenantSlug}/{page}       ✓ Works
```

**Frontend API Calls** (BROKEN):
- Anonymous users call wrong endpoints
- Tenant-specific processing even for general pages
- No fallback content for missing pages

### 4. **UserType Context Confusion**

**Problem**: `globalContext.userType` logic conflicts with URL structure.

**Current Flow**:
1. User accesses `/about` 
2. System detects as tenant user (authenticated)
3. Tries tenant API: `/tenant/content/pages/about/about` → 404
4. No proper fallback

## COMPREHENSIVE FIXES REQUIRED

### **FIX 1: Redesign URL Structure Decision**

**Choose ONE approach**:

**Option A: Pure Tenant-Based Routing**
```
http://localhost:5173/etchinx/products   ← Tenant-specific
http://localhost:5173/etchinx/about     ← Tenant-specific  
http://localhost:5173/platform/about    ← Platform-wide
```

**Option B: Mixed Routing (Recommended)**
```
http://localhost:5173/products           ← General/Platform
http://localhost:5173/about             ← General/Platform
http://localhost:5173/etchinx/products  ← Tenant-specific override
```

### **FIX 2: ContentContext Complete Rewrite**

**File**: `src/contexts/ContentContext.tsx`

**Replace entire `getPageContent` function with**:

```typescript
const getPageContent = useCallback(async (slug: string, providedTenantSlug?: string): Promise<PageContent | null> => {
  const cacheKey = `${globalContext.userType}-${slug}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    setLoading(true);
    setError(null);
    
    let response;
    let pageData;
    
    // CLEAR LOGIC: Determine if this is a tenant-specific route
    const slugParts = slug.split('/');
    const isTenantRoute = slugParts.length > 1; // e.g., "etchinx/products"
    
    if (isTenantRoute) {
      // Tenant-specific content: etchinx/products
      const [tenantSlug, pageSlug] = slugParts;
      
      try {
        // Try public tenant content first
        const anonymousResponse = await anonymousApiClient.getTenantContent(tenantSlug, pageSlug);
        if (anonymousResponse.success && anonymousResponse.data) {
          pageData = anonymousResponse.data;
        } else {
          throw new Error('Tenant content not found');
        }
      } catch (error) {
        // Fallback to tenant-specific mock data
        pageData = getTenantFallbackContent(tenantSlug, pageSlug);
      }
    } else {
      // General platform content: about, faq, contact
      try {
        // Try public platform content first
        const anonymousResponse = await anonymousApiClient.getPlatformContent('pages', slug);
        if (anonymousResponse.success && anonymousResponse.data) {
          pageData = anonymousResponse.data;
        } else {
          throw new Error('Platform content not found');
        }
      } catch (error) {
        // Fallback to platform mock data
        pageData = getPlatformFallbackContent(slug);
      }
    }
    
    const data: PageContent = {
      id: pageData.id || `page-${slug}-1`,
      pageSlug: isTenantRoute ? slugParts[1] : slug,
      content: pageData.content || pageData,
      status: pageData.status || 'published',
      publishedAt: pageData.published_at,
      version: pageData.version || 1,
      createdAt: pageData.created_at || new Date().toISOString(),
      updatedAt: pageData.updated_at || new Date().toISOString(),
    };
    
    cache.set(cacheKey, data);
    return data;
    
  } catch (err) {
    console.error(`ContentProvider: Failed to load page content for ${slug}:`, err);
    setError(err instanceof Error ? err : new Error('Failed to load page content'));
    return null;
  } finally {
    setLoading(false);
  }
}, [cache, globalContext.userType]);

// Add these helper functions
function getTenantFallbackContent(tenantSlug: string, pageSlug: string): any {
  const fallbackData = {
    products: {
      hero: {
        title: { prefix: 'Semua', highlight: 'Produk' },
        subtitle: 'Temukan produk etching berkualitas tinggi dengan presisi sempurna.',
        typingTexts: ['Etching Berkualitas', 'Produk Terbaik', 'Layanan Professional']
      }
    },
    about: {
      hero: {
        title: { prefix: 'Tentang', highlight: tenantSlug.toUpperCase() },
        subtitle: `Pelajari lebih lanjut tentang ${tenantSlug} dan layanan kami.`,
        content: 'Informasi tentang perusahaan dan layanan yang kami tawarkan.'
      }
    }
  };
  
  return {
    id: `page-${tenantSlug}-${pageSlug}-1`,
    content: fallbackData[pageSlug] || { title: 'Page Not Found', subtitle: 'Content coming soon...' }
  };
}

function getPlatformFallbackContent(slug: string): any {
  const fallbackData = {
    about: {
      title: 'About CanvaStencil',
      subtitle: 'Professional Multi-Tenant CMS Platform',
      content: 'CanvaStencil provides enterprise-grade CMS solutions for modern businesses.'
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions',
      faqs: [
        { question: 'What is CanvaStencil?', answer: 'A multi-tenant CMS platform.' }
      ]
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Get in Touch',
      email: 'info@canvastencil.com'
    }
  };
  
  return {
    id: `page-${slug}-1`,
    content: fallbackData[slug] || { title: 'Page Not Found', subtitle: 'Content coming soon...' }
  };
}
```

### **FIX 3: Backend Controller Enhancement**

**File**: `backend/app/Http/Controllers/Api/V1/Public/ContentController.php`

**Add missing page content to `getTenantPage` method**:

```php
// Line 78-136: Replace mock content array with comprehensive content
$mockContent = [
    'products' => [
        // existing products content...
    ],
    'about' => [
        'hero' => [
            'title' => ['prefix' => 'Tentang', 'highlight' => strtoupper($tenantSlug)],
            'subtitle' => "Pelajari lebih lanjut tentang $tenantSlug dan layanan kami.",
            'content' => 'Informasi lengkap tentang perusahaan dan visi misi kami.'
        ]
    ],
    'faq' => [
        'hero' => [
            'title' => ['prefix' => 'Pertanyaan', 'highlight' => 'Umum'],
            'subtitle' => 'Temukan jawaban untuk pertanyaan yang sering diajukan',
        ],
        'faqs' => [
            ['question' => 'Apa itu etching?', 'answer' => 'Etching adalah proses mengukir...'],
            ['question' => 'Berapa lama waktu pengerjaan?', 'answer' => 'Waktu pengerjaan bervariasi...']
        ]
    ],
    'contact' => [
        'hero' => [
            'title' => ['prefix' => 'Hubungi', 'highlight' => 'Kami'],
            'subtitle' => 'Dapatkan konsultasi gratis untuk kebutuhan etching Anda',
        ],
        'contactInfo' => [
            'email' => 'info@' . strtolower($tenantSlug) . '.com',
            'phone' => '+62 812-3456-7890',
            'address' => 'Jalan Industri No. 123, Jakarta'
        ]
    ]
];
```

**Also add general platform content to `getPage` method**.

### **FIX 4: Routing Configuration**

**File**: `src/Router.tsx` (if exists) or routing configuration

**Ensure consistent route handling**:
```typescript
// Routes should handle both patterns
<Route path="/:tenantSlug/:page" element={<TenantPage />} />
<Route path="/:page" element={<PlatformPage />} />
<Route path="/" element={<HomePage />} />
```

### **FIX 5: Product Detail Page Specific**

**Issue**: Product detail pages also failing due to routing confusion.

**Check**: 
- `src/themes/default/pages/ProductDetail.tsx` routing
- Ensure product slug handling works with both patterns:
  - `/products/product-slug` (general)
  - `/etchinx/products/product-slug` (tenant-specific)

### **FIX 6: PublicTenantContext Fix**

**File**: `src/contexts/PublicTenantContext.tsx`

**Problem**: Incorrectly detecting tenant slug from simple pages.

**Fix**: Update tenant detection logic to only activate on proper tenant routes.

## IMPLEMENTATION ORDER

1. **URGENT**: Fix ContentContext.tsx with the rewritten function
2. **HIGH**: Add missing content to backend controller  
3. **HIGH**: Fix PublicTenantContext tenant detection
4. **MEDIUM**: Standardize routing approach across app
5. **LOW**: Add comprehensive error handling and loading states

## TESTING CHECKLIST

After fixes:
- [ ] `/about` loads with platform content
- [ ] `/faq` loads with platform content  
- [ ] `/contact` loads with platform content
- [ ] `/etchinx/products` loads with tenant content
- [ ] `/etchinx/about` loads with tenant-specific content
- [ ] Product detail pages work: `/products/slug` and `/etchinx/products/slug`
- [ ] No 404 errors in console
- [ ] Proper fallback content displays when API fails

## ROOT CAUSE SUMMARY

The main issue is **routing paradigm confusion**: the app tries to support both single-page routes (`/about`) and tenant-prefixed routes (`/etchinx/about`) simultaneously, but the ContentContext logic incorrectly processes simple pages as tenant routes, causing API mismatches and 404 errors.

**The fix requires**: Clear separation of tenant vs platform content logic, proper fallback mechanisms, and consistent URL structure handling.