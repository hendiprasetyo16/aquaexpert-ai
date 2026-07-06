// features/ai/types/ai.types.ts

export type ChatMessage = {
  role: "user" | "ai" | "system";
  content: string;
};

export type AIProviderResponse = {
  reply?: string;
  error?: string;
};