# URL & Domain Management Frontend

## Overview

Modul ini menyediakan user interface untuk mengelola konfigurasi URL tenant, custom domains, dan viewing URL analytics.

## Features

### 1. URL Configuration (`/admin/url-configuration`)

Memungkinkan tenant untuk:
- Memilih primary URL pattern (subdomain/path-based/custom domain)
- Mengkonfigurasi subdomain settings
- Mengkonfigurasi path-based settings  
- Mengaktifkan HTTPS enforcement
- Mengaktifkan WWW redirects
- Mengaktifkan URL analytics tracking

**Key Files:**
- `UrlConfiguration.tsx` - Main page component
- `UrlPatternSelector.tsx` - Pattern selection UI dengan 3 opsi
- `SubdomainConfigForm.tsx` - Subdomain configuration form dengan validasi
- `PathConfigForm.tsx` - Path-based configuration form dengan validasi
- `AdvancedSettingsForm.tsx` - Advanced settings form (HTTPS, WWW, Analytics)

**URL Pattern Options:**
1. **Subdomain**: `{slug}.stencil.canvastack.com` (Recommended)
2. **Path-Based**: `stencil.canvastack.com/{slug}`
3. **Custom Domain**: Menggunakan domain sendiri (requires verification)

### 2. Custom Domains (`/admin/custom-domains`)

Memungkinkan tenant untuk:
- Menambahkan custom domain names
- Memverifikasi domain ownership (TXT/CNAME/File methods)
- Melihat SSL certificate status dengan expiry countdown
- Mengkonfigurasi DNS settings dengan copy-to-clipboard
- Set primary domain
- Delete domains dengan confirmation dialog

**Key Files:**
- `CustomDomains.tsx` - Main page component dengan domain list
- `DomainVerificationWizard.tsx` - 5-step verification wizard
- `wizard-steps/` - Individual wizard step components
  - `WizardStepAddDomain.tsx` - Step 1: Enter domain name
  - `WizardStepChooseMethod.tsx` - Step 2: Choose verification method
  - `WizardStepConfigureDns.tsx` - Step 3: DNS configuration instructions
  - `WizardStepVerify.tsx` - Step 4: Verify domain ownership
  - `WizardStepSslSetup.tsx` - Step 5: SSL certificate provisioning

**Domain Verification Flow:**
1. User memasukkan domain name (contoh: `example.com`)
2. Memilih verification method (TXT/CNAME/File)
3. Melihat DNS configuration instructions dengan copy buttons
4. Mengkonfigurasi DNS di provider mereka
5. Klik "Verify" untuk konfirmasi ownership
6. SSL certificate automatically provisioned setelah verified

**Verification Methods:**
- **TXT Record**: Menambahkan TXT record ke DNS (Recommended untuk most providers)
- **CNAME Record**: Menambahkan CNAME record ke DNS (Alternative method)
- **File Upload**: Upload file verification ke web server (Advanced users)

### 3. URL Analytics (`/admin/url-analytics`)

Menampilkan comprehensive analytics dashboard dengan:
- **Overview Metrics**:
  - Total accesses
  - Unique visitors
  - Average response time
  - Custom domain usage percentage
- **Access Trends**: Line chart dengan time series data (dual metrics)
- **URL Pattern Breakdown**: Pie chart distribusi pattern usage
- **Geographic Distribution**: Table dengan flag emoji dan progress bars
- **Performance Metrics**: Bar chart response time distribution
- **Top Referrers**: List traffic sources dengan percentages
- **Device Breakdown**: Donut chart (Desktop/Mobile/Tablet/Bot)
- **Period Selector**: Filter by Today, 7 days, 30 days, 90 days, 1 year

**Key Files:**
- `UrlAnalytics.tsx` - Main dashboard page dengan period selector
- `AccessTrendsChart.tsx` - Time series line chart (Recharts)
- `UrlPatternChart.tsx` - Pattern distribution pie chart
- `GeographicTable.tsx` - Country-based distribution table
- `PerformanceChart.tsx` - Response time histogram (bar chart)
- `ReferrersList.tsx` - Top traffic sources list
- `DeviceChart.tsx` - Device type breakdown (donut chart)

