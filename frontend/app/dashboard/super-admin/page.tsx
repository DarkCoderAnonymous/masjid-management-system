'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { User, Pagination, MonthlyStats } from '@/types';
import Modal from '@/components/Modal';
import AdminForm from '@/components/AdminForm';

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

export default function SuperAdminPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [donationStats, setDonationStats] = useState<MonthlyStats | null>(null);
  const [expenseStats, setExpenseStats] = useState<MonthlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchAdmins = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (q) params.append('search', q);
      const res = await api.get(`/admins?${params}`);
      setAdmins(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load admins.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchAdmins(); }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdmins(1, search);
  };

  const openCreate = () => { setEditingAdmin(null); setModalOpen(true); };
  const openEdit = (admin: User) => { setEditingAdmin(admin); setModalOpen(true); };

  const handleSave = async (data: Partial<User> & { password?: string }) => {
    try {
      if (editingAdmin) {
        await api.put(`/admins/${editingAdmin.id}`, data);
        toast.success('Admin updated successfully.');
      } else {
        await api.post('/admins', data);
        toast.success('Admin created successfully.');
      }
      setModalOpen(false);
      fetchAdmins(pagination.page);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admins/${deleteTarget.id}`);
      toast.success('Admin deleted.');
      setDeleteTarget(null);
      fetchAdmins(pagination.page);
    } catch {
      toast.error('Failed to delete admin.');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

  const selectedLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage system administrators</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month / Year Picker */}
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
          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            <PlusIcon className="w-4 h-4" /> Add Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-700">{pagination.total}</p>
          <p className="text-sm text-gray-500 mt-1">Total Admins</p>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💰</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">
              Donations — {selectedLabel}
            </p>
            {statsLoading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <>
                <p className="text-xl font-bold text-green-700">
                  {donationStats ? formatCurrency(donationStats.total) : '—'}
                </p>
                <p className="text-xs text-gray-400">{donationStats?.count ?? 0} records</p>
              </>
            )}
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💸</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">
              Expenses — {selectedLabel}
            </p>
            {statsLoading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <>
                <p className="text-xl font-bold text-red-700">
                  {expenseStats ? formatCurrency(expenseStats.total) : '—'}
                </p>
                <p className="text-xs text-gray-400">{expenseStats?.count ?? 0} records</p>
              </>
            )}
          </div>
        </div>
        <div className={`card flex items-center gap-4 ${
          !statsLoading && donationStats !== null && expenseStats !== null
            ? (donationStats.total - expenseStats.total) >= 0 ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-500'
            : ''
        }`}>
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🏦</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">
              In Hand — {selectedLabel}
            </p>
            {statsLoading ? (
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (() => {
              const inHand = (donationStats?.total ?? 0) - (expenseStats?.total ?? 0);
              return (
                <>
                  <p className={`text-xl font-bold ${inHand >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(inHand)}
                  </p>
                  <p className="text-xs text-gray-400">Donations − Expenses</p>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {search && (
            <button type="button" className="btn-secondary" onClick={() => { setSearch(''); fetchAdmins(1, ''); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Mobile</th>
                <th className="table-header">Created</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No admins found. Create one to get started.
                  </td>
                </tr>
              ) : (
                admins.map((admin, idx) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="table-cell font-medium text-gray-900">{admin.name}</td>
                    <td className="table-cell">{admin.email}</td>
                    <td className="table-cell">{admin.mobile || '—'}</td>
                    <td className="table-cell text-gray-500">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(admin)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => fetchAdmins(pagination.page - 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchAdmins(pagination.page + 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAdmin ? 'Edit Admin' : 'Create New Admin'}
      >
        <AdminForm
          initialData={editingAdmin}
          onSubmit={handleSave}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editingAdmin}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Admin">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete admin <strong>{deleteTarget?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete Admin</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
