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

/**
 * Update Supabase project's site_url and uri_allow_list via Management API.
 * @param {string} appUrl
 * @param {string} supabaseUrl
 * @param {string} accessToken
 */
async function updateSupabaseAuthUrls(appUrl, supabaseUrl, accessToken) {
  if (!appUrl || !supabaseUrl || !accessToken) return;

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  try {
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
  console.log("  You need a personal access token to authenticate the CLI");
  console.log("  and enable automatic deployment URL management.\n");
  console.log("  Create one at: https://supabase.com/dashboard/account/tokens\n");

  const accessToken = await password({
    message: "Supabase personal access token:",
    mask: "*",
  });

  supabaseInteractive(["login", "--token", accessToken]);
  console.log("✓ Logged in to Supabase");

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
    `SUPABASE_ACCESS_TOKEN=${accessToken}`,
    `VITE_COMMUNITY_NAME=${communityName}`,
    `VITE_COMMUNITY_TAGLINE=${communityTagline}`,
    logoUrl ? `VITE_COMMUNITY_LOGO_URL=${logoUrl}` : `# VITE_COMMUNITY_LOGO_URL=`,
    `VITE_LAYER1_NAME=${layers[0].name}`,
    `VITE_LAYER1_DESCRIPTION=${layers[0].description}`,
    `VITE_LAYER1_COLOR="${layers[0].color}"`,
    `VITE_LAYER2_NAME=${layers[1].name}`,
    `VITE_LAYER2_DESCRIPTION=${layers[1].description}`,
    `VITE_LAYER2_COLOR="${layers[1].color}"`,
    `VITE_LAYER3_NAME=${layers[2].name}`,
    `VITE_LAYER3_DESCRIPTION=${layers[2].description}`,
    `VITE_LAYER3_COLOR="${layers[2].color}"`,
  ];
  writeFileSync(".env", lines.join("\n") + "\n");
  console.log("✓ .env written");

  // ── 11. Deploy to Vercel (optional) ──────────────────────────────────────
  let appUrl = "http://localhost:5173";
  let aliasUrl = "";

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
      ["vercel", "--prod", "--yes"],
      { stdio: ["pipe", "pipe", "pipe"], encoding: "utf8", cwd: "dist" }
    );

    // Print Vercel progress output
    if (deployResult.stderr) process.stderr.write(deployResult.stderr);

    if (deployResult.status !== 0) {
      console.warn(
        "\n  Warning: Vercel deployment failed.\n" +
        "  You can deploy manually later with:\n" +
        "    npm run deploy\n"
      );
    } else {
      const urlMatch = deployResult.stdout.match(/https:\/\/\S+\.vercel\.app/);
      if (urlMatch) {
        appUrl = urlMatch[0];
        console.log(`✓ Deployed: ${appUrl}`);
      }
      // Extract the stable aliased URL (e.g. https://project-name.vercel.app)
      const aliasMatch = (deployResult.stderr ?? "").match(/Aliased:\s+(https:\/\/\S+)/);
      if (aliasMatch) {
        aliasUrl = aliasMatch[1].replace(/\s*\[.*$/, "");
      }
    }

    await updateSupabaseAuthUrls(aliasUrl || appUrl, supabaseUrl, accessToken);
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  const liveUrl = aliasUrl || appUrl;
  console.log(`
✨ Your community is ready!

  Community:  ${communityName}
  App:        ${appUrl}${aliasUrl ? `\n  App (stable): ${aliasUrl}` : ""}
  Database:   ${supabaseUrl}

Next steps:
${wantsDeploy ? `  1. Visit your live app: ${liveUrl}
  2. Create an account and set up your profile
  3. Share the link with your community members
  4. Customise the code and redeploy with: npm run deploy
  5. Run locally for development with: npm run dev
` : `  1. Start the dev server:  npm run dev
  2. Visit:  http://localhost:5173
  3. Create an account and set up your profile
  4. When ready to go live:  npm run deploy
`}`);
}

main().catch((err) => {
  console.error("\nSetup failed:", err.message);
  process.exit(1);
});
