# Maintenance Notes - URL Tenant Configuration

**Version:** 1.0  
**Created:** January 22, 2026  
**Last Updated:** January 22, 2026

## Overview

Dokumen ini berisi informasi maintenance untuk URL Tenant Configuration feature di CanvaStencil. Dirancang untuk membantu developers dalam melakukan maintenance, debugging, dan extending features.

---

## Common Maintenance Tasks

### Adding New Verification Method

Jika ingin menambahkan verification method baru (contoh: HTTP header verification):

1. **Update TypeScript Types**
   ```typescript
   // File: frontend/src/types/tenant-url.ts
   export type DomainVerificationMethod = 'txt' | 'cname' | 'file' | 'http_header';
   ```

2. **Update Method Options**
   ```typescript
   // File: frontend/src/components/tenant-url/wizard-steps/WizardStepChooseMethod.tsx
   const METHOD_OPTIONS: MethodOption[] = [
     // ... existing options
     {
       value: 'http_header',
       title: 'HTTP Header',
       description: 'Add verification header to your server',
       icon: Globe,
     },
   ];
   ```

3. **Update DNS Instructions Component**
   ```typescript
   // File: frontend/src/components/tenant-url/wizard-steps/WizardStepConfigureDns.tsx
   // Add new case in getDnsInstructions() function
   case 'http_header':
     return {
       recordType: 'HTTP HEADER',
       name: 'X-Stencil-Verification',
       value: verificationToken,
       ttl: 'N/A',
     };
   ```

4. **Add Backend Support**
   - Update backend verification logic
   - Add validation rules
   - Update API documentation

5. **Update Tests**
   - Add unit tests untuk new method
   - Add E2E tests untuk verification flow
   - Update integration tests

### Adding New Analytics Metric

Jika ingin menambahkan metric baru (contoh: bounce rate):

1. **Update Analytics Interface**
   ```typescript
   // File: frontend/src/types/tenant-url.ts
   export interface UrlAnalyticsOverview {
     // ... existing fields
     bounce_rate: number;
     bounce_rate_growth: number;
   }
   ```

2. **Update API Service**
   ```typescript
   // File: frontend/src/services/api/tenant-url.ts
   // Ensure endpoint returns new field
   ```

3. **Create/Update Chart Component**
   ```typescript
   // File: frontend/src/components/tenant-url/BounceRateChart.tsx
   export default function BounceRateChart({ data }) {
     // Chart implementation
   }
   ```

4. **Add to Analytics Dashboard**
   ```typescript
   // File: frontend/src/pages/admin/url-configuration/UrlAnalytics.tsx
   <Card>
     <CardHeader>
       <CardTitle>Bounce Rate</CardTitle>
     </CardHeader>
     <CardContent>
       <BounceRateChart data={bounceRateData} />
     </CardContent>
   </Card>
   ```

5. **Add Corresponding Hook**
   ```typescript
   // File: frontend/src/hooks/useTenantUrl.ts
   export function useBounceRate(period: string) {
     return useQuery({
       queryKey: ['analytics', 'bounce-rate', period],
       queryFn: () => getBounceRate(period),
     });
   }
   ```

### Modifying URL Patterns

Jika ingin menambahkan/mengubah URL pattern:

1. **Update Pattern Type Enum**
   ```typescript
   // File: frontend/src/types/tenant-url.ts
   export type UrlPatternType = 'subdomain' | 'path' | 'custom_domain' | 'hybrid';
   ```

2. **Update Pattern Selector Component**
   ```typescript
   // File: frontend/src/components/tenant-url/UrlPatternSelector.tsx
   const PATTERN_OPTIONS = [
     // ... existing patterns
     {
       value: 'hybrid',
       label: 'Hybrid (Subdomain + Custom)',
       description: 'Use both subdomain and custom domain',
       icon: Globe,
       example: (slug) => `${slug}.example.com`,
     },
   ];
   ```

3. **Update Backend Validation**
   - Add validation rules di backend
   - Update database constraints
   - Update migration scripts

