import React, { lazy } from 'react';
import { withSuspense } from '@/components/withSuspense';

// Dynamically import components using React.lazy (Vite/CRA compatible)
const DynamicCard = lazy(() => import('./card').then(mod => ({ default: mod.Card })));
const DynamicButton = lazy(() => import('./button').then(mod => ({ default: mod.Button })));
const DynamicInput = lazy(() => import('./input').then(mod => ({ default: mod.Input })));
const DynamicLabel = lazy(() => import('./label').then(mod => ({ default: mod.Label })));
const DynamicBadge = lazy(() => import('./badge').then(mod => ({ default: mod.Badge })));
const DynamicDataTable = lazy(() => import('./data-table').then(mod => ({ default: mod.DataTable })));
const DynamicDialog = lazy(() => import('./dialog').then(mod => ({ default: mod.Dialog })));
const DynamicDialogContent = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogContent })));
const DynamicDialogHeader = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogHeader })));
const DynamicDialogTitle = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogTitle })));
const DynamicDialogFooter = lazy(() => import('./dialog').then(mod => ({ default: mod.DialogFooter })));

// Wrap with suspense and export
export const Card = withSuspense(DynamicCard);
export const Button = withSuspense(DynamicButton);
export const Input = withSuspense(DynamicInput);
export const Label = withSuspense(DynamicLabel);
export const Badge = withSuspense(DynamicBadge);
export const DataTable = withSuspense(DynamicDataTable);
export const Dialog = withSuspense(DynamicDialog);
export const DialogContent = withSuspense(DynamicDialogContent);
export const DialogHeader = withSuspense(DynamicDialogHeader);
export const DialogTitle = withSuspense(DynamicDialogTitle);
export const DialogFooter = withSuspense(DynamicDialogFooter);