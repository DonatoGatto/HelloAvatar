'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { videosApi, avatarsApi } from '@/lib/api';
import { Plus, Video, Trash2, Download, Share2, Loader2, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function VideosPage() {
  const qc = useQueryClient();
  const [showGenerator, setShowGenerator] = useState(false);
  const [form, setForm] = useState({ title: '', script: '', avatarId: '', voiceId: '', test: false });
  const [pollingIds, setPollingIds] = useState<string[]>([]);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: videosApi.getAll,
    refetchInterval: pollingIds.length > 0 ? 3000 : false,
  });

  const { data: myAvatars = [] } = useQuery({
    queryKey: ['avatars'],
    queryFn: avatarsApi.getAll,
  });

  const { data: voices = [] } = useQuery({
    queryKey: ['voices'],
    queryFn: avatarsApi.getVoices,
  });

  useEffect(() => {
    const processing = videos.filter((v: any) => ['PENDING', 'PROCESSING'].includes(v.status)).map((v: any) => v.id);
    setPollingIds(processing);
  }, [videos]);

  const generateMutation = useMutation({
    mutationFn: videosApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['videos'] });
      setShowGenerator(false);
      setForm({ title: '', script: '', avatarId: '', voiceId: '', test: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: videosApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['videos'] }),
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'badge-green', PROCESSING: 'badge-yellow', PENDING: 'badge-gray', FAILED: 'badge-red',
    };
    return map[status] || 'badge-gray';
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'PROCESSING': case 'PENDING': return <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />;
      case 'FAILED': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      default: return null;
    }
  };

  const readyAvatars = myAvatars.filter((a: any) => a.status === 'READY');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Videos</h1>
          <p className="text-zinc-500 mt-1">Generate and manage avatar videos</p>
        </div>
        <button onClick={() => setShowGenerator(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Generate video
        </button>
      </div>

      {/* Generator panel */}
      {showGenerator && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-zinc-200 mb-4">New video</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="Product intro..." value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Avatar</label>
              <select className="input" value={form.avatarId}
                onChange={(e) => setForm({ ...form, avatarId: e.target.value })}>
                <option value="">Choose avatar...</option>
                {readyAvatars.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Script</label>
              <textarea className="input resize-none" rows={5} placeholder="Hello! Welcome to our platform..."
                value={form.script} onChange={(e) => setForm({ ...form, script: e.target.value })} />
              <div className="text-xs text-zinc-500 mt-1">{form.script.length} characters · ~{Math.ceil(form.script.split(' ').length / 150)} min video</div>
            </div>
            <div>
              <label className="label">Voice (optional)</label>
              <select className="input" value={form.voiceId}
                onChange={(e) => setForm({ ...form, voiceId: e.target.value })}>
                <option value="">Default voice</option>
                {(Array.isArray(voices) ? voices : []).map((v: any) => (
                  <option key={v.voice_id || v.voiceId} value={v.voice_id || v.voiceId}>
                    {v.voice_name || v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.test} onChange={(e) => setForm({ ...form, test: e.target.checked })}
                  className="rounded border-zinc-600 bg-zinc-800 text-indigo-600" />
                <span className="text-sm text-zinc-400">Test mode (no credits)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              className="btn-primary"
              disabled={!form.title || !form.script || !form.avatarId || generateMutation.isPending}
              onClick={() => generateMutation.mutate(form)}
            >
              {generateMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : 'Generate video'}
            </button>
            <button className="btn-secondary" onClick={() => setShowGenerator(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Video list */}
      {isLoading ? (
        <div className="text-center py-16 text-zinc-600">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="font-semibold text-zinc-200 mb-2">No videos yet</h3>
          <p className="text-zinc-500 text-sm mb-4">Generate your first avatar video</p>
          <button onClick={() => setShowGenerator(true)} className="btn-primary">Generate video</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/[0.05]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Video</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Avatar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Credits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {videos.map((v: any) => (
                <tr key={v.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-zinc-800 rounded overflow-hidden flex-shrink-0 border border-white/[0.05]">
                        {v.thumbnailUrl ? (
                          <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-3 h-3 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-200">{v.title}</div>
                        <div className="text-xs text-zinc-600 truncate max-w-xs">{v.script?.substring(0, 60)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{v.avatar?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(v.status)}
                      <span className={`badge ${statusBadge(v.status)}`}>{v.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {v.durationSecs ? `${Math.floor(v.durationSecs / 60)}:${String(v.durationSecs % 60).padStart(2, '0')}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{v.creditsCost || 0}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {v.url && (
                        <>
                          <a href={v.url} target="_blank" rel="noopener noreferrer"
                            className="text-zinc-600 hover:text-indigo-400 transition-colors" title="Play">
                            <Play className="w-4 h-4" />
                          </a>
                          <a href={v.url} download className="text-zinc-600 hover:text-indigo-400 transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      {v.shareToken && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${v.shareToken}`); }}
                          className="text-zinc-600 hover:text-indigo-400 transition-colors" title="Copy share link">
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Delete video?')) deleteMutation.mutate(v.id); }}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
