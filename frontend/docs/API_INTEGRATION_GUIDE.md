# API Integration Guide - URL Tenant Configuration

## Overview

Panduan ini menjelaskan bagaimana frontend terintegrasi dengan backend URL Tenant Configuration API. Semua data fetching menggunakan React Query (TanStack Query) untuk optimal caching dan automatic refetching.

## Base URL

```
Production: https://api.stencil.canvastack.com/v1
Development: http://localhost:8000
```

## Authentication

Semua API requests memerlukan Bearer token authentication:

```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Tenant-ID': tenant_uuid,
  'Content-Type': 'application/json'
}
```

Token didapatkan dari authentication flow dan disimpan di localStorage/sessionStorage.

## API Endpoints

### URL Configuration

#### Get Configuration

```http
GET /api/tenant/url-configuration
```

**Response:**
```json
{
  "data": {
    "uuid": "cfg-550e8400-e29b-41d4-a716-446655440000",
    "tenant_uuid": "tenant-550e8400-e29b-41d4-a716-446655440001",
    "primary_url_pattern": "subdomain",
    "is_subdomain_enabled": true,
    "subdomain_pattern": "mytenant",
    "is_path_enabled": false,
    "path_prefix": null,
    "is_custom_domain_enabled": false,
    "force_https": true,
    "enable_www_redirect": false,
    "enable_analytics_tracking": true,
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-22T14:20:00Z"
  }
}
```

**Usage dalam React:**

```typescript
import { useUrlConfiguration } from '@/hooks/useTenantUrl';

function UrlConfigPage() {
  const { data: config, isLoading, error } = useUrlConfiguration();
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>Primary Pattern: {config.primary_url_pattern}</div>;
}
```

#### Update Configuration

```http
PUT /api/tenant/url-configuration
```

**Request Body:**
```json
{
  "primary_url_pattern": "custom_domain",
  "is_subdomain_enabled": true,
  "subdomain_pattern": "mytenant",
  "force_https": true,
  "enable_analytics_tracking": true
}
```

**Response:**
```json
{
  "data": {
    "uuid": "cfg-550e8400-e29b-41d4-a716-446655440000",
    "primary_url_pattern": "custom_domain",
    "force_https": true,
    "enable_analytics_tracking": true,
    "updated_at": "2026-01-22T15:00:00Z"
  },
  "message": "URL configuration updated successfully"
}
```

**Usage dalam React:**

```typescript
import { useUpdateUrlConfiguration } from '@/hooks/useTenantUrl';

function UpdateButton() {
  const updateMutation = useUpdateUrlConfiguration();
  
  const handleUpdate = async () => {
    try {
      await updateMutation.mutateAsync({
        primary_url_pattern: 'subdomain',
        force_https: true
      });
      toast.success('Configuration updated!');
    } catch (error) {
      toast.error('Update failed');
    }
  };
  
  return (
    <button onClick={handleUpdate} disabled={updateMutation.isPending}>
      {updateMutation.isPending ? 'Saving...' : 'Save'}
    </button>
  );
}
```

---

### Custom Domains

#### List Domains

