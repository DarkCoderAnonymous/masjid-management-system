export interface User {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: 'super_admin' | 'admin' | 'user';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Donation {
  _id: string;
  userId: string;
  amount: number;
  date: string;
  notes?: string;
  recordedBy?: { name: string };
  createdAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type DonationFilter = 'all' | 'monthly' | '3months' | '6months' | 'yearly';

export const FILTER_OPTIONS: { value: DonationFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'monthly', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'yearly', label: 'This Year' },
];
