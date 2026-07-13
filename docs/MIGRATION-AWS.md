# Migration plan: Supabase → AWS

AuroraGuard ships on **Supabase** today and is intentionally structured so the
move to **AWS (Aurora PostgreSQL + Cognito/Bedrock)** is incremental and
low-risk. This document is the runbook for that migration.

## Why it's low-risk

The app isolates every backend dependency behind a thin layer:

| Concern   | Today (Supabase)            | Swap point                                   |
| --------- | --------------------------- | -------------------------------------------- |
| Database  | Supabase Postgres + RLS     | `lib/supabase/*` + `lib/data.ts`             |
| Auth      | Supabase Auth               | `lib/supabase/*` + `middleware.ts`           |
| AI        | Vercel AI Gateway           | `lib/ai/provider.ts` (one model string)      |
| Schema    | `supabase/migrations/*.sql` | Standard Postgres DDL — runs on Aurora as-is |

Because the schema is plain PostgreSQL and is version-controlled, it ports to
**Aurora PostgreSQL** with effectively no changes.

## Target architecture (AWS)

```
Browser ─▶ Next.js (Vercel or AWS Amplify/ECS)
             │
             ├─▶ Amazon Aurora PostgreSQL (data)
             ├─▶ Amazon Cognito (auth)            [replaces Supabase Auth]
             └─▶ Amazon Bedrock (Claude Haiku)    [replaces AI Gateway default]
```

## Phase 1 — Database (Supabase Postgres → Aurora PostgreSQL)

1. Provision an Aurora PostgreSQL cluster (use the `aws-aurora-postgresql` skill / IAM auth).
2. Run `supabase/migrations/0001_core_schema.sql` against Aurora.
   - Aurora has no built-in `auth.users` table. Replace the FK to `auth.users`
     with a `users` table you own (or Cognito `sub` as the PK), and drop the
     Supabase-specific trigger.
3. RLS is Postgres-native and works on Aurora, **but** Aurora has no
   `auth.uid()`. Two options:
   - **Recommended for app tier:** drop RLS and enforce ownership with
     per-query `WHERE user_id = $currentUser` in `lib/data.ts` (the Server
     Actions already pass the user id). This matches the Neon/Better-Auth model.
   - Or set a session GUC (`SET app.user_id = ...`) per request and rewrite
     policies to read `current_setting('app.user_id')`.
4. Migrate data with `pg_dump`/`pg_restore` (or AWS DMS for zero-downtime).

## Phase 2 — Data access layer

Replace `@supabase/supabase-js` reads/writes with a Postgres client (`pg` with
the `@aws-sdk/rds-signer` for IAM auth). Only two files change materially:

- `lib/supabase/server.ts` → `lib/db/aurora.ts` (connection pool + IAM token)
- `lib/data.ts` → same function signatures, queries run via `pg`

Every consumer imports from `lib/data.ts`, so call sites are untouched.

## Phase 3 — Auth (Supabase Auth → Amazon Cognito)

1. Stand up a Cognito user pool (email + password to match current behavior).
2. Replace `lib/supabase/{client,server,proxy}.ts` session handling with
   Cognito (Amplify Auth or `@aws-sdk/client-cognito-identity-provider`).
3. Update `middleware.ts` to validate the Cognito JWT.
4. Migrate users (Cognito bulk import; passwords require a reset flow).

## Phase 4 — AI (AI Gateway → Amazon Bedrock)

Change the model string in `lib/ai/provider.ts`:

```ts
// Before
export const optimizerModel = process.env.AI_OPTIMIZER_MODEL ?? "openai/gpt-5.4-mini"

// After (Bedrock via AI SDK)
export const optimizerModel =
  process.env.AWS_BEDROCK_MODEL_ID ?? "anthropic.claude-3-haiku-20240307-v1:0"
```

Add the Bedrock provider and AWS credentials. The optimizer's heuristic
fallback (`lib/ai/heuristic-analyzer.ts`) stays as the resilience layer.

## Phase 5 — Hosting & CI/CD

- Option A: keep the app on Vercel, point it at Aurora/Cognito/Bedrock.
- Option B: move to AWS (Amplify Hosting or ECS/Fargate). Update the deploy
  workflows in `.github/workflows/` accordingly; the `ci.yml` quality gates
  stay identical.

## Cutover checklist

- [ ] Aurora cluster provisioned, schema applied, data migrated and verified.
- [ ] `lib/data.ts` swapped to Aurora; integration tests green.
- [ ] Cognito pool live; users migrated; login/signup verified.
- [ ] `lib/ai/provider.ts` pointed at Bedrock; optimizer verified.
- [ ] Env vars updated in hosting provider.
- [ ] DNS / domain cutover.
- [ ] Decommission Supabase project after a soak period.
