import type { CSSProperties } from 'react';

export type IconName =
  | 'grid'
  | 'calendar'
  | 'users'
  | 'funnel'
  | 'activity'
  | 'chat'
  | 'bell'
  | 'plus'
  | 'sun'
  | 'moon'
  | 'chevronDown'
  | 'check'
  | 'checkCircle'
  | 'x'
  | 'search'
  | 'trash'
  | 'logout'
  | 'building'
  | 'mail'
  | 'lock'
  | 'user'
  | 'eye'
  | 'eyeOff'
  | 'clock'
  | 'mapPin'
  | 'ticket'
  | 'heart'
  | 'group'
  | 'send'
  | 'up'
  | 'down'
  | 'star'
  | 'trendingDown'
  | 'image'
  | 'minus';

const PATHS: Record<IconName, string> = {
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke-linecap="round"/>',
  users: '<circle cx="8" cy="9" r="2.6"/><circle cx="16" cy="9" r="2.6"/><path d="M3.5 18c0-2.4 2-3.8 4.5-3.8M20.5 18c0-2.4-2-3.8-4.5-3.8M9 18c0-2 1.4-3.2 3-3.2s3 1.2 3 3.2" stroke-linecap="round"/>',
  funnel: '<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" stroke-linejoin="round"/>',
  activity: '<path d="M3 12h4l2.5-6 5 14 2.5-8H21" stroke-linecap="round" stroke-linejoin="round"/>',
  chat: '<path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V16.5H6a2 2 0 0 1-2-2Z" stroke-linejoin="round"/>',
  bell: '<path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" stroke-linejoin="round"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" stroke-linecap="round"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" stroke-linejoin="round"/>',
  chevronDown: '<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7" stroke-linecap="round" stroke-linejoin="round"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M7 7l10 10M17 7L7 17" stroke-linecap="round"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2" stroke-linecap="round"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a2 2 0 0 1-2 1.9H9.8a2 2 0 0 1-2-1.9L7 7" stroke-linecap="round" stroke-linejoin="round"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>',
  building: '<path d="M12 3.5 4 7v1.5h16V7l-8-3.5Z" stroke-linejoin="round"/><path d="M6 11v6M10 11v6M14 11v6M18 11v6M4 19.5h16" stroke-linecap="round"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7 7.5 5.5L19.5 7" stroke-linejoin="round"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke-linecap="round"/>',
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6" stroke-linecap="round"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.7"/>',
  eyeOff: '<path d="M4 4l16 16" stroke-linecap="round"/><path d="M9.5 5.8A8.7 8.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M6.4 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a8.6 8.6 0 0 0 3.3-.65" stroke-linecap="round" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5l3 2" stroke-linecap="round"/>',
  mapPin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  ticket: '<path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.7 1.7 0 0 0 0 3.3 1.7 1.7 0 0 0 0 3.4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.7 1.7 0 0 0 0-3.4 1.7 1.7 0 0 0 0-3.3Z" stroke-linejoin="round"/>',
  heart: '<path d="M12 20S4 15 4 9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 8 2.5C20 15 12 20 12 20Z" stroke-linejoin="round"/>',
  group: '<circle cx="9" cy="9" r="2.4"/><circle cx="16" cy="9" r="2.4"/><path d="M4 18c0-2 1.6-3.2 4-3.2M20 18c0-2-1.6-3.2-4-3.2" stroke-linecap="round"/>',
  send: '<path d="M4 12l16-7-7 16-2.5-6.5L4 12Z"/>',
  up: '<path d="M12 19V5m0 0-6 6m6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/>',
  down: '<path d="M12 5v14m0 0-6-6m6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  star: '<path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9 6.2 20.95l1.1-6.45-4.7-4.6 6.5-.95L12 2.5Z"/>',
  trendingDown: '<path d="M4 6l7 7 3-3 6 6" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 16v-4h-4" stroke-linecap="round" stroke-linejoin="round"/>',
  image: '<rect x="3.5" y="6" width="17" height="13" rx="3"/><circle cx="12" cy="12.5" r="3"/><path d="M8.5 6l1-2h5l1 2" stroke-linejoin="round"/>',
};

const FILLED: Partial<Record<IconName, boolean>> = { send: true, star: true };

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.9, style, className }: IconProps) {
  const isFilled = FILLED[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? color : 'none'}
      stroke={isFilled ? 'none' : color}
      strokeWidth={isFilled ? undefined : strokeWidth}
      style={{ flexShrink: 0, ...style }}
      className={className}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
