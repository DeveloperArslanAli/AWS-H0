import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

async function run() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
