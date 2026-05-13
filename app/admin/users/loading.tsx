export default function Loading() {
  return <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full max-w-lg animate-pulse rounded bg-slate-100" />
    </div>
    <div className="rounded-lg border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
      </div>
      <div className="mt-4 h-10 w-32 animate-pulse rounded bg-emerald-100" />
    </div>
    <div className="rounded-lg border bg-white p-3">
      <div className="h-10 w-64 animate-pulse rounded bg-slate-100" />
    </div>
    <div className="overflow-hidden rounded-lg border bg-white">
      {Array.from({ length: 7 }).map((_, index) => <div key={index} className="grid grid-cols-6 gap-3 border-b p-3 last:border-b-0">
        {Array.from({ length: 6 }).map((__, cell) => <div key={cell} className="h-6 animate-pulse rounded bg-slate-100" />)}
      </div>)}
    </div>
  </div>;
}
