'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  UsersIcon,
  ShieldCheckIcon,
  HomeIcon,
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

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const filtered = navItems.filter((item) => item.roles.includes(user.role));

  const roleBadge: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'Member',
  };

  const roleBadgeColor: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    user: 'bg-green-100 text-green-700',
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
          🕌
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">Masjid</p>
          <p className="text-xs text-gray-500">Management System</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <UsersIcon className="w-4 h-4 text-primary-700" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <span className={`badge text-xs ${roleBadgeColor[user.role]}`}>
              {roleBadge[user.role]}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">© 2024 Masjid Management</p>
      </div>
    </aside>
  );
}
