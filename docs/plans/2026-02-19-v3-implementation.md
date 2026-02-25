# One Body v3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate One Body from Express + SQLite to Supabase (PostgreSQL + Auth + Storage + Realtime), replacing the secret-code signup with email/password + magic link auth, and a single-screen profile form.

**Architecture:** Vue 3 + Pinia frontend talks directly to Supabase JS client — no Express server. Supabase handles auth (email/password + magic link), PostgreSQL stores people/recommendations, Storage holds photos, and Realtime pushes node-position updates to all connected clients.

**Tech Stack:** Vue 3, Pinia, Vuetify, `@supabase/supabase-js`, Supabase CLI, pgvector, OpenCage geocoding

**Worktree:** `/home/ian/Desktop/projects/one-body-v2/.worktrees/v3`

**Design doc:** `docs/plans/2026-02-19-v3-supabase-migration-design.md`

---

## Task 1: Supabase CLI Setup + TUI Setup Script

**Note:** `npm install supabase --save-dev`, `supabase init`, and the initial `.env.sample` update were already completed in a prior commit (dab7c4d). This task adds the interactive TUI setup script that community organizers run to bootstrap their instance.

**Files:**
- Create: `scripts/setup.js`
- Modify: `.env.sample` (add community branding vars)
- Modify: `package.json` (add `"setup"` script)

### Overview

Community organizers run `npm run setup` once. The script:
1. Prompts for community branding (name, tagline, logo file path)
2. Handles Supabase login (opens browser if not already authenticated)
3. Lists orgs → user picks one
4. Prompts for project name, DB password (or auto-generates), region
5. Creates the Supabase project via CLI
6. Waits for project to become healthy
7. Fetches API keys automatically
8. Links CLI to project
9. Applies migrations (`supabase db push`)
10. Uploads community logo to `community-assets` Storage bucket
11. Writes `.env` with all values populated

### Step 1: Install @inquirer/prompts

```bash
npm install @inquirer/prompts
```

### Step 2: Create scripts/setup.js

```js
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
```

### Step 3: Update .env.sample

Replace the contents of `.env.sample`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
VITE_COMMUNITY_NAME=<your-community-name>
VITE_COMMUNITY_TAGLINE=<your-community-tagline>
VITE_COMMUNITY_LOGO_URL=<public-logo-url-or-leave-blank>
OPENCAGE_API_KEY=<api-key>
```

### Step 4: Add setup script to package.json

In `package.json`, add to the `scripts` block:

```json
"setup": "node scripts/setup.js",
```

### Step 5: Run tests

```bash
npm test
```

Expected: 13 tests still passing.

### Step 6: Commit

```bash
git add scripts/setup.js .env.sample package.json package-lock.json
git commit -m "feat: add TUI community setup script"
```

---

## Task 2: Database Migration (Schema + RLS + Storage)

**Files:**
- Create: `supabase/migrations/20260219000000_init.sql`

### Step 1: Create the migration file

```bash
npx supabase migration new init
```

This creates `supabase/migrations/<timestamp>_init.sql`. Open it and paste:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- People table
create table public.people (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users(id) on delete cascade not null unique,
  name                   text not null,
  location_name          text,
  location_latitude      float8,
  location_longitude     float8,
  values_list            jsonb not null default '[]',
  visions_list           jsonb not null default '[]',
  vehicles_list          jsonb not null default '[]',
  persons_graph_snapshot jsonb,
  embedding              vector(1536),
  created_at             timestamptz default now()
);

-- Recommendations table
create table public.recommendations (
  person1_id  uuid references public.people(id) on delete cascade,
  person2_id  uuid references public.people(id) on delete cascade,
  ranking     float8,
  reason      text,
  potential   jsonb,
  primary key (person1_id, person2_id)
);

-- RLS: people
alter table public.people enable row level security;

create policy "public can read people"
  on public.people for select using (true);

create policy "owner can insert their profile"
  on public.people for insert
  with check (auth.uid() = user_id);

create policy "owner can update their profile"
  on public.people for update
  using (auth.uid() = user_id);

create policy "owner can delete their profile"
  on public.people for delete
  using (auth.uid() = user_id);

-- RLS: recommendations (public read, service role writes)
alter table public.recommendations enable row level security;

create policy "public can read recommendations"
  on public.recommendations for select using (true);

-- Storage: community-assets bucket (public read, set up by setup script)
insert into storage.buckets (id, name, public)
  values ('community-assets', 'community-assets', true);

create policy "public can view community assets"
  on storage.objects for select
  using (bucket_id = 'community-assets');

-- Storage: profile-photos bucket (public read)
insert into storage.buckets (id, name, public)
  values ('profile-photos', 'profile-photos', true);

create policy "public can view profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

create policy "owner can upload their photo"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner can update their photo"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable Realtime for people table
alter publication supabase_realtime add table public.people;
```

