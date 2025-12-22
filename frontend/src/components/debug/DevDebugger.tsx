import React, { useState, useEffect } from 'react';
import { X, Move, Eye, EyeOff, ChevronDown, ChevronRight, Settings, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { authService } from '@/services/api/auth';

interface DebugData {
  label: string;
  data: any;
  category?: 'auth' | 'data' | 'api' | 'state' | 'performance' | 'general';
  timestamp?: number;
}

interface DevDebuggerProps {
  isEnabled?: boolean;
}

const DevDebugger: React.FC<DevDebuggerProps> = ({ 
  isEnabled = import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [debugLogs, setDebugLogs] = useState<DebugData[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [replaceMode, setReplaceMode] = useState(true); // Default to replace mode
  const [filters, setFilters] = useState({
    auth: true,
    data: true,
    api: true,
    state: true,
    performance: true,
    general: true
  });
  const [clearCounter, setClearCounter] = useState(0); // Track clears to trigger re-logs

  // Global debug function
  useEffect(() => {
    if (isEnabled) {
      // Add global debug function
      (window as any).debugLog = (label: string, data: any, category: DebugData['category'] = 'general') => {
        setDebugLogs(prev => {
          const shouldReplace = replaceMode || (window as any).debugReplaceMode;
          
          if (shouldReplace) {
            // In replace mode, replace existing log with same label and category
            const existingIndex = prev.findIndex(log => 
              log.label === label && log.category === category
            );
            if (existingIndex !== -1) {
              const newLogs = [...prev];
              newLogs[existingIndex] = {
                label,
                data,
                category,
                timestamp: Date.now()
              };
              return newLogs;
            }
          }
          // Normal mode: add new log (keep last 49 + new one = 50 max)
          return [...prev.slice(-49), {
            label,
            data,
            category,
            timestamp: Date.now()
          }];
        });
      };

      // Store clear counter in window for components to check
      (window as any).debugClearCounter = clearCounter;

      // Show debugger button
      setIsVisible(true);
    }

    return () => {
      if ((window as any).debugLog) {
        delete (window as any).debugLog;
      }
    };
  }, [isEnabled, replaceMode, clearCounter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const clearLogs = () => {
    setDebugLogs([]);
    setClearCounter(prev => prev + 1); // Increment to trigger re-logs
  };

  const refreshAuthState = () => {
    try {
      const state = authService.debugAuthState();
      // Add to debugLogs directly
      setDebugLogs(prev => {
        const newLog = {
          label: 'Auth State Refresh',
          data: state,
          category: 'auth' as const,
          timestamp: Date.now()
        };
        
        if (replaceMode) {
          const existingIndex = prev.findIndex(log => 
            log.label === newLog.label && log.category === newLog.category
          );
          if (existingIndex !== -1) {
            const newLogs = [...prev];
            newLogs[existingIndex] = newLog;
            return newLogs;
          }
        }
        return [...prev.slice(-49), newLog];
      });
    } catch (error) {
      setDebugLogs(prev => [...prev.slice(-49), {
        label: 'Auth State Error',
        data: { error: error.message },
        category: 'auth' as const,
        timestamp: Date.now()
      }]);
    }
  };

  const forceAuthReset = () => {
    try {
      authService.forceAuthReset();
      setDebugLogs(prev => [...prev.slice(-49), {
        label: 'Auth Reset Complete',
        data: { action: 'forceAuthReset', timestamp: new Date().toISOString() },
        category: 'auth' as const,
        timestamp: Date.now()
      }]);
      // FIXED: Don't auto-refresh recursively to prevent infinite loops
      // setTimeout(() => refreshAuthState(), 100);
    } catch (error) {
      setDebugLogs(prev => [...prev.slice(-49), {
        label: 'Auth Reset Error',
        data: { error: error.message },
        category: 'auth' as const,
        timestamp: Date.now()
      }]);
    }
  };

  // Add sample logs for empty categories to demonstrate functionality
  const addSampleLogs = () => {
    const sampleLogs = [
      { label: 'API Request', data: { method: 'GET', url: '/api/users', status: 200 }, category: 'api' as const },
      { label: 'State Update', data: { component: 'UserProfile', action: 'UPDATE_USER' }, category: 'state' as const },
      { label: 'Performance', data: { operation: 'render', duration: '15ms' }, category: 'performance' as const },
      { label: 'General Log', data: { message: 'Application initialized successfully' }, category: 'general' as const }
    ];

    sampleLogs.forEach(log => {
      if ((window as any).debugLog) {
        (window as any).debugLog(log.label, log.data, log.category);
      }
    });
  };

  // Auto-refresh auth state on component mount
  useEffect(() => {
    if (isEnabled) {
      refreshAuthState();
    }
  }, [isEnabled]);

  const getFilteredLogs = () => {
    return debugLogs.filter(log => filters[log.category || 'general']);
  };

  const formatData = (data: any): string => {
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'auth': return 'text-blue-600 dark:text-blue-400';
      case 'data': return 'text-green-600 dark:text-green-400';
      case 'api': return 'text-purple-600 dark:text-purple-400';
      case 'state': return 'text-orange-600 dark:text-orange-400';
      case 'performance': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isEnabled || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] select-none"
      style={{ 
        left: position.x, 
        top: position.y,
        userSelect: 'none'
      }}
    >
      <Card className="w-80 max-h-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
        <CardHeader 
          className="px-3 py-2 cursor-move flex flex-row items-center justify-between space-y-0"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <Move className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Debug Panel</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setReplaceMode(!replaceMode)}
              title={replaceMode ? "Replace Mode: ON (same labels update)" : "Replace Mode: OFF (always add new)"}
            >
              <Settings className={`h-3 w-3 ${replaceMode ? 'text-primary' : 'text-muted-foreground'}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setIsVisible(false)}
              title="Hide Debug Panel"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost" 
              className="h-6 w-6 p-0"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 space-y-2">
          {/* Controls */}
          <div className="flex flex-wrap gap-1 pb-2 border-b">
            <div className="flex flex-wrap gap-1">
              {Object.entries(filters).map(([category, enabled]) => (
                <Button
                  key={category}
                  size="sm"
                  variant={enabled ? "default" : "outline"}
                  className="h-6 px-2 text-xs"
                  onClick={() => setFilters(prev => ({ ...prev, [category]: !enabled }))}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-1 text-xs"
                onClick={refreshAuthState}
                title="Refresh Auth State"
              >
                <Shield className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-1 text-xs"
                onClick={forceAuthReset}
                title="Force Auth Reset"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-1 text-xs"
                onClick={clearLogs}
                title="Clear Logs"
              >
                X
              </Button>
            </div>
          </div>

          {/* Sample Logs Button */}
          {debugLogs.length === 0 && (
            <div className="text-center py-2">
              <Button
                size="sm"
                variant="outline"
                onClick={addSampleLogs}
                className="text-xs"
              >
                Add Sample Logs
              </Button>
            </div>
          )}

          {/* Debug Logs */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {getFilteredLogs().map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="border rounded p-2 text-xs">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    {expandedItems.has(index) ? (
                      <ChevronDown className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${getCategoryColor(log.category)} truncate`}>
                      [{log.category?.toUpperCase() || 'GENERAL'}]
                    </span>
                    <span className="truncate">{log.label}</span>
                  </div>
                  {log.timestamp && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                {expandedItems.has(index) && (
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {formatData(log.data)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevDebugger;