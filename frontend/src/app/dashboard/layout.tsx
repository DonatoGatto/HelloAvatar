'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard, Users, Video, MessageSquare, CreditCard,
  Settings, Code2, LogOut, Zap, ChevronDown,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/avatars', label: 'Avatars', icon: Users },
  { href: '/dashboard/videos', label: 'Videos', icon: Video },
  { href: '/dashboard/live-chat', label: 'Live Chat', icon: MessageSquare },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspace, fetchMe, logout, token } = useAuthStore();

  useEffect(() => {
    const tok = localStorage.getItem('ha_token');
    if (!tok) { router.push('/login'); return; }
    if (!user) fetchMe();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const planColors: Record<string, string> = {
    FREE: 'badge-gray', STARTER: 'badge-blue', PRO: 'badge-green', ENTERPRISE: 'badge-yellow',
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">HA</span>
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">HelloAvatar</div>
              {workspace && (
                <div className="text-xs text-gray-500 truncate max-w-[140px]">{workspace.name}</div>
              )}
            </div>
          </div>
        </div>

        {/* Credits pill */}
        {workspace && (
          <div className="mx-4 mt-4 bg-brand-50 rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-600" />
              <span className="text-xs font-semibold text-brand-700">{workspace.credits} credits</span>
            </div>
            <span className={planColors[workspace.plan] || 'badge-gray'}>{workspace.plan}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-gray-400'}`} />
                {label}
              </Link>
            );
          })}

          <div className="border-t border-gray-100 my-2" />

          <Link
            href="/dashboard/settings?tab=api-keys"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Code2 className="w-4 h-4 text-gray-400" />
            API Keys
          </Link>
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-semibold text-xs">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
