/**
 * Help System Configuration
 * 
 * Centralized configuration for the enhanced order status workflow help system
 * Contains documentation links, keyboard shortcuts, and contextual help content
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All links point to real documentation
 * - ✅ BUSINESS ALIGNMENT: Reflects completed UX improvements
 * - ✅ CONTEXTUAL HELP: Stage-specific guidance and resources
 * - ✅ ACCESSIBILITY: Keyboard shortcuts and screen reader support
 */

export interface HelpSystemConfig {
  documentationLinks: DocumentationLink[];
  keyboardShortcuts: KeyboardShortcut[];
  contextualHelp: ContextualHelpConfig;
  supportContacts: SupportContact[];
  trainingResources: TrainingResource[];
}

export interface DocumentationLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'user-guide' | 'admin-training' | 'developer' | 'api' | 'troubleshooting';
  type: 'internal' | 'external';
  lastUpdated: string;
  featured?: boolean;
}

export interface KeyboardShortcut {
  id: string;
  keys: string;
  description: string;
  context: 'global' | 'order-detail' | 'timeline' | 'modal';
  action: string;
}

export interface ContextualHelpConfig {
  enableTooltips: boolean;
  enableGuidanceSystem: boolean;
  enableKeyboardShortcuts: boolean;
  defaultHelpLevel: 'basic' | 'detailed' | 'expert';
  autoShowHelp: boolean;
}

export interface SupportContact {
  id: string;
  type: 'technical' | 'business' | 'training' | 'emergency';
  name: string;
  email?: string;
  phone?: string;
  hours: string;
  description: string;
}

export interface TrainingResource {
  id: string;
  title: string;
  type: 'video' | 'guide' | 'interactive' | 'certification';
  url: string;
  duration?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  prerequisites?: string[];
}

/**
 * Enhanced Help System Configuration
 * Updated January 30, 2026 to reflect completed order status workflow UX improvements
 */
