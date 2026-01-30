/**
 * Help System Provider Component
 * 
 * Provides centralized help system functionality throughout the application
 * Manages contextual help, keyboard shortcuts, and documentation access
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All help content from real configuration
 * - ✅ BUSINESS ALIGNMENT: Reflects completed UX improvements
 * - ✅ CONTEXTUAL HELP: Context-aware help based on current page/component
 * - ✅ ACCESSIBILITY: Keyboard navigation and screen reader support
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { helpSystemConfig, helpSystemHelpers, type DocumentationLink, type KeyboardShortcut } from '@/config/helpSystemConfig';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HelpCircle,
  Search,
  ExternalLink,
  FileText,
  Video,
  BookOpen,
  Award,
  Keyboard,
  Phone,
  Mail,
  Clock,
  Star,
  Zap
} from 'lucide-react';

interface HelpSystemContextType {
  isHelpOpen: boolean;
  openHelp: (context?: string) => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  searchHelp: (query: string) => void;
  currentContext: string;
  setCurrentContext: (context: string) => void;
}

const HelpSystemContext = createContext<HelpSystemContextType | undefined>(undefined);

export const useHelpSystem = () => {
  const context = useContext(HelpSystemContext);
  if (!context) {
    throw new Error('useHelpSystem must be used within a HelpSystemProvider');
  }
  return context;
};

interface HelpSystemProviderProps {
  children: React.ReactNode;
}

export function HelpSystemProvider({ children }: HelpSystemProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDocs, setFilteredDocs] = useState(helpSystemConfig.documentationLinks);

  const openHelp = useCallback((context?: string) => {
    if (context) {
      setCurrentContext(context);
    }
    setIsHelpOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
    setSearchQuery('');
  }, []);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen(prev => !prev);
  }, []);

  const searchHelp = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredDocs(helpSystemConfig.documentationLinks);
      return;
    }

    const filtered = helpSystemConfig.documentationLinks.filter(doc =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDocs(filtered);
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F1 - Toggle help
      if (event.key === 'F1') {
        event.preventDefault();
        toggleHelp();
        return;
      }

      // Ctrl+Shift+H - Search help
      if (event.ctrlKey && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        openHelp();
        return;
      }

      // Escape - Close help if open
      if (event.key === 'Escape' && isHelpOpen) {
        closeHelp();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, toggleHelp, openHelp, closeHelp]);

  const contextValue: HelpSystemContextType = {
    isHelpOpen,
    openHelp,
    closeHelp,
    toggleHelp,
    searchHelp,
    currentContext,
    setCurrentContext
  };

  return (
    <HelpSystemContext.Provider value={contextValue}>
      {children}
      <HelpSystemDialog
        isOpen={isHelpOpen}
        onClose={closeHelp}
        searchQuery={searchQuery}
        onSearchChange={searchHelp}
        filteredDocs={filteredDocs}
        currentContext={currentContext}
      />
    </HelpSystemContext.Provider>
  );
}

interface HelpSystemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredDocs: DocumentationLink[];
  currentContext: string;
}

function HelpSystemDialog({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  filteredDocs,
  currentContext
}: HelpSystemDialogProps) {
  const featuredDocs = helpSystemHelpers.getFeaturedDocumentation();
  const contextShortcuts = helpSystemHelpers.getShortcutsByContext(currentContext as any);
  const globalShortcuts = helpSystemHelpers.getShortcutsByContext('global');
  const allShortcuts = [...contextShortcuts, ...globalShortcuts];

  const getIconForDocType = (category: DocumentationLink['category']) => {
    switch (category) {
      case 'user-guide':
        return BookOpen;
      case 'admin-training':
        return Award;
      case 'developer':
        return FileText;
      case 'api':
        return Zap;
      case 'troubleshooting':
        return HelpCircle;
      default:
        return FileText;
    }
  };

  const getIconForTrainingType = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'interactive':
        return Zap;
      case 'certification':
        return Award;
      default:
        return BookOpen;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Enhanced Order Status Help System
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search help documentation..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="documentation" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="documentation" className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Featured Documentation */}
              {!searchQuery && featuredDocs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Featured Guides
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featuredDocs.map((doc) => {
                      const Icon = getIconForDocType(doc.category);
                      return (
                        <Card key={doc.id} className="hover:bg-muted/50 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {doc.title}
                              {doc.type === 'external' && <ExternalLink className="w-3 h-3" />}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {doc.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {doc.category.replace('-', ' ')}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(doc.url, doc.type === 'external' ? '_blank' : '_self')}
                                className="h-6 px-2 text-xs"
                              >
                                Open
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Documentation */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {searchQuery ? `Search Results (${filteredDocs.length})` : 'All Documentation'}
                </h3>
                <div className="space-y-2">
                  {filteredDocs.map((doc) => {
                    const Icon = getIconForDocType(doc.category);
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{doc.title}</h4>
                            {doc.type === 'external' && <ExternalLink className="w-3 h-3" />}
                            {doc.featured && <Star className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{doc.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {doc.category.replace('-', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Updated: {new Date(doc.lastUpdated).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.url, doc.type === 'external' ? '_blank' : '_self')}
                          className="flex-shrink-0"
                        >
                          Open
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Current context: <Badge variant="outline">{currentContext}</Badge>
                </div>
                
                {allShortcuts.length > 0 ? (
                  <div className="space-y-3">
                    {allShortcuts.map((shortcut) => (
                      <div key={shortcut.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{shortcut.description}</p>
                          <p className="text-xs text-muted-foreground">Context: {shortcut.context}</p>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          {shortcut.keys}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Keyboard className="w-8 h-8 mx-auto mb-2" />
                    <p>No keyboard shortcuts available for current context</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="training" className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpSystemConfig.trainingResources.map((resource) => {
                  const Icon = getIconForTrainingType(resource.type);
                  return (
                    <Card key={resource.id} className="hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {resource.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {resource.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {resource.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {resource.type}
                            </Badge>
                            {resource.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {resource.duration}
                              </span>
                            )}
                          </div>
                          {resource.prerequisites && (
                            <div className="text-xs text-muted-foreground">
                              Prerequisites: {resource.prerequisites.join(', ')}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(resource.url, '_blank')}
                            className="w-full"
                          >
                            Start Training
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="support" className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpSystemConfig.supportContacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{contact.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {contact.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="w-3 h-3" />
                            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-xs">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {contact.hours}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {contact.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HelpSystemProvider;