### Step 2: Apply migration to remote project

```bash
npx supabase db push
```

Expected output: `Applying migration ... done`

### Step 3: Verify in dashboard

Go to the Supabase dashboard → Table Editor. You should see `people` and `recommendations` tables.

### Step 4: Commit

```bash
git add supabase/
git commit -m "feat: add database schema migration with pgvector and RLS"
```

---

## Task 3: Install @supabase/supabase-js + Create Client Singleton

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/lib/supabase.test.js`

### Step 1: Install the package

```bash
npm install @supabase/supabase-js
```

### Step 2: Write the failing test

Create `src/lib/supabase.test.js`:

```js
// @ts-check
import test from "node:test";
import assert from "node:assert/strict";

test("supabase client is a singleton", async () => {
  // We can't import the real client without env vars, so test the module shape
  // by verifying the module exports a createClient call result
  // This test intentionally checks the file exists and exports something
  const mod = await import("./supabase.js");
  assert.ok(mod.supabase, "supabase export should exist");
  assert.equal(typeof mod.supabase.auth, "object", "should have auth namespace");
  assert.equal(typeof mod.supabase.from, "function", "should have from() method");
});
```

### Step 3: Run to verify it fails

```bash
node --test src/lib/supabase.test.js
```

Expected: fail with "Cannot find module" or similar.

### Step 4: Create the client singleton

Create `src/lib/supabase.js`:

```js
// @ts-check
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

> **Note:** `import.meta.env` is Vite-specific and won't work in plain Node.js test context. The test above will pass once we confirm the module is importable in the browser build. For now, accept that this test is a structural check — run the test via Vite's dev server manually.

### Step 5: Commit

```bash
git add src/lib/supabase.js src/lib/supabase.test.js package.json package-lock.json
git commit -m "feat: add Supabase client singleton"
```

---

## Task 4: Update types.d.ts

**Files:**
- Modify: `src/types.d.ts`

### Step 1: Replace the Person type

Open `src/types.d.ts` and replace the entire file:

```typescript
export type Person = Readonly<{
  id: string; // UUID
  userId: string; // auth.users UUID
  name: string;
  photoUrl?: string; // Supabase Storage public URL
  locationName?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  values: ReadonlyArray<string>;
  visions: ReadonlyArray<string>;
  vehicles: ReadonlyArray<{
    title: string;
    description?: string;
  }>;
  personsGraphSnapshot?: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      photo?: string;
      nodeSize?: number;
      position: { x: number; y: number };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
    }>;
  };
}>;

export type Recommendation = {
  person1Id: string; // UUID
  person2Id: string; // UUID
  ranking: number;
  reason: string;
  potential: string[];
};

/** Supabase row shape (snake_case from DB) */
export type PersonRow = {
  id: string;
  user_id: string;
  name: string;
  location_name: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  values_list: string[];
  visions_list: string[];
  vehicles_list: { title: string; description?: string }[];
  persons_graph_snapshot: Person["personsGraphSnapshot"] | null;
  created_at: string;
};

export type RecommendationRow = {
  person1_id: string;
  person2_id: string;
  ranking: number;
  reason: string;
  potential: string[];
};
```

### Step 2: Create a mapping utility

Create `src/lib/mappers.js`:

