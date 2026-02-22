// @ts-check
import { confirm, input, password, select } from "@inquirer/prompts";
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

  let logoPath = "";
  while (true) {
    logoPath = await input({
      message: "Path to community logo image (leave blank or type 'skip' to skip):",
      default: "",
    });
    if (!logoPath || logoPath.trim().toLowerCase() === "skip") {
      logoPath = "";
      break;
    }
    if (existsSync(logoPath)) {
      break;
    }
    console.error(`  File not found: ${logoPath} — please try again.`);
  }

  // ── 2. Community layers ──────────────────────────────────────────────────
  console.log("\nWhat are 3 key areas you want your community to connect around?\n");

  /** @type {{ name: string, description: string, color: string }[]} */
  const layers = [];
  for (let i = 1; i <= 3; i++) {
    const layerName = await input({
      message: `Name for area ${i}:`,
      default: ["Values", "Visions", "Vehicles"][i - 1],
    });

    const layerDescription = await input({
      message: `Hint for members — what should they enter for ${layerName}?`,
      default: [
        "The principles that guide how you move through the world.",
        "The futures you want to help bring into being.",
        "The projects and initiatives you're driving.",
      ][i - 1],
    });

    let layerColor = "";
    while (true) {
      layerColor = await input({
        message: `Hex colour for "${layerName}" nodes in the graph (e.g. #ff4f2d):`,
        default: ["#ff4f2d", "#e06ef9", "#bbdf27"][i - 1],
      });
      if (/^#[0-9a-fA-F]{6}$/.test(layerColor)) {
        break;
      }
      console.error(`  Invalid hex colour: ${layerColor} — must be #RRGGBB format.`);
    }

    layers.push({ name: layerName, description: layerDescription, color: layerColor });
  }

  // ── 3. Supabase auth ─────────────────────────────────────────────────────
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
  let projectName = await input({
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
  let projectRef;
  while (true) {
    console.log("\nCreating project...");
    try {
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
      projectRef = project.id;
      break;
    } catch (err) {
      console.error(`\n  Error creating project: ${err.message}`);
      projectName = await input({
        message: "Enter a different project name:",
        default: projectName,
      });
    }
  }
  console.log(`✓ Project created: ${projectRef}`);

  await waitForProject(projectRef);

  // ── 6. Fetch API keys ────────────────────────────────────────────────────
  console.log("Fetching API keys...");
  const keys = supabaseJSON(["projects", "api-keys", "--project-ref", projectRef]);
  const anonKey = keys.find((k) => k.name === "anon")?.api_key;
  const serviceKey = keys.find((k) => k.name === "service_role")?.api_key;
  if (!anonKey || !serviceKey) {
    throw new Error("Could not find anon or service_role key in API response. Check the Supabase dashboard.");
  }
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  console.log("✓ API keys fetched");

  // ── 7. Link CLI ──────────────────────────────────────────────────────────
  console.log("Linking CLI...");
  supabaseInteractive(["link", "--project-ref", projectRef, "--password", dbPassword]);
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
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    const contentType = mimeTypes[ext?.toLowerCase()] ?? "application/octet-stream";
    const { error } = await client.storage
      .from("community-assets")
      .upload(storagePath, file, { upsert: true, contentType });
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
    `VITE_LAYER1_NAME=${layers[0].name}`,
    `VITE_LAYER1_DESCRIPTION=${layers[0].description}`,
    `VITE_LAYER1_COLOR=${layers[0].color}`,
    `VITE_LAYER2_NAME=${layers[1].name}`,
    `VITE_LAYER2_DESCRIPTION=${layers[1].description}`,
    `VITE_LAYER2_COLOR=${layers[1].color}`,
    `VITE_LAYER3_NAME=${layers[2].name}`,
    `VITE_LAYER3_DESCRIPTION=${layers[2].description}`,
    `VITE_LAYER3_COLOR=${layers[2].color}`,
  ];
  writeFileSync(".env", lines.join("\n") + "\n");
  console.log("✓ .env written");

  // ── 11. Deploy to Vercel (optional) ──────────────────────────────────────
  let appUrl = "http://localhost:5173";

  const wantsDeploy = await confirm({
    message: "Deploy your community to Vercel now for a shareable URL?",
    default: true,
  });

  if (wantsDeploy) {
    // Build locally — VITE_* vars are baked into the bundle from .env
    console.log("\nBuilding app...");
    const buildResult = spawnSync("npm", ["run", "build"], {
      stdio: "inherit",
      encoding: "utf8",
    });
    if (buildResult.status !== 0) {
      throw new Error("Build failed — fix the error above then re-run npm run setup.");
    }
    console.log("✓ App built");

    // Check Vercel login
    const vercelWhoami = spawnSync("npx", ["vercel", "whoami"], {
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
    });
    if (vercelWhoami.status !== 0) {
      console.log("\nOpening browser for Vercel login...");
      spawnSync("npx", ["vercel", "login"], { stdio: "inherit", encoding: "utf8" });
    } else {
      console.log(`✓ Logged in to Vercel as ${vercelWhoami.stdout.trim()}`);
    }

    // Deploy the pre-built dist/ folder as static files
    console.log("Deploying to Vercel...");
    const deployResult = spawnSync(
      "npx",
      ["vercel", "dist", "--prod", "--yes"],
      { stdio: ["pipe", "pipe", "inherit"], encoding: "utf8" }
    );

    if (deployResult.status !== 0) {
      console.warn(
        "\n  Warning: Vercel deployment failed.\n" +
        "  You can deploy manually later with:\n" +
        "    npm run build && npx vercel dist --prod\n"
      );
    } else {
      const urlMatch = deployResult.stdout.match(/https:\/\/\S+\.vercel\.app/);
      if (urlMatch) {
        appUrl = urlMatch[0];
        console.log(`✓ Deployed: ${appUrl}`);
      }
    }
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log(`
✨ Your community is ready!

  Community:  ${communityName}
  App:        ${appUrl}
  Database:   ${supabaseUrl}

Next steps:
  1. Add your OPENCAGE_API_KEY to .env  (geocoding for location fields)
     Get a free key at: https://opencagedata.com
${wantsDeploy ? "" : "  2. Run:   npm run dev\n  3. Visit: http://localhost:5173\n"}`);
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
