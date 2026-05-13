import { spawn, type ChildProcess } from "node:child_process";

const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const parsedBaseUrl = new URL(baseUrl);
const hostname = parsedBaseUrl.hostname === "localhost" ? "127.0.0.1" : parsedBaseUrl.hostname;
const port = parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "80");
const canAutoStartServer = ["localhost", "127.0.0.1", "::1"].includes(parsedBaseUrl.hostname);

type Session = { label: string; cookie: string };
type Cleanup = () => void;

function formatServerHint() {
  return [
    `Phase 7 API smoke check could not reach ${baseUrl}.`,
    canAutoStartServer
      ? "The script tried to start the local Next.js server automatically, but it was not ready in time."
      : "Start the target API server or set APP_BASE_URL/NEXTAUTH_URL to the correct reachable URL.",
    "",
    "Manual fallback:",
    "  npm run dev",
    "  npm run test:phase7",
    "",
    "If another port is used, set APP_BASE_URL, for example:",
    "  $env:APP_BASE_URL='http://127.0.0.1:3001'; npm run test:phase7",
  ].join("\n");
}

async function request(url: string, init?: RequestInit) {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? error.cause : undefined;
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: unknown }).code)
        : undefined;

    if (code === "ECONNREFUSED" || error instanceof TypeError) {
      throw new Error(formatServerHint(), { cause: error });
    }

    throw error;
  }
}

async function isServerReachable() {
  try {
    await request(baseUrl, { method: "GET", redirect: "manual" });
    return true;
  } catch {
    return false;
  }
}

function startServer() {
  if (!canAutoStartServer || process.env.PHASE7_SKIP_SERVER_START === "1") {
    return undefined;
  }

  const child = spawn(
    `npm run dev -- --hostname ${hostname} --port ${port}`,
    [],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const showLogs = process.env.PHASE7_SHOW_SERVER_LOGS === "1";
  child.stdout?.on("data", (chunk) => {
    if (showLogs) process.stdout.write(chunk);
  });
  child.stderr?.on("data", (chunk) => {
    if (showLogs) process.stderr.write(chunk);
  });

  return child;
}

function stopServer(child: ChildProcess | undefined) {
  if (!child?.pid || child.killed) return;

  if (process.platform === "win32") {
    spawn(`taskkill /pid ${child.pid} /T /F`, [], {
      shell: true,
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

async function waitForServer(child: ChildProcess | undefined) {
  const startedAt = Date.now();
  const timeoutMs = Number(process.env.PHASE7_SERVER_TIMEOUT_MS || 60_000);

  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReachable()) return;

    if (child?.exitCode !== null) {
      throw new Error(formatServerHint());
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(formatServerHint());
}

async function ensureServerReady(): Promise<Cleanup> {
  if (await isServerReachable()) return () => {};

  const child = startServer();
  await waitForServer(child);

  return () => stopServer(child);
}

async function login(email: string, password = "password"): Promise<Session> {
  const res = await request(`${baseUrl}/api/auth/login`, {
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
  const res = await request(`${baseUrl}${path}`, { headers: { cookie: session.cookie }, redirect: "manual" });
  if (!expected.includes(res.status)) throw new Error(`${session.label} ${path}: expected ${expected.join("/")} got ${res.status}`);
  return res.status;
}

async function main() {
  const cleanup = await ensureServerReady();

  try {
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
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
