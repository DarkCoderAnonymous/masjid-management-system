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

export interface Expense {
  _id: string;
  name: string;
  amount: number;
  description?: string;
  date: string;
  recordedBy?: { name: string };
  createdAt?: string;
}

export interface MonthlyStats {
  total: number;
  count: number;
  month: string;
  year: number;
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

export type ExpenseFilter = 'all' | '1month' | '2months' | '3months' | '6months' | 'yearly';

export const EXPENSE_FILTER_OPTIONS: { value: ExpenseFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '1month', label: 'This Month' },
  { value: '2months', label: 'Last 2 Months' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'yearly', label: 'This Year' },
];
