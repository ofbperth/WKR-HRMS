"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { RiskCode, Unit } from "@prisma/client";
import { createIncidentSchema } from "@/lib/validators";
import { severityDescriptions } from "@/lib/severity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";

type FormValues = z.infer<typeof createIncidentSchema>;

const defaultValues: Partial<FormValues> = {
  affectedType: "Patient",
  clinicalOrGeneral: "Clinical",
  severity: "C",
  needRmSupport: false,
  occurredDate: new Date().toISOString().slice(0, 10),
  occurredTime: new Date().toTimeString().slice(0, 5),
};

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <label className="space-y-1 text-sm font-medium text-slate-700"><span>{label}</span>{children}{error ? <p className="text-xs text-red-600">{error}</p> : null}</label>;
}

export function IncidentForm({ units, riskCodes }: { units: Unit[]; riskCodes: RiskCode[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [riskQuery, setRiskQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdNo, setCreatedNo] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(createIncidentSchema), defaultValues });
  const values = watch();
  const selectedClinicalOrGeneral = values.clinicalOrGeneral || "Clinical";
  const filteredRiskCodes = useMemo(() => {
    const q = riskQuery.trim().toLowerCase();
    return riskCodes
      .filter(r => r.clinicalOrGeneral === selectedClinicalOrGeneral)
      .filter(r => !q || `${r.code} ${r.nameTh} ${r.nameEn ?? ""} ${r.simpleCategory}`.toLowerCase().includes(q))
      .slice(0, 80);
  }, [riskCodes, riskQuery, selectedClinicalOrGeneral]);
  const selectedRisk = riskCodes.find(r => r.id === values.riskCodeId);

  useEffect(() => {
    if (selectedRisk && selectedRisk.clinicalOrGeneral !== selectedClinicalOrGeneral) {
      setValue("riskCodeId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setValue("simpleCategory", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setRiskQuery("");
    }
  }, [selectedClinicalOrGeneral, selectedRisk, setValue]);

  async function goToStep2() {
    const ok = await trigger(["occurredDate", "occurredTime", "incidentUnitId", "affectedType", "title", "description"]);
    if (!ok) {
      alert("กรุณากรอกข้อมูล Step 1 ให้ครบก่อน");
      return;
    }
    setStep(2);
  }

  async function goToStep3() {
    const ok = await trigger(["clinicalOrGeneral", "simpleCategory", "riskCodeId", "severity"]);
    if (!ok) {
      alert("กรุณาเลือกประเภทความเสี่ยง / Risk code / Severity ให้ครบก่อน");
      return;
    }
    setStep(3);
  }

  function onInvalid(formErrors: typeof errors) {
    const keys = Object.keys(formErrors);
    if (keys.some(k => ["occurredDate", "occurredTime", "incidentUnitId", "affectedType", "title", "description"].includes(k))) setStep(1);
    else if (keys.some(k => ["clinicalOrGeneral", "simpleCategory", "riskCodeId", "severity"].includes(k))) setStep(2);
    alert("ยังส่งรายงานไม่ได้: กรุณาตรวจสอบช่องที่จำเป็นให้ครบ");
  }

  function selectRiskCode(r: RiskCode) {
    setValue("riskCodeId", r.id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("simpleCategory", r.simpleCategory, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("clinicalOrGeneral", r.clinicalOrGeneral as "Clinical" | "General", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setRiskQuery(`${r.code} ${r.nameTh}`);
  }

  async function onSubmit(input: FormValues) {
    setSubmitting(true);
    const res = await fetch("/api/incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "บันทึกไม่สำเร็จ");
      return;
    }
    const incident = await res.json();
    setCreatedNo(incident.incidentNo);
    setTimeout(() => router.push(`/my-reports/${incident.id}`), 900);
  }

  if (createdNo) return <Card><CardHeader><CardTitle>ส่งรายงานสำเร็จ</CardTitle></CardHeader><CardContent><p className="text-slate-600">Incident No</p><div className="mt-2 text-3xl font-bold text-blue-700">{createdNo}</div><p className="mt-4 text-sm text-slate-500">กำลังพาไปหน้ารายละเอียด...</p></CardContent></Card>;

  return <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
    <div className="flex flex-wrap gap-2 text-sm">
      {[1,2,3].map(n => <button key={n} type="button" onClick={() => setStep(n)} className={`rounded-full border px-4 py-2 ${step === n ? "bg-primary text-white" : "bg-white"}`}>Step {n}</button>)}
    </div>

    {step === 1 ? <Card><CardHeader><CardTitle>Step 1: ข้อมูลเหตุการณ์</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="วันที่เกิดเหตุ" error={errors.occurredDate?.message}><Input type="date" {...register("occurredDate")} /></Field>
      <Field label="เวลาเกิดเหตุ" error={errors.occurredTime?.message}><Input type="time" {...register("occurredTime")} /></Field>
      <Field label="หน่วยงานที่เกิดเหตุ" error={errors.incidentUnitId?.message}><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("incidentUnitId")}><option value="">เลือกหน่วยงาน</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="สถานที่เกิดเหตุ"><Input placeholder="เช่น ห้องยา, ER zone 1, Ward" {...register("location")} /></Field>
      <Field label="ประเภทผู้ได้รับผลกระทบ"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("affectedType")}><option value="Patient">Patient</option><option value="Personnel">Personnel</option><option value="People">People</option><option value="Organization">Organization</option></select></Field>
      <Field label="Patient HN (optional / masked ตาม permission)"><Input placeholder="HN ถ้าเกี่ยวกับผู้ป่วย" {...register("patientHn")} /></Field>
      <div className="md:col-span-2"><Field label="ชื่อเหตุการณ์แบบสั้น" error={errors.title?.message}><Input placeholder="เช่น จ่ายยาผิดขนาดก่อนถึงผู้ป่วย" {...register("title")} /></Field></div>
      <div className="md:col-span-2"><Field label="รายละเอียดเหตุการณ์" error={errors.description?.message}><textarea className="min-h-32 w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("description")} /></Field></div>
      <div className="md:col-span-2"><Field label="การแก้ไขเบื้องต้น"><textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("immediateAction")} /></Field></div>
      <div className="md:col-span-2 flex justify-end"><Button type="button" onClick={goToStep2}>ถัดไป</Button></div>
    </CardContent></Card> : null}

    {step === 2 ? <Card><CardHeader><CardTitle>Step 2: ประเภทและความรุนแรง</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="Clinical / General"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("clinicalOrGeneral")}><option value="Clinical">Clinical</option><option value="General">General</option></select></Field>
      <Field label="SIMPLE category" error={errors.simpleCategory?.message}><Input placeholder="เช่น Medication & Blood Safety" {...register("simpleCategory")} /></Field>
      <div className="md:col-span-2 space-y-2">
        <Field label="Risk code พร้อม search/dropdown" error={errors.riskCodeId?.message}><Input value={riskQuery} onChange={e => setRiskQuery(e.target.value)} placeholder={`ค้นหาเฉพาะ ${selectedClinicalOrGeneral} code / ชื่อไทย / SIMPLE`} /></Field>
        <div className="max-h-60 overflow-auto rounded-lg border bg-white">
          {filteredRiskCodes.length ? filteredRiskCodes.map(r => <button type="button" key={r.id} onClick={() => selectRiskCode(r)} className={`block w-full border-b px-3 py-2 text-left text-sm hover:bg-slate-50 ${values.riskCodeId === r.id ? "bg-blue-50" : ""}`}><span className="font-semibold">{r.code}</span> {r.nameTh}<span className="ml-2 text-xs text-slate-500">{r.clinicalOrGeneral} · {r.simpleCategory}</span>{values.riskCodeId === r.id ? <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">เลือกแล้ว</span> : null}</button>) : <div className="px-3 py-4 text-sm text-slate-500">ไม่พบ Risk code ในกลุ่ม {selectedClinicalOrGeneral}</div>}
        </div>
      </div>
      <div className="md:col-span-2 space-y-3">
        <div className="text-sm font-semibold">Severity A-I</div>
        <div className="grid gap-2 md:grid-cols-3">
          {(Object.keys(severityDescriptions) as Array<keyof typeof severityDescriptions>).map(s => <label key={s} title={severityDescriptions[s]} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${values.severity === s ? "border-blue-500 bg-blue-50" : "bg-white"}`}><input type="radio" value={s} {...register("severity")} /><span><SeverityBadge severity={s} /><div className="mt-1 text-xs text-slate-600">{severityDescriptions[s]}</div></span></label>)}
        </div>
      </div>
      <label className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm font-medium"><input type="checkbox" {...register("needRmSupport")} />ต้องการความช่วยเหลือจาก RM</label>
      <div className="md:col-span-2 flex justify-between"><Button type="button" className="bg-slate-700" onClick={() => setStep(1)}>ย้อนกลับ</Button><Button type="button" onClick={goToStep3}>ถัดไป</Button></div>
    </CardContent></Card> : null}

    {step === 3 ? <Card><CardHeader><CardTitle>Step 3: ตรวจสอบและส่งรายงาน</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 text-sm">
        <Summary label="วันเวลาเกิดเหตุ" value={`${values.occurredDate || "-"} ${values.occurredTime || ""}`} />
        <Summary label="หน่วยงาน" value={units.find(u => u.id === values.incidentUnitId)?.name || "-"} />
        <Summary label="ชื่อเหตุการณ์" value={values.title || "-"} />
        <Summary label="Risk code" value={selectedRisk ? `${selectedRisk.code} ${selectedRisk.nameTh}` : "-"} />
        <Summary label="Severity" value={values.severity ? `Level ${values.severity}: ${severityDescriptions[values.severity]}` : "-"} />
        <Summary label="Need RM support" value={values.needRmSupport ? "Yes" : "No"} />
      </div>
      <div className="rounded-lg bg-slate-50 p-4 text-sm"><div className="font-semibold">รายละเอียด</div><p className="mt-1 whitespace-pre-wrap text-slate-600">{values.description || "-"}</p></div>
      <div className="flex justify-between"><Button type="button" className="bg-slate-700" onClick={() => setStep(2)}>ย้อนกลับ</Button><Button disabled={submitting} type="submit">{submitting ? "กำลังส่ง..." : "ส่งรายงาน"}</Button></div>
    </CardContent></Card> : null}
  </form>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}