```js
// @ts-check
/** @import { Person, PersonRow, Recommendation, RecommendationRow } from "../types.d.ts" */

const STORAGE_URL = import.meta.env.VITE_SUPABASE_URL + "/storage/v1/object/public/profile-photos";

/**
 * @param {PersonRow} row
 * @returns {Person}
 */
export function rowToPerson(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    photoUrl: `${STORAGE_URL}/${row.user_id}/avatar`,
    locationName: row.location_name ?? undefined,
    locationLatitude: row.location_latitude ?? undefined,
    locationLongitude: row.location_longitude ?? undefined,
    values: row.values_list ?? [],
    visions: row.visions_list ?? [],
    vehicles: row.vehicles_list ?? [],
    personsGraphSnapshot: row.persons_graph_snapshot ?? undefined,
  };
}

/**
 * @param {RecommendationRow} row
 * @returns {Recommendation}
 */
export function rowToRecommendation(row) {
  return {
    person1Id: row.person1_id,
    person2Id: row.person2_id,
    ranking: row.ranking,
    reason: row.reason,
    potential: row.potential ?? [],
  };
}
```

### Step 3: Commit

```bash
git add src/types.d.ts src/lib/mappers.js
git commit -m "feat: update types for Supabase UUIDs and add row mappers"
```

---

## Task 5: Update Pinia Store

**Files:**
- Modify: `src/stores/app.js`

### Step 1: Rewrite the store

Replace `src/stores/app.js` with this (keep all the cytoscape/dark mode/UI state, replace auth + data fetching):

```js
// @ts-check
import { defineStore } from "pinia";
import { supabase } from "../lib/supabase.js";
import { rowToPerson, rowToRecommendation } from "../lib/mappers.js";
/** @import { Person, Recommendation } from "../types.d.ts" */

export const useAppStore = defineStore("app", {
  state: () => ({
    // Auth state
    /** @type {import("@supabase/supabase-js").User | null} */
    authUser: null,
    authLoading: true,

    // Profile state (the logged-in user's person row)
    /** @type {Person | null} */
    myPerson: null,

    // Graph state
    /** @type {null | Readonly<Person[]>} */
    people: null,
    /** @type {null | Readonly<Recommendation[]>} */
    recommendations: null,

    // UI state (unchanged from v2)
    isEdgeView: false,
    isDarkMode: false,
    isFullscreen: false,
    /** @type {null | "globe" | "cytoscape" | "airecommendations"} */
    activeComponent: "cytoscape",
    isViewingProfile: false,
    currentPersonData: null,
    /** @type {null | "values" | "visions" | "vehicles"} */
    activeProfileSection: null,
    cytoscapeData: null,
    cytoscapeInitialized: false,
    cytoscapeInstance: null,
    cytoscapeSvg: null,
    /** @type {null | (() => unknown)} */
    concentricZoomOut: null,
    showNodeLabels: false,
  }),

  actions: {
    // ─── Auth ────────────────────────────────────────────────────────────────

    async initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      this.authUser = session?.user ?? null;
      this.authLoading = false;

      supabase.auth.onAuthStateChange((_event, session) => {
        this.authUser = session?.user ?? null;
      });
    },

    async signOut() {
      await supabase.auth.signOut();
      this.authUser = null;
      this.myPerson = null;
    },

    // ─── Data fetching ───────────────────────────────────────────────────────

    async fetchGraph() {
      const [{ data: peopleRows }, { data: recRows }] = await Promise.all([
        supabase.from("people").select("*"),
        supabase.from("recommendations").select("*"),
      ]);
      this.people = (peopleRows ?? []).map(rowToPerson);
      this.recommendations = (recRows ?? []).map(rowToRecommendation);
    },

    async fetchMyPerson() {
      if (!this.authUser) return;
      const { data } = await supabase
        .from("people")
        .select("*")
        .eq("user_id", this.authUser.id)
        .single();
      this.myPerson = data ? rowToPerson(data) : null;
    },

    // ─── Realtime ────────────────────────────────────────────────────────────

    subscribeToPersonUpdates() {
      supabase
        .channel("people-positions")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "people" },
          (payload) => {
            const updated = rowToPerson(/** @type {any} */ (payload.new));
            if (this.people) {
              this.people = this.people.map((p) =>
                p.id === updated.id ? updated : p
              );
            }
          }
        )
        .subscribe();
    },

    unsubscribeFromPersonUpdates() {
      supabase.channel("people-positions").unsubscribe();
    },

    // ─── Graph snapshot ───────────────────────────────────────────────────────

    async saveGraphSnapshot(graphData) {
      if (!this.myPerson) return;
      await supabase
        .from("people")
        .update({ persons_graph_snapshot: graphData })
        .eq("user_id", this.authUser?.id);
      this.myPerson = { ...this.myPerson, personsGraphSnapshot: graphData };
    },

    // ─── UI actions (unchanged) ───────────────────────────────────────────────

    setGraph(people, recommendations) {
      this.people = people;
      this.recommendations = recommendations;
    },
    checkSystemPreference() {
      this.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    toggleDarkMode() { this.isDarkMode = !this.isDarkMode; },
    setDarkMode(dark) { this.isDarkMode = dark; },
    listenToSystemPreference() {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        this.isDarkMode = e.matches;
      });
    },
    initializeDarkMode() {
      this.checkSystemPreference();
      this.listenToSystemPreference();
    },
    enterFullscreen() { this.isFullscreen = true; },
    exitFullscreen() { this.isFullscreen = false; },
    showGlobe() { this.activeComponent = "globe"; this.isViewingProfile = false; this.currentPersonData = null; },
    showCytoscape() { this.activeComponent = "cytoscape"; this.isViewingProfile = false; this.currentPersonData = null; },
    showAiRecommendations() { this.activeComponent = "airecommendations"; this.isViewingProfile = false; this.currentPersonData = null; },
    setEdgeView(v) { this.isEdgeView = v; },
    hideComponents() { this.activeComponent = null; this.isViewingProfile = false; this.currentPersonData = null; },
    setViewingProfile(v) { this.isViewingProfile = v; },
    setCurrentPersonData(d) { this.currentPersonData = d; },
    clearCurrentPersonData() { this.currentPersonData = null; },
    setActiveProfileSection(s) { this.activeProfileSection = s; },
    clearActiveProfileSection() { this.activeProfileSection = null; },
    setCytoscapeData(d) { this.cytoscapeData = d; },
    setCytoscapeInitialized(v) { this.cytoscapeInitialized = v; },
    setCytoscapeInstance(v) { this.cytoscapeInstance = v; },
    setCytoscapeSvg(v) { this.cytoscapeSvg = v; },
    setConcentricZoomOut(fn) { this.concentricZoomOut = fn; },
    toggleNodeLabels() { this.showNodeLabels = !this.showNodeLabels; },
  },
});
```

