"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AI_RCA_PRIVACY_NOTICE, buildGeminiRcaPrompt, GEMINI_CANVAS_URL, shouldShowAiRcaAssistant, type AiRcaPromptIncident } from "@/lib/ai-rca-assistant";
import type { Role } from "@/lib/types";

export function AiRcaAssistantCard({ incident, role }: { incident: AiRcaPromptIncident; role: Role | string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const prompt = buildGeminiRcaPrompt(incident);

  if (!shouldShowAiRcaAssistant(pathname, role)) return null;

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = prompt;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setToast("คัดลอก RCA Prompt แล้ว กรุณาตรวจว่าไม่มีข้อมูลระบุตัวตนก่อนวางใน Gemini");
    window.setTimeout(() => setToast(null), 4000);
  }

  function openGemini() {
    window.open(GEMINI_CANVAS_URL, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return <>
    <Card className="border-emerald-200 bg-emerald-50/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-emerald-950">
          <Sparkles className="h-5 w-5" />
          <span>AI RCA Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-emerald-950">
        <p>เปิด Gemini Canvas ได้จากตรงนี้โดยไม่ส่งข้อมูลอัตโนมัติ และระบบจะช่วยเตือนเรื่อง privacy ก่อนทุกครั้ง</p>
        <Button type="button" className="w-full bg-emerald-700 hover:bg-emerald-800" onClick={() => setOpen(true)}>
          ✨ ช่วยวิเคราะห์ RCA ด้วย Gemini
        </Button>
      </CardContent>
    </Card>

    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">AI RCA Assistant</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{AI_RCA_PRIVACY_NOTICE}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            ระบบจะไม่ส่งข้อมูลไปที่ Gemini เอง คุณต้องตรวจ prompt และวางเองด้วยตนเอง
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="flex-1 bg-slate-800 hover:bg-slate-900" onClick={copyPrompt}>Copy RCA Prompt</Button>
            <Button type="button" className="flex-1 bg-emerald-700 hover:bg-emerald-800" onClick={openGemini}>เปิด Gemini Canvas</Button>
          </div>
          <button type="button" className="w-full text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline" onClick={() => setOpen(false)}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div> : null}

    {toast ? <div className="fixed right-4 top-4 z-[60] max-w-md rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
      {toast}
    </div> : null}
  </>;
}
