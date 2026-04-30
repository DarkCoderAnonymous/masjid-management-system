'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: '/dashboard/super-admin', label: 'Admin Management', icon: ShieldCheckIcon, roles: ['super_admin'] },
  { href: '/dashboard/admin', label: 'Dashboard', icon: HomeIcon, roles: ['admin'] },
  { href: '/dashboard/admin/users', label: 'Members', icon: UserGroupIcon, roles: ['admin'] },
  { href: '/dashboard/user', label: 'Dashboard', icon: HomeIcon, roles: ['user'] },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const filtered = navItems.filter((item) => item.roles.includes(user.role));

  const roleBadge: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'Member',
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-800">🕌 Masjid</span>
        </div>

        {/* Desktop: breadcrumb / page title */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-400">
            <span className="text-gray-600 font-medium">{roleBadge[user.role]}</span>
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email || roleBadge[user.role]}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600
                       hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 space-y-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
