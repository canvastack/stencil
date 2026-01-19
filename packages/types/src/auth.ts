export interface User {
  uuid: string;
  name: string;
  email: string;
  account_type: 'platform' | 'tenant';
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  token: string;
  type: string;
  expires_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  token: AuthToken;
  tenant?: {
    uuid: string;
    name: string;
    subdomain: string;
  };
}

export interface Permission {
  uuid: string;
  name: string;
  display_name: string;
  description?: string;
}

export interface Role {
  uuid: string;
  name: string;
  display_name: string;
  permissions: Permission[];
}