export const helpSystemConfig: HelpSystemConfig = {
  documentationLinks: [
    // User Guides - Enhanced with new UX improvements
    {
      id: 'enhanced-order-status-guide',
      title: 'Enhanced Order Status Management Guide',
      url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_MANAGEMENT_GUIDE.md',
      description: 'Panduan lengkap sistem manajemen status order yang telah diperbaharui dengan interactive timeline, actionable modals, dan contextual guidance',
      category: 'user-guide',
      type: 'internal',
      lastUpdated: '2026-01-30',
      featured: true
    },
    {
      id: 'order-workflow-guide',
      title: 'Order Workflow Guide',
      url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_WORKFLOW_GUIDE.md',
      description: 'Panduan lengkap workflow bisnis PT CEX dari customer inquiry hingga delivery',
      category: 'user-guide',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },
    {
      id: 'quick-reference-guide',
      title: 'Order Status Quick Reference',
      url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_QUICK_REFERENCE.md',
      description: 'Panduan referensi cepat untuk workflow harian, keyboard shortcuts, dan emergency contacts',
      category: 'user-guide',
      type: 'internal',
      lastUpdated: '2026-01-30',
      featured: true
    },

    // Admin Training - New comprehensive training materials
    {
      id: 'admin-training-comprehensive',
      title: 'Admin Training - Order Status Workflow',
      url: '/docs/USER_DOCUMENTATION/TENANTS/ADMIN_TRAINING_ORDER_STATUS_WORKFLOW.md',
      description: 'Materi pelatihan lengkap dengan 6 modul, hands-on exercises, dan program sertifikasi Bronze/Silver/Gold',
      category: 'admin-training',
      type: 'internal',
      lastUpdated: '2026-01-30',
      featured: true
    },
    {
      id: 'video-training-scripts',
      title: 'Video Training Scripts',
      url: '/docs/USER_DOCUMENTATION/TENANTS/ORDER_STATUS_VIDEO_TRAINING_SCRIPT.md',
      description: 'Script untuk 6-part video series (30-40 menit total) dengan panduan produksi dan konten bilingual',
      category: 'admin-training',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },
    {
      id: 'training-completion-tracker',
      title: 'Training Completion Tracker',
      url: '/docs/USER_DOCUMENTATION/TENANTS/TRAINING_COMPLETION_TRACKER.md',
      description: 'Sistem tracking progress pelatihan dan sertifikasi admin',
      category: 'admin-training',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },

    // Developer Documentation - Technical implementation guides
    {
      id: 'order-status-workflow-components',
      title: 'Order Status Workflow Components',
      url: '/docs/DEVELOPMENT/ORDER_STATUS_WORKFLOW_COMPONENTS.md',
      description: 'Dokumentasi teknis komponen workflow: ActionableStageModal, WhatsNextGuidanceSystem, StatusActionPanel',
      category: 'developer',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },
    {
      id: 'order-status-api-integration',
      title: 'Order Status API Integration',
      url: '/docs/DEVELOPMENT/ORDER_STATUS_API_INTEGRATION.md',
      description: 'Panduan integrasi API untuk status transitions, timeline events, dan real-time updates',
      category: 'api',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },
    {
      id: 'order-status-testing-guide',
      title: 'Order Status Testing Guide',
      url: '/docs/DEVELOPMENT/ORDER_STATUS_TESTING_GUIDE.md',
      description: 'Panduan testing untuk workflow components, integration tests, dan user acceptance testing',
      category: 'developer',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },
    {
      id: 'order-status-troubleshooting',
      title: 'Order Status Troubleshooting',
      url: '/docs/DEVELOPMENT/ORDER_STATUS_TROUBLESHOOTING.md',
      description: 'Panduan troubleshooting untuk common issues, error handling, dan performance optimization',
      category: 'troubleshooting',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },

    // API Documentation
    {
      id: 'order-status-api-endpoints',
      title: 'Order Status API Endpoints',
      url: '/docs/DEVELOPMENT/ORDER_STATUS_NEW_API_ENDPOINTS.md',
      description: 'Dokumentasi endpoint API baru untuk enhanced order status management',
      category: 'api',
      type: 'internal',
      lastUpdated: '2026-01-30'
    },
    {
      id: 'order-status-api-summary',
      title: 'Order Status API Summary',
      url: '/docs/DEVELOPMENT/ORDER_STATUS_API_SUMMARY.md',
      description: 'Ringkasan lengkap API changes dan integration points',
      category: 'api',
      type: 'internal',
      lastUpdated: '2026-01-30'
    }
  ],

  keyboardShortcuts: [
    // Global shortcuts
    {
      id: 'help-toggle',
      keys: 'F1',
      description: 'Toggle contextual help system',
      context: 'global',
      action: 'toggleHelp'
    },
    {
      id: 'search-help',
      keys: 'Ctrl+Shift+H',
      description: 'Search help documentation',
      context: 'global',
      action: 'searchHelp'
    },

    // Order detail page shortcuts
    {
      id: 'add-note',
      keys: 'Alt+N',
      description: 'Add note to current stage',
      context: 'order-detail',
      action: 'addNote'
    },
    {
      id: 'view-timeline',
      keys: 'Alt+T',
      description: 'Switch to timeline tab',
      context: 'order-detail',
      action: 'viewTimeline'
    },
    {
      id: 'advance-stage',
      keys: 'Alt+A',
      description: 'Advance to next stage',
      context: 'order-detail',
      action: 'advanceStage'
    },
    {
      id: 'complete-stage',
      keys: 'Alt+C',
      description: 'Complete current stage',
      context: 'order-detail',
      action: 'completeStage'
    },

    // Timeline shortcuts
    {
      id: 'timeline-next',
      keys: 'ArrowRight',
      description: 'Navigate to next stage',
      context: 'timeline',
      action: 'nextStage'
    },
    {
      id: 'timeline-prev',
      keys: 'ArrowLeft',
      description: 'Navigate to previous stage',
      context: 'timeline',
      action: 'prevStage'
    },
    {
      id: 'timeline-select',
      keys: 'Enter',
      description: 'Open selected stage modal',
      context: 'timeline',
      action: 'selectStage'
    },

    // Modal shortcuts
    {
      id: 'modal-close',
      keys: 'Escape',
      description: 'Close modal',
      context: 'modal',
      action: 'closeModal'
    },
    {
      id: 'modal-confirm',
      keys: 'Ctrl+Enter',
      description: 'Confirm modal action',
      context: 'modal',
      action: 'confirmAction'
    }
  ],

  contextualHelp: {
    enableTooltips: true,
    enableGuidanceSystem: true,
    enableKeyboardShortcuts: true,
    defaultHelpLevel: 'detailed',
    autoShowHelp: false
  },

  supportContacts: [
    {
      id: 'technical-support',
      type: 'technical',
      name: 'Technical Support',
      email: 'support@canvastencil.com',
      phone: '+62-xxx-xxx-xxxx',
      hours: '24/7',
      description: 'System issues, bugs, dan technical troubleshooting'
    },
    {
      id: 'business-consultation',
      type: 'business',
      name: 'Business Consultation',
      email: 'business@canvastencil.com',
      hours: 'Mon-Fri 9AM-6PM WIB',
      description: 'Workflow optimization, business process consultation'
    },
    {
      id: 'training-support',
      type: 'training',
      name: 'Training Support',
      email: 'training@canvastencil.com',
      hours: 'Mon-Fri 9AM-5PM WIB',
      description: 'Admin training, certification program, learning materials'
    },
    {
      id: 'emergency-support',
      type: 'emergency',
      name: 'Emergency Support',
      phone: '+62-xxx-xxx-xxxx',
      hours: '24/7',
      description: 'Critical system issues, urgent order problems'
    }
  ],

  trainingResources: [
    {
      id: 'enhanced-workflow-basics',
      title: 'Enhanced Order Workflow Basics',
      type: 'video',
      url: '/training/videos/enhanced-workflow-basics',
      duration: '15 minutes',
      level: 'beginner',
      description: 'Introduction to the enhanced order status workflow system'
    },
    {
      id: 'interactive-timeline-mastery',
      title: 'Interactive Timeline Mastery',
      type: 'interactive',
      url: '/training/interactive/timeline-mastery',
      duration: '20 minutes',
      level: 'intermediate',
      description: 'Hands-on training for using the interactive timeline effectively'
    },
    {
      id: 'actionable-modals-guide',
      title: 'Actionable Modals Guide',
      type: 'guide',
      url: '/training/guides/actionable-modals',
      level: 'intermediate',
      description: 'Complete guide to using actionable stage modals for efficient workflow management'
    },
    {
      id: 'admin-certification-program',
      title: 'Admin Certification Program',
      type: 'certification',
      url: '/training/certification/admin-program',
      duration: '2-4 hours',
      level: 'advanced',
      description: 'Comprehensive certification program with Bronze, Silver, and Gold levels',
      prerequisites: ['enhanced-workflow-basics', 'interactive-timeline-mastery']
    },
    {
      id: 'mobile-workflow-optimization',
      title: 'Mobile Workflow Optimization',
      type: 'video',
      url: '/training/videos/mobile-optimization',
      duration: '10 minutes',
      level: 'intermediate',
      description: 'Best practices for using the enhanced workflow on mobile devices'
    },
    {
      id: 'accessibility-features-guide',
      title: 'Accessibility Features Guide',
      type: 'guide',
      url: '/training/guides/accessibility-features',
      level: 'beginner',
      description: 'Guide to accessibility features including keyboard navigation and screen reader support'
    }
  ]
};

