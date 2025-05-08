// /lib/index.ts

export type UserRole = 'admin' | 'viewer' | 'client';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  clientId?: string;
  createdAt?: string;
}

export interface Client {
  _id: string;
  name: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  clientId?: string;
}