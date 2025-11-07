import React, { lazy } from 'react';
import { withLazyLoading } from '@/components/withLazyLoading';

// Use React.lazy + withLazyLoading (Suspense + ErrorBoundary) for Vite compatibility
const LazyCard = lazy(() => import('./card').then(mod => ({ default: mod.Card })));
const LazyDialog = lazy(() => import('./dialog').then(mod => ({ default: mod.Dialog })));
const LazyDialogContent = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogContent })));
const LazyDialogHeader = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogHeader })));
const LazyDialogTitle = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogTitle })));
const LazyDialogFooter = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogFooter })));
const LazyButton = lazy(() => import('./button').then(mod => ({ default: mod.Button })));
const LazyInput = lazy(() => import('./input').then(mod => ({ default: mod.Input })));
const LazyLabel = lazy(() => import('./label').then(mod => ({ default: mod.Label })));
const LazyBadge = lazy(() => import('./badge').then(mod => ({ default: mod.Badge })));
const LazySelect = lazy(() => import('./select').then(mod => ({ default: mod.Select })));
const LazySelectContent = lazy(() => import('./select').then(mod => ({ default: mod.SelectContent })));
const LazySelectItem = lazy(() => import('./select').then(mod => ({ default: mod.SelectItem })));
const LazySelectTrigger = lazy(() => import('./select').then(mod => ({ default: mod.SelectTrigger })));
const LazySelectValue = lazy(() => import('./select').then(mod => ({ default: mod.SelectValue })));
const LazyDataTable = lazy(() => import('./data-table').then(mod => ({ default: mod.DataTable })));

export const Card = withLazyLoading(LazyCard as any);
export const Dialog = withLazyLoading(LazyDialog as any);
export const DialogContent = withLazyLoading(LazyDialogContent as any);
export const DialogHeader = withLazyLoading(LazyDialogHeader as any);
export const DialogTitle = withLazyLoading(LazyDialogTitle as any);
export const DialogFooter = withLazyLoading(LazyDialogFooter as any);
export const Button = withLazyLoading(LazyButton as any);
export const Input = withLazyLoading(LazyInput as any);
export const Label = withLazyLoading(LazyLabel as any);
export const Badge = withLazyLoading(LazyBadge as any);
export const Select = withLazyLoading(LazySelect as any);
export const SelectContent = withLazyLoading(LazySelectContent as any);
export const SelectItem = withLazyLoading(LazySelectItem as any);
export const SelectTrigger = withLazyLoading(LazySelectTrigger as any);
export const SelectValue = withLazyLoading(LazySelectValue as any);
export const DataTable = withLazyLoading(LazyDataTable as any);