'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', workspaceName: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-7">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-sm">HA</span>
            </div>
            <span className="font-bold text-xl text-zinc-100">HelloAvatar</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Create your workspace</h1>
          <p className="text-zinc-500 mt-1.5 text-sm">Get 20 free credits — no card required</p>
        </div>

        <div className="bg-zinc-900 border border-white/[0.07] rounded-2xl p-7 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input className="input" placeholder="John" value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="label">Last name</label>
                <input className="input" placeholder="Doe" value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Work email</label>
              <input type="email" className="input" placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Workspace / Company name</label>
              <input className="input" placeholder="Acme Corp" value={form.workspaceName}
                onChange={(e) => setForm({ ...form, workspaceName: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min 8 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-base" disabled={isLoading}>
              {isLoading ? 'Creating workspace...' : 'Create free workspace →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-zinc-400 transition-colors">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-zinc-400 transition-colors">Privacy Policy</Link>
        </p>
        <p className="text-center text-sm text-zinc-600 mt-3">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
