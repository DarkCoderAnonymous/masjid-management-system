'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { MonthlyStats } from '@/types';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function buildYears() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current; y >= current - 5; y--) years.push(y);
  return years;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-based
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [userCount, setUserCount] = useState<number | null>(null);
  const [donationStats, setDonationStats] = useState<MonthlyStats | null>(null);
  const [expenseStats, setExpenseStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch member count once
  useEffect(() => {
    api.get('/users/count').then((res) => setUserCount(res.data.total)).catch(() => setUserCount(null))
      .finally(() => setLoading(false));
  }, []);

  // Fetch stats whenever month/year changes
  const fetchStats = useCallback(async (month: number, year: number) => {
    setStatsLoading(true);
    await Promise.all([
      api.get(`/donations/stats/monthly?month=${month}&year=${year}`)
        .then((res) => setDonationStats(res.data.data)).catch(() => setDonationStats(null)),
      api.get(`/expenses/stats/monthly?month=${month}&year=${year}`)
        .then((res) => setExpenseStats(res.data.data)).catch(() => setExpenseStats(null)),
    ]);
    setStatsLoading(false);
  }, []);

  useEffect(() => { fetchStats(selectedMonth, selectedYear); }, [selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

  const selectedLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin Dashboard</p>
        </div>
        {/* Month / Year Picker */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="input-field py-1.5 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="input-field py-1.5 text-sm w-24"
          >
            {buildYears().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Total Members Card */}
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Members</p>
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-3xl font-bold text-primary-700">{userCount ?? '—'}</p>
            )}
          </div>
        </div>

        {/* Monthly Donations Card */}
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💰</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 truncate">Donations — {selectedLabel}</p>
            {statsLoading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-green-700">{donationStats ? formatCurrency(donationStats.total) : '—'}</p>
                <p className="text-xs text-gray-400">{donationStats?.count ?? 0} records</p>
              </>
            )}
          </div>
        </div>

        {/* Monthly Expenses Card */}
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💸</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 truncate">Expenses — {selectedLabel}</p>
            {statsLoading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold text-red-700">{expenseStats ? formatCurrency(expenseStats.total) : '—'}</p>
                <p className="text-xs text-gray-400">{expenseStats?.count ?? 0} records</p>
              </>
            )}
          </div>
        </div>

        {/* In Hand Card */}
        <div className={`card flex items-center gap-4 ${
          !statsLoading && donationStats !== null && expenseStats !== null
            ? (donationStats.total - expenseStats.total) >= 0 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'
            : ''
        }`}>
          <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏦</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-500 truncate">In Hand — {selectedLabel}</p>
            {statsLoading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (() => {
              const inHand = (donationStats?.total ?? 0) - (expenseStats?.total ?? 0);
              return (
                <>
                  <p className={`text-2xl font-bold ${inHand >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(inHand)}
                  </p>
                  <p className="text-xs text-gray-400">Donations − Expenses</p>
                </>
              );
            })()}
          </div>
        </div>

        {/* Quick Link — Manage Users */}
        <a href="/dashboard/admin/users" className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quick Access</p>
            <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Manage Members</p>
          </div>
        </a>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Guide</h2>
        <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
          <li>Navigate to <strong>Members</strong> to add, edit, or delete registered members.</li>
          <li>Click <strong>View Donations</strong> on any member to record and manage their donations.</li>
          <li>Use <strong>Expenses</strong> in the sidebar to record and track masjid expenses.</li>
          <li>Use filters to view donations by period: monthly, quarterly, semi-annual, or yearly.</li>
          <li>Download a PDF statement for any member with a single click.</li>
        </ul>
      </div>
    </div>
  );
}

