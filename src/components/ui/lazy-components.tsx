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

// Skeleton
export const Skeleton = withLazyLoading(
  React.lazy(() => import('./skeleton').then(mod => ({ default: mod.Skeleton })))
);