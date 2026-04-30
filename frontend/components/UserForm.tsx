'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User } from '@/types';

interface UserFormData {
  name: string;
  mobile: string;
}

interface UserFormProps {
  initialData: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isEdit: boolean;
}

export default function UserForm({ initialData, onSubmit, onCancel, isEdit }: UserFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>();

  useEffect(() => {
    if (initialData) {
      reset({ name: initialData.name, mobile: initialData.mobile || '' });
    } else {
      reset({ name: '', mobile: '' });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="label">Full Name *</label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. Ahmed Ali"
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Min 2 characters' },
          })}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {/* Mobile */}
      <div>
        <label className="label">Mobile Number *</label>
        <input
          type="tel"
          className="input-field"
          placeholder="e.g. 0300-0000000"
          {...register('mobile', {
            required: 'Mobile number is required',
            minLength: { value: 7, message: 'Enter a valid mobile number' },
          })}
        />
        {errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile.message}</p>}
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
          ) : isEdit ? 'Update Member' : 'Add Member'}
        </button>
      </div>
    </form>
  );
}