4. **Update Database Seeders**
   - Add new pattern to seed data
   - Update test fixtures

5. **Update Tests**
   - Unit tests untuk new pattern
   - E2E tests untuk pattern selection
   - Validation tests

### Adding New Chart Type

Untuk menambahkan chart baru (contoh: funnel chart):

1. **Create Chart Component**
   ```tsx
   // File: frontend/src/components/tenant-url/FunnelChart.tsx
   import { ResponsiveContainer, Funnel, FunnelChart } from 'recharts';
   
   export default function CustomFunnelChart({ data }) {
     return (
       <ResponsiveContainer width="100%" height={300}>
         <FunnelChart data={data}>
           <Funnel dataKey="value" />
         </FunnelChart>
       </ResponsiveContainer>
     );
   }
   ```

2. **Add JSDoc Documentation**
3. **Add to Dashboard**
4. **Create Data Fetching Hook**
5. **Add Loading Skeleton**
6. **Add Tests**

### Updating DNS Provider Instructions

Untuk menambahkan DNS provider-specific instructions:

1. **Update DnsInstructionsCard Component**
   ```typescript
   const PROVIDER_GUIDES = {
     cloudflare: { url: 'https://...', steps: [...] },
     godaddy: { url: 'https://...', steps: [...] },
     namecheap: { url: 'https://...', steps: [...] },
     // Add new provider here
   };
   ```

2. **Add Provider Detection Logic** (optional)
3. **Update User Guide Documentation**

---

## Code Conventions

### TypeScript Standards

- **Always use TypeScript** untuk semua files
- **Strict mode enabled**: No `any` types kecuali absolutely necessary
- **Use proper type imports**: `import type { ... }` untuk type-only imports
- **Export types explicitly**: Gunakan `export interface` atau `export type`

### Component Patterns

```typescript
// Good: Proper JSDoc, TypeScript types, destructured props
/**
 * Component description
 * 
 * @component
 * @example
 * ```tsx
 * <MyComponent prop="value" />
 * ```
 */
interface MyComponentProps {
  prop: string;
  optionalProp?: boolean;
}

export default function MyComponent({ prop, optionalProp = false }: MyComponentProps) {
  return <div>{prop}</div>;
}
```

### React Query Patterns

```typescript
// Good: Proper error handling, cache configuration, logging
export function useMyData() {
  const { tenant } = useTenantAuth();
  
  return useQuery({
    queryKey: ['my-data', tenant?.uuid],
    queryFn: async () => {
      logger.debug('Fetching data', { tenantId: tenant?.uuid });
      return await fetchData();
    },
    enabled: !!tenant?.uuid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

### Mutation Patterns with Optimistic Updates

```typescript
export function useUpdateData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateData,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['data'] });
      const previousData = queryClient.getQueryData(['data']);
      queryClient.setQueryData(['data'], newData);
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['data'], context.previousData);
      }
      toastHelpers.error(err, 'Update failed');
    },
    onSuccess: () => {
      toastHelpers.success('Updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] });
    },
  });
}
```

### Form Validation with Zod

```typescript
const formSchema = z.object({
  field: z.string()
    .min(3, 'Minimal 3 karakter')
    .max(50, 'Maksimal 50 karakter')
    .regex(/^[a-z0-9-]+$/, 'Hanya lowercase, numbers, dan hyphens'),
});

type FormData = z.infer<typeof formSchema>;
```

### Error Handling

```typescript
// Good: Comprehensive error handling
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error instanceof AuthError) {
    // Handle auth error
  } else if (error instanceof ApiError) {
    // Handle API error
  } else {
    // Handle unknown error
  }
  throw error; // Re-throw after handling
}
```

### Naming Conventions

- **Components**: PascalCase (`DomainVerificationBadge.tsx`)
- **Hooks**: camelCase with `use` prefix (`useTenantUrl.ts`)
- **Services**: camelCase (`tenant-url.ts`)
- **Types**: PascalCase for interfaces/types (`TenantUrlConfiguration`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DOMAINS`, `DEFAULT_PERIOD`)
- **Functions**: camelCase (`handleVerify`, `getDnsInstructions`)

