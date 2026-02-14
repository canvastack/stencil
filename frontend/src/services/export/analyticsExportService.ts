import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface AnalyticsExportData {
  metrics?: {
    activeOrders: number;
    activeOrdersChange: number;
    onTimeDeliveryRate: number;
    onTimeDeliveryRateChange: number;
    avgProductionTime: number;
    avgProductionTimeChange: number;
    quoteAcceptanceRate: number;
    quoteAcceptanceRateChange: number;
  };
  timeline?: Array<{
    date: string;
    accepted: number;
    completed: number;
    overdue: number;
  }>;
  vendors?: Array<{
    id: string;
    name: string;
    totalOrders: number;
    onTimeDeliveryRate: number;
    avgProductionTime: number;
    qualityScore: number;
    status: string;
  }>;
  deliveryStatus?: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  activities?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
  timeRange?: string;
  generatedAt?: string;
}

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
}

export class AnalyticsExportService {
  /**
   * Export analytics dashboard data to specified format
   */
  static export(
    data: AnalyticsExportData,
    options: ExportOptions = { format: 'xlsx' }
  ): void {
    const { format, filename } = options;

    if (!data) {
      throw new Error('No data to export');
    }

    const defaultFilename = `analytics-dashboard-${new Date().toISOString().split('T')[0]}`;
    const finalFilename = filename || defaultFilename;

    switch (format) {
      case 'xlsx':
        this.exportToExcel(data, finalFilename);
        break;
      case 'csv':
        this.exportToCSV(data, finalFilename);
        break;
      case 'pdf':
        this.exportToPDF(data, finalFilename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to Excel format (.xlsx) with multiple sheets
   */
  private static exportToExcel(data: AnalyticsExportData, filename: string): void {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Overview Metrics
    if (data.metrics) {
      const metricsData = [
        ['Metric', 'Value', 'Change (%)'],
        ['Active Orders', data.metrics.activeOrders, data.metrics.activeOrdersChange],
        ['On-Time Delivery Rate', `${data.metrics.onTimeDeliveryRate}%`, data.metrics.onTimeDeliveryRateChange],
        ['Avg Production Time', `${data.metrics.avgProductionTime} days`, data.metrics.avgProductionTimeChange],
        ['Quote Acceptance Rate', `${data.metrics.quoteAcceptanceRate}%`, data.metrics.quoteAcceptanceRateChange],
      ];
      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
      metricsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Overview Metrics');
    }

    // Sheet 2: Production Timeline
    if (data.timeline && data.timeline.length > 0) {
      const timelineData = data.timeline.map(item => ({
        'Date': item.date,
        'Accepted': item.accepted,
        'Completed': item.completed,
        'Overdue': item.overdue,
      }));
      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      timelineSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Production Timeline');
    }

    // Sheet 3: Vendor Performance
    if (data.vendors && data.vendors.length > 0) {
      const vendorsData = data.vendors.map(vendor => ({
        'Vendor Name': vendor.name,
        'Total Orders': vendor.totalOrders,
        'On-Time Delivery (%)': vendor.onTimeDeliveryRate,
        'Avg Production Time (days)': vendor.avgProductionTime,
        'Quality Score': vendor.qualityScore,
        'Status': vendor.status,
      }));
      const vendorsSheet = XLSX.utils.json_to_sheet(vendorsData);
      vendorsSheet['!cols'] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(workbook, vendorsSheet, 'Vendor Performance');
    }

    // Sheet 4: Delivery Status
    if (data.deliveryStatus && data.deliveryStatus.length > 0) {
      const statusData = data.deliveryStatus.map(item => ({
        'Status': item.status,
        'Count': item.count,
        'Percentage': `${item.percentage}%`,
      }));
      const statusSheet = XLSX.utils.json_to_sheet(statusData);
      statusSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Delivery Status');
    }

    // Sheet 5: Recent Activity
    if (data.activities && data.activities.length > 0) {
      const activitiesData = data.activities.map(activity => ({
        'Type': activity.type,
        'Title': activity.title,
        'Description': activity.description,
        'Timestamp': new Date(activity.timestamp).toLocaleString(),
      }));
      const activitiesSheet = XLSX.utils.json_to_sheet(activitiesData);
      activitiesSheet['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, activitiesSheet, 'Recent Activity');
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob(
      [excelBuffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    saveAs(blob, `${filename}.xlsx`);
  }

  /**
   * Export to CSV format (.csv) - combines all data into one file
   */
  private static exportToCSV(data: AnalyticsExportData, filename: string): void {
    let csvContent = '';

    // Add metadata
    csvContent += `Analytics Dashboard Export\n`;
    csvContent += `Generated: ${data.generatedAt || new Date().toLocaleString()}\n`;
    csvContent += `Time Range: ${data.timeRange || 'N/A'}\n`;
    csvContent += `\n`;

    // Overview Metrics
    if (data.metrics) {
      csvContent += `OVERVIEW METRICS\n`;
      csvContent += `Metric,Value,Change (%)\n`;
      csvContent += `Active Orders,${data.metrics.activeOrders},${data.metrics.activeOrdersChange}\n`;
      csvContent += `On-Time Delivery Rate,${data.metrics.onTimeDeliveryRate}%,${data.metrics.onTimeDeliveryRateChange}\n`;
      csvContent += `Avg Production Time,${data.metrics.avgProductionTime} days,${data.metrics.avgProductionTimeChange}\n`;
      csvContent += `Quote Acceptance Rate,${data.metrics.quoteAcceptanceRate}%,${data.metrics.quoteAcceptanceRateChange}\n`;
      csvContent += `\n`;
    }

    // Production Timeline
    if (data.timeline && data.timeline.length > 0) {
      csvContent += `PRODUCTION TIMELINE\n`;
      csvContent += `Date,Accepted,Completed,Overdue\n`;
      data.timeline.forEach(item => {
        csvContent += `${item.date},${item.accepted},${item.completed},${item.overdue}\n`;
      });
      csvContent += `\n`;
    }

    // Vendor Performance
    if (data.vendors && data.vendors.length > 0) {
      csvContent += `VENDOR PERFORMANCE\n`;
      csvContent += `Vendor Name,Total Orders,On-Time Delivery (%),Avg Production Time (days),Quality Score,Status\n`;
      data.vendors.forEach(vendor => {
        csvContent += `"${vendor.name}",${vendor.totalOrders},${vendor.onTimeDeliveryRate},${vendor.avgProductionTime},${vendor.qualityScore},${vendor.status}\n`;
      });
      csvContent += `\n`;
    }

    // Delivery Status
    if (data.deliveryStatus && data.deliveryStatus.length > 0) {
      csvContent += `DELIVERY STATUS DISTRIBUTION\n`;
      csvContent += `Status,Count,Percentage\n`;
      data.deliveryStatus.forEach(item => {
        csvContent += `${item.status},${item.count},${item.percentage}%\n`;
      });
      csvContent += `\n`;
    }

    // Recent Activity
    if (data.activities && data.activities.length > 0) {
      csvContent += `RECENT ACTIVITY\n`;
      csvContent += `Type,Title,Description,Timestamp\n`;
      data.activities.forEach(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString();
        csvContent += `${activity.type},"${activity.title}","${activity.description}",${timestamp}\n`;
      });
    }

    // Add BOM for UTF-8 encoding (Excel compatibility)
    const BOM = '\uFEFF';
    const blob = new Blob(
      [BOM + csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );

    saveAs(blob, `${filename}.csv`);
  }

  /**
   * Export to PDF format (.pdf)
   */
  private static exportToPDF(data: AnalyticsExportData, filename: string): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Production Analytics Dashboard', 14, yPosition);
    yPosition += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${data.generatedAt || new Date().toLocaleString()}`, 14, yPosition);
    yPosition += 5;
    doc.text(`Time Range: ${data.timeRange || 'N/A'}`, 14, yPosition);
    yPosition += 10;

    // Overview Metrics
    if (data.metrics) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Overview Metrics', 14, yPosition);
      yPosition += 7;

      const metricsData = [
        ['Active Orders', data.metrics.activeOrders.toString(), `${data.metrics.activeOrdersChange > 0 ? '+' : ''}${data.metrics.activeOrdersChange}%`],
        ['On-Time Delivery Rate', `${data.metrics.onTimeDeliveryRate}%`, `${data.metrics.onTimeDeliveryRateChange > 0 ? '+' : ''}${data.metrics.onTimeDeliveryRateChange}%`],
        ['Avg Production Time', `${data.metrics.avgProductionTime} days`, `${data.metrics.avgProductionTimeChange > 0 ? '+' : ''}${data.metrics.avgProductionTimeChange} days`],
        ['Quote Acceptance Rate', `${data.metrics.quoteAcceptanceRate}%`, `${data.metrics.quoteAcceptanceRateChange > 0 ? '+' : ''}${data.metrics.quoteAcceptanceRateChange}%`],
      ];

      autoTable(doc, {
        head: [['Metric', 'Value', 'Change']],
        body: metricsData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Vendor Performance
    if (data.vendors && data.vendors.length > 0) {
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Vendor Performance', 14, yPosition);
      yPosition += 7;

      const vendorsData = data.vendors.map(vendor => [
        vendor.name,
        vendor.totalOrders.toString(),
        `${vendor.onTimeDeliveryRate}%`,
        `${vendor.avgProductionTime} days`,
        vendor.qualityScore.toString(),
      ]);

      autoTable(doc, {
        head: [['Vendor', 'Orders', 'On-Time %', 'Avg Time', 'Quality']],
        body: vendorsData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Delivery Status
    if (data.deliveryStatus && data.deliveryStatus.length > 0) {
      // Add new page if needed
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Delivery Status Distribution', 14, yPosition);
      yPosition += 7;

      const statusData = data.deliveryStatus.map(item => [
        item.status,
        item.count.toString(),
        `${item.percentage}%`,
      ]);

      autoTable(doc, {
        head: [['Status', 'Count', 'Percentage']],
        body: statusData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Production Timeline (summary)
    if (data.timeline && data.timeline.length > 0) {
      // Add new page if needed
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Production Timeline (Recent)', 14, yPosition);
      yPosition += 7;

      // Show only last 10 entries
      const recentTimeline = data.timeline.slice(-10);
      const timelineData = recentTimeline.map(item => [
        item.date,
        item.accepted.toString(),
        item.completed.toString(),
        item.overdue.toString(),
      ]);

      autoTable(doc, {
        head: [['Date', 'Accepted', 'Completed', 'Overdue']],
        body: timelineData,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
  }

  /**
   * Get export format metadata
   */
  static getFormatInfo(format: ExportFormat): {
    label: string;
    extension: string;
    description: string;
    icon: string;
  } {
    const formats = {
      xlsx: {
        label: 'Excel',
        extension: '.xlsx',
        description: 'Excel spreadsheet with multiple sheets',
        icon: '📊',
      },
      csv: {
        label: 'CSV',
        extension: '.csv',
        description: 'Comma-separated values (universal compatibility)',
        icon: '📄',
      },
      pdf: {
        label: 'PDF',
        extension: '.pdf',
        description: 'PDF document for printing and sharing',
        icon: '📑',
      },
    };

    return formats[format] || formats.xlsx;
  }
}
