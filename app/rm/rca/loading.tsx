export default function Loading() {
  return <div className="space-y-4">
    <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
    <div className="overflow-hidden rounded-xl border bg-white">
      {Array.from({ length: 8 }).map((_, index) => <div key={index} className="grid grid-cols-4 gap-4 border-b p-4">
        <div className="h-4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 animate-pulse rounded bg-slate-100" />
      </div>)}
    </div>
  </div>;
}
