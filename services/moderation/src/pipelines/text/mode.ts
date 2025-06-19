import axios from "axios";
import { TextModerationMessage } from "./types";
// import * as dotenv from 'dotenv';
import { openai } from "./utils";

// dotenv.config();

// const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function moderateText(data: TextModerationMessage): Promise<{
  feedback: string;
}> {
  try {
    const prompt = `You are an AI debate coach. A user just wrote this in a debate:\n\n"${data.message.content}"\n\nGive one short, motivational, or constructive sentence to help them improve.`;
    
    const result = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 60,
    });

    if (!result.choices?.[0]?.message?.content) {
      throw new Error("No response from DeepSeek");
    }

    const feedback = result.choices[0].message.content.trim();
    return { feedback };
  } catch (error: any) {
    console.error("DeepSeekdocker API Error:", error.message);
    return { feedback: "Could not generate feedback at this time." };
  }
}