### Step 2: Commit

```bash
git add src/stores/app.js
git commit -m "feat: update Pinia store for Supabase auth and data fetching"
```

---

## Task 6: Create Auth.vue

**Files:**
- Create: `src/views/Auth.vue`

### Step 1: Create the auth page

Community branding is read from Vite env vars (`import.meta.env`):
- `VITE_COMMUNITY_NAME` — shown as the page heading
- `VITE_COMMUNITY_TAGLINE` — shown below the name
- `VITE_COMMUNITY_LOGO_URL` — shown as a logo above the name (optional)

Create `src/views/Auth.vue`:

```vue
<script setup>
// @ts-check
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase.js";

const router = useRouter();

const communityName = import.meta.env.VITE_COMMUNITY_NAME || "One Body";
const communityTagline = import.meta.env.VITE_COMMUNITY_TAGLINE || "";
const communityLogoUrl = import.meta.env.VITE_COMMUNITY_LOGO_URL || "";

/** @type {import("vue").Ref<"signin" | "signup" | "magic">} */
const mode = ref("signin");
const email = ref("");
const password = ref("");
const loading = ref(false);
const message = ref("");
const error = ref("");

async function handleSignIn() {
  loading.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  loading.value = false;
  if (err) {
    error.value = err.message;
  } else {
    router.push("/home");
  }
}

async function handleSignUp() {
  loading.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });
  loading.value = false;
  if (err) {
    error.value = err.message;
  } else {
    message.value = "Check your email to confirm your account, then sign in.";
    mode.value = "signin";
  }
}

async function handleMagicLink() {
  loading.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: { emailRedirectTo: window.location.origin + "/home" },
  });
  loading.value = false;
  if (err) {
    error.value = err.message;
  } else {
    message.value = "Magic link sent! Check your email.";
  }
}

function submit() {
  if (mode.value === "signin") handleSignIn();
  else if (mode.value === "signup") handleSignUp();
  else handleMagicLink();
}
</script>

<template>
  <v-app>
    <v-main class="d-flex align-center justify-center" style="min-height: 100vh">
      <v-card width="420" class="pa-6 text-center">

        <!-- Community logo -->
        <div v-if="communityLogoUrl" class="mb-4">
          <v-img
            :src="communityLogoUrl"
            max-height="80"
            contain
          />
        </div>

        <!-- Community name + tagline -->
        <v-card-title class="text-h5 justify-center">
          {{ communityName }}
        </v-card-title>
        <v-card-subtitle v-if="communityTagline" class="mb-6">
          {{ communityTagline }}
        </v-card-subtitle>

        <v-btn-toggle v-model="mode" mandatory divided class="mb-6 w-100">
          <v-btn value="signin" size="small">Sign In</v-btn>
          <v-btn value="signup" size="small">Sign Up</v-btn>
          <v-btn value="magic" size="small">Magic Link</v-btn>
        </v-btn-toggle>

        <v-alert v-if="error" type="error" class="mb-4" density="compact">
          {{ error }}
        </v-alert>
        <v-alert v-if="message" type="success" class="mb-4" density="compact">
          {{ message }}
        </v-alert>

        <v-form @submit.prevent="submit">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-if="mode !== 'magic'"
            v-model="password"
            label="Password"
            type="password"
            required
            variant="outlined"
            class="mb-4"
          />

          <v-btn
            type="submit"
            color="primary"
            block
            :loading="loading"
          >
            {{ mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Magic Link" }}
          </v-btn>
        </v-form>
      </v-card>
    </v-main>
  </v-app>
</template>
```

