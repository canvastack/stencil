# 🚀 CI/CD Configuration Dashboard - Comprehensive Roadmap

**Document Version:** 1.0  
**Created:** December 22, 2025  
**Status:** 📋 **PLANNING PHASE**  
**Target Completion:** Q1 2026

---

## 📊 Executive Summary

Roadmap ini menguraikan implementasi **CI/CD Configuration Dashboard** - sebuah admin panel UI yang comprehensive untuk manage semua aspek CI/CD pipeline configuration, test suites, API integrations, notifications, dan quality gates tanpa perlu manual config file editing.

**Key Objectives:**
- ✅ Web-based UI untuk manage CI/CD configuration
- ✅ Real-time build monitoring dan logs
- ✅ Test connection functionality untuk all integrations
- ✅ Fine-grained control (enable/disable features)
- ✅ Secure credential storage (encrypted)
- ✅ Multi-tenant support dengan RBAC
- ✅ Audit trail untuk all configuration changes

**Success Metrics:**
- Zero manual config file editing required
- < 5 minutes untuk setup new CI/CD pipeline
- 100% test coverage untuk configuration API
- Real-time build status updates (< 2s latency)
- 99.9% uptime untuk dashboard

---

## 🎯 Project Scope

### **In Scope**

✅ **UI Components:**
- CI/CD configuration dashboard (7 tabs)
- Real-time build monitoring
- Test suite management
- API configuration with connection testing
- Notification setup (Slack, Email, GitHub)
- Quality gates configuration
- Scheduled jobs management
- Environment configuration

✅ **Backend Services:**
- Configuration API (CRUD operations)
- Build trigger API
- Real-time WebSocket for build status
- Secure credential storage (encrypted)
- Audit logging
- Integration testing

✅ **Integrations:**
- GitHub/GitLab/Bitbucket API
- Chromatic API
- Sentry API
- Slack Webhooks
- Email service (SMTP)

✅ **Security:**
- RBAC enforcement (Platform Admin only)
- API token encryption at rest
- Audit trail for all changes
- Secure credential input/display

### **Out of Scope (Future Phases)**

⏳ **Phase 2 Features:**
- Custom pipeline builder (drag & drop)
- Advanced test analytics dashboard
- Cost optimization recommendations
- Integration with external CI providers (CircleCI, Jenkins)
- Mobile app for build notifications
- AI-powered test failure analysis

---

## 📋 Detailed Implementation Plan

### **Phase 1: Foundation Setup** (Weeks 1-2)

#### **Week 1: Database Schema & Backend API**

**Tasks:**

**1.1 Database Schema Design** (2 days)
```sql
-- Tables to create:
✅ cicd_configurations (main config table)
✅ test_suite_configs (test suite settings)
✅ api_configurations (encrypted API tokens)
✅ notification_configs (notification settings)
✅ quality_gates (quality thresholds)
✅ scheduled_jobs (cron jobs)
✅ build_history (build logs & results)
✅ cicd_audit_logs (change tracking)
```

**Files to Create:**
- `backend/database/migrations/2026_01_XX_create_cicd_tables.php`
- `backend/database/seeders/CICDDefaultConfigSeeder.php`

**1.2 Eloquent Models** (1 day)
```php
// Models to create:
✅ app/Domain/CICD/Models/CICDConfiguration.php
✅ app/Domain/CICD/Models/TestSuiteConfig.php
✅ app/Domain/CICD/Models/APIConfiguration.php
✅ app/Domain/CICD/Models/NotificationConfig.php
✅ app/Domain/CICD/Models/QualityGate.php
✅ app/Domain/CICD/Models/ScheduledJob.php
✅ app/Domain/CICD/Models/BuildHistory.php
✅ app/Domain/CICD/Models/CICDAuditLog.php
```

**Relationships:**
- CICDConfiguration hasMany TestSuiteConfig
- CICDConfiguration hasMany APIConfiguration
- CICDConfiguration hasMany NotificationConfig
- CICDConfiguration hasMany QualityGate
- CICDConfiguration hasMany ScheduledJob
- CICDConfiguration hasMany BuildHistory
- All models BelongsToTenant

**1.3 Repository Pattern** (1 day)
```php
// Repositories to create:
✅ app/Domain/CICD/Repositories/CICDConfigurationRepository.php
✅ app/Domain/CICD/Repositories/BuildHistoryRepository.php
✅ app/Domain/CICD/Repositories/ScheduledJobRepository.php
```

**1.4 Service Layer** (2 days)
```php
// Services to create:
✅ app/Domain/CICD/Services/CICDConfigurationService.php
   - getConfiguration()
   - updateConfiguration()
   - toggleCICD()
   - testConnection()

✅ app/Domain/CICD/Services/BuildTriggerService.php
   - triggerManualBuild()
   - getBuildStatus()
   - cancelBuild()

✅ app/Domain/CICD/Services/EncryptionService.php
   - encryptToken()
   - decryptToken()

✅ app/Domain/CICD/Services/AuditService.php
   - logConfigChange()
   - getAuditTrail()
```

**Deliverables:**
- ✅ 8 database tables created with migrations
- ✅ 8 Eloquent models with relationships
- ✅ 3 repositories for data access
- ✅ 4 service classes for business logic
- ✅ Database seeder with default configuration

---

#### **Week 2: API Endpoints & Validation**

