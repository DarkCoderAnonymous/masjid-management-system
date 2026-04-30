'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/count')
      .then((res) => setTotalUsers(res.data.total))
      .catch(() => setTotalUsers(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">As-salamu alaykum, {user?.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome to the Masjid Management System</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">Total Registered Members</p>
          {loading ? (
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
          ) : (
            <p className="text-4xl font-bold text-primary-700">{totalUsers ?? '—'}</p>
          )}
        </div>

        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🕌</span>
          </div>
          <p className="text-sm text-gray-500 mb-2">Your Role</p>
          <span className="badge bg-primary-100 text-primary-800 text-sm px-3 py-1">Member</span>
        </div>
      </div>

      <div className="card max-w-xl">
        <p className="text-sm text-gray-600">
          You are logged in as a <strong>member</strong>. For donation inquiries or to update your information,
          please contact an admin.
        </p>
      </div>
    </div>
  );
}
