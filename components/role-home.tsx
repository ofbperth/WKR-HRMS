import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoleHome({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="space-y-6">
    <div className="rounded-lg border border-emerald-100 bg-white/90 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="text-xs font-semibold text-emerald-600">WKR-HRMS</div>
      <h1 className="mt-1 text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
    {children ?? <Card><CardHeader><CardTitle>Phase 2 พร้อมใช้งาน</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">ระบบ Incident Report, Risk Log, Notification และ Audit log พร้อมสำหรับการทดสอบ</CardContent></Card>}
  </div>;
}
