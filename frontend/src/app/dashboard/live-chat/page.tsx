'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamingApi, avatarsApi, apiKeysApi } from '@/lib/api';
import { Plus, Copy, Trash2, Check, MessageSquare, Code2, Mic } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';

const TTS_VOICES = [
  { value: 'en-US-JennyNeural', label: '🇺🇸 Jenny (Female, EN-US)' },
  { value: 'en-US-GuyNeural', label: '🇺🇸 Guy (Male, EN-US)' },
  { value: 'en-US-AriaNeural', label: '🇺🇸 Aria (Female, EN-US)' },
  { value: 'en-GB-SoniaNeural', label: '🇬🇧 Sonia (Female, EN-GB)' },
  { value: 'en-GB-RyanNeural', label: '🇬🇧 Ryan (Male, EN-GB)' },
  { value: 'lt-LT-OnaNeural', label: '🇱🇹 Ona (Female, LT)' },
  { value: 'lt-LT-LeonasNeural', label: '🇱🇹 Leonas (Male, LT)' },
  { value: 'de-DE-KatjaNeural', label: '🇩🇪 Katja (Female, DE)' },
  { value: 'fr-FR-DeniseNeural', label: '🇫🇷 Denise (Female, FR)' },
  { value: 'es-ES-ElviraNeural', label: '🇪🇸 Elvira (Female, ES)' },
  { value: 'pl-PL-ZofiaNeural', label: '🇵🇱 Zofia (Female, PL)' },
  { value: 'ru-RU-SvetlanaNeural', label: '🇷🇺 Svetlana (Female, RU)' },
];

export default function LiveChatPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'configs' | 'sessions' | 'embed'>('configs');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: 'My Chat Widget', avatarId: '', primaryColor: '#6366f1',
    position: 'bottom-right', greeting: 'Hi! How can I help you today?',
    aiPersona: 'You are a helpful, friendly customer support assistant.',
    ttsVoice: 'en-US-JennyNeural',
  });

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['widget-configs'],
    queryFn: streamingApi.getWidgets,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['streaming-sessions'],
    queryFn: streamingApi.getSessions,
    enabled: tab === 'sessions',
  });

  const { data: myAvatars = [] } = useQuery({
    queryKey: ['avatars'],
    queryFn: avatarsApi.getAll,
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.getAll,
  });

  const activeApiKey = (apiKeys as any[]).find((k: any) => k.isActive);

  const createMutation = useMutation({
    mutationFn: streamingApi.createWidget,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['widget-configs'] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: streamingApi.deleteWidget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widget-configs'] }),
  });

  const embedSnippet = (config: any) => `<!-- HelloAvatar Chat Widget -->
<script
  src="${API_URL}/api/widget/widget.js"
  data-widget-id="${config.id}"
  data-api-key="${activeApiKey?.key || 'YOUR_API_KEY'}"
  data-color="${config.primaryColor}"
  data-position="${config.position}"
  data-title="${config.name}"
></script>`;

  const copySnippet = (config: any) => {
    navigator.clipboard.writeText(embedSnippet(config));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readyAvatars = myAvatars.filter((a: any) => a.status === 'READY');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Chat</h1>
          <p className="text-gray-500 mt-1">Configure real-time avatar chat widgets for your website</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> New widget
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {[
          { id: 'configs', label: 'Widget configs' },
          { id: 'sessions', label: 'Session history' },
          { id: 'embed', label: 'Embed guide' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create widget configuration</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Widget name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Avatar</label>
              <select className="input" value={form.avatarId} onChange={(e) => setForm({ ...form, avatarId: e.target.value })}>
                <option value="">Select avatar...</option>
                {readyAvatars.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Voice</label>
              <select className="input" value={form.ttsVoice} onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}>
                {TTS_VOICES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Primary color</label>
              <div className="flex gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer" />
                <input className="input" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Position</label>
              <select className="input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
                <option value="top-right">Top right</option>
                <option value="top-left">Top left</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Initial greeting</label>
              <input className="input" value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">AI persona (system prompt)</label>
              <textarea className="input resize-none" rows={3} value={form.aiPersona}
                onChange={(e) => setForm({ ...form, aiPersona: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button className="btn-primary" disabled={!form.avatarId || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? 'Creating...' : 'Create widget'}
            </button>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* WIDGET CONFIGS */}
      {tab === 'configs' && (
        <div className="space-y-4">
          {configs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="font-semibold text-gray-900 mb-2">No widgets yet</h3>
              <p className="text-gray-500 text-sm mb-4">Create a widget to embed on your website</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">Create widget</button>
            </div>
          ) : (
            configs.map((config: any) => (
              <div key={config.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: config.primaryColor + '20' }}>
                      <MessageSquare className="w-5 h-5" style={{ color: config.primaryColor }} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{config.name}</div>
                      <div className="text-sm text-gray-500">
                        {config.avatar?.name || 'No avatar'} · {config.position}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setSelected(config); setTab('embed'); }}
                      className="btn-secondary py-1.5 px-3 text-xs gap-1">
                      <Code2 className="w-3.5 h-3.5" /> Get embed code
                    </button>
                    <button onClick={() => { if (confirm('Delete widget?')) deleteMutation.mutate(config.id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Color: </span>
                    <span className="font-mono" style={{ color: config.primaryColor }}>{config.primaryColor}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status: </span>
                    <span className={`badge ${config.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Voice: </span>
                    <span className="text-xs font-mono truncate">{config.ttsVoice || 'en-US-JennyNeural'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SESSION HISTORY */}
      {tab === 'sessions' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Widget</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avatar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Credits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No sessions yet</td></tr>
              ) : sessions.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{s.widgetConfig?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{s.avatar?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : s.status === 'ENDED' ? 'badge-gray' : 'badge-red'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{s.durationSecs ? `${Math.floor(s.durationSecs / 60)}:${String(s.durationSecs % 60).padStart(2, '0')}` : '—'}</td>
                  <td className="px-4 py-3 text-sm">{s.creditsCost || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(s.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EMBED GUIDE */}
      {tab === 'embed' && (
        <div className="max-w-2xl">
          <h2 className="font-semibold text-gray-900 mb-1">Embed your chat widget</h2>
          <p className="text-sm text-gray-500 mb-4">Copy the snippet and paste it into your client's website HTML.</p>

          {!activeApiKey && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-800">
              ⚠️ You have no active API key. Go to <strong>Settings → API Keys</strong> to create one, then the embed code will appear here with the key included.
            </div>
          )}

          {(selected ? [selected] : configs).map((config: any) => (
            <div key={config.id} className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{config.name}</span>
                <button onClick={() => copySnippet(config)} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                  {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy code</>}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto font-mono whitespace-pre-wrap">
                {embedSnippet(config)}
              </pre>
            </div>
          ))}

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">How to embed</h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                Create an API key in <strong>Settings → API Keys</strong> if you haven&apos;t already
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                Copy the snippet for your widget above — it contains your Widget ID and API key
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                Paste it into your website or client&apos;s site HTML, just before the <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                A chat bubble will appear — visitors click it to start a live video call with your avatar
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
