export function DashboardChartsSkeleton() {
  return <div className="dashboard-chart-grid">
    {Array.from({ length: 4 }).map((_, index) => <div key={index} className="dashboard-card rounded-lg border bg-white p-5">
      <div className="h-5 w-48 rounded bg-slate-100" />
      <div className="mt-6 h-64 animate-pulse rounded-lg bg-slate-100" />
    </div>)}
  </div>;
}
