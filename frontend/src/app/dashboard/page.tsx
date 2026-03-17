'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspacesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Video, Users, MessageSquare, Zap, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { workspace } = useAuthStore();
  const { data: usage, isLoading } = useQuery({
    queryKey: ['workspace-usage'],
    queryFn: workspacesApi.getUsage,
  });

  const stats = [
    { label: 'Credits remaining', value: workspace?.credits ?? '—', icon: Zap, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Total videos', value: usage?.totalVideos ?? '—', icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Live sessions', value: usage?.totalSessions ?? '—', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Active sessions', value: usage?.activeSessions ?? 0, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Overview</h1>
        <p className="text-zinc-500 mt-1">Welcome back to {workspace?.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <div className={`w-8 h-8 ${s.bg} border rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plan info */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-200">Current plan</h2>
            <Link href="/dashboard/billing" className="text-sm text-indigo-400 font-medium hover:text-indigo-300 transition-colors flex items-center gap-1">
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-zinc-100">{workspace?.plan}</span>
                <span className={`badge ${workspace?.plan === 'FREE' ? 'badge-gray' : workspace?.plan === 'STARTER' ? 'badge-blue' : 'badge-green'}`}>
                  {workspace?.plan}
                </span>
              </div>
              <div className="text-sm text-zinc-600">
                {workspace?.plan === 'FREE' ? 'Upgrade to unlock all features' : 'Credits renew monthly'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-indigo-400">{workspace?.credits}</div>
              <div className="text-xs text-zinc-600">credits left</div>
            </div>
          </div>

          {/* Credit progress bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((workspace?.credits ?? 0) / (workspace?.plan === 'PRO' ? 500 : workspace?.plan === 'STARTER' ? 100 : 20)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-zinc-200 mb-4">Quick actions</h2>
          <div className="space-y-1.5">
            <Link href="/dashboard/videos" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group">
              <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Generate video</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-700 ml-auto group-hover:text-zinc-400 transition-colors" />
            </Link>
            <Link href="/dashboard/avatars" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group">
              <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Browse avatars</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-700 ml-auto group-hover:text-zinc-400 transition-colors" />
            </Link>
            <Link href="/dashboard/live-chat" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Setup live chat</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-700 ml-auto group-hover:text-zinc-400 transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent videos */}
      {usage?.recentVideos?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
            <h2 className="font-semibold text-zinc-200">Recent videos</h2>
            <Link href="/dashboard/videos" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all</Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {usage.recentVideos.map((v: any) => (
              <div key={v.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden border border-white/[0.05]">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{v.title}</div>
                  <div className="text-xs text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <span className={`badge ${v.status === 'COMPLETED' ? 'badge-green' : v.status === 'PROCESSING' ? 'badge-yellow' : v.status === 'FAILED' ? 'badge-red' : 'badge-gray'}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
