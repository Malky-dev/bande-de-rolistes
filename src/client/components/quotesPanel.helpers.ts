export function buildQuotesPageWindow(
  current: number,
  total: number,
  radius = 3,
): number[] {
  const start = Math.max(1, current - radius);
  const end = Math.min(total, current + radius);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export function getQuotesRangeLabel(
  page: number,
  totalItems: number,
  pageSize: number,
): string {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(totalItems, page * pageSize);
  return `${from}-${to} / ${totalItems}`;
}

export function getQuotesReloadPageAfterDelete(
  itemsLength: number,
  page: number,
): number {
  return itemsLength === 1 && page > 1 ? page - 1 : page;
}
