// @ts-check
/**
 * Build + deploy to Vercel, then update Supabase auth redirect URLs.
 *
 * Preserves the Vercel project link (.vercel/project.json) at the project
 * root so repeated deploys update the same project rather than creating a new
 * one each time (dist/ is wiped on every build).
 *
 * To enable automatic Supabase URL updates, add to .env:
 *   SUPABASE_ACCESS_TOKEN=<token from https://supabase.com/dashboard/account/tokens>
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const rootVercelDir = resolve(root, ".vercel");
const distVercelDir = resolve(distDir, ".vercel");
const rootProjectJson = resolve(rootVercelDir, "project.json");
const distProjectJson = resolve(distVercelDir, "project.json");

// ── 1. Build ──────────────────────────────────────────────────────────────────
console.log("Building...");
const build = spawnSync("npm", ["run", "build"], { stdio: "inherit" });
if (build.status !== 0) {
  console.error("Build failed.");
  process.exit(1);
}

// ── 2. Restore Vercel project link so this deploy updates the same project ────
if (existsSync(rootProjectJson)) {
  mkdirSync(distVercelDir, { recursive: true });
  copyFileSync(rootProjectJson, distProjectJson);
}

// ── 3. Deploy from dist/ ──────────────────────────────────────────────────────
console.log("\nDeploying to Vercel...");
const deploy = spawnSync("npx", ["vercel", "--prod", "--yes"], {
  // stderr → terminal (shows Vercel progress); stdout → captured (contains the URL)
  stdio: ["pipe", "pipe", "inherit"],
  encoding: "utf8",
  cwd: distDir,
});

// ── 4. Save the Vercel project link back for future deploys ───────────────────
if (existsSync(distProjectJson)) {
  mkdirSync(rootVercelDir, { recursive: true });
  copyFileSync(distProjectJson, rootProjectJson);
}

if (deploy.status !== 0) {
  console.error("\nDeployment failed. Try: npm run build && cd dist && npx vercel --prod");
  process.exit(1);
}

// Parse the deployed URL from Vercel output
const appUrl = (deploy.stdout ?? "").match(/https:\/\/\S+\.vercel\.app/)?.[0] ?? null;
if (appUrl) {
  console.log(`\n✓ Deployed: ${appUrl}`);
}

// ── 5. Update Supabase auth redirect URLs ─────────────────────────────────────
await updateSupabaseAuthUrls(appUrl);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a simple KEY=VALUE .env file into an object (no shell expansion).
 * @returns {Record<string, string>}
 */
function readEnv() {
  if (!existsSync(".env")) return {};
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split("\n")
      .flatMap((line) => {
        const m = line.match(/^([^=#\s][^=]*)=(.*)$/);
        return m ? [[m[1].trim(), m[2].trim().replace(/^["']|["']$/g, "")]] : [];
      })
  );
}

/**
 * Update Supabase project's site_url and uri_allow_list via Management API.
 * @param {string | null} appUrl
 */
async function updateSupabaseAuthUrls(appUrl) {
  const env = readEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? env.SUPABASE_ACCESS_TOKEN;

  if (!accessToken) {
    console.log(`
  ⚠ Supabase redirect URLs not auto-updated.
  To enable automatic updates on every deploy, add to .env:
    SUPABASE_ACCESS_TOKEN=<token from https://supabase.com/dashboard/account/tokens>

  Or update manually in Supabase Dashboard → Authentication → URL Configuration:
    Site URL:     ${appUrl ?? "<your vercel url>"}
    Redirect URL: ${appUrl ?? "<your vercel url>"}/**`);
    return;
  }

  if (!supabaseUrl || !appUrl) return;

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  try {
    // Fetch existing config so we don't wipe other redirect URLs
    const getRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!getRes.ok) throw new Error(`${getRes.status} ${await getRes.text()}`);
    const current = await getRes.json();

    const existing = (current.uri_allow_list ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const merged = [
      ...new Set([
        ...existing,
        appUrl,
        `${appUrl}/**`,
        "http://localhost:5173",
        "http://localhost:5173/**",
      ]),
    ].join(",");

    const patchRes = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ site_url: appUrl, uri_allow_list: merged }),
      }
    );
    if (!patchRes.ok) throw new Error(`${patchRes.status} ${await patchRes.text()}`);

    console.log(`✓ Supabase site URL updated to ${appUrl}`);
  } catch (err) {
    console.warn(`  Warning: Could not update Supabase auth URLs — ${err.message}`);
    console.log(`  Manually add ${appUrl} in Supabase Dashboard → Authentication → URL Configuration`);
  }
}
