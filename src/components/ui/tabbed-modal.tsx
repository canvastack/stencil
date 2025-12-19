import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabbedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export const TabbedModal = React.forwardRef<
  React.ElementRef<typeof Dialog>,
  TabbedModalProps
>(({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  tabs, 
  defaultTab, 
  className,
  ...props 
}, ref) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent 
        ref={ref}
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden",
          // Glassmorphism effect
          "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80",
          "border border-white/20 dark:border-gray-800/20",
          "shadow-2xl shadow-black/10 dark:shadow-black/50",
          className
        )}
      >
        <DialogHeader className="pb-4 border-b border-white/10 dark:border-gray-800/10">
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue={defaultTab || tabs[0]?.value} className="h-full flex flex-col">
            <TabsList className={cn(
              "grid w-full mb-4",
              // Glassmorphism for tabs
              "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
              "border border-white/20 dark:border-gray-700/20",
              `grid-cols-${tabs.length}`
            )}>
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-200",
                    "data-[state=active]:bg-white/70 data-[state=active]:dark:bg-gray-700/70",
                    "data-[state=active]:backdrop-blur-sm",
                    "data-[state=active]:border data-[state=active]:border-white/30 data-[state=active]:dark:border-gray-600/30",
                    "data-[state=active]:shadow-sm"
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-auto">
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "mt-0 space-y-4 p-1 focus-visible:outline-none",
                    // Ensure content area has proper scrolling
                    "max-h-[calc(90vh-200px)] overflow-auto"
                  )}
                >
                  <div className={cn(
                    "space-y-4",
                    // Subtle glassmorphism for content area
                    "bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm",
                    "border border-white/10 dark:border-gray-800/10",
                    "rounded-lg p-4"
                  )}>
                    {tab.content}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
});

TabbedModal.displayName = "TabbedModal";