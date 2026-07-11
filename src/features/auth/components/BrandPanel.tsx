import { LogoMark } from '@/components/ui/LogoMark';

const STATS: [string, string][] = [
  ['120+', 'Campus clubs'],
  ['28K', 'Active students'],
  ['1.4K', 'Events / yr'],
];

export function BrandPanel() {
  return (
    <div
      style={{
        flexShrink: 0,
        width: '46%',
        minWidth: 380,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#0E84E0 0%,#19BFFF 55%,#2FD2D2 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        boxSizing: 'border-box',
        color: '#fff',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 2px,transparent 2px,transparent 22px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', top: -90, right: -80 }}
      />
      <div
        aria-hidden="true"
        style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', bottom: 40, left: -70 }}
      />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <LogoMark size={48} light />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1 }}>RIPLY</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
            ANALYTICS · ADMIN
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 'auto' }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, lineHeight: 1.12 }}>
          The campus engagement command center.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)', marginTop: 18, maxWidth: 420 }}>
          Track active students, approve events, monitor groups, and message organizers — all from one dashboard
          built for university administrators.
        </p>

        <div style={{ display: 'flex', gap: 34, marginTop: 34 }}>
          {STATS.map(([num, label]) => (
            <div key={label}>
              <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>{num}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.82)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 34, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        © {new Date().getFullYear()} Riply · University engagement platform
      </div>
    </div>
  );
}