**2.1 API Controllers** (2 days)
```php
// Controllers to create:
✅ app/Infrastructure/Presentation/Http/Controllers/Platform/
   CICDConfigurationController.php

Methods:
- index()          // GET /api/v1/platform/cicd/config
- store()          // POST /api/v1/platform/cicd/config
- update()         // PUT /api/v1/platform/cicd/config/{id}
- destroy()        // DELETE /api/v1/platform/cicd/config/{id}
- toggle()         // POST /api/v1/platform/cicd/toggle
- testConnection() // POST /api/v1/platform/cicd/test-connection

✅ app/Infrastructure/Presentation/Http/Controllers/Platform/
   BuildController.php

Methods:
- index()          // GET /api/v1/platform/cicd/builds
- show()           // GET /api/v1/platform/cicd/builds/{id}
- trigger()        // POST /api/v1/platform/cicd/builds/trigger
- cancel()         // POST /api/v1/platform/cicd/builds/{id}/cancel
- logs()           // GET /api/v1/platform/cicd/builds/{id}/logs

✅ app/Infrastructure/Presentation/Http/Controllers/Platform/
   ScheduledJobController.php

Methods:
- index()          // GET /api/v1/platform/cicd/schedules
- store()          // POST /api/v1/platform/cicd/schedules
- update()         // PUT /api/v1/platform/cicd/schedules/{id}
- destroy()        // DELETE /api/v1/platform/cicd/schedules/{id}
- run()            // POST /api/v1/platform/cicd/schedules/{id}/run
```

**2.2 Request Validation** (1 day)
```php
// Form Requests to create:
✅ app/Infrastructure/Presentation/Http/Requests/CICD/
   StoreCICDConfigurationRequest.php

✅ app/Infrastructure/Presentation/Http/Requests/CICD/
   UpdateCICDConfigurationRequest.php

✅ app/Infrastructure/Presentation/Http/Requests/CICD/
   TestConnectionRequest.php

✅ app/Infrastructure/Presentation/Http/Requests/CICD/
   TriggerBuildRequest.php

✅ app/Infrastructure/Presentation/Http/Requests/CICD/
   StoreScheduledJobRequest.php
```

**Validation Rules:**
```php
// Example: StoreCICDConfigurationRequest
public function rules(): array
{
    return [
        'is_enabled' => 'required|boolean',
        'pipeline_timeout_minutes' => 'required|integer|min:5|max:120',
        'max_concurrent_builds' => 'required|integer|min:1|max:10',
        'trigger_on_pr' => 'required|boolean',
        'trigger_on_push_main' => 'required|boolean',
        'test_suites' => 'required|array',
        'test_suites.*.suite_type' => 'required|in:integration,e2e,visual,load',
        'test_suites.*.is_enabled' => 'required|boolean',
        'test_suites.*.timeout_minutes' => 'required|integer|min:1|max:120',
    ];
}
```

**2.3 API Resources** (1 day)
```php
// Resources to create:
✅ app/Infrastructure/Presentation/Http/Resources/CICD/
   CICDConfigurationResource.php

✅ app/Infrastructure/Presentation/Http/Resources/CICD/
   TestSuiteConfigResource.php

✅ app/Infrastructure/Presentation/Http/Resources/CICD/
   BuildHistoryResource.php

✅ app/Infrastructure/Presentation/Http/Resources/CICD/
   ScheduledJobResource.php
```

**2.4 API Routes** (1 day)
```php
// backend/routes/api.php

// Platform Admin only routes
Route::middleware(['auth:sanctum', 'platform.admin'])->prefix('platform')->group(function () {
    // CI/CD Configuration
    Route::apiResource('cicd/config', CICDConfigurationController::class);
    Route::post('cicd/toggle', [CICDConfigurationController::class, 'toggle']);
    Route::post('cicd/test-connection', [CICDConfigurationController::class, 'testConnection']);
    
    // Builds
    Route::apiResource('cicd/builds', BuildController::class)->only(['index', 'show']);
    Route::post('cicd/builds/trigger', [BuildController::class, 'trigger']);
    Route::post('cicd/builds/{id}/cancel', [BuildController::class, 'cancel']);
    Route::get('cicd/builds/{id}/logs', [BuildController::class, 'logs']);
    
    // Scheduled Jobs
    Route::apiResource('cicd/schedules', ScheduledJobController::class);
    Route::post('cicd/schedules/{id}/run', [ScheduledJobController::class, 'run']);
    
    // Audit Logs
    Route::get('cicd/audit-logs', [CICDAuditLogController::class, 'index']);
});
```

**Deliverables:**
- ✅ 3 API controllers with all CRUD methods
- ✅ 5 form request validation classes
- ✅ 4 API resource transformers
- ✅ Complete API routes with middleware
- ✅ Postman collection for API testing

---

### **Phase 2: Frontend UI Components** (Weeks 3-4)

#### **Week 3: Core UI Components**

**3.1 Page Structure** (1 day)
```typescript
// Files to create:
✅ src/pages/admin/settings/CICDConfiguration.tsx (main page)
✅ src/components/admin/cicd/CICDLayout.tsx (layout wrapper)
✅ src/components/admin/cicd/CICDTabs.tsx (tab navigation)
```