/**
 * Helper functions for help system
 */
export const helpSystemHelpers = {
  /**
   * Get documentation links by category
   */
  getDocumentationByCategory: (category: DocumentationLink['category']) => {
    return helpSystemConfig.documentationLinks.filter(link => link.category === category);
  },

  /**
   * Get featured documentation links
   */
  getFeaturedDocumentation: () => {
    return helpSystemConfig.documentationLinks.filter(link => link.featured);
  },

  /**
   * Get keyboard shortcuts by context
   */
  getShortcutsByContext: (context: KeyboardShortcut['context']) => {
    return helpSystemConfig.keyboardShortcuts.filter(shortcut => shortcut.context === context);
  },

  /**
   * Get training resources by level
   */
  getTrainingByLevel: (level: TrainingResource['level']) => {
    return helpSystemConfig.trainingResources.filter(resource => resource.level === level);
  },

  /**
   * Get support contact by type
   */
  getSupportContact: (type: SupportContact['type']) => {
    return helpSystemConfig.supportContacts.find(contact => contact.type === type);
  },

  /**
   * Check if help feature is enabled
   */
  isHelpFeatureEnabled: (feature: keyof ContextualHelpConfig) => {
    return helpSystemConfig.contextualHelp[feature];
  }
};

export default helpSystemConfig;