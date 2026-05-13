export default function Loading() {
  return <div className="space-y-6">
    <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
    <div className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2">
      {Array.from({ length: 12 }).map((_, index) => <div key={index} className={index % 5 === 0 ? "h-28 animate-pulse rounded bg-slate-100 md:col-span-2" : "h-10 animate-pulse rounded bg-slate-100"} />)}
    </div>
  </div>;
}
