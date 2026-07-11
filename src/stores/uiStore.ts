import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DateRangeId } from '@/types/analytics';

export type Theme = 'light' | 'dark';
export type Scope = 'mine' | 'campus';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface UiState {
  theme: Theme;
  toggleTheme: () => void;

  scope: Scope;
  setScope: (scope: Scope) => void;

  range: DateRangeId;
  setRange: (range: DateRangeId) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  toasts: ToastState[];
  showToast: (message: string, tone?: ToastState['tone']) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

/**
 * Cross-cutting UI state that isn't server data: theme, active "scope"
 * filter, sidebar open/closed, and the toast queue. Persisted to
 * localStorage so theme/scope survive a refresh, replacing the old
 * approach of holding all of this in one 1700-line component's useState.
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      scope: 'campus',
      setScope: (scope) => set({ scope }),

      range: '30d',
      setRange: (range) => set({ range }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      toasts: [],
      showToast: (message, tone = 'success') => {
        const id = ++toastId;
        set({ toasts: [...get().toasts, { id, message, tone }] });
        setTimeout(() => {
          set({ toasts: get().toasts.filter((t) => t.id !== id) });
        }, 3200);
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: 'riply-admin-ui',
      partialize: (state) => ({ theme: state.theme, scope: state.scope, range: state.range }) as UiState,
    },
  ),
);
