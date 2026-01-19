# PLUGIN DEVELOPMENT GUIDE - INDEX

**Version:** 1.0  
**Last Updated:** January 16, 2026  
**Status:** Production Ready

---

## OVERVIEW

Dokumentasi komprehensif untuk pengembangan plugin pada **CanvaStencil Multi-Tenant CMS Platform**. Guide ini berdasarkan pembelajaran dari implementasi **Pages Engine Plugin** (Sessions 1-6) dan mengikuti standar development yang telah ditetapkan.

---

## TABLE OF CONTENTS

### 1. [Getting Started](./01-GETTING-STARTED.md)
- Persiapan environment
- Plugin structure overview
- Scaffolding plugin baru
- Initial configuration

### 2. [Plugin Architecture](./02-ARCHITECTURE.md)
- Hexagonal Architecture implementation
- Domain-Driven Design principles
- Layer responsibilities
- Dependency injection patterns

### 3. [Multi-Tenant Architecture](./03-MULTI-TENANT.md)
- **UUID vs Integer ID conversion** (CRITICAL)
- Tenant schema isolation
- Database design patterns
- Repository UUID/ID translation layer

### 4. [Authorization & Permissions](./04-AUTHORIZATION.md)
- Spatie Permission configuration
- Multi-tenant RBAC setup
- Permission seeding
- Model configuration requirements
- Authorization middleware

### 5. [Repository Pattern Implementation](./05-REPOSITORY-PATTERN.md)
- Repository interface design
- Eloquent implementation with UUID conversion
- Query patterns for tenant isolation
- Bidirectional mapping (Domain ↔ Database)

### 6. [Common Pitfalls & Solutions](./06-COMMON-PITFALLS.md)
- UUID/ID type mismatch errors
- Authorization model mismatches
- Tenant scoping issues
- Foreign key relationship problems
- Collection vs Array type errors

### 7. [Best Practices](./07-BEST-PRACTICES.md)
- Code organization
- Error handling
- Testing strategies
- Performance optimization
- Security considerations

### 8. [Testing Standards](./08-TESTING.md)
- Unit testing domain layer
- Integration testing repositories
- Feature testing API endpoints
- Multi-tenant test isolation
- NO MOCK DATA policy enforcement

### 9. [Case Study: Pages Engine Plugin](./09-CASE-STUDY-PAGES-ENGINE.md)
- Complete implementation walkthrough
- Problem resolution timeline (Sessions 1-6)
- Lessons learned
- Production deployment checklist

---

## CRITICAL DEVELOPMENT RULES

### Zero Tolerance Policies

#### 1. NO MOCK/HARDCODE DATA (ABSOLUTE)
```
❌ BANNED: Mock data, hardcoded values, fake data generators
✅ REQUIRED: 100% Real backend API integration, database seeders only
```

#### 2. UUID-ONLY PUBLIC EXPOSURE (ABSOLUTE)
```
❌ BANNED: Exposing integer database IDs in APIs, URLs, responses
✅ REQUIRED: UUID string for all public-facing resource identification
```

#### 3. TEST SUITE INTEGRITY (ABSOLUTE)
```
❌ BANNED: Committing code with test failures, skipping tests
✅ REQUIRED: 100% test pass rate before any commit
```

---

## ARCHITECTURE ALIGNMENT

All plugin development MUST align with:

### Core References
- `.zencoder/rules` - Immutable development rules
- `.zencoder/repo.md` - Repository standards
- `README.md` - Project overview

### Architecture Documents
- `roadmaps/ARCHITECTURE/BUSINESS_HEXAGONAL_PLAN/HEXAGONAL_AND_ARCHITECTURE_PLAN.md`
- `roadmaps/ARCHITECTURE/BUSINESS_HEXAGONAL_PLAN/BUSINESS_CYCLE_PLAN.md`
- `roadmaps/ARCHITECTURE/ADVANCED_SYSTEMS/0-INDEX.md`
- `roadmaps/ARCHITECTURE/DESIGN_PATTERN/COMPREHENSIVE_DESIGN_PATTERN_ANALYSIS.md`

