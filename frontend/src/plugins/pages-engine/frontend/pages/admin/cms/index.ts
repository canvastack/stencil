export { default as ContentTypeList } from './ContentTypeList';
export { default as ContentTypeForm } from './ContentTypeForm';
export { default as ContentList } from './ContentList';
export { default as ContentForm } from './ContentForm';
export { default as CategoryManagement } from './CategoryManagement';
export { default as CommentModeration } from './CommentModeration';
export { default as ContentRevisionList } from './ContentRevisionList';

export const CMS_ADMIN_ROUTES = [
  {
    path: '/admin/cms/content-types',
    component: 'ContentTypeList',
    requiresPermission: 'pages:content-types:view',
  },
  {
    path: '/admin/cms/content-types/new',
    component: 'ContentTypeForm',
    requiresPermission: 'pages:content-types:create',
  },
  {
    path: '/admin/cms/content-types/:uuid',
    component: 'ContentTypeForm',
    requiresPermission: 'pages:content-types:update',
  },
  {
    path: '/admin/cms/contents',
    component: 'ContentList',
    requiresPermission: 'pages:contents:view',
  },
  {
    path: '/admin/cms/contents/new',
    component: 'ContentForm',
    requiresPermission: 'pages:contents:create',
  },
  {
    path: '/admin/cms/contents/:uuid',
    component: 'ContentForm',
    requiresPermission: 'pages:contents:update',
  },
  {
    path: '/admin/cms/categories',
    component: 'CategoryManagement',
    requiresPermission: 'pages:categories:view',
  },
  {
    path: '/admin/cms/comments',
    component: 'CommentModeration',
    requiresPermission: 'pages:comments:view',
  },
];
