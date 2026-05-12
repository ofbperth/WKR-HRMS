"use client";

import { FormEvent, useState } from "react";
import { Activity, Eye, Hospital, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@hospital.local");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Email หรือ password ไม่ถูกต้อง / user ถูกปิดใช้งาน");
        return;
      }

      window.location.assign(json?.redirectTo || "/dashboard");
    } catch (err) {
      console.error("Login failed", err);
      setError("ไม่สามารถเชื่อมต่อระบบ login ได้ กรุณาดู error ใน terminal / console");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f7fffb_0%,#eefaf3_46%,#f8fbff_100%)] p-4">
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_430px] lg:items-center">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-emerald-500 text-white shadow-[0_16px_30px_rgba(34,197,94,0.28)]"><Hospital size={30} /></div>
            <div>
              <div className="text-3xl font-bold tracking-normal text-emerald-600">WKR-HRMS</div>
              <div className="text-sm font-medium text-slate-500">Hospital Risk Management System</div>
            </div>
          </div>
          <div className="max-w-xl rounded-lg border border-emerald-100 bg-white/82 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">UI/UX Design Direction</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">ระบบรายงานและบริหารความเสี่ยงที่เน้นความเร็ว ความชัดเจน และการทำงานตามบทบาทของผู้ใช้</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-emerald-600" size={18} /><span>One screen, one intention สำหรับงาน incident สำคัญ</span></div>
              <div className="flex items-start gap-3"><Activity className="mt-0.5 text-emerald-600" size={18} /><span>Mobile-first และ dashboard ที่สแกนข้อมูลได้เร็ว</span></div>
              <div className="flex items-start gap-3"><Hospital className="mt-0.5 text-emerald-600" size={18} /><span>Role-based workflow สำหรับ Reporter, RM, Executive และ Admin</span></div>
            </div>
          </div>
        </section>

        <Card className="w-full border-emerald-100 bg-white/94">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-lg bg-emerald-500 text-white shadow-[0_16px_30px_rgba(34,197,94,0.25)]"><Hospital size={34} /></div>
            <CardTitle className="text-2xl text-emerald-600">WKR-HRMS</CardTitle>
            <p className="text-sm text-muted-foreground">เข้าสู่ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <Eye className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                </div>
              </div>
              {error ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-5 text-slate-600">
                ตัวอย่าง: admin@hospital.local / password
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
