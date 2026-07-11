import { Badge } from '@/components/ui/Badge';
import { STATUS_TONE } from '@/utils/constants';
import { titleCase } from '@/utils/format';

export function EventStatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'}>{titleCase(status)}</Badge>;
}
