import { LocationData } from './common';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleId?: string;
  status: UserStatus;
  department?: string;
  location?: LocationData;
  avatar?: string;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string;
  group?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem?: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  roleId: string;
  department?: string;
  location?: LocationData;
  status?: UserStatus;
}

export interface RoleFormData {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

export interface UserFilters {
  role?: string;
  status?: UserStatus;
  department?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuthUser extends User {
  token?: string;
  refreshToken?: string;
  tenantId?: string;
  tenants?: string[];
  abilities?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  phone?: string;
}
