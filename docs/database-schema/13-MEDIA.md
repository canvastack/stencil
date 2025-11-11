# MEDIA LIBRARY MODULE
## Database Schema & API Documentation

**Module:** Media & Content - Media Library  
**Total Fields:** 85+ fields  
**Total Tables:** 5 tables (media_files, media_folders, media_tags, media_usage, media_transformations)  
**Admin Page:** `src/pages/admin/MediaLibrary.tsx`  
**Type Definition:** `src/types/media.ts`

---

## CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
✅ **ENFORCED** - All media tables include mandatory `tenant_id UUID NOT NULL` with foreign key constraints to `tenants(uuid)` table. Media files are strictly isolated per tenant.

### **Rule 2: API Guard Implementation**
✅ **ENFORCED** - All media API endpoints include tenant-scoped access control. Media files can only be accessed by authenticated users within the same tenant context.

### **Rule 3: UUID model_morph_key**
✅ **ENFORCED** - All media tables use `uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` as the public identifier for external API references.

### **Rule 4: Strict Tenant Data Isolation**
✅ **ENFORCED** - No global media with NULL tenant_id. Every media file, folder, and tag is strictly scoped to a specific tenant. Cross-tenant media access is impossible at the database level.

### **Rule 5: RBAC Integration Requirements**
✅ **ENFORCED** - Media management requires specific permissions:
- `media.view` - View media library
- `media.upload` - Upload new media files
- `media.edit` - Edit media metadata and organize files
- `media.delete` - Delete media files and folders
- `media.admin` - Manage media settings and transformations

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Media Categories](#media-categories)
8. [API Endpoints](#api-endpoints)
9. [RBAC Integration](#rbac-integration)
10. [Admin UI Features](#admin-ui-features)
11. [Sample Data](#sample-data)
12. [Migration Script](#migration-script)
13. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

**Media Library Module** adalah sistem **comprehensive media management** yang memungkinkan setiap tenant untuk mengelola file media (images, documents, videos) dengan fitur advanced seperti folder organization, tagging system, automatic transformations, dan usage tracking. Sistem ini dirancang khusus untuk mendukung **etching business workflow** dengan fokus pada design file management dan customer asset organization.

### Core Features

1. **File Upload & Management**
   - Multi-format support (images, documents, videos, design files)
   - Drag & drop upload interface
   - Bulk upload capabilities
   - File validation and security scanning
   - Automatic file optimization

2. **Folder Organization System**
   - Hierarchical folder structure
   - Nested folder support (unlimited depth)
   - Folder permissions and access control
   - Bulk move and organize operations
   - Smart folder suggestions

3. **Advanced Tagging System**
   - Custom tag creation and management
   - Auto-tagging based on file content
   - Tag-based search and filtering
   - Tag categories and hierarchies
   - Bulk tagging operations

4. **Media Transformations**
   - Automatic image resizing and optimization
   - Format conversion (WebP, AVIF support)
   - Thumbnail generation
   - Watermark application
   - Custom transformation presets

5. **Usage Tracking & Analytics**
   - File usage statistics
   - Download tracking
   - Popular media identification
   - Storage usage analytics
   - Performance metrics

6. **Integration Capabilities**
   - CDN integration for fast delivery
   - Cloud storage support (S3, Cloudinary, GCS)
   - External service integrations
   - API access for third-party tools
   - Webhook notifications

7. **Security & Access Control**
   - Tenant-isolated storage
   - File access permissions
   - Secure download URLs
   - Virus scanning integration
   - Audit trail for all operations

---

## BUSINESS CONTEXT

### **Etching Business Integration**

**Media Library** is specifically designed for **custom etching businesses** to manage design files, customer assets, and production materials throughout the complete business cycle.

### **Business Cycle Integration**

**Media management for etching business workflow:**

1. **Inquiry Stage Media**:
   - Customer-uploaded design files and references
   - Sample images and inspiration galleries
   - Material specification documents
   - Previous work portfolios for customer reference

2. **Quotation Stage Media**:
   - Design mockups and previews
   - Material samples and options
   - Pricing documents and templates
   - Technical specification sheets

3. **Order Processing Media**:
   - Final approved design files
   - Production specifications
   - Customer approval documents
   - Order confirmation materials

4. **Production Stage Media**:
   - Work-in-progress photos
   - Quality control images
   - Production process documentation
   - Equipment setup photos

5. **Delivery Stage Media**:
   - Final product photos
   - Packaging and shipping images
   - Delivery confirmation photos
   - Customer satisfaction documentation

### **Etching-Specific Media Categories**

1. **Design Files**:
   - Vector files (AI, SVG, EPS)
   - Raster images (PNG, JPG, TIFF)
   - CAD files for precision etching
   - Font files for text etching

2. **Material References**:
   - Material sample photos
   - Texture and finish examples
   - Color charts and specifications
   - Thickness and dimension guides

3. **Production Assets**:
   - Equipment setup photos
   - Process documentation
   - Quality control checklists
   - Safety procedure documents

4. **Customer Gallery**:
   - Portfolio of completed works
   - Before/after comparisons
   - Customer testimonial images
   - Social media content

### **Media Workflow Integration**

**Seamless integration with business processes:**

```
Customer Upload → Design Review → Approval Process → Production → Delivery Documentation
     ↓              ↓              ↓              ↓              ↓
Media Library → Version Control → Asset Approval → Progress Tracking → Final Gallery
```

---

## DATABASE SCHEMA

### Table: `media_files`

Stores all media files with metadata and tenant isolation.

```sql
CREATE TABLE media_files (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    folder_id BIGINT NULL,
    
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    
    width INT NULL,
    height INT NULL,
    duration INT NULL, -- for videos in seconds
    
    alt_text TEXT NULL,
    caption TEXT NULL,
    description TEXT NULL,
    
    metadata JSONB NULL,
    exif_data JSONB NULL,
    
    is_public BOOLEAN DEFAULT FALSE,
    is_optimized BOOLEAN DEFAULT FALSE,
    
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_path VARCHAR(1000) NULL,
    
    upload_source VARCHAR(50) DEFAULT 'admin',
    uploaded_by BIGINT NOT NULL,
    
    download_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT check_file_type CHECK (file_type IN ('image', 'document', 'video', 'audio', 'design', 'archive')),
    CONSTRAINT check_storage_provider CHECK (storage_provider IN ('local', 's3', 'cloudinary', 'google_cloud')),
    CONSTRAINT check_upload_source CHECK (upload_source IN ('admin', 'customer', 'api', 'bulk'))
);

CREATE INDEX idx_media_files_tenant_id ON media_files(tenant_id);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
CREATE INDEX idx_media_files_filename ON media_files(filename);

CREATE TRIGGER update_media_files_updated_at
BEFORE UPDATE ON media_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `metadata` Structure:**
```json
{
  "camera": "Canon EOS R5",
  "lens": "RF 24-70mm f/2.8L IS USM",
  "iso": 400,
  "aperture": "f/2.8",
  "shutter_speed": "1/125",
  "focal_length": "50mm",
  "color_profile": "sRGB",
  "compression": "lossless"
}
```

---

### Table: `media_folders`

Stores folder structure for organizing media files.

```sql
CREATE TABLE media_folders (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    parent_id BIGINT NULL,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    folder_path VARCHAR(1000) NOT NULL,
    
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    
    permissions JSONB NULL,
    
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT unique_folder_name_per_parent UNIQUE (tenant_id, parent_id, name),
    CONSTRAINT unique_folder_slug_per_parent UNIQUE (tenant_id, parent_id, slug)
);

CREATE INDEX idx_media_folders_tenant_id ON media_folders(tenant_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX idx_media_folders_created_by ON media_folders(created_by);
CREATE INDEX idx_media_folders_folder_path ON media_folders(folder_path);

CREATE TRIGGER update_media_folders_updated_at
BEFORE UPDATE ON media_folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**JSONB `permissions` Structure:**
```json
{
  "view": ["admin", "manager", "staff"],
  "upload": ["admin", "manager"],
  "edit": ["admin", "manager"],
  "delete": ["admin"]
}
```

---

### Table: `media_tags`

Stores tags for categorizing and organizing media files.

```sql
CREATE TABLE media_tags (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) NULL, -- hex color code
    
    category VARCHAR(50) NULL,
    
    usage_count INT DEFAULT 0,
    
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT unique_tag_name_per_tenant UNIQUE (tenant_id, name),
    CONSTRAINT unique_tag_slug_per_tenant UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_media_tags_tenant_id ON media_tags(tenant_id);
CREATE INDEX idx_media_tags_category ON media_tags(category);
CREATE INDEX idx_media_tags_usage_count ON media_tags(usage_count);

CREATE TRIGGER update_media_tags_updated_at
BEFORE UPDATE ON media_tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `media_usage`

Tracks where and how media files are used throughout the system.

```sql
CREATE TABLE media_usage (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    media_file_id BIGINT NOT NULL,
    
    usage_type VARCHAR(50) NOT NULL,
    usage_context VARCHAR(100) NOT NULL,
    reference_id BIGINT NULL,
    reference_table VARCHAR(50) NULL,
    
    usage_metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
    
    CONSTRAINT check_usage_type CHECK (usage_type IN ('product_image', 'gallery_image', 'document_attachment', 'design_file', 'reference_image', 'portfolio_item'))
);

CREATE INDEX idx_media_usage_tenant_id ON media_usage(tenant_id);
CREATE INDEX idx_media_usage_media_file_id ON media_usage(media_file_id);
CREATE INDEX idx_media_usage_type ON media_usage(usage_type);
CREATE INDEX idx_media_usage_reference ON media_usage(reference_table, reference_id);
```

---

### Table: `media_transformations`

Stores different versions/transformations of media files.

```sql
CREATE TABLE media_transformations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    original_file_id BIGINT NOT NULL,
    
    transformation_name VARCHAR(100) NOT NULL,
    transformation_params JSONB NOT NULL,
    
    transformed_filename VARCHAR(255) NOT NULL,
    transformed_path VARCHAR(1000) NOT NULL,
    transformed_url VARCHAR(1000) NOT NULL,
    
    file_size BIGINT NOT NULL,
    width INT NULL,
    height INT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (original_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
    
    CONSTRAINT unique_transformation_per_file UNIQUE (original_file_id, transformation_name)
);

CREATE INDEX idx_media_transformations_tenant_id ON media_transformations(tenant_id);
CREATE INDEX idx_media_transformations_original_file_id ON media_transformations(original_file_id);
CREATE INDEX idx_media_transformations_name ON media_transformations(transformation_name);
```

**JSONB `transformation_params` Structure:**
```json
{
  "width": 800,
  "height": 600,
  "quality": 85,
  "format": "webp",
  "crop": "center",
  "watermark": {
    "enabled": true,
    "position": "bottom-right",
    "opacity": 0.7
  }
}
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      MEDIA LIBRARY                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    tenants       │
│                  │
│ PK: uuid         │◄──────┐
│     name         │       │
│     domain       │       │ FK: tenant_id
└──────────────────┘       │ (One-to-many for all media tables)
                           │
          ┌────────────────┴──────────────────┐
          │                                   │
          ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│  media_folders      │           │  media_files        │
│                     │           │                     │
│ PK: id              │◄──────────│ PK: id              │
│ FK: tenant_id       │           │ FK: tenant_id       │
│ FK: parent_id       │           │ FK: folder_id       │
│     name            │           │     filename        │
│     folder_path     │           │     file_path       │
│     permissions     │           │     file_type       │
│     (JSONB)         │           │     metadata        │
└─────────────────────┘           │     (JSONB)         │
          │                       └─────────────────────┘
          │                                   │
          │                                   │
          ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│  media_tags         │           │ media_transformations│
│                     │           │                     │
│ PK: id              │           │ PK: id              │
│ FK: tenant_id       │           │ FK: tenant_id       │
│     name            │           │ FK: original_file_id│
│     category        │           │     transformation_ │
│     usage_count     │           │     name            │
└─────────────────────┘           │     params (JSONB)  │
          │                       └─────────────────────┘
          │                                   
          │                       ┌─────────────────────┐
          │                       │  media_usage        │
          │                       │                     │
          │                       │ PK: id              │
          └───────────────────────┤ FK: tenant_id       │
                                  │ FK: media_file_id   │
                                  │     usage_type      │
                                  │     reference_table │
                                  │     reference_id    │
                                  └─────────────────────┘
```

**Key Relationships:**

1. **tenants** → **media_files** (One-to-many)
2. **tenants** → **media_folders** (One-to-many)
3. **tenants** → **media_tags** (One-to-many)
4. **media_folders** → **media_files** (One-to-many)
5. **media_folders** → **media_folders** (Self-referencing for nested folders)
6. **media_files** → **media_transformations** (One-to-many)
7. **media_files** → **media_usage** (One-to-many)

---

## FIELD SPECIFICATIONS

### Table: `media_files`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants | Tenant reference |
| `folder_id` | BIGINT | No | FK to media_folders | Parent folder |
| `filename` | VARCHAR(255) | Yes | Unique per folder | System filename |
| `original_filename` | VARCHAR(255) | Yes | - | User's original filename |
| `file_path` | VARCHAR(1000) | Yes | Valid path | Full file path |
| `file_url` | VARCHAR(1000) | Yes | Valid URL | Public access URL |
| `file_type` | VARCHAR(50) | Yes | Enum values | File category |
| `mime_type` | VARCHAR(100) | Yes | Valid MIME | File MIME type |
| `file_size` | BIGINT | Yes | > 0 | File size in bytes |
| `width` | INT | No | > 0 | Image/video width |
| `height` | INT | No | > 0 | Image/video height |
| `duration` | INT | No | > 0 | Video/audio duration |
| `alt_text` | TEXT | No | - | Accessibility text |
| `caption` | TEXT | No | - | Display caption |
| `description` | TEXT | No | - | File description |
| `metadata` | JSONB | No | Valid JSON | File metadata |
| `exif_data` | JSONB | No | Valid JSON | Image EXIF data |
| `is_public` | BOOLEAN | Yes | Default FALSE | Public access flag |
| `is_optimized` | BOOLEAN | Yes | Default FALSE | Optimization status |
| `storage_provider` | VARCHAR(50) | Yes | Enum values | Storage location |
| `upload_source` | VARCHAR(50) | Yes | Enum values | Upload method |
| `uploaded_by` | BIGINT | Yes | FK to users | Uploader reference |
| `download_count` | INT | Yes | >= 0 | Download counter |

### Table: `media_folders`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants | Tenant reference |
| `parent_id` | BIGINT | No | FK to media_folders | Parent folder |
| `name` | VARCHAR(255) | Yes | Unique per parent | Folder name |
| `slug` | VARCHAR(255) | Yes | URL-safe, unique | URL slug |
| `description` | TEXT | No | - | Folder description |
| `folder_path` | VARCHAR(1000) | Yes | Valid path | Full folder path |
| `is_public` | BOOLEAN | Yes | Default FALSE | Public access flag |
| `sort_order` | INT | Yes | >= 0 | Display order |
| `permissions` | JSONB | No | Valid JSON | Access permissions |
| `created_by` | BIGINT | Yes | FK to users | Creator reference |

### Table: `media_tags`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants | Tenant reference |
| `name` | VARCHAR(100) | Yes | Unique per tenant | Tag name |
| `slug` | VARCHAR(100) | Yes | URL-safe, unique | URL slug |
| `description` | TEXT | No | - | Tag description |
| `color` | VARCHAR(7) | No | Hex color format | Display color |
| `category` | VARCHAR(50) | No | - | Tag category |
| `usage_count` | INT | Yes | >= 0 | Usage counter |
| `created_by` | BIGINT | Yes | FK to users | Creator reference |

---

## BUSINESS RULES

### BR-1: File Upload Validation

```typescript
const fileUploadRules = {
  // Rule 1: File size limits per type
  validateFileSize: (fileType: string, fileSize: number) => {
    const limits = {
      image: 10 * 1024 * 1024, // 10MB
      document: 50 * 1024 * 1024, // 50MB
      video: 500 * 1024 * 1024, // 500MB
      design: 100 * 1024 * 1024, // 100MB
      archive: 200 * 1024 * 1024 // 200MB
    };
    
    if (fileSize > limits[fileType]) {
      throw new Error(`File size exceeds limit for ${fileType} files`);
    }
  },
  
  // Rule 2: Allowed file extensions
  validateFileExtension: (filename: string, fileType: string) => {
    const allowedExtensions = {
      image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'],
      document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
      video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      design: ['.ai', '.eps', '.svg', '.psd', '.sketch', '.fig', '.dwg'],
      archive: ['.zip', '.rar', '.7z', '.tar', '.gz']
    };
    
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (!allowedExtensions[fileType]?.includes(ext)) {
      throw new Error(`File extension ${ext} not allowed for ${fileType} files`);
    }
  },
  
  // Rule 3: Virus scanning for uploads
  scanForViruses: async (filePath: string) => {
    // Integration with virus scanning service
    const scanResult = await virusScanner.scan(filePath);
    if (scanResult.infected) {
      throw new Error('File contains malicious content');
    }
  }
};
```

### BR-2: Folder Organization Rules

```typescript
const folderRules = {
  // Rule 1: Maximum folder depth
  validateFolderDepth: async (parentId: number, tenantId: string) => {
    const depth = await calculateFolderDepth(parentId, tenantId);
    if (depth >= 10) {
      throw new Error('Maximum folder depth (10 levels) exceeded');
    }
  },
  
  // Rule 2: Folder name validation
  validateFolderName: (name: string) => {
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(name)) {
      throw new Error('Folder name contains invalid characters');
    }
    
    if (name.length > 255) {
      throw new Error('Folder name too long (max 255 characters)');
    }
  },
  
  // Rule 3: Prevent circular references
  preventCircularReference: async (folderId: number, newParentId: number) => {
    const descendants = await getFolderDescendants(folderId);
    if (descendants.includes(newParentId)) {
      throw new Error('Cannot move folder to its own descendant');
    }
  }
};
```

### BR-3: Media Transformations

```typescript
const transformationRules = {
  // Rule 1: Automatic thumbnail generation
  generateThumbnails: async (mediaFile: MediaFile) => {
    if (mediaFile.file_type === 'image') {
      const thumbnailSizes = [150, 300, 600, 1200];
      
      for (const size of thumbnailSizes) {
        await createTransformation(mediaFile.id, {
          name: `thumbnail_${size}`,
          width: size,
          height: size,
          crop: 'center',
          quality: 85
        });
      }
    }
  },
  
  // Rule 2: WebP conversion for better performance
  convertToWebP: async (mediaFile: MediaFile) => {
    if (mediaFile.file_type === 'image' && 
        !mediaFile.filename.endsWith('.webp')) {
      await createTransformation(mediaFile.id, {
        name: 'webp_optimized',
        format: 'webp',
        quality: 80
      });
    }
  },
  
  // Rule 3: Watermark application for public images
  applyWatermark: async (mediaFile: MediaFile) => {
    if (mediaFile.is_public && mediaFile.file_type === 'image') {
      await createTransformation(mediaFile.id, {
        name: 'watermarked',
        watermark: {
          enabled: true,
          position: 'bottom-right',
          opacity: 0.7,
          text: 'Company Name'
        }
      });
    }
  }
};
```

### BR-4: Usage Tracking

```typescript
const usageTrackingRules = {
  // Rule 1: Track media usage across system
  trackUsage: async (mediaFileId: number, usageType: string, context: any) => {
    await createMediaUsage({
      media_file_id: mediaFileId,
      usage_type: usageType,
      usage_context: context.type,
      reference_id: context.id,
      reference_table: context.table,
      usage_metadata: context.metadata
    });
    
    // Update download count
    await incrementDownloadCount(mediaFileId);
  },
  
  // Rule 2: Prevent deletion of used media
  preventDeletionOfUsedMedia: async (mediaFileId: number) => {
    const usageCount = await getMediaUsageCount(mediaFileId);
    if (usageCount > 0) {
      throw new Error('Cannot delete media file that is currently in use');
    }
  },
  
  // Rule 3: Clean up unused media
  cleanupUnusedMedia: async (tenantId: string, olderThanDays: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const unusedFiles = await getUnusedMediaFiles(tenantId, cutoffDate);
    for (const file of unusedFiles) {
      await deleteMediaFile(file.id);
    }
  }
};
```

---

## MEDIA CATEGORIES

### 1. **Design Files** (Etching Business Specific)
- Vector graphics (AI, SVG, EPS)
- Raster images (PNG, JPG, TIFF)
- CAD files (DWG, DXF)
- Font files (TTF, OTF)
- Design templates and presets

### 2. **Product Images**
- Product photography
- Before/after comparisons
- Detail shots and close-ups
- 360-degree product views
- Lifestyle and context images

### 3. **Documentation**
- Technical specifications
- User manuals and guides
- Certificates and compliance docs
- Warranty information
- Installation instructions

### 4. **Marketing Materials**
- Brochures and catalogs
- Social media graphics
- Advertisement banners
- Email templates
- Presentation slides

### 5. **Customer Assets**
- Customer-uploaded designs
- Reference images
- Approval documents
- Communication records
- Project portfolios

### 6. **Production Media**
- Process documentation
- Quality control images
- Equipment setup photos
- Safety procedure videos
- Training materials

---

## API ENDPOINTS

### File Management

```yaml
# Upload single file
POST /api/tenant/media/upload
Content-Type: multipart/form-data
Body: {
  file: File,
  folder_id: number,
  alt_text: string,
  tags: string[]
}
Response: MediaFile

# Upload multiple files
POST /api/tenant/media/upload/bulk
Content-Type: multipart/form-data
Body: {
  files: File[],
  folder_id: number,
  tags: string[]
}
Response: MediaFile[]

# Get media files
GET /api/tenant/media/files
Query: {
  folder_id?: number,
  file_type?: string,
  tags?: string[],
  search?: string,
  page?: number,
  limit?: number
}
Response: PaginatedMediaFiles

# Get single file
GET /api/tenant/media/files/{uuid}
Response: MediaFile

# Update file metadata
PUT /api/tenant/media/files/{uuid}
Body: {
  alt_text: string,
  caption: string,
  description: string,
  tags: string[]
}
Response: MediaFile

# Delete file
DELETE /api/tenant/media/files/{uuid}
Response: { success: boolean }

# Move files to folder
POST /api/tenant/media/files/move
Body: {
  file_ids: number[],
  folder_id: number
}
Response: { moved: number }
```

### Folder Management

```yaml
# Create folder
POST /api/tenant/media/folders
Body: {
  name: string,
  parent_id?: number,
  description?: string,
  is_public?: boolean
}
Response: MediaFolder

# Get folder tree
GET /api/tenant/media/folders/tree
Response: MediaFolder[]

# Get folder contents
GET /api/tenant/media/folders/{uuid}/contents
Query: {
  include_subfolders?: boolean,
  file_types?: string[]
}
Response: {
  folders: MediaFolder[],
  files: MediaFile[]
}

# Update folder
PUT /api/tenant/media/folders/{uuid}
Body: {
  name: string,
  description: string,
  is_public: boolean
}
Response: MediaFolder

# Delete folder
DELETE /api/tenant/media/folders/{uuid}
Query: { force?: boolean }
Response: { success: boolean }

# Move folder
POST /api/tenant/media/folders/{uuid}/move
Body: { parent_id: number }
Response: MediaFolder
```

### Tag Management

```yaml
# Create tag
POST /api/tenant/media/tags
Body: {
  name: string,
  description?: string,
  color?: string,
  category?: string
}
Response: MediaTag

# Get all tags
GET /api/tenant/media/tags
Query: {
  category?: string,
  search?: string
}
Response: MediaTag[]

# Update tag
PUT /api/tenant/media/tags/{uuid}
Body: {
  name: string,
  description: string,
  color: string
}
Response: MediaTag

# Delete tag
DELETE /api/tenant/media/tags/{uuid}
Response: { success: boolean }

# Tag files
POST /api/tenant/media/files/{uuid}/tags
Body: { tag_ids: number[] }
Response: { success: boolean }

# Remove tags from file
DELETE /api/tenant/media/files/{uuid}/tags
Body: { tag_ids: number[] }
Response: { success: boolean }
```

### Transformations

```yaml
# Get file transformations
GET /api/tenant/media/files/{uuid}/transformations
Response: MediaTransformation[]

# Create transformation
POST /api/tenant/media/files/{uuid}/transformations
Body: {
  name: string,
  params: {
    width?: number,
    height?: number,
    quality?: number,
    format?: string,
    crop?: string,
    watermark?: object
  }
}
Response: MediaTransformation

# Delete transformation
DELETE /api/tenant/media/transformations/{uuid}
Response: { success: boolean }
```

### Analytics & Usage

```yaml
# Get media analytics
GET /api/tenant/media/analytics
Query: {
  period?: string, // 'day', 'week', 'month', 'year'
  file_type?: string
}
Response: {
  total_files: number,
  total_size: number,
  uploads_count: number,
  downloads_count: number,
  popular_files: MediaFile[],
  storage_usage: object
}

# Get file usage
GET /api/tenant/media/files/{uuid}/usage
Response: MediaUsage[]

# Track download
POST /api/tenant/media/files/{uuid}/download
Response: { download_url: string }
```

---

## RBAC INTEGRATION

### **Permission-Based Media Access**

**Media Library integrates with RBAC system** to ensure secure, role-based access to media management features.

### **Required Permissions**

| Permission | Description | Media Access |
|------------|-------------|--------------|
| `media.view` | View media library | Browse files and folders |
| `media.upload` | Upload new files | Add new media files |
| `media.edit` | Edit media metadata | Modify file info, tags, folders |
| `media.delete` | Delete media files | Remove files and folders |
| `media.admin` | Advanced media management | Transformations, settings, analytics |
| `media.public` | Manage public access | Set files as public/private |

### **Role-Based Access Examples**

**Business Owner (Full Access)**:
```typescript
const businessOwnerPermissions = [
  'media.view', 'media.upload', 'media.edit', 
  'media.delete', 'media.admin', 'media.public'
];
```

**Manager (Content Management)**:
```typescript
const managerPermissions = [
  'media.view', 'media.upload', 'media.edit', 'media.public'
];
```

**Staff (Limited Access)**:
```typescript
const staffPermissions = ['media.view', 'media.upload'];
```

**Customer (View Only)**:
```typescript
const customerPermissions = ['media.view']; // Only their own uploads
```

### **Permission Enforcement in API**

```typescript
// Example: File upload endpoint
app.post('/api/tenant/media/upload', 
  authenticateUser,
  requirePermission('media.upload'),
  async (req, res) => {
    const { tenantId } = req.user;
    const file = req.file;
    
    // Validate file
    await validateFileUpload(file);
    
    // Process upload
    const mediaFile = await processFileUpload(tenantId, file, req.user.id);
    res.json(mediaFile);
  }
);

// Example: File deletion endpoint
app.delete('/api/tenant/media/files/:uuid', 
  authenticateUser,
  requirePermission('media.delete'),
  async (req, res) => {
    const { tenantId } = req.user;
    const { uuid } = req.params;
    
    // Check if file is in use
    await preventDeletionOfUsedMedia(uuid);
    
    // Delete file
    await deleteMediaFile(tenantId, uuid);
    res.json({ success: true });
  }
);
```

---

## ADMIN UI FEATURES

### 1. Media Library Dashboard

**Location:** `src/pages/admin/MediaLibrary.tsx`

**Features:**
- ✅ Grid and list view toggle
- ✅ Folder tree navigation
- ✅ Drag & drop upload
- ✅ Bulk selection and operations
- ✅ Search and filter capabilities
- ✅ Tag-based organization
- ⏳ Advanced transformations (planned)
- ⏳ Usage analytics dashboard (planned)

### 2. File Upload Interface

**Features:**
- ✅ Multiple file upload
- ✅ Progress indicators
- ✅ File validation feedback
- ✅ Automatic thumbnail generation
- ✅ Metadata extraction
- ⏳ Virus scanning integration (planned)

### 3. Media Organization Tools

**Features:**
- ✅ Folder creation and management
- ✅ File moving and copying
- ✅ Bulk tagging operations
- ✅ Smart folder suggestions
- ⏳ Auto-organization rules (planned)

---

## SAMPLE DATA

### Sample Media Files

```sql
INSERT INTO media_files (tenant_id, filename, original_filename, file_path, file_url, file_type, mime_type, file_size, width, height, uploaded_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'logo_2024_001.png', 'company-logo.png', '/uploads/2024/11/logo_2024_001.png', 'https://cdn.example.com/logo_2024_001.png', 'image', 'image/png', 245760, 800, 600, 1),
('550e8400-e29b-41d4-a716-446655440000', 'design_template_001.ai', 'etching-template.ai', '/uploads/2024/11/design_template_001.ai', 'https://cdn.example.com/design_template_001.ai', 'design', 'application/postscript', 2048000, NULL, NULL, 1);
```

### Sample Folders

```sql
INSERT INTO media_folders (tenant_id, name, slug, folder_path, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Design Templates', 'design-templates', '/design-templates', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Customer Uploads', 'customer-uploads', '/customer-uploads', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Product Gallery', 'product-gallery', '/product-gallery', 1);
```

### Sample Tags

```sql
INSERT INTO media_tags (tenant_id, name, slug, category, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Metal Etching', 'metal-etching', 'material', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Glass Etching', 'glass-etching', 'material', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Custom Design', 'custom-design', 'type', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Template', 'template', 'type', 1);
```

---

## MIGRATION SCRIPT

```sql
-- Migration: Create media library tables
-- Version: 1.0
-- Date: 2025-11-11

BEGIN;

-- Create media_files table
CREATE TABLE media_files (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    folder_id BIGINT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    width INT NULL,
    height INT NULL,
    duration INT NULL,
    alt_text TEXT NULL,
    caption TEXT NULL,
    description TEXT NULL,
    metadata JSONB NULL,
    exif_data JSONB NULL,
    is_public BOOLEAN DEFAULT FALSE,
    is_optimized BOOLEAN DEFAULT FALSE,
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_path VARCHAR(1000) NULL,
    upload_source VARCHAR(50) DEFAULT 'admin',
    uploaded_by BIGINT NOT NULL,
    download_count INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT check_file_type CHECK (file_type IN ('image', 'document', 'video', 'audio', 'design', 'archive')),
    CONSTRAINT check_storage_provider CHECK (storage_provider IN ('local', 's3', 'cloudinary', 'google_cloud')),
    CONSTRAINT check_upload_source CHECK (upload_source IN ('admin', 'customer', 'api', 'bulk'))
);

-- Create media_folders table
CREATE TABLE media_folders (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    folder_path VARCHAR(1000) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    permissions JSONB NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT unique_folder_name_per_parent UNIQUE (tenant_id, parent_id, name),
    CONSTRAINT unique_folder_slug_per_parent UNIQUE (tenant_id, parent_id, slug)
);

-- Create media_tags table
CREATE TABLE media_tags (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL,
    color VARCHAR(7) NULL,
    category VARCHAR(50) NULL,
    usage_count INT DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT unique_tag_name_per_tenant UNIQUE (tenant_id, name),
    CONSTRAINT unique_tag_slug_per_tenant UNIQUE (tenant_id, slug)
);

-- Create media_usage table
CREATE TABLE media_usage (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    media_file_id BIGINT NOT NULL,
    usage_type VARCHAR(50) NOT NULL,
    usage_context VARCHAR(100) NOT NULL,
    reference_id BIGINT NULL,
    reference_table VARCHAR(50) NULL,
    usage_metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
    CONSTRAINT check_usage_type CHECK (usage_type IN ('product_image', 'gallery_image', 'document_attachment', 'design_file', 'reference_image', 'portfolio_item'))
);

-- Create media_transformations table
CREATE TABLE media_transformations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    original_file_id BIGINT NOT NULL,
    transformation_name VARCHAR(100) NOT NULL,
    transformation_params JSONB NOT NULL,
    transformed_filename VARCHAR(255) NOT NULL,
    transformed_path VARCHAR(1000) NOT NULL,
    transformed_url VARCHAR(1000) NOT NULL,
    file_size BIGINT NOT NULL,
    width INT NULL,
    height INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (original_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
    CONSTRAINT unique_transformation_per_file UNIQUE (original_file_id, transformation_name)
);

-- Create indexes
CREATE INDEX idx_media_files_tenant_id ON media_files(tenant_id);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
CREATE INDEX idx_media_files_filename ON media_files(filename);

CREATE INDEX idx_media_folders_tenant_id ON media_folders(tenant_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX idx_media_folders_created_by ON media_folders(created_by);
CREATE INDEX idx_media_folders_folder_path ON media_folders(folder_path);

CREATE INDEX idx_media_tags_tenant_id ON media_tags(tenant_id);
CREATE INDEX idx_media_tags_category ON media_tags(category);
CREATE INDEX idx_media_tags_usage_count ON media_tags(usage_count);

CREATE INDEX idx_media_usage_tenant_id ON media_usage(tenant_id);
CREATE INDEX idx_media_usage_media_file_id ON media_usage(media_file_id);
CREATE INDEX idx_media_usage_type ON media_usage(usage_type);
CREATE INDEX idx_media_usage_reference ON media_usage(reference_table, reference_id);

CREATE INDEX idx_media_transformations_tenant_id ON media_transformations(tenant_id);
CREATE INDEX idx_media_transformations_original_file_id ON media_transformations(original_file_id);
CREATE INDEX idx_media_transformations_name ON media_transformations(transformation_name);

-- Create triggers
CREATE TRIGGER update_media_files_updated_at
BEFORE UPDATE ON media_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_folders_updated_at
BEFORE UPDATE ON media_folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_tags_updated_at
BEFORE UPDATE ON media_tags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

---

## PERFORMANCE INDEXES

### Index Strategy

```sql
-- Media files indexes
CREATE INDEX idx_media_files_tenant_id ON media_files(tenant_id);
CREATE INDEX idx_media_files_folder_id ON media_files(folder_id);
CREATE INDEX idx_media_files_file_type ON media_files(file_type);
CREATE INDEX idx_media_files_created_at ON media_files(created_at);
CREATE INDEX idx_media_files_filename_search ON media_files USING gin(to_tsvector('english', filename));

-- Media folders indexes
CREATE INDEX idx_media_folders_tenant_id ON media_folders(tenant_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX idx_media_folders_path ON media_folders(folder_path);

-- Media tags indexes
CREATE INDEX idx_media_tags_tenant_id ON media_tags(tenant_id);
CREATE INDEX idx_media_tags_name_search ON media_tags USING gin(to_tsvector('english', name));

-- Media usage indexes
CREATE INDEX idx_media_usage_tenant_id ON media_usage(tenant_id);
CREATE INDEX idx_media_usage_media_file_id ON media_usage(media_file_id);
CREATE INDEX idx_media_usage_reference ON media_usage(reference_table, reference_id);

-- Composite indexes for common queries
CREATE INDEX idx_media_files_tenant_folder ON media_files(tenant_id, folder_id);
CREATE INDEX idx_media_files_tenant_type ON media_files(tenant_id, file_type);
CREATE INDEX idx_media_folders_tenant_parent ON media_folders(tenant_id, parent_id);
```

### Query Performance Benchmarks

**Expected Performance (10,000 media files per tenant):**

| Query Type | Expected Time | Index Used |
|------------|---------------|------------|
| Get files in folder | < 15ms | idx_media_files_tenant_folder |
| Search files by name | < 25ms | idx_media_files_filename_search |
| Get folder tree | < 20ms | idx_media_folders_tenant_parent |
| Filter by file type | < 10ms | idx_media_files_tenant_type |
| Get file usage | < 5ms | idx_media_usage_media_file_id |

### Optimization Techniques

**1. Media Caching:**
```typescript
// Cache frequently accessed media metadata
const cacheKey = `media:${tenantId}:${folderId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const files = await getMediaFiles(tenantId, folderId);
await redis.setex(cacheKey, 600, JSON.stringify(files)); // 10 minutes
return files;
```

**2. CDN Integration:**
```typescript
// Serve media files through CDN
const getMediaUrl = (mediaFile: MediaFile) => {
  if (process.env.CDN_ENABLED) {
    return `${process.env.CDN_BASE_URL}/${mediaFile.file_path}`;
  }
  return mediaFile.file_url;
};
```

**3. Lazy Loading:**
```typescript
// Load thumbnails first, full images on demand
const loadMediaGrid = async (folderId: number) => {
  const thumbnails = await getMediaThumbnails(folderId);
  // Full images loaded when user clicks/hovers
  return thumbnails;
};
```

---

**Previous:** [12-USERS.md](./12-USERS.md)  
**Next:** [14-DOCUMENTATION.md](./14-DOCUMENTATION.md)

**Last Updated:** 2025-11-11  
**Status:** ✅ COMPLETE  
**Reviewed By:** System Architect