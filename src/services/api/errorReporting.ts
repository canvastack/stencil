import { mockApiCall } from './base';

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  tags: string[];
}

export interface ErrorReportingStats {
  totalErrors: number;
  errorsByDay: { date: string; count: number }[];
  errorsByType: { type: string; count: number }[];
  errorsBySeverity: { severity: string; count: number }[];
  topErrors: { message: string; count: number }[];
  affectedUsers: number;
}

// Mock data for error reports
const mockErrorReports: ErrorReport[] = [
  {
    id: '1',
    message: 'Network request failed',
    stack: 'Error: Network request failed\n    at fetch (/api/orders)',
    context: { endpoint: '/api/orders', method: 'GET' },
    userId: 'user-1',
    timestamp: Date.now() - 86400000, // 1 day ago
    url: '/admin/orders',
    userAgent: 'Mozilla/5.0...',
    severity: 'high',
    resolved: false,
    tags: ['network', 'api', 'orders']
  },
  {
    id: '2',
    message: 'Validation error in customer form',
    context: { field: 'email', value: 'invalid-email' },
    userId: 'user-2',
    timestamp: Date.now() - 3600000, // 1 hour ago
    url: '/admin/customers',
    userAgent: 'Mozilla/5.0...',
    severity: 'medium',
    resolved: true,
    tags: ['validation', 'form', 'customers']
  }
];

export const errorReportingService = {
  // Report an error to the backend
  reportError: async (errorData: {
    message: string;
    stack?: string;
    context?: Record<string, any>;
    userId?: string;
    timestamp: number;
    url: string;
    userAgent: string;
  }): Promise<{ success: boolean; id: string }> => {
    return mockApiCall(async () => {
      // Simulate API call to report error
      const errorReport: ErrorReport = {
        id: `error-${Date.now()}`,
        ...errorData,
        severity: errorData.context?.severity || 'medium',
        resolved: false,
        tags: errorData.context?.tags || []
      };
      
      mockErrorReports.push(errorReport);
      
      return { success: true, id: errorReport.id };
    }, 200);
  },

  // Get error reports with filtering
  getErrorReports: async (params?: {
    page?: number;
    limit?: number;
    severity?: string;
    resolved?: boolean;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    reports: ErrorReport[];
    total: number;
    page: number;
    limit: number;
  }> => {
    return mockApiCall(async () => {
      const {
        page = 1,
        limit = 10,
        severity,
        resolved,
        userId,
        dateFrom,
        dateTo
      } = params || {};

      let filteredReports = [...mockErrorReports];

      // Apply filters
      if (severity) {
        filteredReports = filteredReports.filter(report => report.severity === severity);
      }
      if (resolved !== undefined) {
        filteredReports = filteredReports.filter(report => report.resolved === resolved);
      }
      if (userId) {
        filteredReports = filteredReports.filter(report => report.userId === userId);
      }
      if (dateFrom) {
        const fromDate = new Date(dateFrom).getTime();
        filteredReports = filteredReports.filter(report => report.timestamp >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo).getTime();
        filteredReports = filteredReports.filter(report => report.timestamp <= toDate);
      }

      // Sort by timestamp (newest first)
      filteredReports.sort((a, b) => b.timestamp - a.timestamp);

      // Paginate
      const startIndex = (page - 1) * limit;
      const paginatedReports = filteredReports.slice(startIndex, startIndex + limit);

      return {
        reports: paginatedReports,
        total: filteredReports.length,
        page,
        limit
      };
    });
  },

  // Get error reporting statistics
  getErrorStats: async (params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ErrorReportingStats> => {
    return mockApiCall(async () => {
      let reports = [...mockErrorReports];

      // Apply date filters
      if (params?.dateFrom) {
        const fromDate = new Date(params.dateFrom).getTime();
        reports = reports.filter(report => report.timestamp >= fromDate);
      }
      if (params?.dateTo) {
        const toDate = new Date(params.dateTo).getTime();
        reports = reports.filter(report => report.timestamp <= toDate);
      }

      // Calculate stats
      const totalErrors = reports.length;
      
      const uniqueUsers = new Set(reports.map(r => r.userId).filter(Boolean));
      const affectedUsers = uniqueUsers.size;

      // Errors by day
      const errorsByDay = reports.reduce((acc, report) => {
        const date = new Date(report.timestamp).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[]);

      // Errors by type (based on tags)
      const errorsByType = reports.reduce((acc, report) => {
        const type = report.tags[0] || 'unknown';
        const existing = acc.find(item => item.type === type);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type, count: 1 });
        }
        return acc;
      }, [] as { type: string; count: number }[]);

      // Errors by severity
      const errorsBySeverity = reports.reduce((acc, report) => {
        const existing = acc.find(item => item.severity === report.severity);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ severity: report.severity, count: 1 });
        }
        return acc;
      }, [] as { severity: string; count: number }[]);

      // Top errors by message
      const topErrors = reports.reduce((acc, report) => {
        const existing = acc.find(item => item.message === report.message);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ message: report.message, count: 1 });
        }
        return acc;
      }, [] as { message: string; count: number }[])
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

      return {
        totalErrors,
        errorsByDay,
        errorsByType,
        errorsBySeverity,
        topErrors,
        affectedUsers
      };
    });
  },

  // Mark error as resolved
  resolveError: async (errorId: string, notes?: string): Promise<{ success: boolean }> => {
    return mockApiCall(async () => {
      const error = mockErrorReports.find(r => r.id === errorId);
      if (error) {
        error.resolved = true;
      }
      return { success: true };
    });
  },

  // Add tags to error
  tagError: async (errorId: string, tags: string[]): Promise<{ success: boolean }> => {
    return mockApiCall(async () => {
      const error = mockErrorReports.find(r => r.id === errorId);
      if (error) {
        error.tags = [...new Set([...error.tags, ...tags])];
      }
      return { success: true };
    });
  },

  // Bulk resolve errors
  bulkResolveErrors: async (errorIds: string[]): Promise<{ success: boolean; resolved: number }> => {
    return mockApiCall(async () => {
      let resolved = 0;
      errorIds.forEach(id => {
        const error = mockErrorReports.find(r => r.id === id);
        if (error && !error.resolved) {
          error.resolved = true;
          resolved++;
        }
      });
      return { success: true, resolved };
    });
  }
};

export default errorReportingService;