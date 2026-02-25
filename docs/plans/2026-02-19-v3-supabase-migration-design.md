# One Body v3 — Supabase Migration Design

**Date**: 2026-02-19
**Branch**: `v3`
**Status**: Approved

---

## Overview

v3 migrates the backend from Express + SQLite to Supabase (PostgreSQL + Auth + Storage + Realtime), removes the secret-code signup flow, and replaces it with proper auth-gated onboarding. The frontend (Vue 3 + Pinia + Vuetify) remains largely unchanged except for the auth/profile flows.

---

## Architecture

### What's Removed
- Express.js server (`src/server/`)
- SQLite + better-sqlite3
- `SIGNUP_SECRET` environment variable
- Multi-step `AddPersonDialog.vue` / `Signup.vue`
- `/api/*` proxy in Vite config

### What's Added
- Supabase project (managed via Supabase CLI)
- `@supabase/supabase-js` client (called directly from Vue)
- Supabase Auth (email/password + magic link)
- Supabase Storage (profile photos bucket)
- Supabase Realtime (live node position sync)
- pgvector extension (for future AI recommendation embeddings)

### What's Unchanged
- Vue 3 + Pinia + Vuetify
- Globe, Cytoscape, AI recommendations views
- OpenCage geocoding
- AI recommendations pipeline (updated to write to Supabase instead of SQLite)
- Vue Router structure

---

## User Flow

```
Visit /
  └── Not authenticated → Auth page (sign in / sign up / magic link)
  └── Authenticated, no profile → Profile form (create)
  └── Authenticated, profile exists → Community map (home)

Community map
  └── "Edit Profile" button → Profile form (pre-filled, save = update)
  └── Logout option in UI
```

All routes except `/` (auth page) require authentication. The community map is not publicly visible.

---

## Database Schema (PostgreSQL)

```sql
-- Enable extensions
create extension if not exists vector;

-- People table
create table people (
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
  embedding              vector(1536),   -- for pgvector AI recommendations (future)
  created_at             timestamptz default now()
);

-- Recommendations table
create table recommendations (
  person1_id  uuid references people(id) on delete cascade,
  person2_id  uuid references people(id) on delete cascade,
  ranking     float8,
  reason      text,
  potential   jsonb,
  primary key (person1_id, person2_id)
);
```

**Notes**:
- `id` is now UUID (was integer)
- `user_id` links to Supabase Auth user
- `photo` is removed from DB — stored in Supabase Storage
- `secret_key` is removed — Supabase Auth handles identity
- `email` is removed from people table — available via `auth.users`
- `groups` and `groupMemberships` tables preserved if needed later

### Row Level Security (RLS)

```sql
-- people: anyone can read, only owner can write
alter table people enable row level security;

create policy "public read" on people for select using (true);
create policy "owner insert" on people for insert with check (auth.uid() = user_id);
create policy "owner update" on people for update using (auth.uid() = user_id);
create policy "owner delete" on people for delete using (auth.uid() = user_id);

-- recommendations: public read, service role write (AI pipeline)
alter table recommendations enable row level security;
create policy "public read" on recommendations for select using (true);
```

### Storage

- Bucket: `profile-photos` (public read)
- Path: `{user_id}/avatar.{ext}`
- RLS: owner can upload/update their own photo

---

## Auth Flow

Using `@supabase/supabase-js`:

1. **Sign up**: `supabase.auth.signUp({ email, password })` — sends confirmation email
2. **Sign in**: `supabase.auth.signInWithPassword({ email, password })`
3. **Magic link**: `supabase.auth.signInWithOtp({ email })`
4. **Session**: Supabase handles JWT refresh automatically
5. **Logout**: `supabase.auth.signOut()`

After auth, check if a `people` row exists for `auth.uid()`. If not → profile form. If yes → community map.

---

## Profile Form Layout

Single-screen, no steps:

```
┌─────────────────────────────────────────┐
│  [Photo upload / avatar]                │
│  [Name input]                           │
│  [Location input]                       │
├───────────────┬──────────────┬──────────┤
│   Values      │   Visions    │ Vehicles │
│   [+ add]     │   [+ add]    │  [+ add] │
│   • value 1   │   • vision 1 │  • car 1 │
│   • value 2   │              │          │
├───────────────┴──────────────┴──────────┤
│              [Save / Update]            │
└─────────────────────────────────────────┘
```

- Reuses existing `VehiclesStep.vue`, `ChipList.vue` logic as sub-components
- "Save" creates person row + uploads photo
- "Update" patches existing row + replaces photo if changed
- Location input uses existing OpenCage geocoding

---

## Routing

| Path | Guard | Behavior |
|------|-------|----------|
| `/` | public | Auth page (if not logged in) or redirect to `/home` |
| `/home` | auth required | Community map |
| `/profile` | auth required | Profile create/edit form |
| `/countdown` | auth required | Countdown view |

---

## Realtime — Node Position Sync

When a user drags a node in the Cytoscape graph, their `persons_graph_snapshot` is saved to Supabase. All other connected clients receive the update live and re-render that person's node positions.

**Implementation**:
- Enable Realtime on the `people` table in Supabase dashboard (or via migration)
- In `Home.vue` / `InteractiveCytoscapeMany.vue`, subscribe on mount:

```js
supabase
  .channel('people-positions')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'people',
  }, (payload) => {
    // Update that person's graph snapshot in the Pinia store
    store.updatePersonSnapshot(payload.new)
  })
  .subscribe()
```

- Unsubscribe on component unmount
- The Pinia store merges the incoming snapshot into the current graph state without re-fetching all data

---

## Supabase CLI Setup

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Init project config locally
supabase init

# Link to remote project (after creating project at supabase.com)
supabase link --project-ref <project-ref>

# Apply migrations
supabase db push

# Generate types (optional)
supabase gen types typescript --linked > src/types/supabase.ts
```

### Environment Variables

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
OPENCAGE_API_KEY=<api-key>
```

---

## AI Recommendations Pipeline

The existing local Ollama pipeline (`src/recommendations/`) is updated to:
1. Use Supabase JS client instead of SQLite
2. Write recommendations to the `recommendations` table via service role key
3. (Future) Generate embeddings and store in `people.embedding` for pgvector similarity search

---

## Key Files to Create / Modify

| File | Action |
|------|--------|
| `src/lib/supabase.js` | New — Supabase client singleton |
| `src/views/Auth.vue` | New — Sign in / sign up / magic link page |
| `src/views/Profile.vue` | New — Single-screen profile form |
| `src/views/Home.vue` | Modify — add auth guard, edit profile button, Realtime subscription |
| `src/router/index.js` | Modify — new routes, auth guards |
| `src/stores/app.js` | Modify — add auth state, remove secretKey logic, add updatePersonSnapshot |
| `supabase/migrations/*.sql` | New — DB schema |
| `.env.sample` | Update — new env vars |
| `src/server/` | Delete — entire Express backend |
| `package.json` | Update — remove Express deps, add supabase-js |

---

## Out of Scope (v3)

- Groups / group memberships
- Upgrading AI recommendations to use pgvector (schema ready, pipeline unchanged)
- Public profile sharing