**Page Structure:**
```tsx
<CICDLayout>
  <CICDHeader />
  <CICDTabs active="general">
    <TabPanel name="general">
      <GeneralSettingsTab />
    </TabPanel>
    <TabPanel name="test-suites">
      <TestSuitesTab />
    </TabPanel>
    {/* ... more tabs */}
  </CICDTabs>
</CICDLayout>
```

**3.2 Tab Components** (3 days)
```typescript
// Tab Components to create:
✅ src/components/admin/cicd/tabs/GeneralSettingsTab.tsx
   - Enable/disable CI/CD toggle
   - Pipeline timeout settings
   - Trigger event checkboxes
   - Concurrent builds slider

✅ src/components/admin/cicd/tabs/TestSuitesTab.tsx
   - Integration tests config card
   - E2E tests config card with browser selection
   - Visual regression config card with Chromatic token
   - Load testing config card with k6 settings
   - Code quality checks config

✅ src/components/admin/cicd/tabs/APIConfigurationTab.tsx
   - Backend API URL input
   - Test credentials (email, password, tenant)
   - Chromatic integration (token, project ID)
   - Sentry integration (DSN, environment)
   - Codecov integration (token)
   - Test connection buttons for each service

✅ src/components/admin/cicd/tabs/NotificationsTab.tsx
   - Slack webhook configuration
   - Email recipients management
   - GitHub PR comments settings
   - Notification triggers (checkboxes)
   - Test notification buttons

✅ src/components/admin/cicd/tabs/QualityGatesTab.tsx
   - Coverage threshold inputs
   - Performance threshold settings
   - Visual regression approval settings
   - Security severity checkboxes
   - Block/warn action radio buttons

✅ src/components/admin/cicd/tabs/SchedulesTab.tsx
   - Scheduled jobs list
   - Add/edit schedule form with cron builder
   - Job history table
   - Run now button

✅ src/components/admin/cicd/tabs/EnvironmentsTab.tsx
   - Test environment card
   - Staging environment card
   - Production environment card
   - Add environment button
```

**3.3 Reusable Components** (2 days)
```typescript
// Reusable UI components:
✅ src/components/admin/cicd/ui/ConfigCard.tsx
   - Card wrapper for config sections
   - Enable/disable toggle
   - Expand/collapse functionality

✅ src/components/admin/cicd/ui/ConnectionStatus.tsx
   - Connection indicator (connected, failed, not tested)
   - Test connection button
   - Last tested timestamp

✅ src/components/admin/cicd/ui/BuildStatusBadge.tsx
   - Status badges (running, passed, failed, cancelled)
   - Duration display
   - Progress indicator for running builds

✅ src/components/admin/cicd/ui/CronExpressionBuilder.tsx
   - Visual cron expression builder
   - Predefined options (daily, weekly, monthly)
   - Custom expression input with validation

✅ src/components/admin/cicd/ui/SecretInput.tsx
   - Password-style input for API tokens
   - Show/hide toggle
   - Copy to clipboard button
   - Validation indicator
```

**Deliverables:**
- ✅ Main CI/CD configuration page
- ✅ 7 tab components (fully functional)
- ✅ 5 reusable UI components
- ✅ Consistent design with shadcn/ui
- ✅ Responsive layout (mobile, tablet, desktop)

---

#### **Week 4: State Management & API Integration**

**4.1 API Service Layer** (2 days)
```typescript
// API services to create:
✅ src/services/api/cicd.ts

export const cicdService = {
  // Configuration
  getConfiguration: () => get<CICDConfiguration>('/platform/cicd/config'),
  updateConfiguration: (data) => put('/platform/cicd/config', data),
  toggleCICD: (enabled) => post('/platform/cicd/toggle', { enabled }),
  testConnection: (service, credentials) => 
    post('/platform/cicd/test-connection', { service, credentials }),
  
  // Test Suites
  updateTestSuite: (id, data) => put(`/platform/cicd/suites/${id}`, data),
  toggleTestSuite: (id, enabled) => 
    post(`/platform/cicd/suites/${id}/toggle`, { enabled }),
  
  // Builds
  getBuilds: (params) => get<PaginatedResponse<Build>>('/platform/cicd/builds', params),
  getBuildDetails: (id) => get<Build>(`/platform/cicd/builds/${id}`),
  triggerBuild: (data) => post('/platform/cicd/builds/trigger', data),
  cancelBuild: (id) => post(`/platform/cicd/builds/${id}/cancel`),
  getBuildLogs: (id) => get(`/platform/cicd/builds/${id}/logs`),
  
  // Schedules
  getSchedules: () => get<ScheduledJob[]>('/platform/cicd/schedules'),
  createSchedule: (data) => post('/platform/cicd/schedules', data),
  updateSchedule: (id, data) => put(`/platform/cicd/schedules/${id}`, data),
  deleteSchedule: (id) => del(`/platform/cicd/schedules/${id}`),
  runSchedule: (id) => post(`/platform/cicd/schedules/${id}/run`),
  
  // Audit Logs
  getAuditLogs: (params) => get('/platform/cicd/audit-logs', params),
};
```

