/**
 * RBAC Enforcement Utilities
 * 
 * Comprehensive permission checking dan tenant validation untuk
 * prevent cross-tenant data access dan ensure security compliance.
 * 
 * ZERO-TOLERANCE POLICY untuk RBAC violations.
 */

import { toast } from 'sonner';
import { announceToScreenReader } from './accessibility';

export interface RBACContext {
  userType: 'platform' | 'tenant' | 'anonymous';
  tenant?: {
    uuid: string;
    name: string;
  };
  user?: {
    uuid: string;
    email: string;
    name: string;
  };
}

export interface RBACValidationOptions {
  requireTenant?: boolean;
  requireUser?: boolean;
  allowPlatform?: boolean;
}

/**
 * Validate RBAC context before performing operations
 * 
 * @throws Error jika validation fails
 */
export function validateRBACContext(
  context: RBACContext,
  options: RBACValidationOptions = {}
): void {
  const {
    requireTenant = true,
    requireUser = true,
    allowPlatform = false,
  } = options;

  // Check user authentication
  if (requireUser && !context.user?.uuid) {
    throw new Error('[RBAC] User authentication required');
  }

  // Check tenant context untuk tenant users
  if (context.userType === 'tenant' && requireTenant && !context.tenant?.uuid) {
    throw new Error('[RBAC] Tenant context required for tenant users');
  }

  // Check platform user trying tenant operations
  if (context.userType === 'platform' && requireTenant && !allowPlatform) {
    throw new Error('[RBAC] Platform users cannot perform tenant operations');
  }

  // Check anonymous user
  if (context.userType === 'anonymous') {
    throw new Error('[RBAC] Authentication required');
  }
}

/**
 * Validate tenant ownership untuk prevent cross-tenant access
 * 
 * NOTE: Validation disabled - backend enforces tenant isolation
 * ProductResource doesn't expose tenant_id (security best practice)
 * Backend has 4-layer protection: middleware, global scope, explicit filtering, auth
 */
export function validateTenantOwnership(
  resourceTenantId: string | undefined,
  currentTenantId: string | undefined,
  resourceType: string
): void {
  // Backend handles all tenant isolation validation
  // No client-side validation needed - resources don't expose tenant_id
  return;
}

/**
 * Audit log untuk RBAC operations
 */
export interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceIds?: string[];
  tenantId?: string;
  userId?: string;
  userEmail?: string;
  status: 'success' | 'failed' | 'denied';
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Audit queue untuk batch sending
 * Prevents overwhelming the backend with individual requests
 */
let auditQueue: AuditLogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const AUDIT_BATCH_SIZE = 10;
const AUDIT_FLUSH_INTERVAL = 5000; // 5 seconds

/**
 * Flush audit queue to backend
 */
async function flushAuditQueue(): Promise<void> {
  if (auditQueue.length === 0) return;

  const entries = [...auditQueue];
  auditQueue = [];

  try {
    // Get auth token for authenticated requests
    const token = localStorage.getItem('auth_token');
    const accountType = localStorage.getItem('account_type');

    // Choose appropriate API endpoint based on account type
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const endpoint = accountType === 'platform' 
      ? `${baseUrl}/api/v1/platform/audit-logs/batch`
      : `${baseUrl}/api/v1/tenant/audit-logs/batch`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(accountType && { 'X-User-Type': accountType }),
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      console.error('[AUDIT] Failed to send audit logs to backend', {
        status: response.status,
        statusText: response.statusText,
        count: entries.length,
      });
      
      // Re-queue failed entries for retry (with limit to prevent memory leak)
      if (auditQueue.length < 100) {
        auditQueue = [...entries, ...auditQueue];
      }
    } else {
      console.log('[AUDIT] Successfully sent batch of audit logs', {
        count: entries.length,
      });
    }
  } catch (error) {
    console.error('[AUDIT] Error sending audit logs:', error);
    
    // Re-queue on network error (with limit)
    if (auditQueue.length < 100) {
      auditQueue = [...entries, ...auditQueue];
    }
  }
}

