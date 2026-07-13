/**
 * AI provider abstraction for AuroraGuard.
 *
 * Today we run on the Vercel AI Gateway (zero-config: OpenAI / Anthropic /
 * Google / Bedrock model strings all work). When the AWS plan is purchased,
 * flip AI_OPTIMIZER_MODEL to a Bedrock model id (e.g. the Claude Haiku model
 * from the TRD) — no other application code needs to change because every
 * call site imports `optimizerModel` from here.
 *
 * Examples:
 *   AI_OPTIMIZER_MODEL=openai/gpt-5-mini          (default, gateway)
 *   AI_OPTIMIZER_MODEL=anthropic/claude-haiku-4.5 (gateway)
 *   AI_OPTIMIZER_MODEL=bedrock/anthropic.claude-3-5-haiku  (AWS Bedrock later)
 */
export const optimizerModel: string = process.env.AI_OPTIMIZER_MODEL ?? "openai/gpt-5.4-mini"

/** Human-readable label for the active model, surfaced in the UI. */
export function activeModelLabel(): string {
  return optimizerModel
}