**4.2 React Query Hooks** (2 days)
```typescript
// Query hooks to create:
✅ src/hooks/cicd/useCICDConfiguration.ts
   - useQuery for fetching config
   - useMutation for updating config
   - optimistic updates
   - error handling

✅ src/hooks/cicd/useBuildHistory.ts
   - useInfiniteQuery for build list
   - useQuery for build details
   - useMutation for trigger/cancel
   - real-time updates via WebSocket

✅ src/hooks/cicd/useScheduledJobs.ts
   - useQuery for schedules list
   - useMutation for CRUD operations
   - automatic refetch after mutations

✅ src/hooks/cicd/useConnectionTest.ts
   - useMutation for testing connections
   - loading states
   - success/error notifications

✅ src/hooks/cicd/useAuditLogs.ts
   - useInfiniteQuery for audit logs
   - filtering & sorting
```

**Example Hook:**
```typescript
// src/hooks/cicd/useCICDConfiguration.ts
export function useCICDConfiguration() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['cicd', 'configuration'],
    queryFn: () => cicdService.getConfiguration(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const updateMutation = useMutation({
    mutationFn: cicdService.updateConfiguration,
    onSuccess: () => {
      queryClient.invalidateQueries(['cicd', 'configuration']);
      toast.success('Configuration updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update configuration');
      captureException(error);
    },
  });
  
  const toggleMutation = useMutation({
    mutationFn: cicdService.toggleCICD,
    onMutate: async (enabled) => {
      // Optimistic update
      await queryClient.cancelQueries(['cicd', 'configuration']);
      const previous = queryClient.getQueryData(['cicd', 'configuration']);
      queryClient.setQueryData(['cicd', 'configuration'], (old: any) => ({
        ...old,
        is_enabled: enabled,
      }));
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['cicd', 'configuration'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['cicd', 'configuration']);
    },
  });
  
  return {
    configuration: data,
    isLoading,
    error,
    updateConfiguration: updateMutation.mutate,
    toggleCICD: toggleMutation.mutate,
    isUpdating: updateMutation.isPending || toggleMutation.isPending,
  };
}
```

**4.3 TypeScript Types** (1 day)
```typescript
// Types to create:
✅ src/types/cicd.ts

export interface CICDConfiguration {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  pipeline_timeout_minutes: number;
  max_concurrent_builds: number;
  trigger_on_pr: boolean;
  trigger_on_push_main: boolean;
  trigger_on_push_develop: boolean;
  trigger_on_tag: boolean;
  allow_manual_trigger: boolean;
  test_suites: TestSuiteConfig[];
  api_configurations: APIConfiguration[];
  notification_configs: NotificationConfig[];
  quality_gates: QualityGate[];
  created_at: string;
  updated_at: string;
}

export interface TestSuiteConfig {
  id: string;
  suite_type: 'integration' | 'e2e' | 'visual' | 'load';
  is_enabled: boolean;
  timeout_minutes: number;
  run_on_pr: boolean;
  run_on_push: boolean;
  settings: Record<string, any>;
}

export interface APIConfiguration {
  id: string;
  service_name: string;
  api_url: string;
  is_active: boolean;
  connection_status: 'connected' | 'failed' | 'not_tested';
  last_connection_test?: string;
}

export interface Build {
  id: string;
  build_number: number;
  trigger_type: 'pr' | 'push' | 'scheduled' | 'manual';
  trigger_by: string;
  branch_name: string;
  commit_sha: string;
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  tests_total: number;
  tests_passed: number;
  tests_failed: number;
  report_url?: string;
}

export interface ScheduledJob {
  id: string;
  job_name: string;
  is_enabled: boolean;
  cron_expression: string;
  test_suites: string[];
  last_run?: string;
  next_run?: string;
}
```

**Deliverables:**
- ✅ Complete API service layer
- ✅ 5 React Query hooks with optimistic updates
- ✅ TypeScript types for all entities
- ✅ Error handling & loading states
- ✅ Toast notifications for user feedback

---

### **Phase 3: Real-time Features & Integrations** (Weeks 5-6)

#### **Week 5: Real-time Build Monitoring**

**5.1 WebSocket Setup** (2 days)

**Backend:**
```php
// Broadcasting setup
✅ Configure Laravel Broadcasting
✅ Install laravel-websockets or Pusher
✅ Create BuildStatusUpdated event

// app/Domain/CICD/Events/BuildStatusUpdated.php
class BuildStatusUpdated implements ShouldBroadcast
{
    public function __construct(
        public Build $build,
        public string $status,
        public array $testResults = []
    ) {}
    
    public function broadcastOn()
    {
        return new PrivateChannel("cicd.builds.{$this->build->id}");
    }
    
    public function broadcastAs()
    {
        return 'build.status.updated';
    }
}
```

**Frontend:**
```typescript
// src/hooks/cicd/useRealtimeBuildStatus.ts
export function useRealtimeBuildStatus(buildId: string) {
  const [status, setStatus] = useState<BuildStatus | null>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = Echo.private(`cicd.builds.${buildId}`)
      .listen('.build.status.updated', (event: BuildStatusEvent) => {
        setStatus(event.status);
        
        // Update React Query cache
        queryClient.setQueryData(['build', buildId], (old: Build) => ({
          ...old,
          status: event.status,
          tests_passed: event.testResults.passed,
          tests_failed: event.testResults.failed,
        }));
      });
    
    return () => {
      channel.stopListening('.build.status.updated');
      Echo.leave(`cicd.builds.${buildId}`);
    };
  }, [buildId]);
  
  return { realtimeStatus: status };
}
```

