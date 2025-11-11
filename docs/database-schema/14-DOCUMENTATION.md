# DOCUMENTATION & HELP CENTER MODULE
## Database Schema & API Documentation

**Module:** System - Documentation & Help Center  
**Total Fields:** 95+ fields  
**Total Tables:** 6 tables (documentation_articles, documentation_categories, documentation_versions, help_tickets, knowledge_base, user_guides)  
**Admin Page:** `src/pages/admin/Documentation.tsx`  
**Type Definition:** `src/types/documentation.ts`

---

## CORE IMMUTABLE RULES COMPLIANCE

### **Rule 1: Teams Enabled with tenant_id as team_foreign_key**
✅ **ENFORCED** - All documentation tables include mandatory `tenant_id UUID NOT NULL` with foreign key constraints to `tenants(uuid)` table. Documentation is strictly isolated per tenant.

### **Rule 2: API Guard Implementation**
✅ **ENFORCED** - All documentation API endpoints include tenant-scoped access control. Documentation can only be accessed by authenticated users within the same tenant context.

### **Rule 3: UUID model_morph_key**
✅ **ENFORCED** - All documentation tables use `uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid()` as the public identifier for external API references.

### **Rule 4: Strict Tenant Data Isolation**
✅ **ENFORCED** - No global documentation with NULL tenant_id. Every article, guide, and help resource is strictly scoped to a specific tenant. Cross-tenant documentation access is impossible at the database level.

