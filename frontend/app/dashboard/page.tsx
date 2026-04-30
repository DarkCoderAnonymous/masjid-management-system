'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const redirectMap: Record<string, string> = {
      super_admin: '/dashboard/super-admin',
      admin: '/dashboard/admin',
      user: '/dashboard/user',
    };
    router.replace(redirectMap[user.role] || '/login');
  }, [user, router]);

  return null;
}
