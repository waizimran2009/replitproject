import { GoogleGenAI } from "@google/genai";

const userApiKey = process.env.GEMINI_API_KEY;
const replitApiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
const replitBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

if (!replitBaseUrl && !userApiKey) {
  throw new Error(
    "Either AI_INTEGRATIONS_GEMINI_BASE_URL or GEMINI_API_KEY must be set.",
  );
}

// Prefer the Replit integration (no quota limits) over the user's free-tier key
export const ai = replitBaseUrl
  ? new GoogleGenAI({
      apiKey: replitApiKey!,
      httpOptions: {
        apiVersion: "",
        baseUrl: replitBaseUrl,
      },
    })
  : new GoogleGenAI({ apiKey: userApiKey! });
