export default function Loading() {
  return <main className="min-h-screen bg-slate-50 p-4 lg:p-8">
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-lg bg-emerald-100" />
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-64 max-w-[70vw] animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border bg-white" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-lg border bg-white" />)}
      </div>
    </div>
  </main>;
}
