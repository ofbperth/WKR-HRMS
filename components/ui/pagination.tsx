import Link from "next/link";
import type { ReactNode } from "react";

type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 10;

export function getPage(value: string | string[] | undefined, total: number, pageSize = PAGE_SIZE) {
  const raw = typeof value === "string" ? Number(value) : 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return Math.min(Math.floor(raw), totalPages);
}

export function pageSlice<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function Pagination({ basePath, searchParams, page, total, pageSize = PAGE_SIZE }: { basePath: string; searchParams: SearchParams; page: number; total: number; pageSize?: number }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const pages = pageWindow(page, totalPages);

  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-sm">
    <div className="text-slate-600">แสดง {start}-{end} จาก {total} รายการ</div>
    <div className="flex flex-wrap items-center gap-1">
      <PageLink basePath={basePath} searchParams={searchParams} page={Math.max(1, page - 1)} disabled={page === 1}>ก่อนหน้า</PageLink>
      {pages[0] > 1 ? <><PageLink basePath={basePath} searchParams={searchParams} page={1}>1</PageLink><span className="px-2 text-slate-400">...</span></> : null}
      {pages.map((item) => <PageLink key={item} basePath={basePath} searchParams={searchParams} page={item} active={item === page}>{item}</PageLink>)}
      {pages[pages.length - 1] < totalPages ? <><span className="px-2 text-slate-400">...</span><PageLink basePath={basePath} searchParams={searchParams} page={totalPages}>{totalPages}</PageLink></> : null}
      <PageLink basePath={basePath} searchParams={searchParams} page={Math.min(totalPages, page + 1)} disabled={page === totalPages}>ถัดไป</PageLink>
    </div>
  </div>;
}

function PageLink({ basePath, searchParams, page, children, active = false, disabled = false }: { basePath: string; searchParams: SearchParams; page: number; children: ReactNode; active?: boolean; disabled?: boolean }) {
  const href = buildHref(basePath, searchParams, page);
  const className = `inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 ${active ? "border-primary bg-primary text-white" : "bg-white text-slate-700 hover:bg-slate-50"} ${disabled ? "pointer-events-none opacity-50" : ""}`;
  return <Link className={className} href={href} aria-current={active ? "page" : undefined}>{children}</Link>;
}

function buildHref(basePath: string, searchParams: SearchParams, page: number) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "page") return;
    if (typeof value === "string" && value) query.set(key, value);
  });
  if (page > 1) query.set("page", String(page));
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function pageWindow(page: number, totalPages: number) {
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}
