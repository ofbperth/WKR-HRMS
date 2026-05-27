"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, Hospital, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [googleNeedsMigration, setGoogleNeedsMigration] = useState(false);

  const externalError = useMemo(() => {
    if (typeof window === "undefined") return "";
    const code = new URLSearchParams(window.location.search).get("error");
    const messages: Record<string, string> = {
      GOOGLE_LOGIN_DISABLED: "Admin ปิด Google login ไว้",
      GOOGLE_DOMAIN_NOT_ALLOWED: "Google account นี้ไม่ได้อยู่ใน domain หรือ email ที่อนุญาต",
      GOOGLE_USER_NOT_REGISTERED: "บัญชีนี้ยังไม่ได้ลงทะเบียน กรุณาติดต่อ Admin",
      GOOGLE_EMAIL_NOT_VERIFIED: "Google email ยังไม่ได้ verify",
      USER_INACTIVE: "User นี้ถูกปิดใช้งาน กรุณาติดต่อ Admin",
      GOOGLE_USER_PENDING_APPROVAL: "สร้างบัญชีแล้วและกำลังรอ Admin อนุมัติ",
      GOOGLE_OAUTH_NOT_CONFIGURED: "ยังไม่ได้ตั้งค่า Google OAuth",
      google_disabled: "Admin ปิด Google login ไว้",
      google_not_configured: "ยังไม่ได้ตั้งค่า Google OAuth",
      google_needs_migration: "Google login ต้อง migrate database ก่อน",
      google_state_invalid: "Session ของ Google login ไม่ถูกต้อง กรุณาลองใหม่",
    };
    return code ? messages[code] || "Google login ไม่สำเร็จ" : "";
  }, []);

  useEffect(() => {
    setError(externalError);
    fetch("/api/auth/google/settings")
      .then(r => r.json())
      .then(data => {
        setGoogleEnabled(Boolean(data.googleEnabled));
        setGoogleConfigured(Boolean(data.configured));
        setGoogleNeedsMigration(Boolean(data.needsMigration));
      })
      .catch(() => {
        setGoogleEnabled(false);
        setGoogleConfigured(false);
      });
  }, [externalError]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const started = performance.now();
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
        setError(json?.error || "Email หรือ password ไม่ถูกต้อง หรือ user ถูกปิดใช้งาน");
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.info(`[perf] login-submit ${Math.round(performance.now() - started)}ms`);
      }
      router.replace(json?.redirectTo || "/dashboard");
    } catch (err) {
      console.error("Login failed", err);
      setError("เชื่อมต่อ login service ไม่ได้ กรุณาลองใหม่");
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
              <div className="text-sm font-medium text-slate-500">ระบบบริหารความเสี่ยงโรงพยาบาล</div>
            </div>
          </div>
          <div className="max-w-xl rounded-lg border border-emerald-100 bg-white/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
            <h1 className="text-2xl font-bold tracking-normal text-slate-950">กระบวนการบริหารความเสี่ยงโรงพยาบาล</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">ระบบรายงานและบริหารความเสี่ยงที่เน้นความเร็ว ความชัดเจน และการทำงานตามบทบาทของผู้ใช้</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-emerald-600" size={18} /><span>หน้าจอเรียบง่าย ช่วยให้รายงานอุบัติการณ์สำคัญได้ตรงจุด</span></div>
              <div className="flex items-start gap-3"><Activity className="mt-0.5 text-emerald-600" size={18} /><span>ใช้งานบนมือถือได้ดี และ Dashboard สแกนข้อมูลได้เร็ว</span></div>
              <div className="flex items-start gap-3"><Hospital className="mt-0.5 text-emerald-600" size={18} /><span>แยกขั้นตอนตามบทบาทของผู้รายงาน ทีม RM ผู้บริหาร และผู้ดูแลระบบ</span></div>
            </div>
          </div>
        </section>

        <Card className="w-full border-emerald-100 bg-white/95">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-lg bg-emerald-500 text-white shadow-[0_16px_30px_rgba(34,197,94,0.25)]"><Hospital size={34} /></div>
            <CardTitle className="text-2xl text-emerald-600">WKR-HRMS</CardTitle>
            <p className="text-sm text-muted-foreground">เข้าสู่ระบบรายงานและบริหารความเสี่ยงโรงพยาบาล</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">อีเมล</label>
                <Input id="email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">รหัสผ่าน</label>
                <div className="relative">
                  <Input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="pr-10" />
                  <Eye className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                </div>
              </div>
              {error ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
              <Button type="submit" className="w-full" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
              {googleEnabled && googleConfigured
                ? <a className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-emerald-50" href="/api/auth/google">เข้าสู่ระบบด้วย Google</a>
                : <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-xs leading-5 text-slate-600">{googleNeedsMigration ? "Google login ต้อง migration ก่อน" : googleEnabled ? "ยังไม่ได้ตั้งค่า Google Client ID/Secret" : "Admin ปิด Google login ไว้"}</div>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
