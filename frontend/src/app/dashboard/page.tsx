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
    { label: 'Credits remaining', value: workspace?.credits ?? '—', icon: Zap, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Total videos', value: usage?.totalVideos ?? '—', icon: Video, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Live sessions', value: usage?.totalSessions ?? '—', icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active sessions', value: usage?.activeSessions ?? 0, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back to {workspace?.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Plan info */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Current plan</h2>
            <Link href="/dashboard/billing" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              Upgrade <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold">{workspace?.plan}</span>
                <span className={`badge ${workspace?.plan === 'FREE' ? 'badge-gray' : workspace?.plan === 'STARTER' ? 'badge-blue' : 'badge-green'}`}>
                  {workspace?.plan}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {workspace?.plan === 'FREE' ? 'Upgrade to unlock all features' : 'Credits renew monthly'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-brand-600">{workspace?.credits}</div>
              <div className="text-xs text-gray-500">credits left</div>
            </div>
          </div>

          {/* Credit progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((workspace?.credits ?? 0) / (workspace?.plan === 'PRO' ? 500 : workspace?.plan === 'STARTER' ? 100 : 20)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="space-y-2">
            <Link href="/dashboard/videos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Generate video</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
            </Link>
            <Link href="/dashboard/avatars" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Browse avatars</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
            </Link>
            <Link href="/dashboard/live-chat" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Setup live chat</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent videos */}
      {usage?.recentVideos?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent videos</h2>
            <Link href="/dashboard/videos" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {usage.recentVideos.map((v: any) => (
              <div key={v.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                  {v.thumbnailUrl ? (
                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{v.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
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