**5.2 Build Logs Streaming** (2 days)
```typescript
// Real-time log streaming component
✅ src/components/admin/cicd/BuildLogsViewer.tsx

Features:
- Real-time log streaming via WebSocket
- Auto-scroll to bottom
- Search/filter logs
- Download logs as .txt
- Syntax highlighting for errors
- Timestamp display
```

**5.3 Build Status Dashboard** (2 days)
```typescript
// Live dashboard component
✅ src/components/admin/cicd/BuildStatusDashboard.tsx

Features:
- Current builds (running/queued)
- Progress indicators
- Real-time updates
- Quick actions (cancel, view logs)
- Recent builds history
- Build statistics (pass rate, avg duration)
```

**Deliverables:**
- ✅ WebSocket integration for real-time updates
- ✅ Real-time build status hook
- ✅ Build logs viewer with streaming
- ✅ Live dashboard with current builds
- ✅ < 2s latency for status updates

---

#### **Week 6: External Integrations**

**6.1 GitHub Integration** (2 days)
```php
// Backend GitHub API client
✅ app/Domain/CICD/Services/GitHubService.php

Methods:
- getRepository($owner, $repo)
- getBranches($owner, $repo)
- getCommits($owner, $repo, $branch)
- createPRComment($owner, $repo, $prNumber, $comment)
- updatePRStatus($owner, $repo, $commitSha, $status)
- triggerWorkflow($owner, $repo, $workflowId, $inputs)
```

**Frontend:**
```typescript
// GitHub integration UI
✅ src/components/admin/cicd/integrations/GitHubIntegration.tsx

Features:
- OAuth connection flow
- Repository selector
- Branch protection rules
- PR template configuration
- Webhook management
```

**6.2 Chromatic Integration** (1 day)
```php
// Backend Chromatic API client
✅ app/Domain/CICD/Services/ChromaticService.php

Methods:
- getProject($projectId)
- getBuilds($projectId, $params)
- triggerBuild($projectId, $options)
- getBuildStatus($buildId)
```

**Frontend:**
```typescript
// Chromatic integration UI
✅ src/components/admin/cicd/integrations/ChromaticIntegration.tsx

Features:
- Project token validation
- Project info display
- Build history
- Visual changes review link
- Snapshot statistics
```

**6.3 Slack Integration** (1 day)
```php
// Backend Slack webhook service
✅ app/Domain/CICD/Services/SlackService.php

Methods:
- sendMessage($webhook, $message, $blocks)
- sendBuildNotification($build, $webhook)
- testConnection($webhook)
```

**Frontend:**
```typescript
// Slack integration UI
✅ src/components/admin/cicd/integrations/SlackIntegration.tsx

Features:
- Webhook URL input
- Channel selector
- Message template editor
- Test notification button
- Preview message
```

**6.4 Sentry Integration** (1 day)
```php
// Backend Sentry API client
✅ app/Domain/CICD/Services/SentryService.php

Methods:
- getProject($organizationSlug, $projectSlug)
- createRelease($version, $commits)
- finalizeRelease($version)
- deployRelease($version, $environment)
```

**Deliverables:**
- ✅ GitHub API integration (OAuth, webhooks, status updates)
- ✅ Chromatic API integration (build triggering, status polling)
- ✅ Slack webhook integration (notifications, test messages)
- ✅ Sentry API integration (release tracking, error monitoring)
- ✅ Connection testing for all integrations
- ✅ Error handling & retry logic

---

### **Phase 4: Security & Permission Control** (Week 7)

#### **7.1 RBAC Implementation** (2 days)

**Backend Middleware:**
```php
// Platform Admin middleware
✅ app/Infrastructure/Presentation/Http/Middleware/EnsurePlatformAdmin.php

public function handle(Request $request, Closure $next)
{
    if (!$request->user()->hasRole('platform_admin')) {
        abort(403, 'Access denied. Platform admin role required.');
    }
    
    return $next($request);
}
```

**Frontend Permission Checks:**
```typescript
// src/hooks/usePermissions.ts (enhanced)
export function useCICDPermissions() {
  const { user } = useAuth();
  
  return {
    canViewCICD: user?.roles.includes('platform_admin') || 
                 user?.roles.includes('tenant_admin'),
    canConfigureCICD: user?.roles.includes('platform_admin'),
    canTriggerBuilds: user?.roles.includes('platform_admin'),
    canViewBuilds: user?.roles.includes('platform_admin') || 
                   user?.roles.includes('tenant_admin'),
  };
}
```

**Permission-based UI:**
```typescript
// src/pages/admin/settings/CICDConfiguration.tsx
const CICDConfiguration: React.FC = () => {
  const { canConfigureCICD, canViewCICD } = useCICDPermissions();
  
  if (!canViewCICD) {
    return <NotAuthorized />;
  }
  
  return (
    <CICDLayout>
      {canConfigureCICD ? (
        <EditableConfiguration />
      ) : (
        <ReadOnlyConfiguration />
      )}
    </CICDLayout>
  );
};
```

**7.2 Credential Encryption** (2 days)

**Backend Encryption:**
```php
// app/Domain/CICD/Services/EncryptionService.php
class EncryptionService
{
    public function encryptToken(string $token): string
    {
        return encrypt($token);
    }
    
    public function decryptToken(string $encryptedToken): string
    {
        return decrypt($encryptedToken);
    }
    
    public function maskToken(string $token): string
    {
        // Show only first 8 chars
        return substr($token, 0, 8) . str_repeat('•', strlen($token) - 8);
    }
}
```