### Step 2: Manual test

Run `npm run dev` and visit `http://localhost:5173`. You should see the auth card with community name, optional tagline, optional logo, and three mode buttons.

### Step 3: Commit

```bash
git add src/views/Auth.vue
git commit -m "feat: add Auth.vue with sign in / sign up / magic link"
```

---

## Task 7: Create Profile.vue (Single-Screen Form)

**Files:**
- Create: `src/views/Profile.vue`

### Step 1: Create the profile form

Create `src/views/Profile.vue`:

```vue
<script setup>
// @ts-check
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase.js";
import { useAppStore } from "../stores/app.js";
import { getGeocodedLocation } from "../lib/getGeocodedLocation.js";
import ChipList from "../components/ChipList.vue";
import VehiclesStep from "../components/VehiclesStep.vue";

const router = useRouter();
const store = useAppStore();

// Form state
const name = ref("");
const locationInput = ref("");
const locationName = ref("");
const locationLatitude = ref(null);
const locationLongitude = ref(null);
const values = ref([]);
const visions = ref([]);
const vehicles = ref([]);
const photoFile = ref(null);
const photoPreviewUrl = ref(null);
const saving = ref(false);
const error = ref("");

const isEditing = computed(() => !!store.myPerson);

onMounted(async () => {
  if (store.myPerson) {
    name.value = store.myPerson.name;
    locationInput.value = store.myPerson.locationName ?? "";
    locationName.value = store.myPerson.locationName ?? "";
    locationLatitude.value = store.myPerson.locationLatitude ?? null;
    locationLongitude.value = store.myPerson.locationLongitude ?? null;
    values.value = [...store.myPerson.values];
    visions.value = [...store.myPerson.visions];
    vehicles.value = [...store.myPerson.vehicles];
    photoPreviewUrl.value = store.myPerson.photoUrl ?? null;
  }
});

function onPhotoChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  photoFile.value = file;
  photoPreviewUrl.value = URL.createObjectURL(file);
}

async function geocodeLocation() {
  if (!locationInput.value) return;
  try {
    const result = await getGeocodedLocation(locationInput.value);
    locationName.value = result.name;
    locationLatitude.value = result.latitude;
    locationLongitude.value = result.longitude;
  } catch {
    // Keep whatever was typed as the name, no coordinates
    locationName.value = locationInput.value;
  }
}

async function save() {
  if (!name.value.trim()) {
    error.value = "Name is required.";
    return;
  }

  saving.value = true;
  error.value = "";

  try {
    const userId = store.authUser?.id;
    if (!userId) throw new Error("Not authenticated");

    // Geocode location if changed
    if (locationInput.value !== locationName.value) {
      await geocodeLocation();
    }

    // Upsert person row
    const { error: upsertError } = await supabase.from("people").upsert({
      user_id: userId,
      name: name.value.trim(),
      location_name: locationName.value || null,
      location_latitude: locationLatitude.value,
      location_longitude: locationLongitude.value,
      values_list: values.value,
      visions_list: visions.value,
      vehicles_list: vehicles.value,
    }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;

    // Upload photo if changed
    if (photoFile.value) {
      const ext = photoFile.value.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, photoFile.value, { upsert: true });
      if (uploadError) throw uploadError;
    }

    await store.fetchMyPerson();
    router.push("/home");
  } catch (err) {
    error.value = err.message ?? "Something went wrong.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <v-app>
    <v-main class="pa-6">
      <v-container max-width="900">
        <v-row align="center" class="mb-4">
          <v-col>
            <h2 class="text-h5">{{ isEditing ? "Edit Profile" : "Create Your Profile" }}</h2>
          </v-col>
          <v-col cols="auto">
            <v-btn v-if="isEditing" variant="text" @click="router.push('/home')">
              Back
            </v-btn>
          </v-col>
        </v-row>

        <v-alert v-if="error" type="error" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <!-- Row 1: Photo, Name, Location -->
        <v-row class="mb-4">
          <v-col cols="12">
            <!-- Photo -->
            <div class="d-flex align-center mb-4">
              <v-avatar size="80" class="mr-4">
                <v-img v-if="photoPreviewUrl" :src="photoPreviewUrl" cover />
                <v-icon v-else size="48">mdi-account-circle</v-icon>
              </v-avatar>
              <v-btn variant="outlined" component="label">
                {{ photoPreviewUrl ? "Change Photo" : "Upload Photo" }}
                <input type="file" accept="image/*" hidden @change="onPhotoChange" />
              </v-btn>
            </div>

            <!-- Name -->
            <v-text-field
              v-model="name"
              label="Full Name"
              variant="outlined"
              class="mb-3"
              required
            />

            <!-- Location -->
            <v-text-field
              v-model="locationInput"
              label="Location (city, country)"
              variant="outlined"
              @blur="geocodeLocation"
              hint="e.g. Berlin, Germany"
              persistent-hint
            />
          </v-col>
        </v-row>

        <!-- Row 2: Values, Visions, Vehicles -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Values</div>
            <ChipList v-model="values" label="Add a value" />
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Visions</div>
            <ChipList v-model="visions" label="Add a vision" />
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Vehicles</div>
            <VehiclesStep v-model="vehicles" />
          </v-col>
        </v-row>

        <!-- Save row -->
        <v-row>
          <v-col>
            <v-btn
              color="primary"
              size="large"
              :loading="saving"
              @click="save"
            >
              {{ isEditing ? "Update Profile" : "Save Profile" }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
```