---

## Deployment Checklist

Sebelum deploy ke production:

### Pre-Deployment

- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] No console errors in browser
- [ ] Lighthouse score >85 for all pages
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] Mobile responsive verified (320px - 1920px)
- [ ] Dark mode tested
- [ ] Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)

### Performance Checks

- [ ] Bundle size within limits
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] API response times <500ms
- [ ] Charts render smoothly

### Security Checks

- [ ] No secrets in code
- [ ] Authentication working correctly
- [ ] Authorization enforced
- [ ] Input validation on all forms
- [ ] XSS protection verified
- [ ] CSRF protection enabled

### Documentation

- [ ] README updated
- [ ] API documentation current
- [ ] JSDoc comments added
- [ ] User guide updated
- [ ] Changelog updated

---

## Known Issues

### Current Known Issues

**None at this time.**

### Previously Resolved Issues

1. **DNS Propagation False Positives** (Resolved: Jan 20, 2026)
   - Issue: Verification kadang succeed sebelum DNS fully propagated
   - Solution: Added 30-second delay dan multiple DNS server checks
   
2. **Chart Re-rendering on Period Change** (Resolved: Jan 21, 2026)
   - Issue: Charts flicker saat period selector berubah
   - Solution: Implemented proper React Query cache dan suspense boundaries

---

## Performance Optimization

### Current Optimizations

1. **Lazy Loading**
   - Charts loaded on-demand menggunakan React.lazy()
   - Images lazy-loaded dengan loading="lazy"
   - Routes code-split untuk smaller bundles

2. **React Query Caching**
   - URL configuration cached 5 minutes
   - Custom domains cached 2 minutes
   - Analytics data cached 5 minutes
   - DNS instructions cached 10 minutes

3. **Optimistic Updates**
   - URL configuration updates optimistic
   - Domain mutations optimistic
   - Primary domain selection optimistic

4. **Skeleton Screens**
   - Loading states untuk all data fetching
   - Smooth transitions dengan fade-in animations

5. **Debouncing & Throttling**
   - Form inputs debounced 300ms
   - Search inputs debounced 500ms
   - Scroll handlers throttled

### Performance Monitoring

Monitor these metrics:

- **Bundle Size**: Target <300KB main bundle
- **First Contentful Paint**: Target <1.5s
- **Time to Interactive**: Target <3s
- **Lighthouse Score**: Target >85
- **API Response Times**: Target <500ms p95

---

## Security Considerations

### Authentication & Authorization

- All API calls require Bearer token authentication
- Token stored securely di httpOnly cookies (production)
- Automatic token refresh implemented
- Tenant context validated on every request

### Data Protection

- **UUID-Only Exposure**: No integer IDs exposed to frontend
- **Input Validation**: All forms validated dengan Zod schemas
- **XSS Protection**: React automatic escaping + DOMPurify for rich content
- **CSRF Protection**: SameSite cookies + CSRF tokens

### API Security

- Rate limiting enforced di backend
- Request size limits enforced
- SQL injection prevention (parameterized queries)
- No sensitive data logged (UUIDs only)

### Compliance

- **NO MOCK DATA**: 100% real backend integration
- **RBAC Enforced**: Tenant-scoped data access
- **Error Handling**: No data leaks via error messages
- **Audit Logging**: All mutations logged di backend

---

## Monitoring & Debugging

### Logging

Component menggunakan centralized logger:

```typescript
import { logger } from '@/lib/logger';

logger.debug('Debug message', { context });
logger.info('Info message', { context });
logger.warn('Warning message', { context });
logger.error('Error message', { error, context });
```

### Debug Mode

Enable debug mode untuk verbose logging:

```typescript
localStorage.setItem('debug', 'true');
```

### Common Debug Points

