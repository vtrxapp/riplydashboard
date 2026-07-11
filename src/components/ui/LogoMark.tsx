export function LogoMark({ size = 38, light = false }: { size?: number; light?: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        flexShrink: 0,
        background: light ? 'rgba(255,255,255,0.18)' : 'var(--color-brand-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.46,
        letterSpacing: -0.5,
        boxShadow: light ? 'none' : '0 6px 14px rgba(2,162,240,0.35)',
      }}
    >
      R
    </div>
  );
}