**Performance Buckets:**
- < 100ms (Excellent)
- 100-500ms (Good)
- 500ms-1s (Fair)
- 1-2s (Slow)
- > 2s (Very Slow)

## Architecture

### Component Structure

```
pages/admin/url-configuration/
├── UrlConfiguration.tsx          # Main URL config page
├── CustomDomains.tsx             # Domain management page
├── UrlAnalytics.tsx              # Analytics dashboard
└── README.md                     # This file

components/tenant-url/
├── UrlPatternSelector.tsx        # Pattern selection cards (3 options)
├── SubdomainConfigForm.tsx       # Subdomain form dengan Zod validation
├── PathConfigForm.tsx            # Path-based form dengan Zod validation
├── AdvancedSettingsForm.tsx      # Advanced settings toggles
├── DomainVerificationWizard.tsx  # Multi-step wizard (5 steps)
├── DomainVerificationBadge.tsx   # Status badge (verified/pending/failed)
├── SslStatusBadge.tsx            # SSL status badge dengan expiry info
├── DnsStatusBadge.tsx            # DNS status badge
├── DnsInstructionsCard.tsx       # DNS setup guide dengan copy buttons
├── DnsInstructionsDialog.tsx     # DNS instructions modal
├── NoDomainsEmptyState.tsx       # Empty state dengan CTA
├── NoAnalyticsEmptyState.tsx     # Analytics empty state
├── DomainCardSkeleton.tsx        # Loading skeleton untuk domain cards
├── AnalyticsChartSkeleton.tsx    # Loading skeleton untuk charts
├── AccessTrendsChart.tsx         # Line chart component
├── UrlPatternChart.tsx           # Pie chart component
├── GeographicTable.tsx           # Geographic table component
├── PerformanceChart.tsx          # Bar chart component  
├── ReferrersList.tsx             # Referrers list component
├── DeviceChart.tsx               # Donut chart component
├── SslExpiryAlert.tsx            # SSL expiry warning
└── wizard-steps/
    ├── WizardStepAddDomain.tsx
    ├── WizardStepChooseMethod.tsx
    ├── WizardStepConfigureDns.tsx
    ├── WizardStepVerify.tsx
    └── WizardStepSslSetup.tsx
```

### State Management

- **Data Fetching**: TanStack Query (React Query) untuk caching dan automatic refetching
- **Form State**: React Hook Form + Zod validation untuk real-time validation
- **Toast Notifications**: Sonner untuk success/error messages
- **Local State**: React useState untuk UI state management

### API Integration

Semua data fetching melalui:
- `frontend/src/services/api/tenant-url.ts` - API service layer dengan 20+ methods
- `frontend/src/hooks/useTenantUrl.ts` - React Query hooks untuk data fetching

**Key Hooks:**
- `useUrlConfiguration()` - Fetch current URL configuration
- `useUpdateUrlConfiguration()` - Update URL configuration (mutation)
- `useCustomDomains()` - Fetch all custom domains dengan pagination
- `useAddCustomDomain()` - Add new custom domain (mutation)
- `useVerifyDomain()` - Verify domain ownership (mutation)
- `useSetPrimaryDomain()` - Set primary domain (mutation)
- `useDeleteDomain()` - Delete custom domain (mutation)
- `useDnsInstructions()` - Fetch DNS instructions untuk domain
- `useAnalyticsOverview()` - Fetch analytics overview metrics
- `useAccessTrends()` - Fetch trend data untuk line chart
- `useUrlPatternBreakdown()` - Fetch pattern distribution data
- `useGeographicDistribution()` - Fetch geographic data
- `usePerformanceDistribution()` - Fetch performance data
- `useTopReferrers()` - Fetch top referrers
- `useDeviceBreakdown()` - Fetch device breakdown

## Usage Examples

### Display Domain Verification Badge

