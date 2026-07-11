export const CATEGORY_COLORS: Record<string, string> = {
  social: '#FF5A8A',
  career: '#2F6BFF',
  academic: '#7C5CFF',
  sports: '#10B981',
  festival: '#FF6B6B',
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  social: 'linear-gradient(135deg,#FF5A8A,#FF8A3D)',
  career: 'linear-gradient(135deg,#2F6BFF,#6C4DF2)',
  academic: 'linear-gradient(135deg,#7C5CFF,#B06BFF)',
  sports: 'linear-gradient(135deg,#10B981,#06B6D4)',
  festival: 'linear-gradient(135deg,#FF6B6B,#FFB347)',
};

export const DEFAULT_GRADIENT = 'linear-gradient(135deg,#7C5CFF,#B06BFF)';

export function categoryColor(category?: string | null): string {
  return CATEGORY_COLORS[(category || '').toLowerCase()] || '#9AA3B2';
}

export function categoryGradient(category?: string | null): string {
  return CATEGORY_GRADIENTS[(category || '').toLowerCase()] || DEFAULT_GRADIENT;
}

export const EVENT_CATEGORIES = [
  { id: 'social', label: 'Social' },
  { id: 'career', label: 'Career' },
  { id: 'sports', label: 'Sports' },
  { id: 'academic', label: 'Academic' },
  { id: 'festival', label: 'Festival' },
] as const;

export const DATE_RANGES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
] as const;

export const PAGE_SIZE = 10;

export const STATUS_TONE: Record<string, 'green' | 'blue' | 'violet' | 'amber' | 'red' | 'neutral'> = {
  published: 'green',
  upcoming: 'blue',
  draft: 'neutral',
  pending: 'amber',
  archived: 'neutral',
  public: 'blue',
  private: 'violet',
  invite: 'amber',
};
