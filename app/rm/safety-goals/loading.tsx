export default function Loading() {
  return <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-slate-100" />
    </div>
    <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-lg border bg-white" />)}
    </div>
  </div>;
}
