import axios from "axios";
import { TextModerationMessage, ModerationResult } from "./types";

import { openai } from "./utils";

export async function moderateText(
  data: TextModerationMessage
): Promise<ModerationResult> {
  try {
    const prompt = `
You're an expert AI debate judge and moderator.

Given the following debate message and context, return a structured evaluation JSON. Follow the format exactly.

---
Debate Metadata:
- Debate Type: ${data.type}
- Mode: ${data.mode}
- Language: ${data.language}
- Topic: "${data.topic}"
- Turn Number: ${data.turn_number}
- Rules: ${JSON.stringify(data.rules)}

Previous Messages:
${(data.context?.previousMessages || [])
  .map((msg, index) => `Turn ${index + 1} - ${msg.senderId}: "${msg.content}"`)
  .join("\n")}

Current Message by ${data.senderId}:
"${data.content}"
---

Respond in JSON with these fields:
{
  "feedback": {
    "motivational": "...",
    "overallFeedback": "..."
  },
  "scores": {
    "toxicityScore": 0.1,
    "sentimentScore": 0.6,
    "emotionTags": ["confidence"],
    "argumentQuality": 0.8,
    "rebuttalScore": 0.7,
    "fallacyTags": [],
    "languageComplexity": 0.6,
    "questionsAsked": 1,
    "factualAccuracy": 0.9,
    "offtopicScore": 0.1,
    "repetitionScore": 0.2
  },
  "score": 85,
  "verdict": "Strong argument with confident tone.",
  "auto_flagged": false
}
ONLY return valid JSON. Do not add any explanation or prose.
`;

    const result = await openai.chat.completions.create({
      model: "anthropic/claude-sonnet-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });

    const raw = result.choices?.[0]?.message?.content;
    if (!raw) {
      throw new Error("No response from Claude");
    }
    const jsonText = raw
      .trim()
      .replace(/^```json|```$/g, "")
      .trim();
    const structured: ModerationResult = JSON.parse(jsonText);
    if (!structured || typeof structured !== "object") {
      throw new Error("Invalid JSON response from Claude");
    }

    return {
      ...structured,
      messageId: data.messageId,
      sessionId: data.sessionId,
      mode: data.mode,
      type: data.type,
      language: data.language,
    };
  } catch (error: any) {
    console.error("❌ Moderation failed:", error.message);
    return {
      messageId: data.messageId,
      sessionId: data.sessionId,
      mode: data.mode,
      type: data.type,
      language: data.language,
      feedback: {
        motivational: "No feedback available.",
        overallFeedback: "Could not analyze message.",
      },
      scores: {
        toxicityScore: 0,
        sentimentScore: 0,
        emotionTags: [],
        argumentQuality: 0,
        rebuttalScore: 0,
        fallacyTags: [],
        languageComplexity: 0,
        questionsAsked: 0,
        factualAccuracy: 0,
      },
      score: 0,
      verdict: "Analysis failed",
      auto_flagged: true,
    };
  }
}