**Model Attribute Casting:**
```php
// app/Domain/CICD/Models/APIConfiguration.php
class APIConfiguration extends Model
{
    protected $casts = [
        'api_token_encrypted' => 'encrypted',
    ];
    
    public function getApiTokenAttribute(): string
    {
        return decrypt($this->api_token_encrypted);
    }
    
    public function setApiTokenAttribute(string $value): void
    {
        $this->attributes['api_token_encrypted'] = encrypt($value);
    }
}
```

**7.3 Audit Logging** (2 days)

**Backend Audit Service:**
```php
// app/Domain/CICD/Services/AuditService.php
class AuditService
{
    public function logConfigChange(
        User $user,
        string $action,
        array $changes
    ): void {
        CICDAuditLog::create([
            'user_id' => $user->id,
            'action' => $action,
            'changes' => $changes,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
```

**Usage in Controller:**
```php
public function update(UpdateCICDConfigurationRequest $request, $id)
{
    $config = CICDConfiguration::findOrFail($id);
    $originalData = $config->toArray();
    
    $config->update($request->validated());
    
    // Log changes
    $this->auditService->logConfigChange(
        auth()->user(),
        'update_configuration',
        [
            'original' => $originalData,
            'updated' => $config->fresh()->toArray(),
        ]
    );
    
    return new CICDConfigurationResource($config);
}
```

**Frontend Audit Log Viewer:**
```typescript
// src/components/admin/cicd/AuditLogViewer.tsx
Features:
- Searchable audit log table
- Filter by user, action, date range
- Diff view for configuration changes
- Export to CSV
```

**Deliverables:**
- ✅ RBAC enforcement (backend + frontend)
- ✅ API token encryption at rest
- ✅ Masked token display in UI
- ✅ Comprehensive audit logging
- ✅ Audit log viewer component
- ✅ Security best practices documentation

---

### **Phase 5: Testing & Documentation** (Week 8)

#### **8.1 Backend Testing** (3 days)

**Unit Tests:**
```php
// Tests to create:
✅ tests/Unit/Domain/CICD/Services/CICDConfigurationServiceTest.php
✅ tests/Unit/Domain/CICD/Services/EncryptionServiceTest.php
✅ tests/Unit/Domain/CICD/Services/AuditServiceTest.php

// Test coverage:
- Service method logic
- Encryption/decryption
- Validation rules
- Business logic
```

**Integration Tests:**
```php
// Tests to create:
✅ tests/Feature/CICD/CICDConfigurationTest.php
✅ tests/Feature/CICD/BuildTriggerTest.php
✅ tests/Feature/CICD/ScheduledJobTest.php
✅ tests/Feature/CICD/AuditLogTest.php

// Test scenarios:
- CRUD operations via API
- Permission checks (platform admin only)
- Tenant isolation
- Connection testing
- Build triggering
- Schedule management
- Audit log creation
```

**Example Test:**
```php
// tests/Feature/CICD/CICDConfigurationTest.php
class CICDConfigurationTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_platform_admin_can_view_configuration()
    {
        $user = User::factory()->platformAdmin()->create();
        
        $response = $this->actingAs($user)
            ->getJson('/api/v1/platform/cicd/config');
        
        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'is_enabled',
                    'pipeline_timeout_minutes',
                    'test_suites',
                ]
            ]);
    }
    
    public function test_tenant_admin_cannot_modify_configuration()
    {
        $user = User::factory()->tenantAdmin()->create();
        
        $response = $this->actingAs($user)
            ->putJson('/api/v1/platform/cicd/config/1', [
                'is_enabled' => false,
            ]);
        
        $response->assertForbidden();
    }
    
    public function test_api_tokens_are_encrypted_in_database()
    {
        $config = APIConfiguration::create([
            'service_name' => 'chromatic',
            'api_url' => 'https://api.chromatic.com',
            'api_token' => 'chpt_secret_token_12345',
        ]);
        
        // Check database has encrypted value
        $dbValue = DB::table('api_configurations')
            ->where('id', $config->id)
            ->value('api_token_encrypted');
        
        $this->assertNotEquals('chpt_secret_token_12345', $dbValue);
        $this->assertStringContainsString('eyJpdiI6', $dbValue); // Laravel encryption format
        
        // Check model returns decrypted value
        $this->assertEquals('chpt_secret_token_12345', $config->api_token);
    }
}
```

**8.2 Frontend Testing** (2 days)

**Component Tests:**
```typescript
// Tests to create:
✅ src/components/admin/cicd/tabs/__tests__/GeneralSettingsTab.test.tsx
✅ src/components/admin/cicd/tabs/__tests__/TestSuitesTab.test.tsx
✅ src/components/admin/cicd/tabs/__tests__/APIConfigurationTab.test.tsx
✅ src/components/admin/cicd/ui/__tests__/ConnectionStatus.test.tsx
✅ src/components/admin/cicd/ui/__tests__/SecretInput.test.tsx

// Test scenarios:
- Component rendering
- User interactions (toggles, inputs, buttons)
- Form validation
- API integration (mocked)
- Loading states
- Error handling
```