```tsx
import DomainVerificationBadge from '@/components/tenant-url/DomainVerificationBadge';

function MyComponent() {
  return (
    <DomainVerificationBadge 
      status="verified" 
      showTooltip={true} 
    />
  );
}
```

### Fetch and Display Custom Domains

```tsx
import { useCustomDomains } from '@/hooks/useTenantUrl';
import DomainCardSkeleton from '@/components/tenant-url/DomainCardSkeleton';

function MyComponent() {
  const { data: domains, isLoading } = useCustomDomains();

  if (isLoading) return <DomainCardSkeleton />;

  return (
    <div>
      {domains?.map(domain => (
        <div key={domain.uuid}>
          {domain.domain_name}
          <DomainVerificationBadge status={domain.verification_status} />
        </div>
      ))}
    </div>
  );
}
```

### Add Custom Domain

```tsx
import { useAddCustomDomain } from '@/hooks/useTenantUrl';

function MyComponent() {
  const addMutation = useAddCustomDomain();

  const handleAdd = async () => {
    try {
      await addMutation.mutateAsync({
        domain_name: 'example.com',
        verification_method: 'txt',
      });
      toast.success('Domain added successfully!');
    } catch (error) {
      toast.error('Failed to add domain');
    }
  };

  return (
    <button onClick={handleAdd} disabled={addMutation.isPending}>
      Add Domain
    </button>
  );
}
```

### Update URL Configuration

```tsx
import { useUpdateUrlConfiguration } from '@/hooks/useTenantUrl';

function MyComponent() {
  const updateMutation = useUpdateUrlConfiguration();

  const handleSave = async (data) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success('Configuration updated!');
    } catch (error) {
      toast.error('Failed to update configuration');
    }
  };

  return (
    <button onClick={() => handleSave({ 
      primary_url_pattern: 'subdomain',
      force_https: true
    })}>
      Save Configuration
    </button>
  );
}
```

## Testing

### Run Unit Tests

