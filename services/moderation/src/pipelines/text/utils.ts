export function isToxic(score: number, threshold = 0.8): boolean {
  return score >= threshold;
}

// src/utils/deepseekClient.ts
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});
