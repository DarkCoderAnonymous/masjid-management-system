'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { User, Pagination } from '@/types';
import Modal from '@/components/Modal';
import UserForm from '@/components/UserForm';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async (page = 1, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (q) params.append('search', q);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, search);
  };

  const openCreate = () => { setEditingUser(null); setModalOpen(true); };
  const openEdit = (user: User) => { setEditingUser(user); setModalOpen(true); };

  const handleSave = async (data: { name: string; mobile: string }) => {
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, data);
        toast.success('Member updated successfully.');
      } else {
        await api.post('/users', data);
        toast.success('Member added successfully.');
      }
      setModalOpen(false);
      fetchUsers(pagination.page);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('Member and all donations deleted.');
      setDeleteTarget(null);
      fetchUsers(pagination.page);
    } catch {
      toast.error('Failed to delete member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} registered members</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
          {search && (
            <button type="button" className="btn-secondary" onClick={() => { setSearch(''); fetchUsers(1, ''); }}>
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
                <th className="table-header">Mobile</th>
                <th className="table-header">Joined</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      Loading members...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    No members found. Add one to get started.
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell text-gray-400">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="table-cell">{user.mobile}</td>
                    <td className="table-cell text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/admin/users/${user._id}/donations`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-700
                                     bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          title="View Donations"
                        >
                          <BanknotesIcon className="w-3.5 h-3.5" />
                          Donations
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
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
                onClick={() => fetchUsers(pagination.page - 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchUsers(pagination.page + 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit Member' : 'Add New Member'}
      >
        <UserForm
          initialData={editingUser}
          onSubmit={handleSave}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editingUser}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Member">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete member <strong>{deleteTarget?.name}</strong>?
            This will also delete all their donation records. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete Member</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
