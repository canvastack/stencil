# CanvaStencil Pages Engine Plugin

**Version**: 1.0.0  
**Author**: CanvaStack Team  
**Description**: WordPress-like CMS Pages System untuk membuat dan mengelola berbagai jenis konten dinamis

## 🎯 Features

- **Multiple Content Types**: Blog, News, Events, Custom Types
- **Hierarchical Categories**: Unlimited depth dengan materialized path
- **Comment System**: Threaded comments dengan moderation dan spam detection
- **Revision History**: Auto-save revisions dengan restore capability
- **SEO Optimization**: Custom meta tags, canonical URLs, sitemap generation
- **Multi-format Editor**: WYSIWYG ↔ Markdown switching
- **Scheduled Publishing**: Auto-publish pada waktu tertentu
- **URL Management**: Custom URL patterns dengan redirect history
- **Tags System**: Tagging untuk content organization
- **Full-text Search**: PostgreSQL GIN index untuk pencarian cepat

## 📦 Installation

Plugin ini diinstall melalui **PluginManager** dengan approval workflow:

```php
// Via Tinker
$manager = app(\App\Services\PluginManager::class);
$manager->install('tenant-uuid', 'pages-engine');
```

## 📊 Database Tables

Plugin ini membuat 9 tables dengan prefix `canplug_pagen_`:

1. **canplug_pagen_content_types** - Content type definitions
2. **canplug_pagen_contents** - Main content storage
3. **canplug_pagen_categories** - Hierarchical categories
4. **canplug_pagen_category_pivot** - Content-category M2M
5. **canplug_pagen_revisions** - Revision history
6. **canplug_pagen_comments** - Comment system
7. **canplug_pagen_urls** - URL redirect history
8. **canplug_pagen_tags** - Tag system
9. **canplug_pagen_metadata** - Custom metadata

## 🔧 Technical Specifications

- **PHP**: >= 8.2
- **Laravel**: >= 10.0
- **PostgreSQL**: >= 15.0
- **Multi-tenant**: Schema-per-tenant isolation
- **UUID-only**: All public APIs use UUID identifiers

## 📝 Permissions

Plugin ini mendefinisikan 28 permissions:

- `pages:content-types:*` (view, create, update, delete)
- `pages:contents:*` (view, create, update, delete, publish, schedule)
- `pages:categories:*` (view, create, update, delete, reorder)
- `pages:comments:*` (view, moderate, approve, reject, spam, delete)
- `pages:revisions:*` (view, restore)
- `pages:urls:manage`
- `pages:tags:*` (view, create, update, delete)

## 🚀 Usage

### Creating Content Type

```php
// Platform-level content type (available to all tenants)
DB::table('canplug_pagen_content_types')->insert([
    'tenant_id' => null,
    'name' => 'Blog',
    'slug' => 'blog',
    'scope' => 'platform',
    'is_commentable' => true,
]);
```

### Creating Content

```php
DB::table('canplug_pagen_contents')->insert([
    'tenant_id' => $tenantId,
    'content_type_id' => $contentTypeUuid,
    'author_id' => $authorUuid,
    'title' => 'My First Blog Post',
    'slug' => 'my-first-blog-post',
    'content' => json_encode(['blocks' => [...]]),
    'status' => 'published',
    'published_at' => now(),
]);
```

## 🔒 Compliance

- ✅ **NO MOCK DATA**: All data from seeders
- ✅ **UUID-ONLY**: Integer IDs are internal only
- ✅ **MULTI-TENANT ISOLATION**: Schema-per-tenant
- ✅ **RBAC**: Tenant-scoped permissions
- ✅ **TEST INTEGRITY**: Zero breaking changes

## 📚 Documentation

Full documentation tersedia di:
- `roadmaps/PAGES_SYSTEM/ROADMAPS/README.md`
- `roadmaps/PAGES_SYSTEM/ROADMAPS/1-PHASE_1_DATABASE_CHECKLIST.md`

## 🧪 Testing

```bash
# Test plugin installation
php artisan tinker
>>> $manager = app(\App\Services\PluginManager::class);
>>> $manager->install('tenant-uuid', 'pages-engine');

# Verify tables created
>>> DB::select("SELECT tablename FROM pg_tables WHERE tablename LIKE 'canplug_pagen_%'");
```

## 📄 License

Proprietary - CanvaStack Team
