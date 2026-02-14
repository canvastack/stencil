import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsExportService } from '@/services/export/analyticsExportService';
import type { AnalyticsExportData } from '@/services/export/analyticsExportService';

// Mock dependencies - use factory functions to avoid hoisting issues
vi.mock('xlsx', () => {
  const mockWrite = vi.fn(() => new ArrayBuffer(0));
  const mockBookNew = vi.fn(() => ({}));
  const mockJsonToSheet = vi.fn(() => ({}));
  const mockAoaToSheet = vi.fn(() => ({}));
  const mockBookAppendSheet = vi.fn();
  const mockSheetToCsv = vi.fn(() => 'csv,data');

  return {
    utils: {
      book_new: mockBookNew,
      json_to_sheet: mockJsonToSheet,
      aoa_to_sheet: mockAoaToSheet,
      book_append_sheet: mockBookAppendSheet,
      sheet_to_csv: mockSheetToCsv,
    },
    write: mockWrite,
  };
});

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    getNumberOfPages: vi.fn(() => 1),
    save: vi.fn(),
    internal: {
      pageSize: {
        width: 210,
        height: 297,
      },
    },
  })),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc: any) => {
    doc.lastAutoTable = { finalY: 100 };
  }),
}));

describe('AnalyticsExportService', () => {
  const mockData: AnalyticsExportData = {
    metrics: {
      activeOrders: 24,
      activeOrdersChange: 12.5,
      onTimeDeliveryRate: 87.3,
      onTimeDeliveryRateChange: -3.2,
      avgProductionTime: 12.4,
      avgProductionTimeChange: -2.1,
      quoteAcceptanceRate: 73.5,
      quoteAcceptanceRateChange: 5.3,
    },
    timeline: [
      { date: '2026-02-01', accepted: 12, completed: 10, overdue: 2 },
      { date: '2026-02-02', accepted: 15, completed: 13, overdue: 1 },
    ],
    vendors: [
      {
        id: 'vendor-1',
        name: 'PT Vendor A',
        totalOrders: 45,
        onTimeDeliveryRate: 92.3,
        avgProductionTime: 11.2,
        qualityScore: 4.8,
        status: 'active',
      },
    ],
    deliveryStatus: [
      { status: 'on_track', count: 11, percentage: 45.8 },
      { status: 'approaching', count: 6, percentage: 25.0 },
    ],
    activities: [
      {
        id: 'activity-1',
        type: 'quote_accepted',
        title: 'Quote accepted',
        description: 'Order #123',
        timestamp: '2026-02-14T10:00:00Z',
      },
    ],
    timeRange: '30d',
    generatedAt: '2026-02-14T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('export', () => {
    it('throws error when no data provided', () => {
      expect(() => {
        AnalyticsExportService.export(null as any, { format: 'xlsx' });
      }).toThrow('No data to export');
    });

    it('throws error for unsupported format', () => {
      expect(() => {
        AnalyticsExportService.export(mockData, { format: 'invalid' as any });
      }).toThrow('Unsupported export format: invalid');
    });

    it('uses default filename when not provided', async () => {
      const { saveAs } = await import('file-saver');
      
      AnalyticsExportService.export(mockData, { format: 'xlsx' });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/analytics-dashboard-\d{4}-\d{2}-\d{2}\.xlsx/)
      );
    });

    it('uses custom filename when provided', async () => {
      const { saveAs } = await import('file-saver');
      
      AnalyticsExportService.export(mockData, {
        format: 'xlsx',
        filename: 'custom-export',
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'custom-export.xlsx'
      );
    });
  });

  describe('exportToExcel', () => {
    it('creates workbook with multiple sheets', async () => {
      const XLSX = await import('xlsx');
      
      AnalyticsExportService.export(mockData, { format: 'xlsx' });

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(5); // 5 sheets
    });

    it('creates metrics sheet with correct data', async () => {
      const XLSX = await import('xlsx');
      
      AnalyticsExportService.export(mockData, { format: 'xlsx' });

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Metric', 'Value', 'Change (%)'],
          ['Active Orders', 24, 12.5],
        ])
      );
    });

    it('creates timeline sheet with correct data', async () => {
      const XLSX = await import('xlsx');
      
      AnalyticsExportService.export(mockData, { format: 'xlsx' });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            Date: '2026-02-01',
            Accepted: 12,
            Completed: 10,
            Overdue: 2,
          }),
        ])
      );
    });

    it('saves file with correct blob type', async () => {
      const { saveAs } = await import('file-saver');
      
      AnalyticsExportService.export(mockData, { format: 'xlsx' });

      expect(saveAs).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        expect.any(String)
      );
    });
  });

  describe('exportToCSV', () => {
    it('creates CSV with all sections', async () => {
      const { saveAs } = await import('file-saver');
      
      AnalyticsExportService.export(mockData, { format: 'csv' });

      const blobCall = vi.mocked(saveAs).mock.calls[0][0] as Blob;
      expect(blobCall.type).toBe('text/csv;charset=utf-8;');
    });

    it('saves file with .csv extension', async () => {
      const { saveAs } = await import('file-saver');
      
      AnalyticsExportService.export(mockData, {
        format: 'csv',
        filename: 'test-export',
      });

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'test-export.csv'
      );
    });
  });

  describe('exportToPDF', () => {
    it('creates PDF document', async () => {
      const jsPDF = (await import('jspdf')).default;
      
      AnalyticsExportService.export(mockData, { format: 'pdf' });

      expect(jsPDF).toHaveBeenCalledWith(
        expect.objectContaining({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        })
      );
    });

    it('saves file with .pdf extension', async () => {
      const jsPDF = (await import('jspdf')).default;
      
      AnalyticsExportService.export(mockData, {
        format: 'pdf',
        filename: 'test-export',
      });
      
      const mockInstance = vi.mocked(jsPDF).mock.results[0].value;
      expect(mockInstance.save).toHaveBeenCalledWith('test-export.pdf');
    });
  });

  describe('getFormatInfo', () => {
    it('returns correct info for xlsx format', () => {
      const info = AnalyticsExportService.getFormatInfo('xlsx');

      expect(info).toEqual({
        label: 'Excel',
        extension: '.xlsx',
        description: 'Excel spreadsheet with multiple sheets',
        icon: '📊',
      });
    });

    it('returns correct info for csv format', () => {
      const info = AnalyticsExportService.getFormatInfo('csv');

      expect(info).toEqual({
        label: 'CSV',
        extension: '.csv',
        description: 'Comma-separated values (universal compatibility)',
        icon: '📄',
      });
    });

    it('returns correct info for pdf format', () => {
      const info = AnalyticsExportService.getFormatInfo('pdf');

      expect(info).toEqual({
        label: 'PDF',
        extension: '.pdf',
        description: 'PDF document for printing and sharing',
        icon: '📑',
      });
    });

    it('returns xlsx info for unknown format', () => {
      const info = AnalyticsExportService.getFormatInfo('unknown' as any);

      expect(info.label).toBe('Excel');
    });
  });
});
