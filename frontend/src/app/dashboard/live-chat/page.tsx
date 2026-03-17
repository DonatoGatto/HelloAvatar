'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streamingApi, avatarsApi, apiKeysApi } from '@/lib/api';
import { Plus, Copy, Trash2, Check, MessageSquare, Code2, Play, X, User } from 'lucide-react';

// Simli stock faces — all 9 face IDs with preview images
const SIMLI_FACES = [
  { id: 'd2a5c7c6-fed9-4f55-bcb3-062f7cd20103', name: 'Alex', style: 'Professional', img: 'https://storage.googleapis.com/simli-assets/face-previews/d2a5c7c6-fed9-4f55-bcb3-062f7cd20103.jpg' },
  { id: 'b9e5fba3-071a-4e35-896e-211c4d6eaa7b', name: 'Jordan', style: 'Friendly', img: 'https://storage.googleapis.com/simli-assets/face-previews/b9e5fba3-071a-4e35-896e-211c4d6eaa7b.jpg' },
  { id: '5fc23ea5-8175-4a82-aaaf-cdd8c88543dc', name: 'Morgan', style: 'Elegant', img: 'https://storage.googleapis.com/simli-assets/face-previews/5fc23ea5-8175-4a82-aaaf-cdd8c88543dc.jpg' },
  { id: 'afdb6a3e-3939-40aa-92df-01604c23101c', name: 'Taylor', style: 'Casual', img: 'https://storage.googleapis.com/simli-assets/face-previews/afdb6a3e-3939-40aa-92df-01604c23101c.jpg' },
  { id: '804c347a-26c9-4dcf-bb49-13df4bed61e8', name: 'Riley', style: 'Warm', img: 'https://storage.googleapis.com/simli-assets/face-previews/804c347a-26c9-4dcf-bb49-13df4bed61e8.jpg' },
  { id: 'f0ba4efe-7946-45de-9955-c04a04c367b9', name: 'Cameron', style: 'Bold', img: 'https://storage.googleapis.com/simli-assets/face-previews/f0ba4efe-7946-45de-9955-c04a04c367b9.jpg' },
  { id: 'dd10cb5a-d31d-4f12-b69f-6db3383c006e', name: 'Avery', style: 'Modern', img: 'https://storage.googleapis.com/simli-assets/face-previews/dd10cb5a-d31d-4f12-b69f-6db3383c006e.jpg' },
  { id: 'c295e3a2-ed11-48d5-a1bd-ff42ac7eac73', name: 'Quinn', style: 'Energetic', img: 'https://storage.googleapis.com/simli-assets/face-previews/c295e3a2-ed11-48d5-a1bd-ff42ac7eac73.jpg' },
  { id: 'b1f6ad8f-ed78-430b-85ef-2ec672728104', name: 'Logan', style: 'Classic', img: 'https://storage.googleapis.com/simli-assets/face-previews/b1f6ad8f-ed78-430b-85ef-2ec672728104.jpg' },
];

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
  const [testingWidget, setTestingWidget] = useState<any>(null);
  const testScriptRef = useRef<HTMLScriptElement | null>(null);
  const [form, setForm] = useState({
    name: 'My Chat Widget', avatarId: '', simliFaceId: SIMLI_FACES[2].id, primaryColor: '#6366f1',
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

  const launchTest = (config: any) => {
    // Remove old test widget if any
    if (testScriptRef.current) {
      testScriptRef.current.remove();
      testScriptRef.current = null;
    }
    // Remove any existing widget DOM elements
    ['ha-launcher', 'ha-modal', 'ha-call-modal', 'ha-s-aud', 'ha-widget-root'].forEach(id => document.getElementById(id)?.remove());
    // Reset global HA state so widget re-inits cleanly
    if ((window as any).HA) { (window as any).HA = undefined; }
    setTestingWidget(config);
    // Inject widget script with cache-busting
    const script = document.createElement('script');
    script.src = `${API_URL}/api/widget/widget.js?v=${Date.now()}`;
    script.setAttribute('data-widget-id', config.id);
    script.setAttribute('data-api-key', activeApiKey?.key || '');
    script.setAttribute('data-color', config.primaryColor);
    script.setAttribute('data-position', 'bottom-right');
    script.setAttribute('data-title', config.name);
    script.onload = () => {
      // Auto-open widget after load
      setTimeout(() => {
        const btn = document.getElementById('ha-launcher') as HTMLElement;
        if (btn) btn.click();
      }, 800);
    };
    document.body.appendChild(script);
    testScriptRef.current = script;
  };

  const stopTest = () => {
    testScriptRef.current?.remove();
    testScriptRef.current = null;
    ['ha-launcher', 'ha-modal', 'ha-call-modal', 'ha-s-aud'].forEach(id => document.getElementById(id)?.remove());
    setTestingWidget(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Live Chat</h1>
          <p className="text-zinc-500 mt-1">Configure real-time avatar chat widgets for your website</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> New AI Assistant
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-white/[0.06] rounded-xl p-1 w-fit mb-6">
        {[
          { id: 'configs', label: 'Widget configs' },
          { id: 'sessions', label: 'Session history' },
          { id: 'embed', label: 'Embed guide' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CREATE FORM */}
      {showCreate && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-zinc-200 mb-5">Create AI Assistant</h2>

          {/* Simli Face Picker */}
          <div className="mb-6 p-4 bg-zinc-800/40 rounded-xl border border-white/[0.06]">
            <label className="label mb-3 flex items-center gap-2"><User className="w-4 h-4 text-indigo-400" /> Choose avatar face</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {SIMLI_FACES.map((face) => (
                <button
                  key={face.id}
                  type="button"
                  onClick={() => setForm({ ...form, simliFaceId: face.id })}
                  className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                    form.simliFaceId === face.id
                      ? 'border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                      : 'border-white/[0.07] bg-zinc-900/60 hover:border-white/20 hover:bg-zinc-800/70'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img
                      src={face.img}
                      alt={face.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = 'none';
                        t.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-zinc-700 text-zinc-300 text-sm font-bold">${face.name[0]}</div>`;
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-200 truncate w-full text-center leading-tight">{face.name}</span>
                  <span className="text-[9px] text-zinc-500 truncate w-full text-center">{face.style}</span>
                  {form.simliFaceId === face.id && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Widget name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Custom avatar (optional)</label>
              <select className="input" value={form.avatarId} onChange={(e) => setForm({ ...form, avatarId: e.target.value })}>
                <option value="">Use selected Simli face</option>
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
                  className="h-10 w-16 rounded-lg border border-zinc-700 cursor-pointer bg-zinc-800" />
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
            <button className="btn-primary" disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? 'Creating...' : 'Create AI Assistant'}
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
              <h3 className="font-semibold text-zinc-200 mb-2">No widgets yet</h3>
              <p className="text-zinc-500 text-sm mb-4">Create an AI assistant to embed on your website</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary">Create AI Assistant</button>
            </div>
          ) : (
            configs.map((config: any) => (
              <div key={config.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: config.primaryColor + '18', borderColor: config.primaryColor + '30' }}>
                      <MessageSquare className="w-5 h-5" style={{ color: config.primaryColor }} />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-200">{config.name}</div>
                      <div className="text-sm text-zinc-500">
                        {config.simliFaceId
                          ? (SIMLI_FACES.find(f => f.id === config.simliFaceId)?.name || 'Custom face') + ' · '
                          : (config.avatar?.name ? config.avatar.name + ' · ' : '')}
                        {config.position}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testingWidget?.id === config.id ? (
                      <button onClick={stopTest} className="btn-danger py-1.5 px-3 text-xs gap-1">
                        <X className="w-3.5 h-3.5" /> End call
                      </button>
                    ) : (
                      <button onClick={() => launchTest(config)} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 btn py-1.5 px-3 text-xs gap-1"
                        title={!activeApiKey ? 'Need API key — go to Settings' : 'Start live call'}>
                        <Play className="w-3.5 h-3.5" /> Call
                      </button>
                    )}
                    <button onClick={() => { setSelected(config); setTab('embed'); }}
                      className="btn-secondary py-1.5 px-3 text-xs gap-1">
                      <Code2 className="w-3.5 h-3.5" /> Get embed code
                    </button>
                    <button onClick={() => { if (confirm('Delete widget?')) deleteMutation.mutate(config.id); }}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/[0.05] grid grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-600">Color: </span>
                    <span className="font-mono text-xs" style={{ color: config.primaryColor }}>{config.primaryColor}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">Status: </span>
                    <span className={`badge ${config.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600">Voice: </span>
                    <span className="text-xs text-zinc-400 font-mono truncate">{config.ttsVoice || 'en-US-JennyNeural'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">Face: </span>
                    <span className="text-xs text-zinc-400">
                      {SIMLI_FACES.find(f => f.id === config.simliFaceId)?.name || (config.simliFaceId ? 'Custom' : 'Default')}
                    </span>
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
            <thead className="border-b border-white/[0.05]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Widget</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Avatar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Credits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sessions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-zinc-600">No sessions yet</td></tr>
              ) : sessions.map((s: any) => (
                <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-zinc-300">{s.widgetConfig?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.avatar?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.status === 'ACTIVE' ? 'badge-green' : s.status === 'ENDED' ? 'badge-gray' : 'badge-red'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.durationSecs ? `${Math.floor(s.durationSecs / 60)}:${String(s.durationSecs % 60).padStart(2, '0')}` : '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{s.creditsCost || 0}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{new Date(s.startedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EMBED GUIDE */}
      {tab === 'embed' && (
        <div className="max-w-2xl">
          <h2 className="font-semibold text-zinc-200 mb-1">Embed your chat widget</h2>
          <p className="text-sm text-zinc-500 mb-4">Copy the snippet and paste it into your client's website HTML.</p>

          {!activeApiKey && (
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-4 mb-4 text-sm text-amber-400">
              ⚠️ You have no active API key. Go to <strong>Settings → API Keys</strong> to create one, then the embed code will appear here with the key included.
            </div>
          )}

          {(selected ? [selected] : configs).map((config: any) => (
            <div key={config.id} className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-zinc-200">{config.name}</span>
                <button onClick={() => copySnippet(config)} className="btn-secondary py-1.5 px-3 text-xs gap-1.5">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy code</>}
                </button>
              </div>
              <pre className="bg-zinc-950 border border-white/[0.05] text-emerald-400 text-xs rounded-lg p-4 overflow-x-auto font-mono whitespace-pre-wrap">
                {embedSnippet(config)}
              </pre>
            </div>
          ))}

          <div className="card p-5">
            <h3 className="font-semibold text-zinc-200 mb-3">How to embed</h3>
            <ol className="space-y-3 text-sm text-zinc-500">
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                Create an API key in <strong className="text-zinc-300">Settings → API Keys</strong> if you haven&apos;t already
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                Copy the snippet for your widget above — it contains your Widget ID and API key
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                Paste it into your website or client&apos;s site HTML, just before the <code className="bg-zinc-800 px-1 rounded text-zinc-300">&lt;/body&gt;</code> tag
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                A chat bubble will appear — visitors click it to start a live video call with your avatar
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
