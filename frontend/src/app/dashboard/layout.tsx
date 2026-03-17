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
    <div className="flex h-screen bg-[#09090b] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-950 border-r border-white/[0.05] flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30">
              <span className="text-white font-black text-xs">HA</span>
            </div>
            <div>
              <div className="font-bold text-sm text-zinc-100">HelloAvatar</div>
              {workspace && (
                <div className="text-xs text-zinc-600 truncate max-w-[130px]">{workspace.name}</div>
              )}
            </div>
          </div>
        </div>

        {/* Credits pill */}
        {workspace && (
          <div className="mx-3 mt-4 bg-indigo-500/8 border border-indigo-500/15 rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">{workspace.credits} credits</span>
            </div>
            <span className={planColors[workspace.plan] || 'badge-gray'}>{workspace.plan}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/15'
                    : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-400' : 'text-zinc-600'}`} />
                {label}
              </Link>
            );
          })}

          <div className="border-t border-white/[0.05] my-2" />

          <Link
            href="/dashboard/settings?tab=api-keys"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200 transition-all"
          >
            <Code2 className="w-4 h-4 text-zinc-600" />
            API Keys
          </Link>
        </nav>

        {/* User profile */}
        <div className="p-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800/40 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-300 font-semibold text-xs">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-zinc-300 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-zinc-600 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-zinc-600 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#0d0d10]">
        {children}
      </main>
    </div>
  );
}
