# AmoSave.Web

## Azure Deployment (CI/CD)

AmoSave.Web is continuously built and deployed to **Azure Static Web Apps** (free tier) via GitHub Actions.

### How it works

| Trigger | What happens |
|---|---|
| Push to `main` | Lint → type-check → test → build → deploy to **production** |
| Pull request opened/updated | Same pipeline → deploy to an isolated **PR preview URL** |
| Pull request closed | PR preview environment is automatically deleted |

### One-time Azure setup

> **Prerequisites:** Azure account (free subscription is fine) + GitHub repository admin access.

1. **Create an Azure Static Web App**
   - Go to [Azure Portal](https://portal.azure.com) → **Create a resource** → search *Static Web Apps* → **Create**
   - Fill in:
     - **Subscription**: your free subscription
     - **Resource Group**: create a new one (e.g. `amosave-rg`)
     - **Name**: `amosave-web`
     - **Plan type**: **Free**
     - **Region**: any region close to your users
     - **Source**: choose **Other** (we manage the GitHub Actions workflow ourselves)
   - Click **Review + Create** → **Create**

2. **Copy the deployment token**
   - After the resource is created, open it in the portal
   - Go to **Settings → Manage deployment token** (or **Overview → Manage deployment token**)
   - Copy the token

3. **Add GitHub repository secrets**

   Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

   | Secret name | Value |
   |---|---|
   | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from step 2 |
   | `VITE_API_BASE_URL` | Your production API URL, e.g. `https://amosave-api.azurewebsites.net/api/v1` |
   | `VITE_API_KEY` | Your API key |

4. **Push to `main`** — the GitHub Actions workflow (`.github/workflows/azure-static-web-apps.yml`) will automatically build and deploy.

### Local development

```bash
# Copy and edit environment variables
cp .env.example .env.local

# Install dependencies
yarn install

# Start dev server (http://localhost:3000)
yarn dev
```

### Available commands

```bash
yarn dev          # Start dev server
yarn build        # Type-check + production build (output: dist/)
yarn typecheck    # TypeScript check only
yarn lint         # ESLint
yarn test         # Run tests (Vitest)
yarn test:watch   # Run tests in watch mode
```

---

## Planning Docs

- [Solution Architecture Plan](docs/plans/01-solution-architecture.md)
- [API to UI Coverage Matrix](docs/plans/02-api-ui-coverage-matrix.md)
- [Phased Roadmap](docs/plans/03-phased-roadmap.md)
- [React + TypeScript + Yarn + ESLint Setup](docs/plans/04-react-typescript-yarn-eslint-setup.md)
- [UI Reference from Sample Screens](docs/plans/05-ui-reference-from-sample.md)
- [NFR + Release Governance](docs/plans/06-nfr-release-governance.md)
- [Master Implementation Task Plan](docs/plans/07-master-implementation-task-plan.md)

## Execution Logs

- [Copilot Logs Root](.github/logs/README.md)
- [Session Logs](.github/logs/sessions/)

## Current Navigation UX

- Left main menus are now route-driven and persistent: `Market`, `Trade`, `Analyse`, `App Settings`, `Algo`, `Stragy Builder`.
- Clicking a left main menu loads contextual top submenus as tab menus in the main layout.
- App Settings tabs: `User Setting`, `System Settings`.
- Algo tabs: `Strgy Builder`, `Back testing`.
- Dedicated `Stragy Builder` main menu is also available for direct entry into strategy workflows.

### New Routes Added

- `/app/settings/user`
- `/app/settings/system`
- `/app/algo/strategy-builder`
- `/app/algo/back-testing`
- `/app/strategy-builder`