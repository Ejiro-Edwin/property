import { BadRequestException } from '@nestjs/common';

export type SortOrder = 'asc' | 'desc';

export function buildSafeOrderBy(
  opts: {
    sortBy?: string;
    order?: string;
  },
  allowedFields: readonly string[],
  fallback: Record<string, SortOrder>,
) {
  if (!opts.sortBy) {
    return fallback;
  }

  if (!allowedFields.includes(opts.sortBy)) {
    throw new BadRequestException(`Invalid sortBy value: ${opts.sortBy}`);
  }

  const order: SortOrder = opts.order === 'asc' ? 'asc' : 'desc';
  return { [opts.sortBy]: order } as Record<string, SortOrder>;
}

