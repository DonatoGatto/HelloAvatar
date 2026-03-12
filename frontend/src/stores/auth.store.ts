import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  workspaces: any[];
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  credits: number;
  logoUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  workspace: Workspace | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (dto: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateWorkspace: (workspace: Partial<Workspace>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      workspace: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const data = await authApi.login({ email, password });
        localStorage.setItem('ha_token', data.token);
        set({ token: data.token, user: data.user, workspace: data.workspace, isLoading: false });
      },

      register: async (dto) => {
        set({ isLoading: true });
        const data = await authApi.register(dto);
        localStorage.setItem('ha_token', data.token);
        set({ token: data.token, user: data.user, workspace: data.workspace, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem('ha_token');
        set({ token: null, user: null, workspace: null });
      },

      fetchMe: async () => {
        const token = localStorage.getItem('ha_token');
        if (!token) return;
        try {
          const user = await authApi.me();
          const workspace = user.workspaces?.[0]?.workspace;
          set({ user, workspace, token });
        } catch {
          get().logout();
        }
      },

      updateWorkspace: (ws) => {
        set((state) => ({ workspace: state.workspace ? { ...state.workspace, ...ws } : null }));
      },
    }),
    { name: 'ha-auth', partialize: (s) => ({ token: s.token }) }
  )
);
