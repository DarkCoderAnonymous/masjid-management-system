'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/count')
      .then((res) => setUserCount(res.data.total))
      .catch(() => setUserCount(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Admin Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users Card */}
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

        {/* Info Card */}
        <div className="card flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Feature</p>
            <p className="font-semibold text-gray-900">Donation Tracking</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Guide</h2>
        <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
          <li>Navigate to <strong>Members</strong> to add, edit, or delete registered members.</li>
          <li>Click <strong>View Donations</strong> on any member to record and manage their donations.</li>
          <li>Use filters to view donations by period: monthly, quarterly, semi-annual, or yearly.</li>
          <li>Download a PDF statement for any member with a single click.</li>
        </ul>
      </div>
    </div>
  );
}
