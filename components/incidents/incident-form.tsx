"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import type { z } from "zod";
import { createIncidentSchema, medicationRightValues } from "@/lib/validators";
import { clinicalSeverityDescriptions, generalSeverityDetails, severityDescriptions, severityOptionsFor } from "@/lib/severity";
import { containsLikelyPatientIdentifier } from "@/lib/pdpa-guard";
import type { DbRiskCode, DbUnit } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimeInput } from "@/components/ui/time-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import { formatBangkokDateInput, formatBangkokTimeInput, formatDateInputDisplay } from "@/lib/format";

type FormValues = z.infer<typeof createIncidentSchema>;

const defaultValues: Partial<FormValues> = {
  affectedType: "Patient",
  clinicalOrGeneral: "Clinical",
  severity: "C",
  needRmSupport: false,
  occurredDate: formatBangkokDateInput(new Date()),
  occurredTime: formatBangkokTimeInput(new Date()),
};

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return <label className="grid min-w-0 gap-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}{error ? <p className="text-xs text-red-600">{error}</p> : null}</label>;
}

export function IncidentForm({ units, riskCodes }: { units: DbUnit[]; riskCodes: DbRiskCode[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [riskQuery, setRiskQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdNo, setCreatedNo] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(createIncidentSchema), defaultValues });
  const values = watch();
  const selectedClinicalOrGeneral = values.clinicalOrGeneral || "Clinical";
  const severityOptions = useMemo(() => severityOptionsFor(selectedClinicalOrGeneral), [selectedClinicalOrGeneral]);
  const filteredRiskCodes = useMemo(() => {
    const q = riskQuery.trim().toLowerCase();
    return riskCodes
      .filter(r => r.clinicalOrGeneral === selectedClinicalOrGeneral)
      .filter(r => !q || `${r.code} ${r.nameTh} ${r.nameEn ?? ""} ${r.simpleCategory}`.toLowerCase().includes(q))
      .slice(0, 80);
  }, [riskCodes, riskQuery, selectedClinicalOrGeneral]);
  const selectedRisk = riskCodes.find(r => r.id === values.riskCodeId);
  const isMedicationAdministration = selectedRisk?.code === "CPM205" || /Administration/i.test(selectedRisk?.nameTh ?? "");
  const pdpaNameDetected = containsLikelyPatientIdentifier([values.title, values.description, values.immediateAction].filter(Boolean).join(" "));

  useEffect(() => {
    if (selectedRisk && selectedRisk.clinicalOrGeneral !== selectedClinicalOrGeneral) {
      setValue("riskCodeId", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setValue("simpleCategory", "", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setRiskQuery("");
    }
    if (values.severity && !(severityOptions as readonly string[]).includes(values.severity)) {
      setValue("severity", severityOptions[0], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }
  }, [selectedClinicalOrGeneral, selectedRisk, setValue, severityOptions, values.severity]);

  async function goToStep2() {
    const ok = await trigger(["occurredDate", "occurredTime", "incidentUnitId", "affectedType", "title", "description"]);
    if (!ok) {
      alert("กรุณากรอกข้อมูลส่วนที่ 1 ให้ครบก่อน");
      return;
    }
    setStep(2);
  }

  async function goToStep3() {
    const ok = await trigger(["clinicalOrGeneral", "riskCodeId", "severity"]);
    if (!ok) {
      alert("กรุณาเลือกกลุ่มเหตุการณ์ / NRLS code / ระดับความรุนแรง ให้ครบก่อน");
      return;
    }
    setStep(3);
  }

  function onInvalid(formErrors: typeof errors) {
    const keys = Object.keys(formErrors);
    if (keys.some(k => ["occurredDate", "occurredTime", "incidentUnitId", "affectedType", "title", "description"].includes(k))) setStep(1);
    else if (keys.some(k => ["clinicalOrGeneral", "riskCodeId", "severity"].includes(k))) setStep(2);
    alert("ยังส่งรายงานไม่ได้: กรุณาตรวจสอบช่องที่จำเป็นให้ครบ");
  }

  function selectRiskCode(r: DbRiskCode) {
    setValue("riskCodeId", r.id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("simpleCategory", r.simpleCategory, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue("clinicalOrGeneral", r.clinicalOrGeneral as "Clinical" | "General", { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setRiskQuery(`${r.code} ${r.nameTh}`);
  }

  async function onSubmit(input: FormValues) {
    if (pdpaNameDetected) {
      alert("ไม่ให้ลงข้อมูลส่วนตัวผู้ป่วยลงในรายละเอียด");
      setStep(1);
      return;
    }
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

  if (createdNo) return <Card><CardHeader><CardTitle>ส่งรายงานสำเร็จ</CardTitle></CardHeader><CardContent><p className="text-slate-600">เลขที่รายงาน</p><div className="mt-2 text-3xl font-bold text-blue-700">{createdNo}</div><p className="mt-4 text-sm text-slate-500">กำลังพาไปหน้ารายละเอียด...</p></CardContent></Card>;

  return <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mx-auto max-w-5xl space-y-5">
    <div className="rounded-lg border border-emerald-100 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          { n: 1, title: "เหตุการณ์" },
          { n: 2, title: "ประเภท / ความรุนแรง" },
          { n: 3, title: "ตรวจสอบ" },
        ].map(item => <button key={item.n} type="button" onClick={() => setStep(item.n)} className={`flex min-h-12 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${step === item.n ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${step === item.n ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item.n}</span>
          <span><span className="block text-xs uppercase text-slate-500">ส่วนที่ {item.n}</span><span className="font-semibold">{item.title}</span></span>
        </button>)}
      </div>
    </div>

    {step === 1 ? <Card><CardHeader><CardTitle className="text-xl">ส่วนที่ 1: ข้อมูลเหตุการณ์</CardTitle><p className="mt-1 text-sm text-slate-500">ระบุเวลา หน่วยงาน และรายละเอียดเหตุการณ์ที่จำเป็น</p></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="วันที่เกิดเหตุ" error={errors.occurredDate?.message}>
        <DateInput value={values.occurredDate ?? ""} onChange={(value) => setValue("occurredDate", value, { shouldValidate: true, shouldDirty: true, shouldTouch: true })} />
        <input type="hidden" {...register("occurredDate")} />
      </Field>
      <Field label="เวลาเกิดเหตุ" error={errors.occurredTime?.message}><TimeInput {...register("occurredTime")} /></Field>
      <Field label="หน่วยงานที่เกิดเหตุ" error={errors.incidentUnitId?.message}><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("incidentUnitId")}><option value="">เลือกหน่วยงาน</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
      <Field label="สถานที่เกิดเหตุ"><Input placeholder="เช่น ห้องยา, ER zone 1, Ward" {...register("location")} /></Field>
      <Field label="ผู้ได้รับผลกระทบ"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("affectedType")}><option value="Patient">ผู้ป่วย</option><option value="Personnel">บุคลากร</option><option value="People">ประชาชน/ผู้มาติดต่อ</option><option value="Organization">องค์กร/ระบบงาน</option></select></Field>
      <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
        <Field label="HN ผู้ป่วย (ถ้ามี)"><Input placeholder="ระบบจะปิดบังตามสิทธิ์ผู้ใช้งาน" {...register("patientHn")} /></Field>
        <Field label="AN ผู้ป่วย (ถ้ามี)"><Input placeholder="สำหรับผู้ป่วยใน ระบบจะปิดบังตามสิทธิ์" {...register("patientAn")} /></Field>
      </div>
      <div className="md:col-span-2"><Field label="ชื่อเหตุการณ์แบบสั้น" error={errors.title?.message}><Input placeholder="เช่น จ่ายยาผิดขนาดก่อนถึงผู้ป่วย" {...register("title")} /></Field></div>
      {pdpaNameDetected ? <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">ไม่ให้ลงข้อมูลส่วนตัวผู้ป่วยลงในรายละเอียด</div> : null}
      <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium leading-6 text-red-800">
        ห้ามใส่ชื่อ-นามสกุล หรือข้อมูลที่สามารถระบุตัวตนผู้ป่วยในรายละเอียดเหตุการณ์ เพื่อให้เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ให้ใช้ HN/AN ในช่องที่กำหนดเท่านั้น และบันทึกเฉพาะข้อมูลที่จำเป็นต่อการบริหารความเสี่ยง
      </div>
      <div className="md:col-span-2"><Field label="รายละเอียดเหตุการณ์" error={errors.description?.message}><textarea className="min-h-32 w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("description")} /></Field></div>
      <div className="md:col-span-2"><Field label="การแก้ไขเบื้องต้น"><textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm" {...register("immediateAction")} /></Field></div>
      <div className="md:col-span-2 flex flex-wrap justify-end gap-2 border-t pt-4"><Button type="button" onClick={goToStep2}>ถัดไป</Button></div>
    </CardContent></Card> : null}

    {step === 2 ? <Card><CardHeader><CardTitle className="text-xl">ส่วนที่ 2: ประเภทและความรุนแรง</CardTitle><p className="mt-1 text-sm text-slate-500">เลือกกลุ่มเหตุการณ์ NRLS code และระดับความรุนแรง</p></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="กลุ่มเหตุการณ์"><select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("clinicalOrGeneral")}><option value="Clinical">เกี่ยวกับการดูแลรักษาผู้ป่วย</option><option value="General">ทั่วไป / ระบบงาน / สิ่งแวดล้อม</option></select></Field>
      <Field label="หมวด SIMPLE จาก NRLS code"><Input value={selectedRisk?.simpleCategory ?? ""} readOnly placeholder="ระบบจะเติมให้อัตโนมัติหลังเลือก NRLS code" className="bg-slate-50 text-slate-700" /><input type="hidden" {...register("simpleCategory")} /></Field>
      <div className="md:col-span-2 space-y-2">
        <Field label="NRLS code" error={errors.riskCodeId?.message}><Input value={riskQuery} onChange={e => setRiskQuery(e.target.value)} placeholder={`ค้นหารหัส NRLS / ชื่อเหตุการณ์ / หมวด SIMPLE`} /></Field>
        <p className="text-xs leading-5 text-slate-500">เลือก NRLS code แล้วระบบจะกำหนดหมวด SIMPLE ให้อัตโนมัติ ผู้รายงานไม่ต้องเลือกหมวดเอง</p>
        <div className="max-h-72 overflow-auto rounded-lg border bg-white">
          {filteredRiskCodes.length ? filteredRiskCodes.map(r => <button type="button" key={r.id} onClick={() => selectRiskCode(r)} className={`block w-full border-b px-3 py-2 text-left text-sm hover:bg-slate-50 ${values.riskCodeId === r.id ? "bg-blue-50" : ""}`}><span className="font-semibold">{r.code}</span> {r.nameTh}<span className="ml-2 text-xs text-slate-500">{r.clinicalOrGeneral === "Clinical" ? "ดูแลรักษาผู้ป่วย" : "ทั่วไป"} · SIMPLE {r.simpleCategory}</span>{values.riskCodeId === r.id ? <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white">เลือกแล้ว</span> : null}</button>) : <div className="px-3 py-4 text-sm text-slate-500">ไม่พบ NRLS code ในกลุ่มนี้</div>}
        </div>
      </div>
      {isMedicationAdministration ? <Field label="ความถูกต้องในการบริหารยา 6 Rights" error={errors.medicationRight?.message}>
        <select className="h-10 w-full rounded-md border bg-white px-3 text-sm" {...register("medicationRight")}>
          <option value="">เลือก 6 Rights ที่เกี่ยวข้อง</option>
          {medicationRightValues.map((right) => <option key={right} value={right}>{right}</option>)}
        </select>
      </Field> : null}
      <div className="md:col-span-2 space-y-3">
        <div>
          <div className="text-sm font-semibold">{selectedClinicalOrGeneral === "General" ? "ระดับความรุนแรงทั่วไป 1-5" : "ระดับความรุนแรงทางคลินิก A-I"}</div>
          {selectedClinicalOrGeneral === "General" ? <p className="mt-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">เหตุการณ์ทั่วไปใช้คะแนน 1-5 สำหรับผลกระทบต่อการดำเนินงาน ทรัพย์สิน และชื่อเสียง หากเหตุการณ์มีอันตรายต่อชีวิตหรือร่างกายผู้ป่วย/บุคลากร ให้เลือกกลุ่มเหตุการณ์เกี่ยวกับการดูแลรักษาผู้ป่วยที่ใช้ระดับ A-I แทน</p> : null}
        </div>
        {selectedClinicalOrGeneral === "General" ? <div className="grid gap-2">
          {severityOptions.map(s => {
            const detail = generalSeverityDetails[s as keyof typeof generalSeverityDetails];
            return <label key={s} title={severityDescriptions[s]} className={`cursor-pointer rounded-lg border p-3 ${values.severity === s ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
              <div className="flex items-start gap-3">
                <input type="radio" value={s} {...register("severity")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={s} /><span className="text-sm font-semibold">{detail.label}</span></div>
                  <p className="mt-1 text-xs text-slate-700">{detail.summary}</p>
                  <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-3">
                    <div>{detail.people}</div>
                    <div>{detail.property}</div>
                    <div>{detail.reputation}</div>
                  </div>
                </div>
              </div>
            </label>;
          })}
        </div> : <div className="grid items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {severityOptions.map(s => <label key={s} title={clinicalSeverityDescriptions[s]} className={`grid min-h-32 cursor-pointer grid-cols-[1.25rem_1fr] gap-3 rounded-lg border p-4 ${values.severity === s ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
            <input className="mt-0.5" type="radio" value={s} {...register("severity")} />
            <span className="grid min-w-0 content-start gap-2">
              <span className="h-7"><SeverityBadge severity={s} /></span>
              <span className="text-sm leading-6 text-slate-700">{clinicalSeverityDescriptions[s]}</span>
            </span>
          </label>)}
        </div>}
      </div>
      <label className="md:col-span-2 flex w-fit items-center gap-3 rounded-lg border bg-white p-3 text-sm font-medium"><input type="checkbox" {...register("needRmSupport")} />ต้องการความช่วยเหลือจาก RM</label>
      <div className="md:col-span-2 flex flex-wrap justify-between gap-2 border-t pt-4"><Button type="button" className="bg-slate-700" onClick={() => setStep(1)}>ย้อนกลับ</Button><Button type="button" onClick={goToStep3}>ถัดไป</Button></div>
    </CardContent></Card> : null}

    {step === 3 ? <Card><CardHeader><CardTitle className="text-xl">ส่วนที่ 3: ตรวจสอบและส่งรายงาน</CardTitle><p className="mt-1 text-sm text-slate-500">ตรวจความถูกต้องก่อนส่งรายงานเข้าสู่ระบบ</p></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <Summary label="วันเวลาเกิดเหตุ" value={`${formatDateInputDisplay(values.occurredDate) || "-"} ${values.occurredTime || ""}`} />
        <Summary label="หน่วยงาน" value={units.find(u => u.id === values.incidentUnitId)?.name || "-"} />
        <Summary label="ชื่อเหตุการณ์" value={values.title || "-"} />
        <Summary label="NRLS code" value={selectedRisk ? `${selectedRisk.code} ${selectedRisk.nameTh}` : "-"} />
        <Summary label="หมวด SIMPLE" value={selectedRisk?.simpleCategory ?? "-"} />
        <Summary label="ระดับความรุนแรง" value={values.severity ? `ระดับ ${values.severity}: ${severityDescriptions[values.severity]}` : "-"} />
        <Summary label="ต้องการให้ทีม RM ช่วยดูแล" value={values.needRmSupport ? "ต้องการ" : "ไม่ต้องการ"} />
      </div>
      <div className="rounded-lg border bg-slate-50 p-4 text-sm"><div className="font-semibold">รายละเอียด</div><p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">{values.description || "-"}</p></div>
      <div className="flex flex-wrap justify-between gap-2 border-t pt-4"><Button type="button" className="bg-slate-700" onClick={() => setStep(2)}>ย้อนกลับ</Button><Button disabled={submitting} type="submit">{submitting ? "กำลังส่ง..." : "ส่งรายงาน"}</Button></div>
    </CardContent></Card> : null}
  </form>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 font-medium">{value}</div></div>;
}

function DateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [displayValue, setDisplayValue] = useState(formatDateInputDisplay(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(formatDateInputDisplay(value));
  }, [value]);

  function openPicker() {
    const picker = pickerRef.current;
    if (!picker) return;
    picker.focus();
    try {
      picker.showPicker?.();
    } catch {
      picker.click();
    }
  }

  return <div className="relative flex h-10 overflow-hidden rounded-lg border border-input bg-white transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
    <Input
      type="text"
      inputMode="none"
      autoComplete="off"
      placeholder="DD/MM/YYYY"
      value={displayValue}
      readOnly
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      className="h-full flex-1 cursor-pointer rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0"
    />
    <button
      type="button"
      aria-label="เลือกวันที่"
      onClick={openPicker}
      className="grid h-full w-11 shrink-0 place-items-center border-l text-slate-600 hover:bg-slate-50"
    >
      <Calendar aria-hidden="true" className="h-4 w-4" />
    </button>
    <input
      ref={pickerRef}
      type="date"
      value={value}
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      onChange={(event) => {
        onChange(event.currentTarget.value);
        setDisplayValue(formatDateInputDisplay(event.currentTarget.value));
      }}
    />
  </div>;
}
