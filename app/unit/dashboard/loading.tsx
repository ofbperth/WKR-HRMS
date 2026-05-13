export default function Loading() {
  return <div className="space-y-6">
    <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
    <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded bg-slate-100" />)}
    </div>
    <div className="dashboard-stat-grid">
      {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-lg border bg-white" />)}
    </div>
    <div className="dashboard-chart-grid">
      {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-lg border bg-white" />)}
    </div>
  </div>;
}
