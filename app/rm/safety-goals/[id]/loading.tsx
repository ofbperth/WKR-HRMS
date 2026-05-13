export default function Loading() {
  return <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-80 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
    </div>
    <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
    </div>
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-4 h-6 w-56 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded bg-slate-100" />)}
      </div>
    </div>
  </div>;
}