### Database Standards
- `roadmaps/database-schema/01-STANDARDS.md`
- `roadmaps/database-schema/00-INDEX.md` through `21-SUPPLIERS.md`

### API Specifications
- `openapi/*.yaml` - All API contract definitions

---

## MULTI-TENANT RBAC RULES

### Core Configuration (IMMUTABLE)
```yaml
teams: true                    # Multi-tenant enabled
team_foreign_key: tenant_id    # Tenant scoping column
guard_name: api                # Laravel Sanctum API guard
model_morph_key: model_uuid    # UUID for polymorphic relations
```

### Tenant Role Scoping
```
✅ All tenant roles/permissions MUST be bound to specific tenant_id
❌ NO tenant roles with tenant_id IS NULL
✅ Platform Admin operates at landlord level (account_type = 'platform')
❌ Platform Admin NEVER operates on tenant schemas directly
```

### Authentication Context Separation
```
✅ account_type is single source of truth:
   - 'platform' → PlatformAuthContext only
   - 'tenant'   → TenantAuthContext only

❌ Auth contexts MUST NOT call clearAuth() for different account_type
✅ Only context owning current account_type may clear auth
```

---

## DATABASE DESIGN STANDARDS

### Dual Identifier Strategy (MANDATORY)
```sql
-- All tables MUST have both columns
CREATE TABLE plugin_entities (
    id BIGSERIAL PRIMARY KEY,              -- Internal database use only
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- Public API exposure
    tenant_id BIGINT REFERENCES tenants(id),
    -- other columns...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_plugin_entities_uuid ON plugin_entities(uuid);
CREATE INDEX idx_plugin_entities_tenant_id ON plugin_entities(tenant_id);
```

### UUID ↔ Integer ID Translation Pattern
```php
// Query: UUID → Integer ID
$tenant = DB::table('tenants')
    ->where('uuid', $tenantId->getValue())
    ->first();
$query->where('tenant_id', $tenant->id);

// Read: Integer ID → UUID
$tenant = DB::table('tenants')
    ->where('id', $model->tenant_id)
    ->first();
$tenantUuid = new Uuid($tenant->uuid);

// Write: UUID → Integer ID
$tenant = DB::table('tenants')
    ->where('uuid', $entity->getTenantId()->getValue())
    ->first();
$data['tenant_id'] = $tenant->id;
```

---

## REALISTIC SEEDING DATA REQUIREMENTS

```
✅ Minimum 20-50 seed records per table with business context
✅ Multi-tenant data distribution across tenant types
✅ Relationship consistency with proper foreign keys
✅ Performance testing data for load scenarios
```

---

## UI/UX DESIGN COMPLIANCE

```
✅ Use existing design patterns from src/ folder
✅ Full support for dark/light mode
✅ Responsive design for all screen sizes and devices
✅ Follow shadcn/ui component standards
✅ Maintain Tailwind CSS utility-first approach
```

---

## GETTING HELP

### Internal Resources
- Check existing plugins: `plugins/*/` directories
- Review test implementations: `backend/tests/`
- Consult OpenAPI specs: `openapi/*.yaml`

### Documentation Sections
Each section provides:
- ✅ **Correct implementation examples**
- ❌ **Common mistakes to avoid**
- 🔧 **Troubleshooting guides**
- 💡 **Best practice recommendations**

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-16 | Initial comprehensive plugin development guide |

---

## NEXT STEPS

1. Read [Getting Started](./01-GETTING-STARTED.md) untuk setup awal
2. Study [Multi-Tenant Architecture](./03-MULTI-TENANT.md) untuk UUID/ID pattern (CRITICAL)
3. Review [Authorization](./04-AUTHORIZATION.md) untuk RBAC configuration
4. Examine [Case Study](./09-CASE-STUDY-PAGES-ENGINE.md) untuk real-world implementation

---

**Remember:** Plugin development requires strict adherence to established patterns. The UUID/ID conversion pattern is the most critical aspect to understand and implement correctly.
