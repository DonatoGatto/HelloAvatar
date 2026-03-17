'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi, apiKeysApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Key, Plus, Trash2, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
        <p className="text-zinc-500 mt-1">Manage workspace settings and integrations</p>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-white/[0.06] rounded-xl p-1 w-fit mb-6">
        {[
          { id: 'workspace', label: 'Workspace' },
          { id: 'team', label: 'Team' },
          { id: 'api-keys', label: 'API Keys' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* WORKSPACE SETTINGS */}
      {tab === 'workspace' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <h2 className="font-semibold text-zinc-100 mb-4">Workspace settings</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Workspace name</label>
                <input className="input" value={wsForm.name}
                  onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Workspace slug</label>
                <input className="input bg-zinc-800/50 text-zinc-600 cursor-not-allowed" value={workspace?.slug || ''} disabled />
                <p className="text-xs text-zinc-600 mt-1">Slug cannot be changed</p>
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

          <div className="card p-5 mt-4" style={{borderColor:'rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.05)'}}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-red-400 text-sm">Danger zone</h3>
            </div>
            <p className="text-sm text-red-400/70 mb-3">Once you delete a workspace, there is no going back.</p>
            <button
              className="py-1.5 px-3 text-xs rounded-lg font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              onClick={() => alert('Please contact support to delete your workspace.')}
            >Delete workspace</button>
          </div>
        </div>
      )}

      {/* TEAM */}
      {tab === 'team' && (
        <div className="max-w-2xl">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="font-semibold text-zinc-100">Team members</h2>
              <button
                className="btn-primary py-1.5 px-3 text-xs gap-1"
                onClick={() => alert('Team invitations coming soon!')}
              >
                <Plus className="w-3.5 h-3.5" /> Invite member
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {members.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">No team members yet</div>
              ) : members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                      <span className="text-indigo-300 font-semibold text-xs">
                        {m.user.firstName?.[0]}{m.user.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        {m.user.firstName} {m.user.lastName}
                      </div>
                      <div className="text-xs text-zinc-500">{m.user.email}</div>
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
          <div className="card p-4 mb-4" style={{borderColor:'rgba(245,158,11,0.2)',background:'rgba(245,158,11,0.05)'}}>
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300/80">
                API keys give full access to your workspace. Keep them secret and never expose them in frontend code.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden mb-4">
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="font-semibold text-zinc-100 mb-3">Create API key</h2>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Key name (e.g. Production)" value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)} />
                <button className="btn-primary whitespace-nowrap" disabled={!newKeyName || createKeyMutation.isPending}
                  onClick={() => createKeyMutation.mutate(newKeyName)}>
                  <Plus className="w-4 h-4" /> Create key
                </button>
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-sm">No API keys yet</div>
              ) : apiKeys.map((ak: any) => (
                <div key={ak.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Key className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-200">{ak.name}</div>
                    <div className="font-mono text-xs text-zinc-500 truncate">
                      {ak.key.substring(0, 24)}••••••••
                    </div>
                    {ak.lastUsedAt && (
                      <div className="text-xs text-zinc-600">
                        Last used: {new Date(ak.lastUsedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${ak.isActive ? 'badge-green' : 'badge-red'}`}>
                      {ak.isActive ? 'Active' : 'Revoked'}
                    </span>
                    <button onClick={() => copyKey(ak.key)}
                      className="text-zinc-500 hover:text-indigo-400 transition-colors" title="Copy key">
                      {copiedKey === ak.key ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { if (confirm('Delete API key?')) deleteKeyMutation.mutate(ak.id); }}
                      className="text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Docs link */}
          <div className="card p-5">
            <h3 className="font-semibold text-zinc-100 mb-2">Developer API</h3>
            <p className="text-sm text-zinc-500 mb-3">
              Use the REST API to generate videos, list avatars, and integrate with your own systems.
            </p>
            <a href="http://localhost:4000/api/docs" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm gap-2">
              <ExternalLink className="w-4 h-4" /> View API Docs (Swagger)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
