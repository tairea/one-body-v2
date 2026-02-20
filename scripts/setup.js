// @ts-check
import { input, password, select } from "@inquirer/prompts";
import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// ─── CLI helpers ─────────────────────────────────────────────────────────────

/**
 * Run a supabase CLI command and return parsed JSON output.
 * @param {string[]} args
 * @returns {any}
 */
function supabaseJSON(args) {
  const result = spawnSync("npx", ["supabase", ...args, "--output", "json"], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `supabase ${args[0]} failed`);
  }
  return JSON.parse(result.stdout);
}

/**
 * Run a supabase CLI command with stdio inherited (interactive).
 * @param {string[]} args
 */
function supabaseInteractive(args) {
  const result = spawnSync("npx", ["supabase", ...args], {
    stdio: "inherit",
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`supabase ${args[0]} failed`);
  }
}

function isLoggedIn() {
  try {
    supabaseJSON(["orgs", "list"]);
    return true;
  } catch {
    return false;
  }
}

/** @returns {string} */
function generatePassword() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Poll until project status is ACTIVE_HEALTHY or timeout.
 * @param {string} projectRef
 */
async function waitForProject(projectRef) {
  const maxMs = 180_000;
  const start = Date.now();
  process.stdout.write("  Waiting for project");
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, 5000));
    process.stdout.write(".");
    try {
      const projects = supabaseJSON(["projects", "list"]);
      const project = projects.find((p) => p.id === projectRef);
      if (project?.status === "ACTIVE_HEALTHY") {
        console.log(" ready!");
        return;
      }
    } catch {
      // keep polling
    }
  }
  throw new Error("Project did not become ready within 3 minutes.");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n✦ One Body Community Setup\n");

  // ── 1. Community branding ────────────────────────────────────────────────
  console.log("Community branding\n");

  const communityName = await input({
    message: "Community name:",
    default: "My Community",
  });

  const communityTagline = await input({
    message: "Community tagline:",
    default: "Connected by purpose",
  });

  const logoPath = await input({
    message: "Path to community logo image (leave blank to skip):",
    default: "",
  });

  if (logoPath && !existsSync(logoPath)) {
    console.error(`\nLogo file not found: ${logoPath}`);
    process.exit(1);
  }

  // ── 2. Supabase auth ─────────────────────────────────────────────────────
  console.log("\nSupabase setup\n");

  if (!isLoggedIn()) {
    console.log("Opening browser for Supabase login...\n");
    supabaseInteractive(["login"]);
  } else {
    console.log("✓ Already logged in to Supabase");
  }

  // ── 3. Organisation ──────────────────────────────────────────────────────
  const orgs = supabaseJSON(["orgs", "list"]);
  let orgId;
  if (orgs.length === 1) {
    orgId = orgs[0].id;
    console.log(`✓ Organisation: ${orgs[0].name}`);
  } else {
    orgId = await select({
      message: "Select organisation:",
      choices: orgs.map((o) => ({ name: o.name, value: o.id })),
    });
  }

  // ── 4. Project config ────────────────────────────────────────────────────
  const projectName = await input({
    message: "Supabase project name:",
    default: "one-body",
  });

  const rawPassword = await password({
    message: "Database password (press Enter to auto-generate):",
    mask: "*",
  });
  const dbPassword = rawPassword || generatePassword();

  const region = await select({
    message: "Region:",
    choices: [
      { name: "US East — N. Virginia", value: "us-east-1" },
      { name: "US West — Oregon", value: "us-west-1" },
      { name: "EU West — Ireland", value: "eu-west-1" },
      { name: "EU Central — Frankfurt", value: "eu-central-1" },
      { name: "AP Southeast — Singapore", value: "ap-southeast-1" },
      { name: "AP Northeast — Tokyo", value: "ap-northeast-1" },
    ],
  });

  // ── 5. Create project ────────────────────────────────────────────────────
  console.log("\nCreating project...");
  const project = supabaseJSON([
    "projects",
    "create",
    projectName,
    "--org-id",
    orgId,
    "--db-password",
    dbPassword,
    "--region",
    region,
  ]);
  const projectRef = project.id;
  console.log(`✓ Project created: ${projectRef}`);

  await waitForProject(projectRef);

  // ── 6. Fetch API keys ────────────────────────────────────────────────────
  console.log("Fetching API keys...");
  const keys = supabaseJSON(["projects", "api-keys", "--project-ref", projectRef]);
  const anonKey = keys.find((k) => k.name === "anon")?.api_key;
  const serviceKey = keys.find((k) => k.name === "service_role")?.api_key;
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  console.log("✓ API keys fetched");

  // ── 7. Link CLI ──────────────────────────────────────────────────────────
  console.log("Linking CLI...");
  spawnSync(
    "npx",
    ["supabase", "link", "--project-ref", projectRef, "--password", dbPassword],
    { stdio: "inherit", encoding: "utf8" }
  );
  console.log("✓ CLI linked");

  // ── 8. Apply migrations ──────────────────────────────────────────────────
  console.log("Applying database migrations...");
  supabaseInteractive(["db", "push"]);
  console.log("✓ Migrations applied");

  // ── 9. Upload community logo ─────────────────────────────────────────────
  let logoUrl = "";
  if (logoPath) {
    console.log("Uploading community logo...");
    const client = createClient(supabaseUrl, serviceKey);
    const file = readFileSync(logoPath);
    const ext = logoPath.split(".").pop();
    const storagePath = `logo.${ext}`;
    const { error } = await client.storage
      .from("community-assets")
      .upload(storagePath, file, { upsert: true });
    if (error) {
      console.warn(`  Warning: logo upload failed — ${error.message}`);
    } else {
      logoUrl = `${supabaseUrl}/storage/v1/object/public/community-assets/${storagePath}`;
      console.log("✓ Logo uploaded");
    }
  }

  // ── 10. Write .env ───────────────────────────────────────────────────────
  const lines = [
    `VITE_SUPABASE_URL=${supabaseUrl}`,
    `VITE_SUPABASE_ANON_KEY=${anonKey}`,
    `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`,
    `VITE_COMMUNITY_NAME=${communityName}`,
    `VITE_COMMUNITY_TAGLINE=${communityTagline}`,
    logoUrl ? `VITE_COMMUNITY_LOGO_URL=${logoUrl}` : `# VITE_COMMUNITY_LOGO_URL=`,
    `# OPENCAGE_API_KEY=  ← add your key from opencagedata.com`,
  ];
  writeFileSync(".env", lines.join("\n") + "\n");
  console.log("✓ .env written");

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log(`
✨ Your community is ready!

  Community:  ${communityName}
  Project:    ${supabaseUrl}

Next steps:
  1. Add your OPENCAGE_API_KEY to .env  (geocoding for location fields)
     Get a free key at: https://opencagedata.com
  2. Run:   npm run dev
  3. Visit: http://localhost:5173
`);
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
