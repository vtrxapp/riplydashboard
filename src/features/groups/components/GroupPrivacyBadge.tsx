import { Badge } from '@/components/ui/Badge';
import { STATUS_TONE } from '@/utils/constants';
import { titleCase } from '@/utils/format';

export function GroupPrivacyBadge({ privacy }: { privacy: string }) {
  return <Badge tone={STATUS_TONE[privacy] ?? 'neutral'}>{titleCase(privacy)}</Badge>;
}
