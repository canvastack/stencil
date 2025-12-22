import React from 'react';
import { withLazyLoading } from '@/components/withLazyLoading';

// Card
export const Card = withLazyLoading(
  React.lazy(() => import('./card').then(mod => ({ default: mod.Card })))
);
export const CardHeader = withLazyLoading(
  React.lazy(() => import('./card').then(mod => ({ default: mod.CardHeader })))
);
export const CardTitle = withLazyLoading(
  React.lazy(() => import('./card').then(mod => ({ default: mod.CardTitle })))
);
export const CardDescription = withLazyLoading(
  React.lazy(() => import('./card').then(mod => ({ default: mod.CardDescription })))
);
export const CardContent = withLazyLoading(
  React.lazy(() => import('./card').then(mod => ({ default: mod.CardContent })))
);
export const CardFooter = withLazyLoading(
  React.lazy(() => import('./card').then(mod => ({ default: mod.CardFooter })))
);

// Button
export const Button = withLazyLoading(
  React.lazy(() => import('./button').then(mod => ({ default: mod.Button })))
);

// Input
export const Input = withLazyLoading(
  React.lazy(() => import('./input').then(mod => ({ default: mod.Input })))
);

// Dialog - keep synchronous to avoid accessibility flash (Title/Description must be present)
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from './dialog';

// AlertDialog - keep synchronous to avoid accessibility flash and module loading issues
export { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogTrigger, 
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogOverlay,
  AlertDialogPortal
} from './alert-dialog';

// Select
export const Select = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.Select })))
);
export const SelectGroup = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectGroup })))
);
export const SelectValue = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectValue })))
);
export const SelectTrigger = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectTrigger })))
);
export const SelectContent = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectContent })))
);
export const SelectLabel = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectLabel })))
);
export const SelectItem = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectItem })))
);
export const SelectSeparator = withLazyLoading(
  React.lazy(() => import('./select').then(mod => ({ default: mod.SelectSeparator })))
);

// Label
export const Label = withLazyLoading(
  React.lazy(() => import('./label').then(mod => ({ default: mod.Label })))
);

// Badge
export const Badge = withLazyLoading(
  React.lazy(() => import('./badge').then(mod => ({ default: mod.Badge })))
);

// DataTable
export const DataTable = withLazyLoading(
  React.lazy(() => import('./data-table').then(mod => ({ default: mod.DataTable })))
);

// Tabs
export const Tabs = withLazyLoading(
  React.lazy(() => import('./tabs').then(mod => ({ default: mod.Tabs })))
);
export const TabsList = withLazyLoading(
  React.lazy(() => import('./tabs').then(mod => ({ default: mod.TabsList })))
);
export const TabsTrigger = withLazyLoading(
  React.lazy(() => import('./tabs').then(mod => ({ default: mod.TabsTrigger })))
);
export const TabsContent = withLazyLoading(
  React.lazy(() => import('./tabs').then(mod => ({ default: mod.TabsContent })))
);

// Textarea
export const Textarea = withLazyLoading(
  React.lazy(() => import('./textarea').then(mod => ({ default: mod.Textarea })))
);

// DropdownMenu
export const DropdownMenu = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenu })))
);
export const DropdownMenuTrigger = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuTrigger })))
);
export const DropdownMenuContent = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuContent })))
);
export const DropdownMenuItem = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuItem })))
);
export const DropdownMenuCheckboxItem = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuCheckboxItem })))
);
export const DropdownMenuRadioItem = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuRadioItem })))
);
export const DropdownMenuLabel = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuLabel })))
);
export const DropdownMenuSeparator = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuSeparator })))
);
export const DropdownMenuShortcut = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuShortcut })))
);
export const DropdownMenuGroup = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuGroup })))
);
export const DropdownMenuPortal = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuPortal })))
);
export const DropdownMenuSub = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuSub })))
);
export const DropdownMenuSubContent = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuSubContent })))
);
export const DropdownMenuSubTrigger = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuSubTrigger })))
);
export const DropdownMenuRadioGroup = withLazyLoading(
  React.lazy(() => import('./dropdown-menu').then(mod => ({ default: mod.DropdownMenuRadioGroup })))
);

// Separator
export const Separator = withLazyLoading(
  React.lazy(() => import('./separator').then(mod => ({ default: mod.Separator })))
);

// Skeleton - exported as static to avoid duplicate import (needed synchronously in fallbacks)
export { Skeleton } from './skeleton';