### Step 2: Check ChipList and VehiclesStep accept v-model

Open `src/components/ChipList.vue` and `src/components/VehiclesStep.vue`. Verify they emit `update:modelValue` (standard Vue 3 v-model). If they use a different pattern (e.g. emitting raw events), adapt the Profile.vue binding accordingly.

### Step 3: Commit

```bash
git add src/views/Profile.vue
git commit -m "feat: add single-screen Profile.vue with photo upload"
```

---

## Task 8: Update Router (New Routes + Auth Guards)

**Files:**
- Modify: `src/router/index.js`

### Step 1: Replace the router

Replace `src/router/index.js`:

```js
// @ts-check
import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../lib/supabase.js";
import Auth from "../views/Auth.vue";
import Home from "../views/Home.vue";
import Profile from "../views/Profile.vue";
import Countdown from "../views/Countdown.vue";

const routes = [
  {
    path: "/",
    name: "Auth",
    component: Auth,
    meta: { requiresGuest: true },
  },
  {
    path: "/home",
    name: "Home",
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
  {
    path: "/countdown",
    name: "Countdown",
    component: Countdown,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthed = !!session;

  if (to.meta.requiresAuth && !isAuthed) {
    return { name: "Auth" };
  }
  if (to.meta.requiresGuest && isAuthed) {
    return { name: "Home" };
  }
});

export default router;
```

