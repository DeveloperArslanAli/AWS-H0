import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

async function run() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const model = google("gemini-1.5-flash"); // Let's try gemini-1.5-flash-latest or gemini-1.5-flash

  try {
    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      prompt: "Hello",
    });
    console.log("Response:", text);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
run();
