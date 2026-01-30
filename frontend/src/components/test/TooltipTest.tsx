import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, AlertTriangle } from 'lucide-react';

export const TooltipTest = () => {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-8 space-y-8">
        <h1 className="text-2xl font-bold">Tooltip Visibility Test</h1>
        
        {/* Test 1: Simple tooltip */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test 1: Simple Tooltip</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Hover me (simple)
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a simple tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Test 2: Card with overflow hidden */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test 2: Card with overflow hidden</h2>
          <Card className="relative overflow-hidden w-64">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        Total Revenue (Hidden)
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      </CardTitle>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm p-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">This tooltip should be clipped</p>
                      <p className="text-xs">Card has overflow: hidden</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Rp 1,000,000</div>
              <p className="text-sm text-muted-foreground mt-2">Overflow hidden</p>
            </CardContent>
          </Card>
        </div>

        {/* Test 3: Card with overflow visible */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test 3: Card with overflow visible</h2>
          <Card className="relative w-64" style={{ overflow: 'visible' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        Total Revenue (Visible)
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      </CardTitle>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="max-w-sm p-4 bg-white dark:bg-gray-800 border shadow-xl z-[9999] rounded-lg"
                    sideOffset={15}
                    avoidCollisions={true}
                    collisionPadding={20}
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">This tooltip should be visible!</p>
                      <p className="text-xs">Card has overflow: visible</p>
                      <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border">
                        <p><strong>Test:</strong> High z-index and proper positioning</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Rp 1,000,000</div>
              <p className="text-sm text-muted-foreground mt-2">Overflow visible</p>
            </CardContent>
          </Card>
        </div>

        {/* Test 4: Enhanced Card Component Test */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test 4: Enhanced Card Component</h2>
          <EnhancedCard allowTooltipOverflow={true} className="w-64">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        Enhanced Card Test
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      </CardTitle>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="max-w-sm p-4 bg-white dark:bg-gray-800 border shadow-xl z-[9999] rounded-lg"
                    sideOffset={15}
                    avoidCollisions={true}
                    collisionPadding={20}
                  >
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">Enhanced Card Tooltip</p>
                      <p className="text-xs">Using allowTooltipOverflow prop</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Enhanced</div>
              <p className="text-sm text-muted-foreground mt-2">With tooltip overflow</p>
            </CardContent>
          </EnhancedCard>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Enhanced Card Component (copied from OrderManagement)
const EnhancedCard = ({ 
  children, 
  className = "",
  allowTooltipOverflow = false,
  ...props 
}: { 
  children: React.ReactNode; 
  className?: string;
  allowTooltipOverflow?: boolean;
  [key: string]: any;
}) => (
  <Card 
    className={`relative ${allowTooltipOverflow ? '' : 'overflow-hidden'} group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
    {...props}
  >
    {/* Shine effect - only show if overflow is hidden */}
    {!allowTooltipOverflow && (
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
    )}
    {children}
  </Card>
);