**E2E Tests:**
```typescript
// Tests to create:
✅ src/__tests__/e2e/cicd/configuration.spec.ts
✅ src/__tests__/e2e/cicd/build-monitoring.spec.ts
✅ src/__tests__/e2e/cicd/integrations.spec.ts

// Test scenarios:
- Complete configuration workflow
- Toggle CI/CD on/off
- Configure test suites
- Test API connections
- Trigger manual build
- View build logs
- Create scheduled job
```

**Example E2E Test:**
```typescript
// src/__tests__/e2e/cicd/configuration.spec.ts
import { test, expect } from '@playwright/test';

test('platform admin can configure CI/CD', async ({ page }) => {
  // Login as platform admin
  await page.goto('/platform/login');
  await page.fill('[name="email"]', 'admin@canvastencil.com');
  await page.fill('[name="password"]', 'Admin@2024');
  await page.click('button[type="submit"]');
  
  // Navigate to CI/CD settings
  await page.goto('/admin/settings/cicd');
  await expect(page.locator('h1')).toContainText('CI/CD Configuration');
  
  // Toggle CI/CD enabled
  await page.click('[data-testid="cicd-toggle"]');
  await expect(page.locator('.toast')).toContainText('CI/CD enabled successfully');
  
  // Configure test suite
  await page.click('[data-testid="tab-test-suites"]');
  await page.click('[data-testid="integration-tests-configure"]');
  await page.fill('[name="timeout_minutes"]', '10');
  await page.click('[data-testid="save-test-suite"]');
  await expect(page.locator('.toast')).toContainText('Test suite updated');
  
  // Test API connection
  await page.click('[data-testid="tab-api-configuration"]');
  await page.fill('[name="chromatic_token"]', 'chpt_test_token');
  await page.click('[data-testid="test-chromatic-connection"]');
  await expect(page.locator('[data-testid="chromatic-status"]')).toContainText('Connected');
});
```

**8.3 Documentation** (1 day)

**Documentation to create:**
```markdown
✅ docs/CICD/USER_GUIDE.md
   - Getting started
   - Configuration walkthrough
   - Test suite setup
   - Integration setup (GitHub, Chromatic, Slack)
   - Troubleshooting

✅ docs/CICD/API_DOCUMENTATION.md
   - API endpoints reference
   - Request/response examples
   - Error codes
   - Rate limiting

✅ docs/CICD/DEVELOPER_GUIDE.md
   - Architecture overview
   - Database schema
   - Adding new integrations
   - Testing guidelines
   - Deployment instructions

✅ docs/CICD/SECURITY.md
   - Encryption details
   - RBAC implementation
   - Audit logging
   - Best practices
```

**Deliverables:**
- ✅ 100% test coverage for services
- ✅ Integration tests for all API endpoints
- ✅ Component tests for all UI
- ✅ E2E tests for critical workflows
- ✅ 4 comprehensive documentation files
- ✅ API reference documentation

---

## 📊 Success Metrics & KPIs

### **Development Metrics**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Backend Test Coverage** | 90%+ | PHPUnit coverage report |
| **Frontend Test Coverage** | 85%+ | Vitest coverage report |
| **E2E Test Coverage** | 20+ scenarios | Playwright test count |
| **API Response Time** | < 200ms | Laravel Telescope |
| **Build Time** | < 5 minutes | CI/CD pipeline duration |
| **Zero Critical Bugs** | 0 bugs | Issue tracker |

### **User Experience Metrics**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Time to Configure CI/CD** | < 5 minutes | User testing |
| **Connection Test Success Rate** | 95%+ | Backend logs |
| **Build Status Update Latency** | < 2 seconds | WebSocket monitoring |
| **Dashboard Load Time** | < 1 second | Lighthouse audit |
| **User Satisfaction** | 4.5+/5 | User feedback survey |

### **System Reliability Metrics**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Dashboard Uptime** | 99.9% | Uptime monitoring |
| **API Error Rate** | < 0.1% | Sentry error tracking |
| **Data Encryption Rate** | 100% | Security audit |
| **Audit Log Completeness** | 100% | Manual verification |
| **RBAC Enforcement** | 100% | Penetration testing |

---

## 🚀 Deployment Strategy

### **Phase 1: Staging Deployment**

**Week 9: Staging Release**
1. Deploy to staging environment
2. Run full test suite (integration + E2E)
3. Internal team testing (5 users)
4. Performance benchmarking
5. Security audit
6. Bug fixes & refinements

**Staging Checklist:**
- ✅ Database migrations run successfully
- ✅ All tests passing (backend + frontend)
- ✅ API tokens encrypted in database
- ✅ RBAC working correctly
- ✅ Real-time features functioning
- ✅ External integrations connected
- ✅ Audit logs being created
- ✅ No console errors
- ✅ Lighthouse score > 90

### **Phase 2: Production Deployment**

**Week 10: Production Release**
1. Code freeze (no new features)
2. Final regression testing
3. Database backup
4. Deploy to production (blue-green deployment)
5. Smoke testing
6. Monitor for 48 hours
7. Rollback plan ready

