import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RoleHome({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-slate-600">{description}</p></div>
    {children ?? <Card><CardHeader><CardTitle>Phase 2 พร้อมใช้งาน</CardTitle></CardHeader><CardContent className="text-sm text-slate-600">ระบบ Incident Report, Risk Log, Notification และ Audit log พร้อมสำหรับการทดสอบ</CardContent></Card>}
  </div>;
}