1. **Domain Verification Issues**
   ```typescript
   // Check verification logs
   const { data: logs } = useDomainVerificationLogs(domainUuid);
   console.log('Verification attempts:', logs);
   ```

2. **API Call Failures**
   - Check Network tab di DevTools
   - Look for 401/403 errors (auth issues)
   - Look for 400 errors (validation issues)
   - Check Response tab untuk error messages

3. **React Query Cache Issues**
   ```typescript
   // Inspect cache state
   import { useQueryClient } from '@tanstack/react-query';
   const queryClient = useQueryClient();
   console.log('Cache:', queryClient.getQueryData(['tenant-url', 'configuration']));
   ```

### Error Tracking

Production errors tracked via:
- Sentry for client-side errors
- Backend logs for API errors
- Analytics for user behavior

---

## Testing Guidelines

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test DomainVerificationBadge.test.tsx
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E in headed mode
npm run test:e2e -- --headed
```

### Test Coverage Requirements

- Components: >80% coverage
- Hooks: >90% coverage
- Services: >95% coverage
- Critical paths: 100% coverage

---

## Dependencies Management

### Key Dependencies

- **React Query**: Data fetching dan caching
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **Recharts**: Chart visualization
- **Sonner**: Toast notifications
- **Lucide React**: Icons

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update react-query

# Update all (caution!)
npm update
```

### Breaking Changes to Watch

- React Query v5+ has breaking changes
- React Hook Form v8+ validation changes
- Recharts frequent API changes

---

## Troubleshooting Guide

### Domain Verification Not Working

**Symptoms:** Verification fails dengan "DNS records not found"

**Debugging Steps:**
1. Check DNS records dengan `nslookup` atau https://www.whatsmydns.net/
2. Verify record type (TXT vs CNAME)
3. Check for typos in record name/value
4. Wait for DNS propagation (up to 48 hours)
5. Check verification logs di database

**Common Causes:**
- DNS not propagated yet
- Wrong record type configured
- Typo in verification token
- DNS caching di provider

### Charts Not Rendering

**Symptoms:** Charts show blank atau error

**Debugging Steps:**
1. Check browser console for errors
2. Verify Recharts library loaded
3. Check data format matches chart expectations
4. Verify container has height/width

**Common Causes:**
- Missing data
- Invalid data format
- Container with 0 height
- Recharts version mismatch

### API Authentication Errors

**Symptoms:** 401 errors di Network tab

**Debugging Steps:**
1. Check if token exists di localStorage/cookies
2. Verify token not expired
3. Check tenant context available
4. Try logout and login again

**Common Causes:**
- Token expired
- Invalid token
- Missing tenant context
- CORS issues

### Performance Issues

**Symptoms:** Slow page load atau laggy interactions

**Debugging Steps:**
1. Run Lighthouse audit
2. Check Network tab untuk slow requests
3. Check bundle size dengan `npm run build -- --stats`
4. Profile dengan React DevTools Profiler

**Common Causes:**
- Large bundle size
- Unoptimized images
- Missing code splitting
- Excessive re-renders

---

## Contact & Support

### Development Team

- **Lead Developer**: [Team Lead Name]
- **Backend Team**: backend-team@canvastack.com
- **Frontend Team**: frontend-team@canvastack.com

### Resources

- **Project Repository**: Internal GitLab
- **API Documentation**: https://docs.api.stencil.canvastack.com
- **Design System**: https://design.canvastack.com
- **Wiki**: https://wiki.canvastack.com/url-tenant-config

### Reporting Issues

1. Check Known Issues section above
2. Search existing issues di project tracker
3. Create new issue dengan template:
   - Description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots
   - Environment details

---

## Changelog

### Version 1.0 (January 22, 2026)

**Initial Release:**
- URL Configuration management
- Custom Domains dengan verification wizard
- URL Analytics dashboard
- Comprehensive documentation

---

**Last Updated:** January 22, 2026  
**Maintainer:** CanvaStencil Development Team
