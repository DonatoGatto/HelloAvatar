'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { avatarsApi } from '@/lib/api';
import { Plus, Search, Trash2, Edit3, Upload, CheckCircle, Clock, XCircle, PlayCircle, X } from 'lucide-react';

type Tab = 'library' | 'stock' | 'create';

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

export default function AvatarsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('library');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', sourceVideoUrl: '' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [editAvatar, setEditAvatar] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', simliEaceId: '', ttsVoice: 'en-US-JennyNeural' });

  const { data: myAvatars = [], isLoading: loadingMine } = useQuery({
    queryKey: ['avatars'],
    queryFn: avatarsApi.getAll,
  });

  const { data: stockAvatars = [], isLoading: loadingStock } = useQuery({
    queryKey: ['stock-avatars'],
    queryFn: avatarsApi.getStock,
    enabled: tab === 'stock',
  });

  const addStockMutation = useMutation({
    mutationFn: (avatar: any) => avatarsApi.addStock({
      heygenAvatarId: avatar.avatar_id,
      name: avatar.avatar_name,
      thumbnailUrl: avatar.preview_image_url,
      previewVideoUrl: avatar.preview_video_url,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avatars'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: avatarsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['avatars'] }),
  });

  const createCustomMutation = useMutation({
    mutationFn: avatarsApi.createCustom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avatars'] });
      setCreating(false);
      setForm({ name: '', sourceVideoUrl: '' });
      setTab('library');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => avatarsApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avatars'] });
      setEditAvatar(null);
    },
  });

  const openEdit = (avatar: any) => {
    setEditAvatar(avatar);
    setEditForm({
      name: avatar.name,
      simliEaceId: avatar.simliEaceId || '',
      ttsVoice: avatar.ttsVoice || 'en-US-JennyNeural',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);

    try {
      const { uploadUrl, fileUrl } = await avatarsApi.getUploadUrl(file.name);

      const formData = new FormData();
      formData.append('file', file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        // Include JWT so the protected endpoint accepts the request
        const token = localStorage.getItem('ha_token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setForm((f) => ({ ...f, sourceVideoUrl: fileUrl }));
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
    } catch (err) {
      console.error('Upload failed', err);
      setUploadProgress(null);
    }
  };

  const filtered = myAvatars.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusIcon = (status: string) => {
    switch (status) {
      case 'READY': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PROCESSING': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-8">
      {/* EDIT MODAL */}
      {editAvatar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Edit avatar settings</h2>
              <button onClick={() => setEditAvatar(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Voice</label>
                <select className="input" value={editForm.ttsVoice} onChange={(e) => setEditForm({ ...editForm, ttsVoice: e.target.value })}>
                  {TTS_VOICES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">This voice is used when the widget config doesn&apos;t specify a voice.</p>
              </div>
              <div>
                <label className="label">Simli Face ID <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input font-mono text-sm" placeholder="e.g. 5fc23ea5-8175-4a82-aaaf-cdd8c88543dc"
                  value={editForm.simliEaceId} onChange={(e) => setEditForm({ ...editForm, simliEaceId: e.target.value })} />
                <p className="text-xs text-gray-400 mt-1">Get a face ID from <a href="https://app.simli.com" target="_blank" className="text-brand-500 hover:underline">app.simli.com</a> by uploading a photo of this person.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button className="btn-primary" disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: editAvatar.id, dto: editForm })}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
              <button className="btn-secondary" onClick={() => setEditAvatar(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avatars</h1>
          <p className="text-gray-500 mt-1">Manage your AI avatar library</p>
        </div>
        <button onClick={() => setTab('create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create avatar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {[
          { id: 'library', label: 'My avatars' },
          { id: 'stock', label: 'Stock library' },
          { id: 'create', label: 'Create custom' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MY LIBRARY */}
      {tab === 'library' && (
        <div>
          <div className="relative mb-4 max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="input pl-9" placeholder="Search avatars..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loadingMine ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-48 bg-gray-100" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎭</div>
              <h3 className="font-semibold text-gray-900 mb-2">No avatars yet</h3>
              <p className="text-gray-500 text-sm mb-4">Add avatars from the stock library or create your own</p>
              <button onClick={() => setTab('stock')} className="btn-primary">Browse stock avatars</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((avatar: any) => (
                <div key={avatar.id} className="card overflow-hidden group">
                  <div className="relative aspect-video bg-gray-100">
                    {avatar.thumbnailUrl ? (
                      <img src={avatar.thumbnailUrl} alt={avatar.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">🎭</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-1">
                      {statusIcon(avatar.status)}
                      <span className="text-white text-xs">{avatar.status}</span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      {avatar.previewVideoUrl && (
                        <PlayCircle className="w-10 h-10 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900 truncate max-w-[100px]">{avatar.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`badge ${avatar.type === 'CUSTOM' ? 'badge-blue' : 'badge-gray'}`}>{avatar.type}</span>
                        {avatar.simliEaceId
                          ? <span className="badge badge-green" title="Simli face connected">🎭 Live</span>
                          : <span className="badge badge-gray text-yellow-600" title="No Simli face — will use default">⚠ No face</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(avatar)} className="text-gray-400 hover:text-brand-500 transition-colors" title="Edit voice & Simli face">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete avatar?')) deleteMutation.mutate(avatar.id); }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STOCK LIBRARY */}
      {tab === 'stock' && (
        <div>
          {loadingStock ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="card p-4 animate-pulse h-48 bg-gray-100" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(Array.isArray(stockAvatars) ? stockAvatars : []).map((avatar: any) => (
                <div key={avatar.avatar_id} className="card overflow-hidden group">
                  <div className="relative aspect-video bg-gray-100">
                    {avatar.preview_image_url && (
                      <img src={avatar.preview_image_url} alt={avatar.avatar_name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="font-medium text-sm text-gray-900 truncate max-w-[120px]">{avatar.avatar_name}</div>
                    <button
                      onClick={() => addStockMutation.mutate(avatar)}
                      disabled={addStockMutation.isPending}
                      className="btn-primary py-1 px-2 text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE CUSTOM */}
      {tab === 'create' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Create custom avatar</h2>
            <p className="text-sm text-gray-500 mb-6">Upload a 2-5 minute video of yourself. Processing takes ~10 minutes.</p>

            <div className="space-y-4">
              <div>
                <label className="label">Avatar name</label>
                <input className="input" placeholder="My Avatar" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="label">Video file (MP4, 2-5 min)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">Drag & drop or click to upload</p>
                  <input type="file" accept="video/*" className="hidden" id="avatar-upload"
                    onChange={handleFileUpload} />
                  <label htmlFor="avatar-upload" className="btn-secondary cursor-pointer">Choose file</label>
                </div>

                {uploadProgress !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {form.sourceVideoUrl && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" /> Video uploaded successfully
                  </div>
                )}
              </div>

              <button
                className="btn-primary w-full py-2.5"
                disabled={!form.name || !form.sourceVideoUrl || createCustomMutation.isPending}
                onClick={() => createCustomMutation.mutate(form)}
              >
                {createCustomMutation.isPending ? 'Creating...' : 'Create avatar'}
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Tips for best results</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use good lighting (face clearly visible)</li>
              <li>• Speak naturally for 2-5 minutes</li>
              <li>• Stable camera, neutral background</li>
              <li>• Avoid fast head movements</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
