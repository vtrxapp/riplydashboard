import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useCreateEvent } from '@/hooks/queries/useEvents';
import { CreateEventInputSchema, type CreateEventInput } from '@/types/event';
import { EVENT_CATEGORIES, categoryGradient } from '@/utils/constants';
import { fieldErrors } from '@/utils/validation';

interface FormState {
  title: string;
  category: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  pricing: 'free' | 'paid';
  priceAmount: string;
  capacity: number;
}

const INITIAL: FormState = {
  title: '',
  category: 'social',
  description: '',
  date: '',
  start_time: '',
  end_time: '',
  venue: '',
  pricing: 'free',
  priceAmount: '',
  capacity: 500,
};

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createEvent = useCreateEvent();

  const activeCat = EVENT_CATEGORIES.find((c) => c.id === form.category) ?? EVENT_CATEGORIES[0];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const buildInput = (): unknown => ({
    title: form.title,
    category: form.category,
    description: form.description,
    date: form.date,
    start_time: form.start_time,
    end_time: form.end_time,
    venue: form.venue,
    price: form.pricing === 'free' ? 'Free' : `$${form.priceAmount || '0'}`,
    capacity: form.capacity,
  });

  const handlePublish = () => {
    const result = CreateEventInputSchema.safeParse(buildInput());
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    createEvent.mutate(result.data as CreateEventInput, {
      onSuccess: () => {
        setForm(INITIAL);
        navigate('/admin/dashboard/funnel');
      },
    });
  };

  const label = (text: string) => <div className="field-label">{text}</div>;

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            {label('Cover')}
            <div
              style={{
                width: '100%',
                height: 150,
                borderRadius: 16,
                border: '2px dashed var(--color-border-strong)',
                background: categoryGradient(form.category) || activeCat.id,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="image" size={22} color="var(--color-brand-500)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Cover photo uses category color for now</div>
            </div>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              {label('Event Title')}
              <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Welcome Week Concert" className="text-input" style={{ height: 46, fontSize: 16, fontWeight: 700 }} />
              {errors.title && <ErrorText text={errors.title} />}
            </div>
            <div>
              {label('Category')}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EVENT_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => set('category', c.id)}
                    style={{
                      height: 34,
                      padding: '0 14px',
                      borderRadius: 999,
                      border: 'none',
                      background: form.category === c.id ? categoryGradient(c.id) : 'var(--color-surface-muted)',
                      color: form.category === c.id ? '#fff' : 'var(--color-text-secondary)',
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {label('About')}
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe the event — activities, guests, food, networking…"
                className="textarea"
              />
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {label('When & Where')}
            <div className="input-row">
              <Icon name="calendar" size={18} color="var(--color-brand-500)" />
              <input value={form.date} onChange={(e) => set('date', e.target.value)} placeholder="Date — 2026-08-15" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="input-row" style={{ flex: 1 }}>
                <Icon name="clock" size={17} color="var(--color-brand-500)" />
                <input value={form.start_time} onChange={(e) => set('start_time', e.target.value)} placeholder="Start" />
              </div>
              <div className="input-row" style={{ flex: 1 }}>
                <Icon name="clock" size={17} color="var(--color-text-faint)" />
                <input value={form.end_time} onChange={(e) => set('end_time', e.target.value)} placeholder="End" />
              </div>
            </div>
            <div className="input-row">
              <Icon name="mapPin" size={18} color="var(--color-brand-500)" />
              <input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Venue — e.g. Central Quad" />
            </div>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {label('Pricing & Capacity')}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['free', 'paid'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('pricing', p)}
                  style={{
                    flex: 1,
                    height: 40,
                    border: `1.5px solid ${form.pricing === p ? 'var(--color-brand-500)' : 'var(--color-border-strong)'}`,
                    borderRadius: 12,
                    background: form.pricing === p ? 'var(--color-brand-50)' : 'var(--color-surface)',
                    color: form.pricing === p ? 'var(--color-brand-500)' : 'var(--color-text-secondary)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            {form.pricing === 'paid' && (
              <div className="input-row">
                <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-green)' }}>$</span>
                <input value={form.priceAmount} onChange={(e) => set('priceAmount', e.target.value)} placeholder="0.00" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-faint)' }}>per ticket</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-alt)', border: '1.5px solid var(--color-border-strong)', borderRadius: 12, padding: '0 8px 0 14px', height: 46 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>Capacity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button variant="secondary" size="sm" icon onClick={() => set('capacity', Math.max(10, form.capacity - 10))} aria-label="Decrease capacity">
                  <Icon name="minus" size={15} />
                </Button>
                <span style={{ fontSize: 17, fontWeight: 800, minWidth: 48, textAlign: 'center' }}>{form.capacity}</span>
                <Button variant="primary" size="sm" icon onClick={() => set('capacity', form.capacity + 10)} aria-label="Increase capacity">
                  <Icon name="plus" size={15} color="#fff" />
                </Button>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 11 }}>
            <Button variant="secondary" onClick={() => setForm(INITIAL)} disabled={createEvent.isPending}>
              Reset
            </Button>
            <Button variant="primary" onClick={handlePublish} disabled={createEvent.isPending} style={{ flex: 1 }}>
              {createEvent.isPending ? (
                'Submitting…'
              ) : (
                <>
                  <Icon name="send" size={16} color="#fff" />
                  Publish Event
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return <div style={{ fontSize: 12.5, color: 'var(--color-red)', marginTop: 6, fontWeight: 600 }}>{text}</div>;
}
