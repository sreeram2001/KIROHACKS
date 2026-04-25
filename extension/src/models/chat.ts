import type { ProductContext } from "./product";
import type { TECResponse } from "./tec";
import type { UserProfile } from "./profile";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string; // ISO 8601
}

export interface ChatRequest {
    message: string;
    productContext: ProductContext;
    tecData: TECResponse | null;
    conversationHistory: ChatMessage[];
    userProfile: UserProfile;
}

export interface ChatResponse {
    reply: string;
    sources: string[];
}
