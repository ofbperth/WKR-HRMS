export default function Loading() {
  return <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
    </div>
    <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
    </div>
    <div className="flex flex-wrap gap-2">
      <div className="h-10 w-36 animate-pulse rounded-md border bg-white" />
      <div className="h-10 w-44 animate-pulse rounded-md border bg-white" />
    </div>
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="grid min-w-[760px] grid-cols-8 gap-px bg-slate-100 p-1">
        {Array.from({ length: 64 }).map((_, index) => <div key={index} className="h-12 animate-pulse rounded bg-white" />)}
      </div>
    </div>
  </div>;
}
