import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * AI provider abstraction for AuroraGuard.
 *
 * Today we run on the Vercel AI Gateway by default, or Google directly if configured.
 * When the AWS plan is purchased, flip AI_OPTIMIZER_MODEL to a Bedrock model id.
 */
const envModel = process.env.AI_OPTIMIZER_MODEL ?? "openai/gpt-4o-mini";

export const optimizerModel = (() => {
  // If the user specified a google/ model and has the key, use direct Google AI provider
  // to avoid Vercel AI Gateway credit card requirements.
  if (envModel.startsWith("google/") && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
    return google(envModel.replace("google/", ""));
  }
  
  // Otherwise, return string (which defaults to Vercel AI gateway resolution in AI SDK)
  return envModel;
})();

/** Human-readable label for the active model, surfaced in the UI. */
export function activeModelLabel(): string {
  return typeof optimizerModel === "string" ? optimizerModel : optimizerModel.modelId;
}
