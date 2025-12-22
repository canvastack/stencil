import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import type { Product } from '@/types/product';

export interface ProductKeyboardShortcutsConfig {
  products: Product[];
  canAccessCreate: boolean;
  canAccessDelete: boolean;
  selectedProductsSize: number;
  onFocusSearch: () => void;
  onNavigateToNew: () => void;
  onRefresh: () => void;
  onClearFilters: () => void;
  onToggleSelection: () => void;
  onOpenExportDialog: () => void;
  onOpenImportDialog: () => void;
  onSelectAll: () => void;
  onBulkCompare: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onToggleKeyboardHelp: () => void;
}

export function getProductKeyboardShortcuts(config: ProductKeyboardShortcutsConfig): KeyboardShortcut[] {
  const {
    products,
    canAccessCreate,
    canAccessDelete,
    selectedProductsSize,
    onFocusSearch,
    onNavigateToNew,
    onRefresh,
    onClearFilters,
    onToggleSelection,
    onOpenExportDialog,
    onOpenImportDialog,
    onSelectAll,
    onBulkCompare,
    onBulkDelete,
    onClearSelection,
    onToggleKeyboardHelp,
  } = config;

  return [
    {
      key: 'k',
      shiftKey: true,
      description: 'Focus search',
      callback: onFocusSearch,
    },
    {
      key: 'n',
      shiftKey: true,
      description: 'New product',
      callback: onNavigateToNew,
    },
    {
      key: 'r',
      shiftKey: true,
      description: 'Refresh products',
      callback: onRefresh,
    },
    {
      key: 'c',
      shiftKey: true,
      description: 'Clear filters',
      callback: onClearFilters,
    },
    {
      key: 's',
      shiftKey: true,
      description: 'Toggle selection mode',
      callback: onToggleSelection,
    },
    {
      key: 'e',
      shiftKey: true,
      description: 'Export products',
      callback: onOpenExportDialog,
    },
    {
      key: 'i',
      shiftKey: true,
      description: 'Import products',
      callback: onOpenImportDialog,
    },
    {
      key: 'a',
      shiftKey: true,
      description: 'Select all products',
      callback: onSelectAll,
    },
    {
      key: 'p',
      shiftKey: true,
      description: 'Compare selected products',
      callback: onBulkCompare,
    },
    {
      key: 'd',
      shiftKey: true,
      description: 'Delete selected products',
      callback: onBulkDelete,
    },
    {
      key: 'Escape',
      description: 'Clear selection',
      callback: onClearSelection,
      preventDefault: false,
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      callback: onToggleKeyboardHelp,
      preventDefault: true,
    },
  ];
}
