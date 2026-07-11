import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockFrom, mockSelect, mockEq, mockIlike, mockRange } = vi.hoisted(() => {
  const mockRange = vi.fn();
  const mockOrder = vi.fn(() => ({ range: mockRange }));
  const mockIlike = vi.fn(() => ({ order: mockOrder }));
  const mockEq = vi.fn(() => ({ order: mockOrder, ilike: mockIlike }));
  const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder, ilike: mockIlike }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockFrom, mockSelect, mockEq, mockIlike, mockOrder, mockRange };
});

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { fetchEvents } from '../events.service';

describe('events.service fetchEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRange.mockResolvedValue({
      data: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Welcome Week Concert',
          category: 'social',
          date: '2026-08-01',
          status: 'published',
          likes: 10,
          attendee_count: 100,
          capacity: 200,
          price: 'Free',
          created_at: '2026-07-01T00:00:00.000Z',
          image_url: null,
          org: 'UMSU',
        },
      ],
      error: null,
      count: 1,
    });
  });

  it('requests the events table with the correct columns', async () => {
    await fetchEvents({});
    expect(mockFrom).toHaveBeenCalledWith('events');
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('id, title, category'), { count: 'exact' });
  });

  it('filters by status when provided', async () => {
    await fetchEvents({ status: 'published' });
    expect(mockEq).toHaveBeenCalledWith('status', 'published');
  });

  it('applies a case-insensitive title search', async () => {
    await fetchEvents({ search: 'concert' });
    expect(mockIlike).toHaveBeenCalledWith('title', '%concert%');
  });

  it('parses and returns paged rows with a total count', async () => {
    const result = await fetchEvents({ page: 1, pageSize: 10 });
    expect(result.totalCount).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].title).toBe('Welcome Week Concert');
  });

  it('throws a normalized AppError when Supabase returns an error', async () => {
    mockRange.mockResolvedValueOnce({ data: null, error: { message: 'permission denied', code: '42501' }, count: null });
    await expect(fetchEvents({})).rejects.toThrow('permission denied');
  });
});
