'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi, apiKeysApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Key, Plus, Trash2, AlertCircle, Copy, Check, EyeOff, Eye } from 'lucide-react';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { workspace, updateWorkspace } = useAuthStore();
  const [tab, setTab] = useState<'workspace' | 'team' | 'api-keys'>('workspace');
  const [wsForm, setWsForm] = useState({ name: workspace?.name || '' });
  const [saved, setSaved] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ['workspace-members'],
    queryFn: workspacesApi.getMembers,
    enabled: tab === 'team',
  });

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.getAll,
    enabled: tab === 'api-keys',
  });

  const updateWsMutation = useMutation({
    mutationFn: workspacesApi.update,
    onSuccess: (data) => {
      updateWorkspace(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: apiKeysApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); setNewKeyName(''); },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: apiKeysApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage workspace settings and integrations</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        {[
          { id: 'workspace', label: 'Workspace' },
          { id: 'team', label: 'Team' },
          { id: 'api-keys', label: 'API Keys' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* WORKSPACE SETTINGS */}
      {tab === 'workspace' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Workspace settings</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Workspace name</label>
                <input className="input" value={wsForm.name}
                  onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Workspace slug</label>
                <input className="input" value={workspace?.slug || ''} disabled
                  className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
                <p className="text-xs text-gray-400 mt-1">Slug cannot be changed</p>
              </div>
              <button
                className={`btn-primary ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                disabled={updateWsMutation.isPending}
                onClick={() => updateWsMutation.mutate(wsForm)}
              >
                {saved ? '✓ Saved' : updateWsMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="card p-5 mt-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h3 className="font-semibold text-red-900 text-sm">Danger zone</h3>
            </div>
            <p className="text-sm text-red-700 mb-3">Once you delete a workspace, there is no going back.</p>
            <button className="btn-danger py-1.5 px-3 text-xs">Delete workspace</button>
          </div>
        </div>
      )}

      {/* TEAM */}
      {tab === 'team' && (
        <div className="max-w-2xl">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Team members</h2>
              <button className="btn-primary py-1.5 px-3 text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> Invite member
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-brand-700 font-semibold text-xs">
                        {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {m.user.firstName} {m.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{m.user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${m.role === 'OWNER' ? 'badge-blue' : m.role === 'ADMIN' ? 'badge-yellow' : 'badge-gray'}`}>
                      {m.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API KEYS */}
      {tab === 'api-keys' && (
        <div className="max-w-2xl">
          <div className="card p-5 bg-amber-50 border-amber-200 mb-4">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                API keys give full access to your workspace. Keep them secret and never expose them in frontend code.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden mb-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-3">Create API key</h2>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Key name (e.g. Production)" value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)} />
                <button className="btn-primary whitespace-nowrap" disabled={!newKeyName || createKeyMutation.isPending}
                  onClick={() => createKeyMutation.mutate(newKeyName)}>
                  <Plus className="w-4 h-4" /> Create key
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No API keys yet</div>
              ) : apiKeys.map((ak: any) => (
                <div key={ak.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{ak.name}</div>
                    <div className="font-mono text-xs text-gray-500 truncate">
                      {ak.key.substring(0, 24)}••••••••
                    </div>
                    {ak.lastUsedAt && (
                      <div className="text-xs text-gray-400">
                        Last used: {new Date(ak.lastUsedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${ak.isActive ? 'badge-green' : 'badge-red'}`}>
                      {ak.isActive ? 'Active' : 'Revoked'}
                    </span>
                    <button onClick={() => copyKey(ak.key)}
                      className="text-gray-400 hover:text-brand-600 transition-colors" title="Copy key">
                      {copiedKey === ak.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { if (confirm('Delete API key?')) deleteKeyMutation.mutate(ak.id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Docs link */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Developer API</h3>
            <p className="text-sm text-gray-600 mb-3">
              Use the REST API to generate videos, list avatars, and integrate with your own systems.
            </p>
            <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm gap-2">
              <Key className="w-4 h-4" /> View API Docs (Swagger)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
