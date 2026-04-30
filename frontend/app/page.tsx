'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import "./globals.css";
export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();


  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const redirectMap: Record<string, string> = {
      super_admin: '/dashboard/super-admin',
      admin: '/dashboard/admin',
      user: '/dashboard/user',
    };
    router.replace(redirectMap[user.role] || '/login');
  }, [user,  router]);

  // Loading check complete — render nothing while the redirect fires



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