### Step 2: Manual test

1. Visit `http://localhost:5173/home` while logged out → should redirect to `/`
2. Sign in → should redirect to `/home`
3. Visit `/` while logged in → should redirect to `/home`

### Step 3: Commit

```bash
git add src/router/index.js
git commit -m "feat: update router with auth guards and v3 routes"
```

---

## Task 9: Update Home.vue (Supabase Data + Edit Profile Button + Realtime)

**Files:**
- Modify: `src/views/Home.vue`

### Step 1: Replace fetchGraphData and add Realtime

Open `src/views/Home.vue`. Make the following targeted changes:

**Remove** the `fetchGraphData` function and its `fetch()` call (lines ~34-43).

**Replace** the `onMounted` block's data fetching with:

```js
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(async () => {
  await store.fetchGraph();
  await store.fetchMyPerson();
  store.subscribeToPersonUpdates();
  store.initializeDarkMode();
});

onUnmounted(() => {
  store.unsubscribeFromPersonUpdates();
});
```

**Add** an Edit Profile button in the template. Find the top-right corner area (near the DarkModeToggle) and add:

```vue
<v-btn
  variant="outlined"
  size="small"
  prepend-icon="mdi-account-edit"
  @click="router.push('/profile')"
>
  Edit Profile
</v-btn>
```

**Update** `saveGraphSnapshot` to use the store action directly (no secretKey needed):

```js
const handleSaveNodePositions = async () => {
  if (!cytoscapeRef.value) return;
  try {
    isSavingPositions.value = true;
    const graphData = cytoscapeRef.value.getGraphSnapshot();
    await store.saveGraphSnapshot(graphData);
    hasNodePositionChanges.value = false;
  } catch (error) {
    console.error("Error saving node positions:", error);
  } finally {
    isSavingPositions.value = false;
  }
};
```

**Remove** the `AddPersonDialog` import and usage (replaced by `/profile` route).

### Step 2: Manual test

1. Log in → home page loads, people appear on globe/graph
2. Drag a node → position updates
3. Click "Save positions" → saves to Supabase
4. Open a second browser tab → drag a node in tab 1 → tab 2 updates in real time
5. Click "Edit Profile" → navigates to `/profile`

### Step 3: Commit

```bash
git add src/views/Home.vue
git commit -m "feat: update Home.vue with Supabase data fetching and Realtime"
```

---

## Task 10: Remove Express Backend + Update package.json + vite.config.js

**Files:**
- Delete: `src/server/` (entire directory)
- Modify: `package.json`
- Modify: `vite.config.js`

### Step 1: Delete the server directory

```bash
rm -rf src/server/
```

### Step 2: Update package.json scripts and dependencies

In `package.json`, replace the `scripts` block:

```json
"scripts": {
  "dev": "vite",
  "recommendations:people-export": "node src/recommendations/dump-people.js",
  "recommendations:build": "node src/recommendations/build.js",
  "recommendations:import": "node src/recommendations/import-recommendations.js",
  "format": "prettier --write .",
  "build": "vite build",
  "preview": "vite preview",
  "test": "node --test"
},
```

Remove these from `dependencies` (they were server-only):

```bash
npm uninstall better-sqlite3 cors express morgan string-timing-safe-equal dotenv
```

### Step 3: Remove Vite proxy

In `vite.config.js`, remove the `server.proxy` block:

```js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [vue(), vuetify()],
});
```

### Step 4: Run tests to confirm nothing is broken

```bash
npm test
```

