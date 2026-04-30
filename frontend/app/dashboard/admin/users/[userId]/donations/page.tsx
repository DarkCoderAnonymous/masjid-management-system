'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { User, Donation, Pagination, DonationFilter, FILTER_OPTIONS } from '@/types';
import Modal from '@/components/Modal';
import DonationForm from '@/components/DonationForm';
import DonationList from '@/components/DonationList';

export default function DonationsPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [member, setMember] = useState<User | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [filter, setFilter] = useState<DonationFilter>('all');
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Donation | null>(null);

  const fetchMember = useCallback(async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      setMember(res.data.data);
    } catch {
      toast.error('Member not found.');
      router.push('/dashboard/admin/users');
    }
  }, [userId, router]);

  const fetchDonations = useCallback(async (page = 1, activeFilter = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (activeFilter !== 'all') params.append('filter', activeFilter);
      const res = await api.get(`/donations/user/${userId}?${params}`);
      setDonations(res.data.data);
      setTotalAmount(res.data.totalAmount);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load donations.');
    } finally {
      setLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => { fetchMember(); }, [fetchMember]);
  useEffect(() => { fetchDonations(1, filter); }, [filter]);

  const handleFilterChange = (newFilter: DonationFilter) => {
    setFilter(newFilter);
  };

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      const res = await api.get(`/donations/user/${userId}/pdf?${params}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `donation-statement-${member?.name?.replace(/\s+/g, '-') || userId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully.');
    } catch {
      toast.error('Failed to generate PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const openCreate = () => { setEditingDonation(null); setModalOpen(true); };
  const openEdit = (donation: Donation) => { setEditingDonation(donation); setModalOpen(true); };

  const handleSave = async (data: { amount: number; date: string; notes?: string }) => {
    try {
      if (editingDonation) {
        await api.put(`/donations/${editingDonation._id}`, data);
        toast.success('Donation updated successfully.');
      } else {
        await api.post('/donations', { ...data, userId });
        toast.success('Donation recorded successfully.');
      }
      setModalOpen(false);
      fetchDonations(pagination.page, filter);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/donations/${deleteTarget._id}`);
      toast.success('Donation deleted.');
      setDeleteTarget(null);
      fetchDonations(pagination.page, filter);
    } catch {
      toast.error('Failed to delete donation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/admin/users')}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member ? member.name : 'Loading...'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {member?.mobile ? `📱 ${member.mobile}` : 'Donation history'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPDF} disabled={downloadingPdf} className="btn-secondary">
            <ArrowDownTrayIcon className="w-4 h-4" />
            {downloadingPdf ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={openCreate} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Add Donation
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-700">
            PKR {totalAmount.toLocaleString('en-PK')}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total Donated</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-800">{pagination.total}</p>
          <p className="text-xs text-gray-500 mt-1">Transactions</p>
        </div>
        <div className="card text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-gray-800">
            {pagination.total > 0 ? `PKR ${Math.round(totalAmount / pagination.total).toLocaleString('en-PK')}` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg. Donation</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === opt.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Donation List */}
      <DonationList
        donations={donations}
        loading={loading}
        pagination={pagination}
        onEdit={openEdit}
        onDelete={(d) => setDeleteTarget(d)}
        onPageChange={(page) => fetchDonations(page, filter)}
      />

      {/* Donation Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDonation ? 'Edit Donation' : 'Record Donation'}
      >
        <DonationForm
          initialData={editingDonation}
          onSubmit={handleSave}
          onCancel={() => setModalOpen(false)}
          isEdit={!!editingDonation}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Donation">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this donation of{' '}
            <strong>PKR {deleteTarget?.amount.toLocaleString()}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn-danger" onClick={handleDelete}>Delete Donation</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
