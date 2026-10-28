// Read every matching row without a reporting cap. An ID cursor avoids the
// growing offset cost of later pages and keeps equal timestamps unambiguous.
export async function readAnalyticsRows<T extends { id: string }>(
  loadPage: (pagination: { take: number; orderBy: { id: "asc" }; cursor?: { id: string }; skip?: number }) => Promise<T[]>,
): Promise<T[]> {
  const rows: T[] = [];
  const take = 500;
  let cursor: string | undefined;
  while (true) {
    const page = await loadPage({ take, orderBy: { id: "asc" }, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    rows.push(...page);
    if (page.length < take) return rows;
    cursor = page[page.length - 1].id;
  }
}
