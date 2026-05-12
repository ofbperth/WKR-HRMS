export default function Loading() {
  return <div className="space-y-6">
    <div className="flex justify-between gap-4">
      <div className="space-y-2"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="h-4 w-80 animate-pulse rounded bg-slate-100" /></div>
      <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="h-96 animate-pulse rounded-lg border bg-white lg:col-span-2" />
      <div className="h-96 animate-pulse rounded-lg border bg-white" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="h-80 animate-pulse rounded-lg border bg-white" />
      <div className="h-80 animate-pulse rounded-lg border bg-white" />
    </div>
  </div>;
}