```http
GET /api/tenant/custom-domains?page=1&per_page=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by verification_status (verified/pending/failed)

**Response:**
```json
{
  "data": [
    {
      "uuid": "domain-550e8400-e29b-41d4-a716-446655440002",
      "tenant_uuid": "tenant-550e8400-e29b-41d4-a716-446655440001",
      "domain_name": "example.com",
      "is_primary": true,
      "verification_status": "verified",
      "verification_method": "txt",
      "verification_token": "stencil-verify-abc123def456",
      "ssl_status": "active",
      "ssl_expires_at": "2026-04-15T10:00:00Z",
      "dns_configured": true,
      "created_at": "2026-01-10T08:00:00Z",
      "verified_at": "2026-01-10T10:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 3,
    "total_pages": 1
  }
}
```

**Usage dalam React:**

```typescript
import { useCustomDomains } from '@/hooks/useTenantUrl';

function DomainsList() {
  const { data: domains, isLoading } = useCustomDomains();
  
  if (isLoading) return <DomainCardSkeleton />;
  
  return (
    <div>
      {domains?.map(domain => (
        <DomainCard key={domain.uuid} domain={domain} />
      ))}
    </div>
  );
}
```

#### Add Domain

```http
POST /api/tenant/custom-domains
```

**Request Body:**
```json
{
  "domain_name": "example.com",
  "verification_method": "txt"
}
```

**Validation Rules:**
- `domain_name`: Valid domain format, unique per tenant
- `verification_method`: One of: txt, cname, file

**Response:**
```json
{
  "data": {
    "uuid": "domain-550e8400-e29b-41d4-a716-446655440003",
    "domain_name": "example.com",
    "verification_status": "pending",
    "verification_method": "txt",
    "verification_token": "stencil-verify-xyz789abc123",
    "ssl_status": "pending",
    "created_at": "2026-01-22T15:30:00Z"
  },
  "message": "Domain added successfully. Please configure DNS to verify ownership."
}
```

**Usage dalam React:**

```typescript
import { useAddCustomDomain } from '@/hooks/useTenantUrl';

function AddDomainForm() {
  const addMutation = useAddCustomDomain();
  
  const handleSubmit = async (data) => {
    try {
      const result = await addMutation.mutateAsync({
        domain_name: data.domain,
        verification_method: 'txt'
      });
      toast.success('Domain added! Please configure DNS.');
      // Open verification wizard
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### Verify Domain

```http
POST /api/tenant/custom-domains/{uuid}/verify
```

**Response (Success):**
```json
{
  "data": {
    "domain": {
      "uuid": "domain-550e8400-e29b-41d4-a716-446655440003",
      "domain_name": "example.com",
      "verification_status": "verified",
      "dns_configured": true,
      "verified_at": "2026-01-22T16:00:00Z"
    },
    "ssl_provisioning": {
      "status": "pending",
      "estimated_completion": "2026-01-22T16:15:00Z"
    }
  },
  "message": "Domain verified successfully! SSL certificate provisioning in progress."
}
```

**Response (Failed):**
```json
{
  "message": "Verification failed: DNS records not found",
  "errors": {
    "verification": [
      "TXT record '_stencil-verify.example.com' not found in DNS",
      "Please ensure DNS changes have propagated (may take up to 48 hours)"
    ]
  },
  "code": "VERIFICATION_FAILED"
}
```

**Usage dalam React:**

```typescript
import { useVerifyDomain } from '@/hooks/useTenantUrl';

function VerifyButton({ domainUuid }) {
  const verifyMutation = useVerifyDomain();
  const [error, setError] = useState(null);
  
  const handleVerify = async () => {
    try {
      setError(null);
      const result = await verifyMutation.mutateAsync(domainUuid);
      toast.success('Domain verified!');
    } catch (err) {
      setError(err.message);
      toast.error('Verification failed');
    }
  };
  
  return (
    <>
      <button onClick={handleVerify} disabled={verifyMutation.isPending}>
        {verifyMutation.isPending ? 'Verifying...' : 'Verify Now'}
      </button>
      {error && <Alert variant="destructive">{error}</Alert>}
    </>
  );
}
```

#### Set Primary Domain

```http
POST /api/tenant/custom-domains/{uuid}/set-primary
```

**Response:**
```json
{
  "data": {
    "uuid": "domain-550e8400-e29b-41d4-a716-446655440003",
    "domain_name": "example.com",
    "is_primary": true,
    "updated_at": "2026-01-22T16:30:00Z"
  },
  "message": "Primary domain updated successfully"
}
```

**Usage dalam React:**

```typescript
import { useSetPrimaryDomain } from '@/hooks/useTenantUrl';

function SetPrimaryButton({ domainUuid }) {
  const setPrimaryMutation = useSetPrimaryDomain();
  
  return (
    <button 
      onClick={() => setPrimaryMutation.mutate(domainUuid)}
      disabled={setPrimaryMutation.isPending}
    >
      Set as Primary
    </button>
  );
}
```

#### Delete Domain

```http
DELETE /api/tenant/custom-domains/{uuid}
```

**Response:**
```json
{
  "message": "Domain deleted successfully"
}
```

**Error (Primary Domain):**
```json
{
  "message": "Cannot delete primary domain",
  "errors": {
    "domain": ["Please set another domain as primary before deleting this one"]
  },
  "code": "PRIMARY_DOMAIN_DELETE_ERROR"
}
```

**Usage dalam React:**

```typescript
import { useDeleteDomain } from '@/hooks/useTenantUrl';

function DeleteButton({ domain }) {
  const deleteMutation = useDeleteDomain();
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(domain.uuid);
      toast.success('Domain deleted');
      setShowConfirm(false);
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  return (
    <>
      <button onClick={() => setShowConfirm(true)}>Delete</button>
      <ConfirmDialog 
        open={showConfirm}
        onConfirm={handleDelete}
        message={`Delete ${domain.domain_name}?`}
      />
    </>
  );
}
```

#### Get DNS Instructions

```http
GET /api/tenant/custom-domains/{uuid}/dns-instructions
```

**Response:**
```json
{
  "data": {
    "record_type": "TXT",
    "host": "_stencil-verify.example.com",
    "value": "stencil-verify-xyz789abc123",
    "ttl": 3600,
    "priority": null,
    "instructions": "Add this TXT record to your DNS provider"
  }
}
```

**Usage dalam React:**

```typescript
import { useDnsInstructions } from '@/hooks/useTenantUrl';

function DnsInstructionsCard({ domainUuid }) {
  const { data: instructions, isLoading } = useDnsInstructions(domainUuid);
  
  if (isLoading) return <Skeleton />;
  
  return (
    <DnsInstructionsCard 
      instructions={instructions}
      domainName={domain.domain_name}
    />
  );
}
```

---

### Analytics

#### Get Overview

```http
GET /api/tenant/url-analytics/overview?period=30days
```

**Query Parameters:**
- `period`: today, 7days, 30days, 90days, 1year

**Response:**
```json
{
  "data": {
    "total_accesses": 15234,
    "unique_visitors": 4521,
    "avg_response_time_ms": 245,
    "custom_domain_percentage": 65.5,
    "period": "30days",
    "start_date": "2025-12-23",
    "end_date": "2026-01-22"
  }
}
```

**Usage dalam React:**

```typescript
import { useAnalyticsOverview } from '@/hooks/useTenantUrl';

function OverviewCards() {
  const { data: overview } = useAnalyticsOverview('30days');
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardTitle>Total Accesses</CardTitle>
        <CardContent>{overview?.total_accesses.toLocaleString()}</CardContent>
      </Card>
      {/* More cards... */}
    </div>
  );
}
```

#### Get Trends

```http
GET /api/tenant/url-analytics/trends?period=7days
```

**Response:**
```json
{
  "data": {
    "labels": ["Jan 16", "Jan 17", "Jan 18", "Jan 19", "Jan 20", "Jan 21", "Jan 22"],
    "total_accesses": [450, 520, 480, 610, 590, 650, 720],
    "unique_visitors": [180, 210, 195, 240, 230, 260, 280]
  }
}
```

**Usage dalam React:**

```typescript
import { useAccessTrends } from '@/hooks/useTenantUrl';
import AccessTrendsChart from '@/components/tenant-url/AccessTrendsChart';

function TrendsSection() {
  const { data: trends } = useAccessTrends('7days');
  
  return <AccessTrendsChart data={trends} />;
}
```

#### Get URL Pattern Breakdown

```http
GET /api/tenant/url-analytics/pattern-breakdown?period=30days
```

**Response:**
```json
{
  "data": {
    "subdomain": 8500,
    "path": 2100,
    "custom_domain": 4634
  }
}
```

#### Get Geographic Distribution

```http
GET /api/tenant/url-analytics/geographic?period=30days&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "country_code": "US",
      "country_name": "United States",
      "access_count": 5240,
      "percentage": 34.4
    },
    {
      "country_code": "ID",
      "country_name": "Indonesia",
      "access_count": 3120,
      "percentage": 20.5
    }
  ]
}
```

#### Get Performance Distribution

```http
GET /api/tenant/url-analytics/performance?period=30days
```

**Response:**
```json
{
  "data": {
    "under_100ms": 4200,
    "under_500ms": 7800,
    "under_1s": 2400,
    "under_2s": 600,
    "over_2s": 234
  }
}
```

#### Get Top Referrers

```http
GET /api/tenant/url-analytics/referrers?period=30days&limit=10
```

**Response:**
```json
{
  "data": [
    {
      "referrer": "google.com",
      "count": 4520,
      "percentage": 29.7
    },
    {
      "referrer": null,
      "count": 3100,
      "percentage": 20.3
    }
  ]
}
```

Note: `null` referrer represents direct traffic.

#### Get Device Breakdown

```http
GET /api/tenant/url-analytics/devices?period=30days
```

**Response:**
```json
{
  "data": {
    "desktop": 8400,
    "mobile": 5200,
    "tablet": 1400,
    "bot": 234
  }
}
```

---

## Error Handling

Semua errors mengikuti format standard:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field_name": ["Validation error message 1", "Validation error message 2"]
  },
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Input validation failed
- `VERIFICATION_FAILED`: Domain verification failed
- `DNS_NOT_CONFIGURED`: DNS records not found
- `DOMAIN_ALREADY_EXISTS`: Domain already added by this/another tenant
- `PRIMARY_DOMAIN_DELETE_ERROR`: Cannot delete primary domain
- `SSL_PROVISIONING_FAILED`: SSL certificate provisioning failed
- `UNAUTHORIZED`: Invalid or expired token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

**Handling di Frontend:**

```typescript
// API service error handler
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data;
    throw new Error(apiError?.message || 'An error occurred');
  }
  throw error;
}

// Dalam component
try {
  await mutation.mutateAsync(data);
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

---

## Rate Limiting

- **Standard Endpoints**: 100 requests per minute per tenant
- **Analytics Endpoints**: 50 requests per minute per tenant
- **Verification Endpoint**: 10 requests per hour per domain (untuk prevent abuse)

Rate limit headers included in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706187600
```

**Handling Rate Limits:**

```typescript
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['url-config'],
  queryFn: fetchUrlConfig,
  staleTime: 5 * 60 * 1000, // 5 minutes - reduce requests
  retry: (failureCount, error) => {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      return false; // Don't retry rate limit errors
    }
    return failureCount < 3;
  }
});
```

---

## Best Practices

### 1. Use React Query Hooks

✅ **Good**: Use provided hooks
```typescript
const { data, isLoading } = useCustomDomains();
```

❌ **Bad**: Direct API call
```typescript
const response = await fetch('/api/tenant/custom-domains');
```

### 2. Handle Loading States

✅ **Good**: Show skeleton screens
```typescript
if (isLoading) return <DomainCardSkeleton />;
```

❌ **Bad**: Show nothing or generic loader
```typescript
if (isLoading) return null;
```

### 3. Handle Errors Gracefully

✅ **Good**: User-friendly error messages
```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('Success!');
} catch (error) {
  const message = error instanceof Error 
    ? error.message 
    : 'An error occurred';
  toast.error(message);
}
```

❌ **Bad**: Show technical errors
```typescript
catch (error) {
  console.error(error); // User sees nothing
}
```

### 4. Implement Optimistic Updates

```typescript
const updateMutation = useUpdateUrlConfiguration({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['url-config'] });
    
    // Snapshot previous value
    const previousConfig = queryClient.getQueryData(['url-config']);
    
    // Optimistically update
    queryClient.setQueryData(['url-config'], newData);
    
    return { previousConfig };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['url-config'], context?.previousConfig);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['url-config'] });
  }
});
```

### 5. Cache Invalidation

```typescript
const deleteMutation = useDeleteDomain({
  onSuccess: () => {
    // Invalidate domains list after delete
    queryClient.invalidateQueries({ queryKey: ['custom-domains'] });
    toast.success('Domain deleted');
  }
});
```

### 6. Debounce Heavy Operations

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value) => {
    // Search API call
  },
  500 // 500ms delay
);
```

---

## Testing API Integration

### Mock API Responses untuk Testing

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/tenant/url-configuration', (req, res, ctx) => {
    return res(
      ctx.json({
        data: {
          uuid: 'test-uuid',
          primary_url_pattern: 'subdomain'
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Integration Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useUrlConfiguration } from '@/hooks/useTenantUrl';

test('fetches URL configuration', async () => {
  const { result } = renderHook(() => useUrlConfiguration());
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data.primary_url_pattern).toBe('subdomain');
});
```

---

## Environment Configuration

```typescript
// config/api.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Usage
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const apiClient = axios.create(API_CONFIG);
```

---

## Related Documentation

- [Feature README](../src/pages/admin/url-configuration/README.md)
- [User Guide](../../docs/USER_GUIDE_URL_MANAGEMENT.md)
- [Maintenance Notes](./MAINTENANCE_NOTES.md)

---

**Version**: 1.0  
**Last Updated**: January 22, 2026  
**Maintained by**: CanvaStack Development Team