```bash
npm test -- --coverage
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Run Accessibility Audit

```bash
npm run lighthouse
```

### Test Coverage

Component unit tests tersedia untuk:
- UrlPatternSelector
- DomainVerificationBadge
- SslStatusBadge
- DnsStatusBadge

Integration tests tersedia untuk:
- UrlConfiguration page
- CustomDomains page
- UrlAnalytics page

E2E tests tersedia untuk:
- Complete domain verification workflow
- URL configuration changes
- Analytics dashboard interactions
- Accessibility compliance (WCAG 2.1 AA)
- Performance benchmarks (Web Vitals)
- Browser compatibility (Chrome, Firefox, Safari, Mobile)

## Compliance

Modul ini mengikuti semua core immutable rules:

- ✅ **NO MOCK DATA**: 100% real backend API integration tanpa fallback mock data
- ✅ **UUID-ONLY EXPOSURE**: Semua resources diidentifikasi dengan UUID string, bukan integer IDs
- ✅ **MULTI-TENANT RBAC**: Proper tenant scoping enforced di semua API calls
- ✅ **ERROR HANDLING**: Graceful error handling dengan user-friendly messages
- ✅ **LOADING STATES**: Skeleton screens untuk semua loading states
- ✅ **EMPTY STATES**: Informative empty states dengan CTAs
- ✅ **FORM VALIDATION**: Real-time validation dengan Zod schemas
- ✅ **ACCESSIBILITY**: WCAG 2.1 AA compliance
- ✅ **RESPONSIVE DESIGN**: Mobile-first responsive design
- ✅ **DARK MODE**: Full dark mode support

## Support

Untuk issues atau questions:
- Check troubleshooting guide below
- Review component JSDoc documentation dalam source code
- Contact development team

## Troubleshooting

### Domain Verification Fails

**Symptoms**: Verification status tetap "pending" atau berubah ke "failed"

**Solutions**:
- Verify DNS records dikonfigurasi dengan benar (no typos)
- Wait for DNS propagation (bisa sampai 24-48 jam)
- Use https://www.whatsmydns.net/ untuk check propagation status
- Pastikan TTL value sesuai dengan instructions
- Check DNS provider documentation untuk format yang benar

### Charts Not Displaying

**Symptoms**: Empty chart area atau error message

**Solutions**:
- Pastikan analytics tracking diaktifkan di URL Configuration
- Check browser console untuk error messages
- Verify Chart.js/Recharts library loaded correctly
- Clear browser cache dan reload
- Check API response data format matches expected structure

### API Errors

**Symptoms**: "Failed to fetch" atau 403/401 errors

**Solutions**:
- Check network tab untuk failed requests dengan details
- Verify authentication token masih valid (not expired)
- Check backend logs untuk server errors
- Ensure tenant context correct (tenant_id header present)
- Verify RBAC permissions untuk current user

### SSL Certificate Issues

**Symptoms**: SSL status "failed" atau "pending" terlalu lama

**Solutions**:
- Ensure domain sudah verified terlebih dahulu
- Wait 5-15 minutes untuk automatic provisioning
- Check domain DNS records pointing correctly
- Verify no CAA records blocking Let's Encrypt
- Contact support jika pending > 30 minutes

### Form Validation Errors

**Symptoms**: Form tidak bisa di-submit atau validation errors tidak jelas

**Solutions**:
- Read error message carefully (Zod provides descriptive messages)
- Check input format matches requirements (lowercase, no spaces, etc.)
- Ensure all required fields filled
- Check console untuk Zod validation details

## Future Enhancements

Potential improvements yang bisa ditambahkan:

- DNS provider-specific guides (Cloudflare, GoDaddy, Namecheap, etc.)
- Real-time domain verification status (WebSocket updates)
- Advanced analytics filters (date range picker, custom filters)
- Export analytics data (CSV/PDF reports)
- Bulk domain management (import/export domains)
- Automated SSL renewal notifications via email
- Domain health monitoring dengan uptime checks
- CDN integration options
- Advanced DNS management (DNSSEC, CAA records)
- Custom SSL certificate upload (untuk enterprise)
- Domain transfer wizard
- Subdomain wildcards support
- A/B testing URLs
- URL shortener integration

## Performance Optimization

Optimizations yang sudah diterapkan:

- **Lazy Loading**: Charts di-lazy load untuk faster initial page load
- **Data Caching**: Analytics data cached 5 minutes dengan React Query
- **Skeleton Screens**: Loading skeletons untuk better perceived performance
- **Optimistic Updates**: Mutations menggunakan optimistic UI updates
- **Debounced Validation**: Form validation di-debounce untuk reduce re-renders
- **Code Splitting**: Route-based code splitting dengan React.lazy
- **Image Optimization**: Flag emojis menggunakan Unicode (no image downloads)
- **Bundle Size**: Tree-shaking dan minification di production

## Security Considerations

Security measures yang diterapkan:

- All API calls menggunakan authentication tokens
- UUID-only exposure (no integer IDs exposed to client)
- Input validation pada all forms (client-side dengan Zod)
- Server-side validation enforced di backend
- Proper error handling (no sensitive data leaked)
- HTTPS enforcement available
- Domain ownership verification required sebelum SSL provisioning
- RBAC checks di backend untuk all operations
- XSS protection dengan React's built-in escaping
- CSRF protection via Laravel backend

## Monitoring

Areas untuk monitoring:

- Check error logs untuk API failures dan patterns
- Monitor analytics endpoint performance (response times)
- Track domain verification failure rates
- Watch for SSL certificate renewal issues
- Monitor user feedback dan support tickets
- Track adoption rates untuk different URL patterns
- Monitor DNS propagation times
- Analytics query performance

## Related Documentation

- [API Integration Guide](../../docs/API_INTEGRATION_GUIDE.md)
- [User Guide](../../../docs/USER_GUIDE_URL_MANAGEMENT.md)
- [Maintenance Notes](../../docs/MAINTENANCE_NOTES.md)
- [Backend API Documentation](../../../backend/docs/URL_TENANT_CONFIGURATION_API.md)

---

**Version**: 1.0  
**Last Updated**: January 22, 2026  
**Maintained by**: CanvaStack Development Team
