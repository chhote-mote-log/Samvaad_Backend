export interface TextModerationMessage {
  sessionId: string;
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  language: string;
  turn_number: number;
  mode: "text" | "audio" | "video";
  type: "professional" | "fun";
  topic: string;
  rules: {
    turnDurationSecs: number;
    allowChat: boolean;
    allowVoice: boolean;
    relaxedMode: boolean;
  };
  context?: {
    previousMessages?: { senderId: string; content: string; timestamp: number }[];
  };
}
export interface ModerationResult {
  messageId: string;
  sessionId: string;
  mode: "text" | "audio" | "video";
  type:"professional" | "fun",
  language: string;
  feedback: {
    motivational: string;
    overallFeedback: string;
  };
  scores: {
    toxicityScore: number;        // 0 (safe) – 1 (toxic)
    sentimentScore: number;       // -1 (negative) to 1 (positive)
    emotionTags: string[];        // e.g., ["anger", "confidence"]
    argumentQuality: number;      // 0–1
    rebuttalScore: number;        // 0–1
    fallacyTags: string[];        // e.g., ["strawman", "ad hominem"]
    languageComplexity: number;   // 0–1 (simple to complex)
    questionsAsked: number;       // count
    factualAccuracy: number;      // 0–1
  };
  score: number;                  // Composite debate performance score (0–100)
  verdict: string;                // e.g., "Excellent rebuttal", "Needs clarity"
  auto_flagged: boolean;          // If the message needs moderator review
}
export interface TextMessage {
  type: 'text';
  timestamp: number;
  senderId: string;
  content: string; // Optional, if language detection is implemented
}