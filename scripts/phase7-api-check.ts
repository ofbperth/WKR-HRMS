const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

type Session = { label: string; cookie: string };

async function login(email: string, password = "password"): Promise<Session> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error(`No session cookie for ${email}`);
  return { label: email, cookie };
}

async function expectStatus(session: Session, path: string, expected: number[]) {
  const res = await fetch(`${baseUrl}${path}`, { headers: { cookie: session.cookie }, redirect: "manual" });
  if (!expected.includes(res.status)) throw new Error(`${session.label} ${path}: expected ${expected.join("/")} got ${res.status}`);
  return res.status;
}

async function main() {
  const reporter = await login("reporter@hospital.local");
  const unit = await login("unitmanager@hospital.local");
  const rm = await login("rm@hospital.local");
  const admin = await login("admin@hospital.local");
  const executive = await login("executive@hospital.local");

  await expectStatus(reporter, "/api/incidents", [200]);
  await expectStatus(reporter, "/api/dashboard/rm", [403]);
  await expectStatus(unit, "/api/dashboard/unit", [200]);
  await expectStatus(unit, "/api/admin/users", [403]);
  await expectStatus(rm, "/api/dashboard/rm", [200]);
  await expectStatus(rm, "/api/admin/users", [403]);
  await expectStatus(executive, "/api/dashboard/executive", [200]);
  await expectStatus(executive, "/api/incidents/export", [403]);
  await expectStatus(admin, "/api/admin/users", [200]);
  await expectStatus(admin, "/api/admin/audit-logs", [200]);
  await expectStatus(admin, "/api/automation", [200]);

  console.log("Phase 7 API smoke check passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