**Production Deployment Steps:**
```bash
# 1. Backup production database
php artisan backup:run --only-db

# 2. Run migrations (zero downtime)
php artisan migrate --force

# 3. Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# 4. Build frontend assets
npm run build

# 5. Deploy to servers (blue-green)
# Switch traffic to new version

# 6. Verify deployment
curl https://api.canvastencil.com/health
curl https://canvastencil.com/admin/settings/cicd

# 7. Monitor logs
tail -f storage/logs/laravel.log
```

**Rollback Plan:**
```bash
# If critical issues detected:
# 1. Switch traffic back to old version
# 2. Rollback database migrations
php artisan migrate:rollback --force

# 3. Restore database from backup (if needed)
php artisan backup:restore --backup-name=backup-name
```

---

## 🔄 Maintenance & Support

### **Ongoing Tasks**

**Monthly:**
- Review audit logs for suspicious activity
- Check API token expiration dates
- Update integration dependencies
- Review build success rate trends
- Optimize slow database queries

**Quarterly:**
- Security audit (penetration testing)
- Performance benchmarking
- User feedback survey
- Update documentation
- Review and update test coverage

**Yearly:**
- Major version upgrades
- Infrastructure review
- Cost optimization analysis

### **Support Channels**

- **Technical Issues:** GitHub Issues
- **Feature Requests:** Product Board
- **Security Issues:** security@canvastencil.com
- **General Questions:** Slack #cicd-support

---

## 💰 Cost Estimate

### **Development Costs**

| Resource | Rate | Duration | Total |
|----------|------|----------|-------|
| Backend Developer | $80/hr | 160 hours | $12,800 |
| Frontend Developer | $75/hr | 160 hours | $12,000 |
| DevOps Engineer | $90/hr | 40 hours | $3,600 |
| QA Engineer | $60/hr | 80 hours | $4,800 |
| **Total Development** | | | **$33,200** |

### **Infrastructure Costs (Monthly)**

| Service | Cost |
|---------|------|
| GitHub Actions | $0-$40 |
| Chromatic | $0-$149 |
| WebSocket Server (Pusher/Soketi) | $0-$49 |
| Sentry | $26 |
| Additional Cloud Storage | $10 |
| **Total Monthly** | **$36-$274** |

### **ROI Analysis**

**Benefits:**
- **Time Saved:** 10 hours/week (no manual config editing)
- **Faster Onboarding:** 5 minutes vs 2 hours
- **Reduced Errors:** 90% fewer misconfigurations
- **Better Visibility:** Real-time monitoring vs manual checks

**Estimated Annual Savings:** $52,000
- Developer time saved: $40,000
- Reduced downtime: $10,000
- Fewer bugs in production: $2,000

**Payback Period:** 8 months

---

## 🎯 Success Criteria

### **Must Have (Phase 1 Release)**
- ✅ Platform admins can configure all CI/CD settings via UI
- ✅ All API tokens encrypted at rest
- ✅ Test connections work for all integrations
- ✅ Real-time build status updates
- ✅ Audit logging for all configuration changes
- ✅ RBAC enforcement (platform admin only)
- ✅ Responsive UI (mobile, tablet, desktop)
- ✅ 90%+ test coverage

### **Should Have (Phase 2 Enhancement)**
- ⏳ Custom pipeline builder (drag & drop)
- ⏳ Advanced analytics dashboard
- ⏳ Build artifacts management
- ⏳ Multi-repo support
- ⏳ Cost tracking per build

### **Could Have (Future Phases)**
- 📅 AI-powered test failure analysis
- 📅 Mobile app for notifications
- 📅 Integration with external CI (CircleCI, Jenkins)
- 📅 Custom webhooks
- 📅 Build result sharing (public links)

---

## 📞 Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| **Project Manager** | TBD | Overall project coordination |
| **Backend Lead** | TBD | API development & database design |
| **Frontend Lead** | TBD | UI/UX implementation |
| **DevOps Lead** | TBD | CI/CD pipeline integration |
| **QA Lead** | TBD | Testing strategy & execution |
| **Security Expert** | TBD | Security audit & encryption |
| **Product Owner** | TBD | Requirements & acceptance criteria |

---

## 📅 Timeline Summary

```
Week 1-2:  Backend Foundation (Database, API, Services)
Week 3-4:  Frontend UI Components (7 tabs, reusable components)
Week 5-6:  Real-time Features & Integrations (WebSocket, GitHub, Chromatic)
Week 7:    Security & Permissions (RBAC, Encryption, Audit)
Week 8:    Testing & Documentation (100% coverage, docs)
Week 9:    Staging Deployment & Testing
Week 10:   Production Deployment & Monitoring

Total: 10 weeks (2.5 months)
```

---

## 🔗 Related Documents

- [Testing Strategy & Guidelines](../../TESTING/TESTING_STRATEGY_AND_GUIDELINES.md)
- [Visual Regression Testing Guide](../../TESTING/VISUAL_REGRESSION_TESTING.md)
- [Architecture Plan](../../ARCHITECTURE/BUSINESS_HEXAGONAL_PLAN/HEXAGONAL_AND_ARCHITECTURE_PLAN.md)
- [Development Rules](../../../.zencoder/rules)

---

## ✅ Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Project Manager** | | | |
| **Technical Lead** | | | |
| **Product Owner** | | | |
| **Security Lead** | | | |

---

**Document Status:** ✅ **APPROVED FOR IMPLEMENTATION**  
**Next Review:** End of Week 2 (Progress Checkpoint)  
**Last Updated:** December 22, 2025
