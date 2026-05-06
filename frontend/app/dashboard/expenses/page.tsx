'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Expense, ExpenseFilter, EXPENSE_FILTER_OPTIONS, Pagination } from '@/types';
import Modal from '@/components/Modal';
import ExpenseForm from '@/components/ExpenseForm';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ExpenseFilter>('1month');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const fetchExpenses = useCallback(async (page = 1, currentFilter = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (currentFilter !== 'all') params.append('filter', currentFilter);
      const res = await api.get(`/expenses?${params}`);
      setExpenses(res.data.data);
      setTotalAmount(res.data.totalAmount || 0);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchExpenses(1, filter);
  }, [filter]);

  const openCreate = () => { setEditingExpense(null); setModalOpen(true); };
  const openEdit = (expense: Expense) => { setEditingExpense(expense); setModalOpen(true); };

  const handleSave = async (data: Partial<Expense>) => {
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense._id}`, data);
        toast.success('Expense updated successfully.');
      } else {
        await api.post('/expenses', data);
        toast.success('Expense added successfully.');
      }
      setModalOpen(false);
      fetchExpenses(pagination.page);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/expenses/${deleteTarget._id}`);
      toast.success('Expense deleted.');
      setDeleteTarget(null);
      fetchExpenses(pagination.page);
    } catch {
      toast.error('Failed to delete expense.');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage masjid expenses</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <PlusIcon className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Filter + Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {EXPENSE_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filter === opt.value
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total card */}
      <div className="card bg-red-50 border border-red-100 flex items-center gap-4 py-4">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl">💸</span>
        </div>
        <div>
          <p className="text-sm text-red-600">Total Expenses ({EXPENSE_FILTER_OPTIONS.find(o => o.value === filter)?.label})</p>
          {loading ? (
            <div className="h-7 w-28 bg-red-200 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-red-700">{formatCurrency(totalAmount)}</p>
          )}
        </div>
      </div>

      {/* Expense Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-gray-500 font-medium">No expenses found for this period.</p>
            <button onClick={openCreate} className="btn-primary mt-4 text-sm">Add First Expense</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Recorded By</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{expense.name}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(expense.date)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {expense.description || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {expense.recordedBy?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-1.5 text-gray-400 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchExpenses(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              <button
                onClick={() => fetchExpenses(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
      >
        <ExpenseForm
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          initialData={editingExpense}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget ? formatCurrency(deleteTarget.amount) : ''})? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="btn-danger flex-1">Delete</button>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
