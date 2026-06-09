type EmailMetric = { label: string; value: number };
type EmailListItem = { label: string; value: number };
type EmailActionItem = {
  incidentNo: string;
  unit: string;
  severity: string;
  rcaStatus: string;
  dueText: string;
  linkUrl: string;
};

export const WEEKLY_SUMMARY_EMAIL_SUBJECT = "[WKR-HRMS] สรุปความเสี่ยงและ RCA ประจำสัปดาห์";

export type RmSummaryEmailTemplateInput = {
  recipientName: string;
  scopeLabel: string;
  generatedAtLabel: string;
  windowLabel: string;
  incidentMetrics: EmailMetric[];
  topRiskGroups: EmailListItem[];
  rcaMetrics: EmailMetric[];
  actionItems: EmailActionItem[];
  dashboardUrl: string;
  rcaUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMetricCards(items: EmailMetric[]) {
  return items
    .map(
      (item) => `
      <div style="flex:1 1 140px;border:1px solid #dbe3ea;border-radius:14px;padding:14px 16px;background:#f8fafc;">
        <div style="font-size:12px;line-height:18px;color:#475569;">${escapeHtml(item.label)}</div>
        <div style="margin-top:8px;font-size:28px;line-height:32px;font-weight:700;color:#0f172a;">${item.value}</div>
      </div>`,
    )
    .join("");
}

function renderTopRiskGroups(items: EmailListItem[]) {
  if (!items.length) return `<div style="font-size:14px;line-height:22px;color:#64748b;">ไม่มี incident ใหม่ในช่วง 7 วันที่ผ่านมา</div>`;
  return `
    <ol style="margin:0;padding-left:18px;color:#0f172a;">
      ${items
        .map((item) => `<li style="margin:0 0 8px 0;font-size:14px;line-height:22px;">${escapeHtml(item.label)} <strong>${item.value}</strong></li>`)
        .join("")}
    </ol>`;
}

function renderActionItems(items: EmailActionItem[]) {
  if (!items.length) {
    return `<div style="font-size:14px;line-height:22px;color:#64748b;">ไม่มีรายการ RCA ที่ใกล้ครบกำหนดหรือเกินกำหนดในช่วง 7 วันถัดไป</div>`;
  }
  return `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #dbe3ea;font-size:12px;color:#64748b;">Incident</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #dbe3ea;font-size:12px;color:#64748b;">Unit</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #dbe3ea;font-size:12px;color:#64748b;">Severity</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #dbe3ea;font-size:12px;color:#64748b;">RCA Status</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #dbe3ea;font-size:12px;color:#64748b;">Due</th>
          <th style="text-align:left;padding:10px;border-bottom:1px solid #dbe3ea;font-size:12px;color:#64748b;">Link</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (item) => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #eef2f7;font-size:14px;color:#0f172a;">${escapeHtml(item.incidentNo)}</td>
              <td style="padding:10px;border-bottom:1px solid #eef2f7;font-size:14px;color:#0f172a;">${escapeHtml(item.unit)}</td>
              <td style="padding:10px;border-bottom:1px solid #eef2f7;font-size:14px;color:#0f172a;">${escapeHtml(item.severity)}</td>
              <td style="padding:10px;border-bottom:1px solid #eef2f7;font-size:14px;color:#0f172a;">${escapeHtml(item.rcaStatus)}</td>
              <td style="padding:10px;border-bottom:1px solid #eef2f7;font-size:14px;color:#b45309;">${escapeHtml(item.dueText)}</td>
              <td style="padding:10px;border-bottom:1px solid #eef2f7;font-size:14px;"><a href="${escapeHtml(item.linkUrl)}" style="color:#0f766e;text-decoration:none;">เปิดรายการ</a></td>
            </tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

export function renderRmSummaryEmail(input: RmSummaryEmailTemplateInput) {
  const html = `
  <!doctype html>
  <html lang="th">
    <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;padding:24px 12px;">
        <div style="background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #dbe3ea;">
          <div style="padding:28px;background:linear-gradient(135deg,#0f766e,#155e75);color:#ffffff;">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.88;">WKR-HRMS Scheduled Summary</div>
            <h1 style="margin:10px 0 0 0;font-size:28px;line-height:34px;">สรุปความเสี่ยงและ RCA ประจำสัปดาห์</h1>
            <p style="margin:10px 0 0 0;font-size:14px;line-height:22px;">${escapeHtml(input.scopeLabel)} | ช่วงข้อมูล ${escapeHtml(input.windowLabel)}</p>
            <p style="margin:6px 0 0 0;font-size:13px;line-height:20px;opacity:.92;">สร้างเมื่อ ${escapeHtml(input.generatedAtLabel)}</p>
          </div>

          <div style="padding:24px;">
            <p style="margin:0 0 20px 0;font-size:15px;line-height:24px;">เรียน ${escapeHtml(input.recipientName)}, รายงานนี้สรุปเฉพาะข้อมูล aggregate และรายการติดตาม RCA ที่ไม่เปิดเผยข้อมูลผู้ป่วย</p>

            <section style="margin-bottom:28px;">
              <h2 style="margin:0 0 12px 0;font-size:20px;">1. New Incident Summary</h2>
              <div style="display:flex;flex-wrap:wrap;gap:12px;">${renderMetricCards(input.incidentMetrics)}</div>
              <div style="margin-top:16px;">
                <div style="font-size:14px;line-height:22px;font-weight:700;color:#0f172a;margin-bottom:8px;">Top 5 Risk Groups</div>
                ${renderTopRiskGroups(input.topRiskGroups)}
              </div>
            </section>

            <section style="margin-bottom:28px;">
              <h2 style="margin:0 0 12px 0;font-size:20px;">2. RCA Reminder</h2>
              <div style="display:flex;flex-wrap:wrap;gap:12px;">${renderMetricCards(input.rcaMetrics)}</div>
            </section>

            <section style="margin-bottom:28px;">
              <h2 style="margin:0 0 12px 0;font-size:20px;">3. Action Required</h2>
              ${renderActionItems(input.actionItems)}
            </section>

            <section>
              <h2 style="margin:0 0 12px 0;font-size:20px;">4. Secure Links</h2>
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                <a href="${escapeHtml(input.dashboardUrl)}" style="display:inline-block;padding:12px 16px;border-radius:12px;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;">เปิด Dashboard</a>
                <a href="${escapeHtml(input.rcaUrl)}" style="display:inline-block;padding:12px 16px;border-radius:12px;background:#e2e8f0;color:#0f172a;text-decoration:none;font-weight:700;">เปิดหน้า RCA</a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </body>
  </html>`;

  const text = [
    "WKR-HRMS Scheduled Summary",
    `สรุปความเสี่ยงและ RCA ประจำสัปดาห์ (${input.scopeLabel})`,
    `ช่วงข้อมูล ${input.windowLabel}`,
    `สร้างเมื่อ ${input.generatedAtLabel}`,
    "",
    `เรียน ${input.recipientName}`,
    "รายงานนี้เป็น aggregate summary และ RCA reminder โดยไม่มีข้อมูลระบุตัวผู้ป่วย",
    "",
    "1. New Incident Summary",
    ...input.incidentMetrics.map((item) => `- ${item.label}: ${item.value}`),
    ...input.topRiskGroups.map((item, index) => `${index + 1}. ${item.label}: ${item.value}`),
    "",
    "2. RCA Reminder",
    ...input.rcaMetrics.map((item) => `- ${item.label}: ${item.value}`),
    "",
    "3. Action Required",
    ...(input.actionItems.length
      ? input.actionItems.map((item) => `- ${item.incidentNo} | ${item.unit} | ${item.severity} | ${item.rcaStatus} | ${item.dueText} | ${item.linkUrl}`)
      : ["- ไม่มีรายการที่ต้องติดตามในช่วง 7 วันถัดไป"]),
    "",
    "4. Secure Links",
    `- Dashboard: ${input.dashboardUrl}`,
    `- RCA: ${input.rcaUrl}`,
  ].join("\n");

  return { html, text };
}
