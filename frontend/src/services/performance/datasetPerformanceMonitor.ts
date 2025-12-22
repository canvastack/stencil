import { performanceMonitoring } from '@/config/monitoring';

/**
 * Performance monitoring khusus untuk large datasets
 * Melacak performa rendering, memory usage, dan loading time untuk data besar
 */

export interface DatasetMetrics {
  dataSize: number;
  renderTime: number;
  memoryUsage: number;
  scrollPerformance: number;
  filterTime: number;
  sortTime: number;
}

export interface DatasetPerformanceThresholds {
  maxRenderTime: number; // ms
  maxMemoryUsage: number; // bytes
  maxFilterTime: number; // ms
  maxSortTime: number; // ms
  warningDataSize: number; // number of items
  criticalDataSize: number; // number of items
}

const DEFAULT_THRESHOLDS: DatasetPerformanceThresholds = {
  maxRenderTime: 100, // 100ms
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  maxFilterTime: 50, // 50ms
  maxSortTime: 100, // 100ms
  warningDataSize: 1000, // 1k items
  criticalDataSize: 5000, // 5k items
};

class DatasetPerformanceMonitor {
  private thresholds: DatasetPerformanceThresholds = DEFAULT_THRESHOLDS;
  private activeMonitors = new Map<string, number>();

  /**
   * Mulai monitoring rendering dataset
   */
  startDatasetRender(datasetId: string, dataSize: number): void {
    this.activeMonitors.set(`render_${datasetId}`, performance.now());
    
    // Track memory sebelum render
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      this.activeMonitors.set(`memory_start_${datasetId}`, memInfo.usedJSHeapSize);
    }

