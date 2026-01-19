import type { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

export * from './components/cms';

export * from './services/cms';

export * from './types/cms';

export * from './hooks/cms';

export * from './stores/cms';

const ContentTypeList = lazy(() => import('./pages/admin/cms/ContentTypeList'));
const ContentTypeForm = lazy(() => import('./pages/admin/cms/ContentTypeForm'));
const ContentList = lazy(() => import('./pages/admin/cms/ContentList'));
const ContentForm = lazy(() => import('./pages/admin/cms/ContentForm'));
const CategoryManagement = lazy(() => import('./pages/admin/cms/CategoryManagement'));
const CommentModeration = lazy(() => import('./pages/admin/cms/CommentModeration'));
const ContentRevisionList = lazy(() => import('./pages/admin/cms/ContentRevisionList'));

const ContentDetail = lazy(() => import('./pages/public/cms/ContentDetail'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

export const AdminRoutes: RouteObject[] = [
  {
    path: 'content-types',
    element: <Suspense fallback={<LoadingFallback />}><ContentTypeList /></Suspense>,
  },
  {
    path: 'content-types/new',
    element: <Suspense fallback={<LoadingFallback />}><ContentTypeForm /></Suspense>,
  },
  {
    path: 'content-types/:uuid/edit',
    element: <Suspense fallback={<LoadingFallback />}><ContentTypeForm /></Suspense>,
  },
  {
    path: 'contents',
    element: <Suspense fallback={<LoadingFallback />}><ContentList /></Suspense>,
  },
  {
    path: 'contents/create',
    element: <Suspense fallback={<LoadingFallback />}><ContentForm /></Suspense>,
  },
  {
    path: 'contents/:uuid/edit',
    element: <Suspense fallback={<LoadingFallback />}><ContentForm /></Suspense>,
  },
  {
    path: 'categories',
    element: <Suspense fallback={<LoadingFallback />}><CategoryManagement /></Suspense>,
  },
  {
    path: 'comments',
    element: <Suspense fallback={<LoadingFallback />}><CommentModeration /></Suspense>,
  },
  {
    path: 'contents/:contentUuid/revisions',
    element: <Suspense fallback={<LoadingFallback />}><ContentRevisionList /></Suspense>,
  },
];

export const PublicRoutes: RouteObject[] = [
  {
    path: 'contents/:slug',
    element: <Suspense fallback={<LoadingFallback />}><ContentDetail /></Suspense>,
  },
];

export const MenuItems = [
  {
    id: 'cms',
    label: 'CMS',
    icon: 'file-text',
    children: [
      {
        id: 'cms-content-types',
        label: 'Content Types',
        path: '/admin/cms/content-types',
        permission: 'pages:content-types:view',
      },
      {
        id: 'cms-contents',
        label: 'Contents',
        path: '/admin/cms/contents',
        permission: 'pages:contents:view',
      },
      {
        id: 'cms-categories',
        label: 'Categories',
        path: '/admin/cms/categories',
        permission: 'pages:categories:view',
      },
      {
        id: 'cms-comments',
        label: 'Comments',
        path: '/admin/cms/comments',
        permission: 'pages:comments:view',
      },
    ],
  },
];

export const PLUGIN_METADATA = {
  name: 'pages-engine',
  version: '1.0.0',
  displayName: 'CanvaStencil Pages Engine',
  description: 'WordPress-like CMS Pages System untuk blog, news, events, dan custom content types',
};
