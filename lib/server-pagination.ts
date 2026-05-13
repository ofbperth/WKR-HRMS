export const DEFAULT_LIST_PAGE_SIZE = 10;
export const MAX_LIST_PAGE_SIZE = 50;

export function getPagingParams(url: URL, fallbackPageSize = DEFAULT_LIST_PAGE_SIZE) {
  const page = toBoundedInt(url.searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = toBoundedInt(url.searchParams.get("pageSize"), fallbackPageSize, 1, MAX_LIST_PAGE_SIZE);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPageMeta(page: number, pageSize: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasNextPage: safePage < totalPages,
  };
}

function toBoundedInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}