    // Log warning jika dataset terlalu besar
    if (dataSize > this.thresholds.criticalDataSize) {
      console.warn(`🚨 Dataset ${datasetId} sangat besar: ${dataSize} items. Pertimbangkan pagination atau virtualization.`);
      performanceMonitoring.trackCustomMetric('dataset_size_critical', dataSize, { datasetId });
    } else if (dataSize > this.thresholds.warningDataSize) {
      console.warn(`⚠️ Dataset ${datasetId} cukup besar: ${dataSize} items. Monitor performa rendering.`);
      performanceMonitoring.trackCustomMetric('dataset_size_warning', dataSize, { datasetId });
    }
  }

  /**
   * Selesaikan monitoring rendering dataset
   */
  endDatasetRender(datasetId: string, dataSize: number): DatasetMetrics | null {
    const startTime = this.activeMonitors.get(`render_${datasetId}`);
    const memoryStart = this.activeMonitors.get(`memory_start_${datasetId}`);
    
    if (!startTime) {
      console.warn(`No render start time found for dataset: ${datasetId}`);
      return null;
    }

    const renderTime = performance.now() - startTime;
    let memoryUsage = 0;

    // Hitung memory usage
    if (memoryStart && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      memoryUsage = memInfo.usedJSHeapSize - memoryStart;
    }

    const metrics: DatasetMetrics = {
      dataSize,
      renderTime,
      memoryUsage,
      scrollPerformance: 0, // akan diupdate saat scroll
      filterTime: 0, // akan diupdate saat filter
      sortTime: 0, // akan diupdate saat sort
    };

    // Check thresholds dan log warnings
    this.checkRenderThresholds(datasetId, metrics);

    // Track metrics
    this.trackDatasetMetrics(datasetId, metrics);

    // Cleanup
    this.activeMonitors.delete(`render_${datasetId}`);
    this.activeMonitors.delete(`memory_start_${datasetId}`);

    return metrics;
  }

  /**
   * Monitor filtering performance
   */
  monitorFilter<T>(
    datasetId: string, 
    data: T[], 
    filterFn: (item: T) => boolean
  ): T[] {
    const startTime = performance.now();
    const filtered = data.filter(filterFn);
    const filterTime = performance.now() - startTime;

    // Track metrics
    performanceMonitoring.trackCustomMetric('dataset_filter_time', filterTime, {
      datasetId,
      originalSize: data.length.toString(),
      filteredSize: filtered.length.toString(),
    });

    // Check threshold
    if (filterTime > this.thresholds.maxFilterTime) {
      console.warn(`🐌 Filter lambat untuk ${datasetId}: ${filterTime.toFixed(2)}ms`);
      performanceMonitoring.trackCustomMetric('dataset_filter_slow', filterTime, { datasetId });
    }

    return filtered;
  }

  /**
   * Monitor sorting performance
   */
  monitorSort<T>(
    datasetId: string, 
    data: T[], 
    compareFn: (a: T, b: T) => number
  ): T[] {
    const startTime = performance.now();
    const sorted = [...data].sort(compareFn);
    const sortTime = performance.now() - startTime;

    // Track metrics
    performanceMonitoring.trackCustomMetric('dataset_sort_time', sortTime, {
      datasetId,
      dataSize: data.length.toString(),
    });

    // Check threshold
    if (sortTime > this.thresholds.maxSortTime) {
      console.warn(`🐌 Sort lambat untuk ${datasetId}: ${sortTime.toFixed(2)}ms`);
      performanceMonitoring.trackCustomMetric('dataset_sort_slow', sortTime, { datasetId });
    }

    return sorted;
  }

  /**
   * Monitor scroll performance untuk virtualized lists
   */
  startScrollPerformance(datasetId: string): void {
    this.activeMonitors.set(`scroll_${datasetId}`, performance.now());
  }

  endScrollPerformance(datasetId: string): number {
    const startTime = this.activeMonitors.get(`scroll_${datasetId}`);
    if (!startTime) return 0;

    const scrollTime = performance.now() - startTime;
    this.activeMonitors.delete(`scroll_${datasetId}`);

    performanceMonitoring.trackCustomMetric('dataset_scroll_performance', scrollTime, { datasetId });
    
    return scrollTime;
  }

  /**
   * Recommendations berdasarkan metrics
   */
  getOptimizationRecommendations(metrics: DatasetMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.dataSize > this.thresholds.criticalDataSize) {
      recommendations.push('✅ Gunakan pagination atau infinite scrolling');
      recommendations.push('✅ Implementasi virtualization untuk list besar');
    }

    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      recommendations.push('✅ Optimasi rendering dengan React.memo atau useMemo');
      recommendations.push('✅ Lazy loading untuk komponen berat');
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      recommendations.push('✅ Cleanup memory dengan useEffect cleanup');
      recommendations.push('✅ Optimasi struktur data untuk mengurangi memory footprint');
    }

    if (metrics.filterTime > this.thresholds.maxFilterTime) {
      recommendations.push('✅ Implementasi debounced search');
      recommendations.push('✅ Server-side filtering untuk dataset besar');
    }

    if (metrics.sortTime > this.thresholds.maxSortTime) {
      recommendations.push('✅ Server-side sorting untuk dataset besar');
      recommendations.push('✅ Cache sorted results');
    }

    return recommendations;
  }

  /**
   * Check render thresholds
   */
  private checkRenderThresholds(datasetId: string, metrics: DatasetMetrics): void {
    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      console.warn(`🐌 Rendering lambat untuk ${datasetId}: ${metrics.renderTime.toFixed(2)}ms`);
      console.warn('💡 Saran: Gunakan React.memo, virtualization, atau pagination');
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      console.warn(`🧠 Memory usage tinggi untuk ${datasetId}: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      console.warn('💡 Saran: Optimasi struktur data atau cleanup memory');
    }
  }

  /**
   * Track all dataset metrics
   */
  private trackDatasetMetrics(datasetId: string, metrics: DatasetMetrics): void {
    const tags = { datasetId };

    performanceMonitoring.trackCustomMetric('dataset_data_size', metrics.dataSize, tags);
    performanceMonitoring.trackCustomMetric('dataset_render_time', metrics.renderTime, tags);
    
    if (metrics.memoryUsage > 0) {
      performanceMonitoring.trackCustomMetric('dataset_memory_usage', metrics.memoryUsage, tags);
    }
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<DatasetPerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): DatasetPerformanceThresholds {
    return { ...this.thresholds };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): {
    summary: string;
    recommendations: string[];
    metrics: Record<string, number>;
  } {
    return {
      summary: 'Dataset Performance Monitor telah melacak performa rendering data besar',
      recommendations: [
        '✅ Monitor terus dataset dengan >1000 items',
        '✅ Implementasi virtualization untuk list panjang',
        '✅ Gunakan server-side pagination',
        '✅ Cache filtered/sorted results',
        '✅ Optimasi dengan React.memo untuk item components',
      ],
      metrics: {
        maxRenderTimeThreshold: this.thresholds.maxRenderTime,
        maxMemoryUsageThreshold: this.thresholds.maxMemoryUsage,
        warningDataSize: this.thresholds.warningDataSize,
        criticalDataSize: this.thresholds.criticalDataSize,
      }
    };
  }
}

// Export singleton instance
export const datasetPerformanceMonitor = new DatasetPerformanceMonitor();

// React hook untuk mudah menggunakan dataset performance monitoring
export function useDatasetPerformanceMonitor(datasetId: string) {
  return {
    startRender: (dataSize: number) => datasetPerformanceMonitor.startDatasetRender(datasetId, dataSize),
    endRender: (dataSize: number) => datasetPerformanceMonitor.endDatasetRender(datasetId, dataSize),
    monitorFilter: <T>(data: T[], filterFn: (item: T) => boolean) => 
      datasetPerformanceMonitor.monitorFilter(datasetId, data, filterFn),
    monitorSort: <T>(data: T[], compareFn: (a: T, b: T) => number) => 
      datasetPerformanceMonitor.monitorSort(datasetId, data, compareFn),
    getRecommendations: (metrics: DatasetMetrics) => 
      datasetPerformanceMonitor.getOptimizationRecommendations(metrics),
  };
}

export default datasetPerformanceMonitor;