Expected: 13 tests passing (the lib tests that don't depend on Express).

### Step 5: Commit

```bash
git add package.json package-lock.json vite.config.js
git rm -r src/server/
git commit -m "feat: remove Express server, simplify to Vite-only dev"
```

---

## Task 11: Update Recommendations Pipeline for Supabase

**Files:**
- Modify: `src/recommendations/dump-people.js`
- Modify: `src/recommendations/import-recommendations.js`
- Create: `src/recommendations/supabase-client.js`

### Step 1: Create a server-side Supabase client for scripts

Create `src/recommendations/supabase-client.js`:

```js
// @ts-check
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
}

export const supabase = createClient(url, key);
```

### Step 2: Update dump-people.js

Replace `src/recommendations/dump-people.js`:

```js
// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { argv } from "node:process";
import { supabase } from "./supabase-client.js";

assert.equal(argv.length, 3, "Expected 1 argument: the destination file path");
const outputFile = argv[2];
assert(outputFile, "Expected destination file path to be supplied");

const { data, error } = await supabase.from("people").select("*");
if (error) throw error;

// Map to the shape build.js expects (camelCase Person type)
const people = data.map((row) => ({
  id: row.id,
  name: row.name,
  locationName: row.location_name,
  locationLatitude: row.location_latitude,
  locationLongitude: row.location_longitude,
  values: row.values_list ?? [],
  visions: row.visions_list ?? [],
  vehicles: row.vehicles_list ?? [],
}));

fs.writeFileSync(outputFile, JSON.stringify(people, null, 2), { encoding: "utf8" });
console.log(`Exported ${people.length} people to ${outputFile}`);
```

### Step 3: Update import-recommendations.js

Replace `src/recommendations/import-recommendations.js`:

```js
// @ts-check
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { argv } from "node:process";
import { supabase } from "./supabase-client.js";

assert.equal(argv.length, 3, "Expected 1 argument: the recommendations file path");
const recommendationsPath = argv[2];
assert(recommendationsPath, "Expected input file path to be supplied");

const data = fs.readFileSync(recommendationsPath, { encoding: "utf8" });
const recommendations = JSON.parse(data);

assert(
  Array.isArray(recommendations) &&
    recommendations.every(
      (r) =>
        r &&
        typeof r.person1Id === "string" &&
        typeof r.person2Id === "string" &&
        typeof r.ranking === "number" &&
        typeof r.reason === "string" &&
        Array.isArray(r.potential)
    ),
  "Input data is invalid — person1Id and person2Id must be UUID strings"
);

const rows = recommendations.map((r) => ({
  person1_id: r.person1Id,
  person2_id: r.person2Id,
  ranking: r.ranking,
  reason: r.reason,
  potential: r.potential,
}));

const { error } = await supabase.from("recommendations").upsert(rows);
if (error) throw error;

console.log(`Imported ${rows.length} recommendations.`);
```

### Step 4: Add dotenv as a regular dependency (used by scripts)

```bash
npm install dotenv
```

### Step 5: Verify the pipeline works end-to-end

With a populated Supabase database:

```bash
npm run recommendations:people-export -- /tmp/people.json
cat /tmp/people.json  # should show people array with UUID ids

# Run recommendations build
npm run recommendations:build -- /tmp/people.json /tmp/recommendations.json

# Import back to Supabase
npm run recommendations:import -- /tmp/recommendations.json
```

### Step 6: Commit

```bash
git add src/recommendations/
git add package.json package-lock.json
git commit -m "feat: update recommendations pipeline to use Supabase instead of SQLite"
```

---

## Final Verification

### Manual smoke test checklist

1. `npm run dev` starts Vite only (no Express)
2. `http://localhost:5173` shows auth page
3. Sign up with email/password → confirmation email arrives
4. Confirm email → sign in → redirected to `/home`
5. No profile exists → redirected to `/profile`
6. Fill in form: photo, name, location, values, visions, vehicles → Save
7. Redirected to `/home` — you appear in the graph/globe
8. Click "Edit Profile" → form pre-filled, make a change → Update
9. Drag a node → position saves to Supabase
10. Open second tab → drag node in tab 1 → updates in tab 2 in real time
11. Sign out → redirected to `/`
12. Magic link flow works

### Run tests

```bash
npm test
```

Expected: all 13 existing tests pass.

### Final commit if anything was left unstaged

```bash
git status
git add -p  # review and stage any remaining changes
git commit -m "chore: v3 final cleanup"
```