### **Rule 5: RBAC Integration Requirements**
✅ **ENFORCED** - Documentation management requires specific permissions:
- `documentation.view` - View documentation and help articles
- `documentation.create` - Create new documentation content
- `documentation.edit` - Edit existing documentation
- `documentation.publish` - Publish and manage documentation versions
- `documentation.admin` - Manage documentation settings and analytics

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Database Schema](#database-schema)
4. [Relationship Diagram](#relationship-diagram)
5. [Field Specifications](#field-specifications)
6. [Business Rules](#business-rules)
7. [Documentation Categories](#documentation-categories)
8. [API Endpoints](#api-endpoints)
9. [RBAC Integration](#rbac-integration)
10. [Admin UI Features](#admin-ui-features)
11. [Sample Data](#sample-data)
12. [Migration Script](#migration-script)
13. [Performance Indexes](#performance-indexes)

---

## OVERVIEW

**Documentation & Help Center Module** adalah sistem **comprehensive knowledge management** yang memungkinkan setiap tenant untuk membuat, mengelola, dan menyediakan dokumentasi lengkap untuk pengguna dengan fitur advanced seperti version control, search functionality, interactive guides, dan analytics. Sistem ini dirancang khusus untuk mendukung **etching business workflow** dengan fokus pada customer education, process documentation, dan technical support.

### Core Features

1. **Article Management**
   - Rich text editor with multimedia support
   - Markdown and HTML content support
   - Version control and revision history
   - Content approval workflows
   - Collaborative editing capabilities

2. **Knowledge Base Organization**
   - Hierarchical category structure
   - Tag-based content organization
   - Advanced search and filtering
   - Related articles suggestions
   - Content recommendations

3. **User Guide Creation**
   - Step-by-step guide builder
   - Interactive tutorials and walkthroughs
   - Video and image integration
   - Progress tracking for users
   - Completion certificates

4. **Help Ticket Integration**
   - Seamless support ticket creation
   - Article-to-ticket linking
   - Customer feedback collection
   - Support analytics and insights
   - Automated response suggestions

5. **Multi-Language Support**
   - Content translation management
   - Language-specific documentation
   - Automatic language detection
   - Translation workflow tools
   - Localization support

6. **Analytics & Insights**
   - Content performance tracking
   - User engagement analytics
   - Search query analysis
   - Popular content identification
   - Knowledge gap detection

7. **Access Control & Permissions**
   - Role-based content access
   - Customer vs internal documentation
   - Draft and published states
   - Content visibility controls
   - Team collaboration features

---

## BUSINESS CONTEXT

### **Etching Business Integration**

**Documentation & Help Center** is specifically designed for **custom etching businesses** to provide comprehensive customer education, process documentation, and technical support throughout the complete business cycle.

### **Business Cycle Integration**

**Documentation support for etching business workflow:**

1. **Inquiry Stage Documentation**:
   - Service overview and capabilities
   - Material specifications and options
   - Design guidelines and requirements
   - Pricing structure explanations
   - FAQ for common inquiries

2. **Quotation Stage Documentation**:
   - Quotation process explanation
   - Design approval workflows
   - Payment terms and conditions
   - Timeline and delivery information
   - Revision and change procedures

3. **Order Processing Documentation**:
   - Order confirmation procedures
   - Production timeline explanations
   - Communication protocols
   - Progress tracking guides
   - Quality assurance processes

4. **Production Stage Documentation**:
   - Technical specifications
   - Production process overviews
   - Quality control procedures
   - Safety guidelines and protocols
   - Equipment operation manuals

5. **Delivery Stage Documentation**:
   - Shipping and handling instructions
   - Installation and setup guides
   - Maintenance and care instructions
   - Warranty information
   - Customer satisfaction surveys

### **Etching-Specific Documentation Categories**

1. **Technical Guides**:
   - Material properties and characteristics
   - Etching process explanations
   - Design file preparation guides
   - Quality standards and specifications
   - Troubleshooting procedures

2. **Customer Education**:
   - Service overview and benefits
   - Design best practices
   - Material selection guides
   - Care and maintenance instructions
   - Industry applications and use cases

3. **Process Documentation**:
   - Standard operating procedures
   - Quality control checklists
   - Safety protocols and guidelines
   - Equipment operation manuals
   - Emergency procedures

4. **Support Resources**:
   - Frequently asked questions
   - Common issue resolutions
   - Contact information and hours
   - Escalation procedures
   - Feedback and improvement processes

### **Documentation Workflow Integration**

**Seamless integration with business processes:**

```
Customer Inquiry → Documentation Access → Self-Service → Support Ticket (if needed)
       ↓                    ↓                ↓                    ↓
   FAQ Search → Process Guides → Video Tutorials → Live Support
```

---

## DATABASE SCHEMA

### Table: `documentation_articles`

Stores all documentation articles with content, metadata, and version control.

```sql
CREATE TABLE documentation_articles (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    category_id BIGINT NULL,
    
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    excerpt TEXT NULL,
    
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'markdown',
    
    status VARCHAR(50) DEFAULT 'draft',
    visibility VARCHAR(50) DEFAULT 'private',
    
    featured_image_url VARCHAR(1000) NULL,
    
    meta_title VARCHAR(500) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT NULL,
    
    reading_time INT NULL, -- estimated reading time in minutes
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    
    tags JSONB NULL,
    related_articles JSONB NULL,
    
    author_id BIGINT NOT NULL,
    reviewer_id BIGINT NULL,
    published_by BIGINT NULL,
    
    published_at TIMESTAMP NULL,
    last_reviewed_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES documentation_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_article_slug_per_tenant UNIQUE (tenant_id, slug),
    CONSTRAINT check_status CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
    CONSTRAINT check_visibility CHECK (visibility IN ('private', 'internal', 'public', 'customer')),
    CONSTRAINT check_content_type CHECK (content_type IN ('markdown', 'html', 'rich_text')),
    CONSTRAINT check_difficulty_level CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

CREATE INDEX idx_documentation_articles_tenant_id ON documentation_articles(tenant_id);
CREATE INDEX idx_documentation_articles_category_id ON documentation_articles(category_id);
CREATE INDEX idx_documentation_articles_status ON documentation_articles(status);
CREATE INDEX idx_documentation_articles_visibility ON documentation_articles(visibility);
CREATE INDEX idx_documentation_articles_author_id ON documentation_articles(author_id);
CREATE INDEX idx_documentation_articles_published_at ON documentation_articles(published_at);
CREATE INDEX idx_documentation_articles_title_search ON documentation_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_documentation_articles_content_search ON documentation_articles USING gin(to_tsvector('english', content));

CREATE TRIGGER update_documentation_articles_updated_at
BEFORE UPDATE ON documentation_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `documentation_categories`

Stores hierarchical categories for organizing documentation.

```sql
CREATE TABLE documentation_categories (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    parent_id BIGINT NULL,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    
    icon VARCHAR(100) NULL,
    color VARCHAR(7) NULL, -- hex color code
    
    sort_order INT DEFAULT 0,
    
    is_visible BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    article_count INT DEFAULT 0,
    
    metadata JSONB NULL,
    
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES documentation_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT unique_category_slug_per_tenant UNIQUE (tenant_id, slug),
    CONSTRAINT unique_category_name_per_parent UNIQUE (tenant_id, parent_id, name)
);

CREATE INDEX idx_documentation_categories_tenant_id ON documentation_categories(tenant_id);
CREATE INDEX idx_documentation_categories_parent_id ON documentation_categories(parent_id);
CREATE INDEX idx_documentation_categories_sort_order ON documentation_categories(sort_order);
CREATE INDEX idx_documentation_categories_is_visible ON documentation_categories(is_visible);

CREATE TRIGGER update_documentation_categories_updated_at
BEFORE UPDATE ON documentation_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `documentation_versions`

Stores version history for documentation articles.

```sql
CREATE TABLE documentation_versions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    article_id BIGINT NOT NULL,
    
    version_number VARCHAR(20) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    
    change_summary TEXT NULL,
    change_type VARCHAR(50) NOT NULL,
    
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES documentation_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT check_change_type CHECK (change_type IN ('major', 'minor', 'patch', 'hotfix'))
);

CREATE INDEX idx_documentation_versions_tenant_id ON documentation_versions(tenant_id);
CREATE INDEX idx_documentation_versions_article_id ON documentation_versions(article_id);
CREATE INDEX idx_documentation_versions_created_at ON documentation_versions(created_at);
```

---

### Table: `help_tickets`

Stores customer support tickets linked to documentation.

```sql
CREATE TABLE help_tickets (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    ticket_number VARCHAR(50) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    category VARCHAR(100) NULL,
    
    customer_id BIGINT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    
    assigned_to BIGINT NULL,
    
    related_articles JSONB NULL,
    suggested_articles JSONB NULL,
    
    resolution TEXT NULL,
    resolution_time INT NULL, -- in minutes
    
    satisfaction_rating INT NULL, -- 1-5 scale
    satisfaction_feedback TEXT NULL,
    
    metadata JSONB NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_ticket_number_per_tenant UNIQUE (tenant_id, ticket_number),
    CONSTRAINT check_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT check_status CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'cancelled')),
    CONSTRAINT check_satisfaction_rating CHECK (satisfaction_rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_help_tickets_tenant_id ON help_tickets(tenant_id);
CREATE INDEX idx_help_tickets_status ON help_tickets(status);
CREATE INDEX idx_help_tickets_priority ON help_tickets(priority);
CREATE INDEX idx_help_tickets_assigned_to ON help_tickets(assigned_to);
CREATE INDEX idx_help_tickets_customer_email ON help_tickets(customer_email);
CREATE INDEX idx_help_tickets_created_at ON help_tickets(created_at);

CREATE TRIGGER update_help_tickets_updated_at
BEFORE UPDATE ON help_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `knowledge_base`

Stores structured knowledge base entries with Q&A format.

```sql
CREATE TABLE knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    category_id BIGINT NULL,
    
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    keywords TEXT NULL,
    tags JSONB NULL,
    
    view_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    
    related_questions JSONB NULL,
    
    created_by BIGINT NOT NULL,
    reviewed_by BIGINT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES documentation_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_knowledge_base_tenant_id ON knowledge_base(tenant_id);
CREATE INDEX idx_knowledge_base_category_id ON knowledge_base(category_id);
CREATE INDEX idx_knowledge_base_is_published ON knowledge_base(is_published);
CREATE INDEX idx_knowledge_base_question_search ON knowledge_base USING gin(to_tsvector('english', question));
CREATE INDEX idx_knowledge_base_answer_search ON knowledge_base USING gin(to_tsvector('english', answer));

CREATE TRIGGER update_knowledge_base_updated_at
BEFORE UPDATE ON knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `user_guides`

Stores interactive user guides and tutorials.

```sql
CREATE TABLE user_guides (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    tenant_id UUID NOT NULL,
    
    title VARCHAR(500) NOT NULL,
    description TEXT NULL,
    
    guide_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    
    estimated_duration INT NULL, -- in minutes
    
    steps JSONB NOT NULL,
    prerequisites JSONB NULL,
    
    completion_count INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    thumbnail_url VARCHAR(1000) NULL,
    
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    CONSTRAINT check_guide_type CHECK (guide_type IN ('tutorial', 'walkthrough', 'quickstart', 'advanced', 'troubleshooting')),
    CONSTRAINT check_difficulty_level CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

CREATE INDEX idx_user_guides_tenant_id ON user_guides(tenant_id);
CREATE INDEX idx_user_guides_guide_type ON user_guides(guide_type);
CREATE INDEX idx_user_guides_difficulty_level ON user_guides(difficulty_level);
CREATE INDEX idx_user_guides_is_published ON user_guides(is_published);

CREATE TRIGGER update_user_guides_updated_at
BEFORE UPDATE ON user_guides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## RELATIONSHIP DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION & HELP CENTER                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│    tenants       │
│                  │
│ PK: uuid         │◄──────┐
│     name         │       │
│     domain       │       │ FK: tenant_id
└──────────────────┘       │ (One-to-many for all documentation tables)
                           │
          ┌────────────────┴──────────────────┐
          │                                   │
          ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│ documentation_      │           │ documentation_      │
│ categories          │           │ articles            │
│                     │           │                     │
│ PK: id              │◄──────────│ PK: id              │
│ FK: tenant_id       │           │ FK: tenant_id       │
│ FK: parent_id       │           │ FK: category_id     │
│     name            │           │     title           │
│     slug            │           │     content         │
│     sort_order      │           │     status          │
└─────────────────────┘           │     visibility      │
          │                       └─────────────────────┘
          │                                   │
          │                                   │
          ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│ knowledge_base      │           │ documentation_      │
│                     │           │ versions            │
│ PK: id              │           │                     │
│ FK: tenant_id       │           │ PK: id              │
│ FK: category_id     │           │ FK: tenant_id       │
│     question        │           │ FK: article_id      │
│     answer          │           │     version_number  │
│     helpful_count   │           │     change_summary  │
└─────────────────────┘           └─────────────────────┘
          │                                   
          │                       ┌─────────────────────┐
          │                       │ help_tickets        │
          │                       │                     │
          │                       │ PK: id              │
          └───────────────────────┤ FK: tenant_id       │
                                  │     ticket_number   │
                                  │     subject         │
                                  │     status          │
                                  │     priority        │
                                  └─────────────────────┘
                                              │
                                              │
                                              ▼
                                  ┌─────────────────────┐
                                  │ user_guides         │
                                  │                     │
                                  │ PK: id              │
                                  │ FK: tenant_id       │
                                  │     title           │
                                  │     guide_type      │
                                  │     steps (JSONB)   │
                                  │     completion_count│
                                  └─────────────────────┘
```

**Key Relationships:**

1. **tenants** → **documentation_articles** (One-to-many)
2. **tenants** → **documentation_categories** (One-to-many)
3. **documentation_categories** → **documentation_articles** (One-to-many)
4. **documentation_categories** → **documentation_categories** (Self-referencing for nested categories)
5. **documentation_articles** → **documentation_versions** (One-to-many)
6. **tenants** → **help_tickets** (One-to-many)
7. **tenants** → **knowledge_base** (One-to-many)
8. **tenants** → **user_guides** (One-to-many)

---

## FIELD SPECIFICATIONS

### Table: `documentation_articles`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants | Tenant reference |
| `category_id` | BIGINT | No | FK to documentation_categories | Category reference |
| `title` | VARCHAR(500) | Yes | Min 5, Max 500 | Article title |
| `slug` | VARCHAR(500) | Yes | URL-safe, unique per tenant | URL slug |
| `excerpt` | TEXT | No | Max 500 chars | Article summary |
| `content` | TEXT | Yes | Min 10 chars | Article content |
| `content_type` | VARCHAR(50) | Yes | Enum values | Content format |
| `status` | VARCHAR(50) | Yes | Enum values | Publication status |
| `visibility` | VARCHAR(50) | Yes | Enum values | Access level |
| `reading_time` | INT | No | > 0 | Estimated reading time |
| `difficulty_level` | VARCHAR(20) | Yes | Enum values | Content difficulty |
| `view_count` | INT | Yes | >= 0 | View counter |
| `author_id` | BIGINT | Yes | FK to users | Author reference |

### Table: `documentation_categories`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants | Tenant reference |
| `parent_id` | BIGINT | No | FK to documentation_categories | Parent category |
| `name` | VARCHAR(255) | Yes | Unique per parent | Category name |
| `slug` | VARCHAR(255) | Yes | URL-safe, unique | URL slug |
| `description` | TEXT | No | - | Category description |
| `sort_order` | INT | Yes | >= 0 | Display order |
| `is_visible` | BOOLEAN | Yes | Default TRUE | Visibility flag |
| `article_count` | INT | Yes | >= 0 | Article counter |

### Table: `help_tickets`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | BIGSERIAL | Yes | Auto | Primary key |
| `uuid` | UUID | Yes | Auto-generated | Public identifier |
| `tenant_id` | UUID | Yes | FK to tenants | Tenant reference |
| `ticket_number` | VARCHAR(50) | Yes | Unique per tenant | Ticket identifier |
| `subject` | VARCHAR(500) | Yes | Min 5 chars | Ticket subject |
| `description` | TEXT | Yes | Min 10 chars | Issue description |
| `priority` | VARCHAR(20) | Yes | Enum values | Ticket priority |
| `status` | VARCHAR(50) | Yes | Enum values | Ticket status |
| `customer_email` | VARCHAR(255) | Yes | Valid email | Customer contact |
| `satisfaction_rating` | INT | No | 1-5 scale | Customer rating |

---

## BUSINESS RULES

### BR-1: Article Publishing Workflow

```typescript
const articlePublishingRules = {
  // Rule 1: Articles must be reviewed before publishing
  validatePublishingWorkflow: async (article: DocumentationArticle) => {
    if (article.status === 'published' && !article.reviewer_id) {
      throw new Error('Articles must be reviewed before publishing');
    }
    
    if (article.status === 'published' && !article.published_by) {
      throw new Error('Published articles must have a publisher assigned');
    }
  },
  
  // Rule 2: Automatic version creation on content changes
  createVersionOnUpdate: async (articleId: number, changes: any, userId: number) => {
    const currentVersion = await getCurrentVersion(articleId);
    const newVersionNumber = incrementVersion(currentVersion.version_number);
    
    await createDocumentationVersion({
      article_id: articleId,
      version_number: newVersionNumber,
      title: changes.title,
      content: changes.content,
      change_summary: changes.change_summary,
      change_type: determineChangeType(changes),
      created_by: userId
    });
  },
  
  // Rule 3: SEO optimization validation
  validateSEORequirements: (article: DocumentationArticle) => {
    if (article.visibility === 'public') {
      if (!article.meta_title || article.meta_title.length < 30) {
        throw new Error('Public articles require meta title (min 30 chars)');
      }
      
      if (!article.meta_description || article.meta_description.length < 120) {
        throw new Error('Public articles require meta description (min 120 chars)');
      }
    }
  }
};
```

### BR-2: Help Ticket Management

```typescript
const helpTicketRules = {
  // Rule 1: Automatic article suggestions based on ticket content
  suggestRelevantArticles: async (ticket: HelpTicket) => {
    const keywords = extractKeywords(ticket.subject + ' ' + ticket.description);
    const suggestedArticles = await searchArticlesByKeywords(keywords, ticket.tenant_id);
    
    await updateTicket(ticket.id, {
      suggested_articles: suggestedArticles.slice(0, 5)
    });
  },
  
  // Rule 2: SLA tracking and escalation
  trackSLACompliance: async (ticket: HelpTicket) => {
    const slaLimits = {
      urgent: 2 * 60, // 2 hours
      high: 8 * 60,   // 8 hours
      medium: 24 * 60, // 24 hours
      low: 72 * 60     // 72 hours
    };
    
    const timeElapsed = getMinutesSince(ticket.created_at);
    const slaLimit = slaLimits[ticket.priority];
    
    if (timeElapsed > slaLimit && ticket.status !== 'resolved') {
      await escalateTicket(ticket.id);
    }
  },
  
  // Rule 3: Knowledge base article creation from resolved tickets
  createKnowledgeBaseFromTicket: async (ticket: HelpTicket) => {
    if (ticket.status === 'resolved' && ticket.satisfaction_rating >= 4) {
      const similarTickets = await findSimilarTickets(ticket);
      
      if (similarTickets.length >= 3) {
        await createKnowledgeBaseEntry({
          tenant_id: ticket.tenant_id,
          question: generateQuestionFromTickets([ticket, ...similarTickets]),
          answer: ticket.resolution,
          created_by: ticket.assigned_to
        });
      }
    }
  }
};
```

### BR-3: Content Analytics and Optimization

```typescript
const contentAnalyticsRules = {
  // Rule 1: Track content performance metrics
  updateContentMetrics: async (articleId: number, action: string) => {
    const metrics = {
      view: () => incrementViewCount(articleId),
      like: () => incrementLikeCount(articleId),
      helpful: () => incrementHelpfulCount(articleId),
      share: () => trackShareEvent(articleId)
    };
    
    if (metrics[action]) {
      await metrics[action]();
      await updateContentScore(articleId);
    }
  },
  
  // Rule 2: Identify content gaps from search queries
  analyzeSearchGaps: async (tenantId: string) => {
    const searchQueries = await getSearchQueriesWithNoResults(tenantId);
    const commonQueries = groupAndCountQueries(searchQueries);
    
    for (const query of commonQueries) {
      if (query.count >= 5) {
        await createContentSuggestion({
          tenant_id: tenantId,
          suggested_topic: query.text,
          search_frequency: query.count,
          priority: calculatePriority(query.count)
        });
      }
    }
  },
  
  // Rule 3: Content freshness monitoring
  monitorContentFreshness: async (tenantId: string) => {
    const staleArticles = await getArticlesOlderThan(tenantId, 365); // 1 year
    
    for (const article of staleArticles) {
      await createReviewTask({
        article_id: article.id,
        task_type: 'freshness_review',
        assigned_to: article.author_id,
        due_date: addDays(new Date(), 30)
      });
    }
  }
};
```

---

## DOCUMENTATION CATEGORIES

### 1. **Getting Started**
- Platform overview and introduction
- Account setup and configuration
- Basic navigation and features
- Quick start guides
- First-time user tutorials

### 2. **Service Documentation** (Etching Business Specific)
- Etching process explanations
- Material specifications and options
- Design guidelines and requirements
- Quality standards and certifications
- Pricing structure and policies

### 3. **Technical Guides**
- Design file preparation
- Software compatibility guides
- Technical specifications
- Equipment and process details
- Troubleshooting procedures

### 4. **Customer Support**
- Frequently asked questions
- Common issue resolutions
- Contact information and hours
- Escalation procedures
- Feedback and improvement processes

### 5. **Business Processes**
- Order placement procedures
- Payment and billing information
- Shipping and delivery policies
- Returns and warranty information
- Communication protocols

### 6. **Advanced Features**
- Custom design services
- Bulk order processing
- API documentation
- Integration guides
- Advanced customization options

---

## API ENDPOINTS

### Article Management

```yaml
# Get articles
GET /api/tenant/documentation/articles
Query: {
  category_id?: number,
  status?: string,
  visibility?: string,
  search?: string,
  page?: number,
  limit?: number
}
Response: PaginatedArticles

# Get single article
GET /api/tenant/documentation/articles/{uuid}
Response: DocumentationArticle

# Create article
POST /api/tenant/documentation/articles
Body: {
  title: string,
  content: string,
  category_id?: number,
  excerpt?: string,
  status?: string,
  visibility?: string,
  tags?: string[]
}
Response: DocumentationArticle

# Update article
PUT /api/tenant/documentation/articles/{uuid}
Body: {
  title: string,
  content: string,
  change_summary?: string
}
Response: DocumentationArticle

# Publish article
POST /api/tenant/documentation/articles/{uuid}/publish
Response: DocumentationArticle

# Delete article
DELETE /api/tenant/documentation/articles/{uuid}
Response: { success: boolean }
```

### Category Management

```yaml
# Get categories
GET /api/tenant/documentation/categories
Query: { include_articles?: boolean }
Response: DocumentationCategory[]

# Create category
POST /api/tenant/documentation/categories
Body: {
  name: string,
  parent_id?: number,
  description?: string,
  icon?: string,
  color?: string
}
Response: DocumentationCategory

# Update category
PUT /api/tenant/documentation/categories/{uuid}
Body: {
  name: string,
  description: string,
  sort_order: number
}
Response: DocumentationCategory

# Delete category
DELETE /api/tenant/documentation/categories/{uuid}
Response: { success: boolean }
```

### Help Ticket Management

```yaml
# Create help ticket
POST /api/tenant/documentation/help-tickets
Body: {
  subject: string,
  description: string,
  priority: string,
  customer_email: string,
  customer_name: string,
  category?: string
}
Response: HelpTicket

# Get help tickets
GET /api/tenant/documentation/help-tickets
Query: {
  status?: string,
  priority?: string,
  assigned_to?: number,
  customer_email?: string,
  page?: number,
  limit?: number
}
Response: PaginatedHelpTickets

# Update help ticket
PUT /api/tenant/documentation/help-tickets/{uuid}
Body: {
  status?: string,
  priority?: string,
  assigned_to?: number,
  resolution?: string
}
Response: HelpTicket

# Rate ticket resolution
POST /api/tenant/documentation/help-tickets/{uuid}/rate
Body: {
  satisfaction_rating: number,
  satisfaction_feedback?: string
}
Response: { success: boolean }
```

### Knowledge Base

```yaml
# Search knowledge base
GET /api/tenant/documentation/knowledge-base/search
Query: {
  q: string,
  category_id?: number,
  limit?: number
}
Response: KnowledgeBaseEntry[]

# Get knowledge base entries
GET /api/tenant/documentation/knowledge-base
Query: {
  category_id?: number,
  is_featured?: boolean,
  page?: number,
  limit?: number
}
Response: PaginatedKnowledgeBase

# Create knowledge base entry
POST /api/tenant/documentation/knowledge-base
Body: {
  question: string,
  answer: string,
  category_id?: number,
  keywords?: string,
  tags?: string[]
}
Response: KnowledgeBaseEntry

# Mark as helpful
POST /api/tenant/documentation/knowledge-base/{uuid}/helpful
Body: { helpful: boolean }
Response: { success: boolean }
```

### User Guides

```yaml
# Get user guides
GET /api/tenant/documentation/user-guides
Query: {
  guide_type?: string,
  difficulty_level?: string,
  is_featured?: boolean
}
Response: UserGuide[]

# Get single guide
GET /api/tenant/documentation/user-guides/{uuid}
Response: UserGuide

# Track guide completion
POST /api/tenant/documentation/user-guides/{uuid}/complete
Body: {
  completion_time?: number,
  rating?: number,
  feedback?: string
}
Response: { success: boolean }
```

### Analytics

```yaml
# Get documentation analytics
GET /api/tenant/documentation/analytics
Query: {
  period?: string, // 'day', 'week', 'month', 'year'
  type?: string // 'articles', 'tickets', 'searches'
}
Response: {
  total_articles: number,
  total_views: number,
  popular_articles: Article[],
  search_queries: SearchQuery[],
  ticket_metrics: TicketMetrics,
  content_gaps: ContentGap[]
}
```

---

## RBAC INTEGRATION

### **Permission-Based Documentation Access**

**Documentation module integrates with RBAC system** to ensure secure, role-based access to documentation management features.

### **Required Permissions**

| Permission | Description | Documentation Access |
|------------|-------------|---------------------|
| `documentation.view` | View documentation | Browse articles and guides |
| `documentation.create` | Create content | Add new articles and guides |
| `documentation.edit` | Edit content | Modify existing documentation |
| `documentation.publish` | Publish content | Manage publication workflow |
| `documentation.admin` | Advanced management | Analytics, settings, bulk operations |
| `documentation.support` | Support management | Manage help tickets and knowledge base |

### **Role-Based Access Examples**

**Documentation Manager (Full Access)**:
```typescript
const docManagerPermissions = [
  'documentation.view', 'documentation.create', 'documentation.edit',
  'documentation.publish', 'documentation.admin', 'documentation.support'
];
```

**Content Writer (Content Creation)**:
```typescript
const writerPermissions = [
  'documentation.view', 'documentation.create', 'documentation.edit'
];
```

**Support Agent (Support Focus)**:
```typescript
const supportPermissions = [
  'documentation.view', 'documentation.support'
];
```

**Customer (Read Only)**:
```typescript
const customerPermissions = ['documentation.view']; // Only published content
```

### **Permission Enforcement in API**

```typescript
// Example: Article creation endpoint
app.post('/api/tenant/documentation/articles', 
  authenticateUser,
  requirePermission('documentation.create'),
  async (req, res) => {
    const { tenantId } = req.user;
    const articleData = req.body;
    
    // Create article
    const article = await createDocumentationArticle(tenantId, articleData, req.user.id);
    res.json(article);
  }
);

// Example: Article publishing endpoint
app.post('/api/tenant/documentation/articles/:uuid/publish', 
  authenticateUser,
  requirePermission('documentation.publish'),
  async (req, res) => {
    const { tenantId } = req.user;
    const { uuid } = req.params;
    
    // Publish article
    const article = await publishArticle(tenantId, uuid, req.user.id);
    res.json(article);
  }
);
```

---

## ADMIN UI FEATURES

### 1. Documentation Dashboard

**Location:** `src/pages/admin/Documentation.tsx`

**Features:**
- ✅ Article management interface
- ✅ Category organization
- ✅ Content editor with rich text support
- ✅ Publishing workflow
- ⏳ Version control interface (planned)
- ⏳ Analytics dashboard (planned)

### 2. Help Desk Interface

**Features:**
- ✅ Ticket management system
- ✅ Customer communication tools
- ✅ Knowledge base integration
- ⏳ SLA tracking (planned)
- ⏳ Automated responses (planned)

### 3. Content Analytics

**Features:**
- ⏳ Content performance metrics (planned)
- ⏳ Search analytics (planned)
- ⏳ User engagement tracking (planned)
- ⏳ Content gap analysis (planned)

---

## SAMPLE DATA

### Sample Documentation Articles

```sql
INSERT INTO documentation_articles (tenant_id, title, slug, content, status, visibility, author_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Getting Started with Custom Etching', 'getting-started-custom-etching', 'Welcome to our custom etching service...', 'published', 'public', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Material Selection Guide', 'material-selection-guide', 'Choosing the right material for your etching project...', 'published', 'public', 1);
```

### Sample Categories

```sql
INSERT INTO documentation_categories (tenant_id, name, slug, description, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Getting Started', 'getting-started', 'Basic guides for new customers', 1),
('550e8400-e29b-41d4-a716-446655440000', 'Technical Guides', 'technical-guides', 'Detailed technical documentation', 1),
('550e8400-e29b-41d4-a716-446655440000', 'FAQ', 'faq', 'Frequently asked questions', 1);
```

### Sample Knowledge Base

```sql
INSERT INTO knowledge_base (tenant_id, question, answer, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'What materials can be etched?', 'We can etch on various materials including metals, glass, wood, and plastics...', 1),
('550e8400-e29b-41d4-a716-446655440000', 'How long does the etching process take?', 'The etching process typically takes 3-5 business days depending on complexity...', 1);
```

---

## MIGRATION SCRIPT

```sql
-- Migration: Create documentation tables
-- Version: 1.0
-- Date: 2025-11-11

BEGIN;

-- Create documentation_categories table
CREATE TABLE documentation_categories (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(100) NULL,
    color VARCHAR(7) NULL,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    article_count INT DEFAULT 0,
    metadata JSONB NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES documentation_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT unique_category_slug_per_tenant UNIQUE (tenant_id, slug),
    CONSTRAINT unique_category_name_per_parent UNIQUE (tenant_id, parent_id, name)
);

-- Create documentation_articles table
CREATE TABLE documentation_articles (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category_id BIGINT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    excerpt TEXT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'markdown',
    status VARCHAR(50) DEFAULT 'draft',
    visibility VARCHAR(50) DEFAULT 'private',
    featured_image_url VARCHAR(1000) NULL,
    meta_title VARCHAR(500) NULL,
    meta_description TEXT NULL,
    meta_keywords TEXT NULL,
    reading_time INT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    tags JSONB NULL,
    related_articles JSONB NULL,
    author_id BIGINT NOT NULL,
    reviewer_id BIGINT NULL,
    published_by BIGINT NULL,
    published_at TIMESTAMP NULL,
    last_reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(uuid) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES documentation_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_article_slug_per_tenant UNIQUE (tenant_id, slug),
    CONSTRAINT check_status CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
    CONSTRAINT check_visibility CHECK (visibility IN ('private', 'internal', 'public', 'customer')),
    CONSTRAINT check_content_type CHECK (content_type IN ('markdown', 'html', 'rich_text')),
    CONSTRAINT check_difficulty_level CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert'))
);

-- Create remaining tables (documentation_versions, help_tickets, knowledge_base, user_guides)
-- [Additional table creation statements would continue here...]

-- Create indexes
CREATE INDEX idx_documentation_articles_tenant_id ON documentation_articles(tenant_id);
CREATE INDEX idx_documentation_articles_category_id ON documentation_articles(category_id);
CREATE INDEX idx_documentation_articles_status ON documentation_articles(status);
CREATE INDEX idx_documentation_articles_visibility ON documentation_articles(visibility);
CREATE INDEX idx_documentation_articles_title_search ON documentation_articles USING gin(to_tsvector('english', title));

CREATE INDEX idx_documentation_categories_tenant_id ON documentation_categories(tenant_id);
CREATE INDEX idx_documentation_categories_parent_id ON documentation_categories(parent_id);

-- Create triggers
CREATE TRIGGER update_documentation_articles_updated_at
BEFORE UPDATE ON documentation_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentation_categories_updated_at
BEFORE UPDATE ON documentation_categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

---

## PERFORMANCE INDEXES

### Index Strategy

```sql
-- Documentation articles indexes
CREATE INDEX idx_documentation_articles_tenant_id ON documentation_articles(tenant_id);
CREATE INDEX idx_documentation_articles_status_visibility ON documentation_articles(status, visibility);
CREATE INDEX idx_documentation_articles_published_at ON documentation_articles(published_at);
CREATE INDEX idx_documentation_articles_title_search ON documentation_articles USING gin(to_tsvector('english', title));
CREATE INDEX idx_documentation_articles_content_search ON documentation_articles USING gin(to_tsvector('english', content));

-- Help tickets indexes
CREATE INDEX idx_help_tickets_tenant_status ON help_tickets(tenant_id, status);
CREATE INDEX idx_help_tickets_priority_created ON help_tickets(priority, created_at);
CREATE INDEX idx_help_tickets_customer_email ON help_tickets(customer_email);

-- Knowledge base indexes
CREATE INDEX idx_knowledge_base_tenant_published ON knowledge_base(tenant_id, is_published);
CREATE INDEX idx_knowledge_base_question_search ON knowledge_base USING gin(to_tsvector('english', question));

-- Composite indexes for common queries
CREATE INDEX idx_articles_tenant_category_status ON documentation_articles(tenant_id, category_id, status);
CREATE INDEX idx_categories_tenant_parent_visible ON documentation_categories(tenant_id, parent_id, is_visible);
```

### Query Performance Benchmarks

**Expected Performance (5,000 articles per tenant):**

| Query Type | Expected Time | Index Used |
|------------|---------------|------------|
| Get published articles | < 20ms | idx_articles_tenant_category_status |
| Search article content | < 50ms | idx_documentation_articles_content_search |
| Get category tree | < 15ms | idx_categories_tenant_parent_visible |
| Filter help tickets | < 10ms | idx_help_tickets_tenant_status |
| Search knowledge base | < 30ms | idx_knowledge_base_question_search |

### Optimization Techniques

**1. Content Caching:**
```typescript
// Cache frequently accessed articles
const cacheKey = `docs:${tenantId}:${categoryId}:published`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const articles = await getPublishedArticles(tenantId, categoryId);
await redis.setex(cacheKey, 1800, JSON.stringify(articles)); // 30 minutes
return articles;
```

**2. Search Optimization:**
```typescript
// Use full-text search with ranking
const searchArticles = async (query: string, tenantId: string) => {
  return await db.query(`
    SELECT *, ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery($1)) as rank
    FROM documentation_articles 
    WHERE tenant_id = $2 
    AND to_tsvector('english', title || ' ' || content) @@ plainto_tsquery($1)
    ORDER BY rank DESC, view_count DESC
    LIMIT 20
  `, [query, tenantId]);
};
```

**3. Category Tree Optimization:**
```typescript
// Cache category hierarchy
const getCategoryTree = async (tenantId: string) => {
  const cacheKey = `category_tree:${tenantId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const categories = await buildCategoryTree(tenantId);
  await redis.setex(cacheKey, 3600, JSON.stringify(categories)); // 1 hour
  return categories;
};
```

---

**Previous:** [13-MEDIA.md](./13-MEDIA.md)  
**Next:** [15-THEME.md](./15-THEME.md)