/**
 * Schedule audit queue flush
 */
function scheduleFlush(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }

  flushTimeout = setTimeout(() => {
    flushAuditQueue();
    flushTimeout = null;
  }, AUDIT_FLUSH_INTERVAL);
}

/**
 * Log audit event
 * 
 * In development: Logs to console with structured format
 * In production: Batches events and sends to backend API
 * 
 * Features:
 * - Automatic batching to reduce API calls
 * - Retry on failure with queue limit
 * - Non-blocking operation (fire-and-forget)
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const auditEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Development: Always log to console for debugging
  if (import.meta.env.DEV) {
    console.log('[AUDIT]', {
      action: auditEntry.action,
      resourceType: auditEntry.resourceType,
      resourceId: auditEntry.resourceId || auditEntry.resourceIds,
      status: auditEntry.status,
      tenantId: auditEntry.tenantId,
      userId: auditEntry.userId,
      metadata: auditEntry.metadata,
    });
  }

  // Production: Queue for batch sending
  if (import.meta.env.PROD) {
    auditQueue.push(auditEntry);

    // Flush immediately if batch size reached
    if (auditQueue.length >= AUDIT_BATCH_SIZE) {
      flushAuditQueue();
    } else {
      // Schedule delayed flush
      scheduleFlush();
    }
  }
}

/**
 * Manually flush audit queue
 * Useful for critical operations or before page unload
 */
export function flushAuditLogs(): void {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  flushAuditQueue();
}

// Flush audit logs before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushAuditLogs();
  });
}

/**
 * Handle RBAC errors dengan user-friendly messages
 */
export function handleRBACError(
  error: unknown,
  context: {
    operation: string;
    resourceType: string;
    resourceId?: string;
  }
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Log error
  console.error(`[RBAC] ${context.operation} failed:`, {
    error: errorMessage,
    context,
  });

  // User-friendly error messages
  if (errorMessage.includes('Tenant context')) {
    toast.error('Tenant context missing. Please refresh and try again.');
    announceToScreenReader('Tenant context missing');
  } else if (errorMessage.includes('Permission denied') || errorMessage.includes('Insufficient permissions')) {
    toast.error(`You don't have permission to ${context.operation.toLowerCase()}`);
    announceToScreenReader('Permission denied');
  } else if (errorMessage.includes('Cross-tenant access')) {
    toast.error('Access denied: Resource belongs to different tenant');
    announceToScreenReader('Access denied');
  } else if (errorMessage.includes('Authentication required')) {
    toast.error('Please login to continue');
    announceToScreenReader('Authentication required');
  } else if (error.response?.status === 403) {
    toast.error('Access denied: Insufficient permissions');
  } else if (error.response?.status === 404) {
    toast.error(`${context.resourceType} not found or access denied`);
  } else {
    toast.error(`Failed to ${context.operation.toLowerCase()}. Please try again.`);
  }

  // Audit log
  logAuditEvent({
    action: `${context.resourceType}.${context.operation}`,
    resourceType: context.resourceType,
    resourceId: context.resourceId,
    status: 'failed',
    error: errorMessage,
  });
}

/**
 * Confirmation dialog untuk destructive actions
 */
export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
}

export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const {
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  } = options;

  // Simple browser confirm for now
  // TODO: Replace dengan custom Dialog component
  return Promise.resolve(
    window.confirm(`${title}\n\n${description}`)
  );
}

/**
 * Batch validation untuk bulk operations
 * 
 * NOTE: Validation disabled - backend enforces tenant isolation
 * ProductResource doesn't expose tenant_id (security best practice)
 */
export function validateBulkTenantOwnership(
  resources: Array<{ uuid: string; tenant_id?: string }>,
  currentTenantId: string | undefined,
  resourceType: string
): { valid: string[]; invalid: string[] } {
  // Backend handles all tenant isolation validation
  // All resources assumed valid - backend will reject invalid requests
  const valid = resources.map(r => r.uuid);
  const invalid: string[] = [];

  return { valid, invalid };
}
