'use client';

import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Donation, Pagination } from '@/types';

interface DonationListProps {
  donations: Donation[];
  loading: boolean;
  pagination: Pagination;
  onEdit: (donation: Donation) => void;
  onDelete: (donation: Donation) => void;
  onPageChange: (page: number) => void;
}

export default function DonationList({
  donations,
  loading,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
}: DonationListProps) {
  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          Loading donations...
        </div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="card text-center py-16">
        <p className="text-4xl mb-3">💰</p>
        <p className="text-gray-500 font-medium">No donations found</p>
        <p className="text-sm text-gray-400 mt-1">No records for the selected period. Try a different filter or add a donation.</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">#</th>
              <th className="table-header">Date</th>
              <th className="table-header">Amount (PKR)</th>
              <th className="table-header">Notes</th>
              <th className="table-header">Recorded By</th>
              <th className="table-header text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {donations.map((donation, idx) => (
              <tr key={donation._id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell text-gray-400">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </td>
                <td className="table-cell font-medium text-gray-900">
                  {new Date(donation.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="table-cell">
                  <span className="font-semibold text-primary-700">
                    PKR {donation.amount.toLocaleString('en-PK', { minimumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="table-cell text-gray-500 max-w-[200px] truncate">
                  {donation.notes || <span className="text-gray-300">—</span>}
                </td>
                <td className="table-cell text-gray-500">
                  {donation.recordedBy?.name || '—'}
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(donation)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(donation)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              onClick={() => onPageChange(pagination.page - 1)}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
