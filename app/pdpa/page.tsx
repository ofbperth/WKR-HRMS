import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function sanitizeNext(value: string | string[] | undefined) {
  const next = typeof value === "string" ? value : "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function PdpaNoticePage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const next = sanitizeNext(searchParams.next);

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white"><ShieldCheck size={24} /></div>
        <CardTitle className="text-2xl">คำประกาศเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล</CardTitle>
        <p className="text-sm text-slate-600">Personal Data Protection Notice</p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm leading-6 text-slate-700">
        <p>
          ระบบนี้เก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคลเท่าที่จำเป็นเพื่อการรายงานอุบัติการณ์
          การบริหารความเสี่ยง การพัฒนาคุณภาพและความปลอดภัยของผู้ป่วย การตรวจสอบย้อนหลัง
          และการปฏิบัติตามกฎหมายหรือระเบียบที่เกี่ยวข้อง
        </p>
        <p>
          ผู้ใช้งานต้องเข้าถึง ใช้ และบันทึกข้อมูลตามบทบาทหน้าที่เท่านั้น ห้ามนำข้อมูลออกไปใช้
          เปิดเผย หรือส่งต่อโดยไม่มีอำนาจหรือวัตถุประสงค์ที่ชอบด้วยกฎหมาย ข้อมูลจะถูกจำกัดสิทธิ์
          การเข้าถึง บันทึกประวัติการใช้งาน และเก็บรักษาเท่าที่จำเป็นตามนโยบายของหน่วยงาน
        </p>
        <p>
          หากต้องการใช้สิทธิของเจ้าของข้อมูล หรือมีข้อสงสัยเกี่ยวกับการคุ้มครองข้อมูลส่วนบุคคล
          โปรดติดต่อผู้ดูแลระบบหรือเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลของหน่วยงาน
        </p>
        <div className="rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
          การกด “รับทราบและดำเนินการต่อ” หมายถึงผู้ใช้งานรับทราบหน้าที่ในการใช้ข้อมูลอย่างเหมาะสม
          และยอมปฏิบัติตามมาตรการคุ้มครองข้อมูลส่วนบุคคลของระบบ
        </div>
        <div className="flex justify-end">
          <Link className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90" href={next}>รับทราบและดำเนินการต่อ</Link>
        </div>
      </CardContent>
    </Card>
  </main>;
}
