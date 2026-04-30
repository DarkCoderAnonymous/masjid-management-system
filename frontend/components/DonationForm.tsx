'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Donation } from '@/types';

interface DonationFormData {
  amount: number;
  date: string;
  notes?: string;
}

interface DonationFormProps {
  initialData: Donation | null;
  onSubmit: (data: DonationFormData) => Promise<void>;
  onCancel: () => void;
  isEdit: boolean;
}

export default function DonationForm({ initialData, onSubmit, onCancel, isEdit }: DonationFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormData>();

  useEffect(() => {
    if (initialData) {
      reset({
        amount: initialData.amount,
        date: new Date(initialData.date).toISOString().split('T')[0],
        notes: initialData.notes || '',
      });
    } else {
      reset({
        amount: undefined,
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="label">Amount (PKR) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">PKR</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="input-field pl-12"
            placeholder="0.00"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 0.01, message: 'Amount must be greater than 0' },
              valueAsNumber: true,
            })}
          />
        </div>
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
      </div>

      {/* Date */}
      <div>
        <label className="label">Donation Date *</label>
        <input
          type="date"
          className="input-field"
          max={new Date().toISOString().split('T')[0]}
          {...register('date', { required: 'Date is required' })}
        />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          rows={3}
          className="input-field resize-none"
          placeholder="e.g. Zakat, Sadaqah, Monthly donation..."
          {...register('notes', { maxLength: { value: 500, message: 'Max 500 characters' } })}
        />
        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving...
            </span>
          ) : isEdit ? 'Update Donation' : 'Record Donation'}
        </button>
      </div>
    </form>
  );
}
