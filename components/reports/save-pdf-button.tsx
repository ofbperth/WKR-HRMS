"use client";

export function SavePdfButton() {
  return <button type="button" className="rounded-md border bg-white px-3 py-2 text-sm hover:bg-slate-50 print:hidden" onClick={() => window.print()}>
    Save PDF
  </button>;
}
