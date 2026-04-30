'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User } from '@/types';

interface AdminFormData {
  name: string;
  email: string;
  password?: string;
  mobile?: string;
}

interface AdminFormProps {
  initialData: User | null;
  onSubmit: (data: AdminFormData) => Promise<void>;
  onCancel: () => void;
  isEdit: boolean;
}

export default function AdminForm({ initialData, onSubmit, onCancel, isEdit }: AdminFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminFormData>();

  useEffect(() => {
    if (initialData) {
      reset({ name: initialData.name, email: initialData.email || '', mobile: initialData.mobile || '' });
    } else {
      reset({ name: '', email: '', password: '', mobile: '' });
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
          placeholder="John Doe"
          {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="label">Email Address *</label>
        <input
          type="email"
          className="input-field"
          placeholder="admin@example.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
          })}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="label">{isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
        <input
          type="password"
          className="input-field"
          placeholder={isEdit ? '••••••••' : 'Minimum 6 characters'}
          {...register('password', {
            validate: (val) => {
              if (!isEdit && (!val || val.length < 6)) return 'Password must be at least 6 characters';
              if (val && val.length > 0 && val.length < 6) return 'Password must be at least 6 characters';
              return true;
            },
          })}
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {/* Mobile */}
      <div>
        <label className="label">Mobile Number</label>
        <input
          type="tel"
          className="input-field"
          placeholder="+92 300 0000000"
          {...register('mobile')}
        />
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
          ) : isEdit ? 'Update Admin' : 'Create Admin'}
        </button>
      </div>
    </form>
  );
}
