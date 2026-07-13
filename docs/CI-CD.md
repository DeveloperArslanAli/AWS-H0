# CI/CD Pipeline

AuroraGuard uses **GitHub Actions** for CI and the **Vercel CLI** for
deployments. The pipeline enforces quality gates before any code reaches
production and gives every pull request a live preview URL.

## Overview

```
                ┌─────────────────────────────────────────────┐
   PR opened ──▶│ ci.yml: lint → typecheck → build            │
                │ codeql.yml: security scan                   │
                │ deploy-preview.yml: Vercel preview + comment │
                └─────────────────────────────────────────────┘
                                   │ merge to main
                                   ▼
                ┌─────────────────────────────────────────────┐
 push to main ─▶│ ci.yml: lint → typecheck → build            │
                │ deploy-production.yml: Vercel --prod         │
                └─────────────────────────────────────────────┘
```

## Workflows

### `ci.yml` — Continuous Integration

Runs on every push to `main`/`develop` and on every PR.

1. **Lint & Type Check** — `pnpm lint` and `pnpm typecheck`.
2. **Production Build** — `pnpm build` (depends on the first job passing).

Uses pnpm with a frozen lockfile and caches `.next/cache` for faster builds.
Concurrency is set so older runs on the same ref are cancelled.

### `deploy-preview.yml` — Preview Deployments

Runs on PRs targeting `main`. Pulls the Vercel preview environment, builds with
`vercel build`, deploys with `vercel deploy --prebuilt`, and posts (or updates)
a comment on the PR with the live preview URL. Skips PRs from forks (no secrets).

### `deploy-production.yml` — Production Deployments

Runs on push to `main` (and manual `workflow_dispatch`). Builds with
`vercel build --prod` and promotes with `vercel deploy --prebuilt --prod`.
Uses a protected `production` GitHub Environment so you can require manual
approval and restrict who can deploy.

### `codeql.yml` — Security Scanning

GitHub CodeQL SAST for JavaScript/TypeScript on PRs, pushes to `main`, and a
weekly schedule. Results appear in the repository Security tab.

### `dependabot.yml`

Weekly dependency and GitHub Actions updates, with minor/patch npm updates
grouped into a single PR to reduce noise.

## Required GitHub secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret              | Where to get it                                              |
| ------------------- | ----------------------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel → Account Settings → Tokens                          |
| `VERCEL_ORG_ID`     | `.vercel/project.json` after `vercel link`, or project settings |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link`, or project settings |

> Application runtime env vars (Supabase URL/keys, AI keys) are configured in
> **Vercel project settings**, not in GitHub. `vercel pull` fetches them at
> build time.

## Environments

- **preview** — ephemeral, one per PR.
- **production** — protected; recommended to require a reviewer approval.

## Branching model

- `main` — always deployable; protected; production deploys from here.
- `develop` — optional integration branch.
- Feature branches → PR into `main` (or `develop`).

Recommended branch protection on `main`:

- Require the `CI` checks (`Lint & Type Check`, `Production Build`) to pass.
- Require the CodeQL check to pass.
- Require at least one approving review.
- Disallow force pushes.
