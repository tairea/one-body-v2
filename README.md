# One Body

**The One Body Problem** is the challenge of coordinating many people as one — discovering shared values, aligning visions, and connecting the vehicles (projects and initiatives) that bring communities together.

One Body is an open-source tool that maps the relationships between people in a community through an interactive graph. Members create profiles describing what matters to them across three customisable layers, and the app visualises the overlaps — making it easy to find collaborators, spark conversations, and strengthen the whole.

Built with [Vue.js](https://vuejs.org/), [Cytoscape.js](https://js.cytoscape.org/), and [Supabase](https://supabase.com/).

> Inspired by the original [One Body prototype](https://github.com/tairea/one-body).

## Features

- **Interactive community graph** — person nodes linked by shared values, visions, and vehicles, powered by Cytoscape.js
- **Member profiles** — each member describes themselves across three community-defined layers
- **Hierarchical chip nodes** — drill into any layer to see sub-topics and connections
- **3D globe view** — visualise your community geographically with Globe.GL
- **Dark / light mode** — full theme support throughout the app
- **One-command setup** — interactive CLI creates your Supabase project, applies migrations, and optionally deploys to Vercel
- **AI recommendations** — _currently in development_

## Screenshots

_Coming soon._

## Tech Stack

| Layer     | Technology              |
| --------- | ----------------------- |
| Frontend  | Vue 3, Vuetify, Vite    |
| Graph     | Cytoscape.js            |
| Globe     | Globe.GL, Three.js      |
| Database  | Supabase (PostgreSQL)   |
| Auth      | Supabase Auth           |
| Storage   | Supabase Storage        |
| Hosting   | Vercel (static export)  |

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A free [Supabase](https://supabase.com/) account
- A Supabase [personal access token](https://supabase.com/dashboard/account/tokens)
- (Optional) A [Vercel](https://vercel.com/) account for deployment

### Quick Start

```sh
git clone https://github.com/tairea/one-body-v2.git
cd one-body-v2
npm install
npm run setup
```

The interactive setup wizard will walk you through everything:

1. **Community branding** — name, tagline, and an optional logo image
2. **Three community layers** — name, description, and hex colour for each layer (e.g. Values, Visions, Vehicles)
3. **Supabase authentication** — paste your personal access token to log in to the CLI
4. **Organisation selection** — choose which Supabase organisation to use
5. **Project creation** — name, database password (auto-generated if skipped), and region
6. **Database migrations** — automatically applied to your new project
7. **Logo upload** — uploaded to Supabase Storage (if provided)
8. **Environment file** — `.env` is written with all keys and config
9. **Vercel deployment** (optional) — builds the app and deploys to a live URL, then configures Supabase auth redirect URLs

Once complete you'll see your live URL and next steps.

## Development

```sh
npm run dev
```

Opens the app at [http://localhost:5173](http://localhost:5173).

## Deployment

To redeploy after making changes:

```sh
npm run deploy
```

This builds the app and deploys the `dist/` folder to Vercel.

## Project Structure

```
src/
├── components/       # Vue components (graph, profile panel, chips, globe, etc.)
├── lib/              # Supabase client, mappers, utilities
├── router/           # Vue Router config with auth guards
├── stores/           # Pinia stores (app state, profile data)
├── views/            # Page-level views (Home, Auth, Countdown)
└── assets/           # Static assets (logo, styles)
scripts/
├── setup.js          # Interactive setup wizard
└── deploy.js         # Build & deploy script
supabase/
└── migrations/       # SQL migration files
```

## License

MIT
