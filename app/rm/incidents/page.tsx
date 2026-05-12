import { redirect } from "next/navigation";

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value) query.set(key, value);
  });
  redirect(`/rm/search${query.toString() ? `?${query.toString()}` : ""}`);
}
