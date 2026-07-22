// features/ai/types/ai.types.ts

export type ChatRole = "user" | "ai" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

export interface AIProviderResponse {
  reply?: string;
  error?: string;
}

// 💡 Tipe data untuk hasil pencarian RAG dari Database
export interface RAGContextData {
  diseases: string[];
  fishes: string[];
  plants: string[];
}