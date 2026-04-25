import type { ProductContext, ProductDetectedMessage, ProductClearedMessage } from "../models/product";
import type { UserProfile } from "../models/profile";
import type { TECResponse } from "../models/tec";
import type { ChatMessage, ChatResponse } from "../models/chat";
import type { ErrorResponse } from "../models/errors";

// --- Types ---

interface HistoryFilters {
    category?: string;
    platform?: string;
    savingsType?: string;
    timePeriod?: string;
}

interface DecisionRecord {
    userId: string;
    timestamp: string;
    productName: string;
    listedPrice: number;
    chosenTec: number;
    bestAlternativeTec: number;
    savings: number;
    category: string;
    platform: string;
    fairnessVerdict: string;
}

interface DecisionHistory {
    decisions: DecisionRecord[];
    total: number;
}

interface SyncResult {
    success: boolean;
    lastModified: string;
}

interface BackendClient {
    computeTEC(product: ProductContext, profile: UserProfile): Promise<TECResponse>;
    chat(message: string, context: ChatContext): Promise<ChatResponse>;
    syncProfile(profile: UserProfile): Promise<SyncResult>;
    getDecisionHistory(userId: string, filters?: HistoryFilters): Promise<DecisionHistory>;
}

interface ChatContext {
    productContext: ProductContext;
    tecData: TECResponse | null;
    conversationHistory: ChatMessage[];
    userProfile: UserProfile;
}

// --- Config ---

// Default placeholder URL. After deploying the CDK stack, set the actual
// API Gateway URL in chrome.storage.local under the key "apiBaseUrl".
// Example: chrome.storage.local.set({ apiBaseUrl: "https://<id>.execute-api.<region>.amazonaws.com/prod" })
const DEFAULT_API_BASE_URL = "https://cl58tgzoq1.execute-api.us-east-1.amazonaws.com/prod";

let apiBaseUrl: string = DEFAULT_API_BASE_URL;

/** Load the configured API base URL from chrome.storage.local on startup. */
async function loadApiBaseUrl(): Promise<void> {
    try {
        const result = await chrome.storage.local.get("apiBaseUrl");
        if (result.apiBaseUrl && typeof result.apiBaseUrl === "string") {
            apiBaseUrl = result.apiBaseUrl;
        }
    } catch {
        // Storage unavailable — keep the default
    }
}

// Initialize on Service Worker startup
loadApiBaseUrl();

// --- Timeout constants ---

/** Timeout for TEC computation requests (ms) */
const TEC_TIMEOUT_MS = 60000;
/** Timeout for chat requests (ms) */
const CHAT_TIMEOUT_MS = 30000;
/** Default timeout for other API requests (ms) */
const DEFAULT_TIMEOUT_MS = 8000;

// --- Tab cache ---

const tabCache = new Map<number, TECResponse>();
const tabProducts = new Map<number, ProductContext>();

// --- Error helpers ---

/**
 * Parse an error response body and return a user-friendly message.
 * Attempts to extract structured error details from the backend's ErrorResponse format.
 */
function parseErrorResponse(status: number, body: string): string {
    try {
        const parsed = JSON.parse(body) as ErrorResponse;
        if (parsed.error?.message) {
            const details = parsed.error.details;
            if (details && details.length > 0) {
                const fieldErrors = details.map((d) => `${d.field}: ${d.error}`).join("; ");
                return `${parsed.error.message} (${fieldErrors})`;
            }
            return parsed.error.message;
        }
    } catch {
        // Body is not valid JSON — fall through
    }

    if (status >= 400 && status < 500) {
        return `Request error (${status}): please check your input and try again.`;
    }
    return "Service temporarily unavailable. Please try again later.";
}

// --- Response validators ---

/** Validate that a parsed object has the expected TECResponse shape. */
function validateTECResponse(data: unknown): data is TECResponse {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return (
        typeof obj.productName === "string" &&
        typeof obj.listedPrice === "number" &&
        typeof obj.tec === "number" &&
        typeof obj.currency === "string" &&
        typeof obj.layerBreakdown === "object" &&
        obj.layerBreakdown !== null &&
        Array.isArray(obj.alternatives) &&
        typeof obj.alternativesComplete === "boolean" &&
        typeof obj.decisionImpactReport === "object" &&
        obj.decisionImpactReport !== null &&
        typeof obj.fairnessVerdict === "object" &&
        obj.fairnessVerdict !== null
    );
}

/** Validate that a parsed object has the expected ChatResponse shape. */
function validateChatResponse(data: unknown): data is ChatResponse {
    if (typeof data !== "object" || data === null) return false;
    const obj = data as Record<string, unknown>;
    return typeof obj.reply === "string" && Array.isArray(obj.sources);
}

// --- Backend Client ---

interface ApiRequestOptions extends RequestInit {
    timeoutMs?: number;
}

async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {},
    validator?: (data: unknown) => data is T,
): Promise<T> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(`${apiBaseUrl}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...fetchOptions,
            signal: controller.signal,
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(parseErrorResponse(res.status, body));
        }

        const json: unknown = await res.json();

        if (validator && !validator(json)) {
            console.error("[TrueCost] Response schema validation failed. Raw response:", JSON.stringify(json));
            throw new Error("Unexpected response format from server. Please try again.");
        }

        return json as T;
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
            throw new Error("Request timed out. Please try again.");
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

const backendClient: BackendClient = {
    async computeTEC(product, profile) {
        return apiRequest<TECResponse>(
            "/tec",
            {
                method: "POST",
                body: JSON.stringify({ product, user_profile: profile }),
                timeoutMs: TEC_TIMEOUT_MS,
            },
            validateTECResponse,
        );
    },

    async chat(message, context) {
        return apiRequest<ChatResponse>(
            "/chat",
            {
                method: "POST",
                body: JSON.stringify({
                    message,
                    product_context: context.productContext,
                    tec_data: context.tecData,
                    conversation_history: context.conversationHistory,
                    user_profile: context.userProfile,
                }),
                timeoutMs: CHAT_TIMEOUT_MS,
            },
            validateChatResponse,
        );
    },

    async syncProfile(profile) {
        return apiRequest<SyncResult>(`/profile/${profile.userId}`, {
            method: "PUT",
            body: JSON.stringify(profile),
        });
    },

    async getDecisionHistory(userId, filters) {
        const params = new URLSearchParams();
        if (filters?.category) params.set("category", filters.category);
        if (filters?.platform) params.set("platform", filters.platform);
        if (filters?.savingsType) params.set("savingsType", filters.savingsType);
        if (filters?.timePeriod) params.set("timePeriod", filters.timePeriod);
        const qs = params.toString();
        return apiRequest<DecisionHistory>(`/decisions/${userId}${qs ? `?${qs}` : ""}`);
    },
};

// --- Storage helpers ---

async function getUserProfile(): Promise<UserProfile | null> {
    const result = await chrome.storage.local.get("userProfile");
    return (result.userProfile as UserProfile) ?? null;
}

// --- Badge ---

function setBadge(tabId: number, text: string, color: string): void {
    chrome.action.setBadgeText({ text, tabId });
    chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// --- Save decision to local storage for dashboard ---

async function logDecisionLocally(tec: TECResponse, product: ProductContext): Promise<void> {
    try {
        const result = await chrome.storage.local.get("decisionHistory");
        const history: Array<{
            productName: string; date: string; amountPaid: number;
            chosenTec: number; bestAlternativeTec: number; savings: number;
            category: string; platform: string; isAlternative?: boolean;
        }> = (result.decisionHistory as typeof history) ?? [];

        const bestAlt = tec.alternatives.length > 0 ? tec.alternatives[0].tec : tec.tec;
        const savings = tec.tec - bestAlt;

        history.unshift({
            productName: tec.productName ?? product.productName,
            date: new Date().toISOString(),
            amountPaid: tec.listedPrice,
            chosenTec: tec.tec,
            bestAlternativeTec: bestAlt,
            savings: Math.round(savings * 100) / 100,
            category: product.pageType,
            platform: product.platformId,
        });

        // Keep last 100 decisions
        await chrome.storage.local.set({ decisionHistory: history.slice(0, 100) });
    } catch {
        // Storage write failed — non-critical
    }
}

// --- Message handling ---

type ExtensionMessage =
    | ProductDetectedMessage
    | ProductClearedMessage
    | { type: "GET_TEC_DATA"; tabId: number }
    | { type: "GET_PRODUCT_CONTEXT"; tabId: number }
    | { type: "CHAT_MESSAGE"; message: string; tabId: number }
    | { type: "OPEN_MANUAL_ENTRY" }
    | { type: "DETECT_FROM_TAB"; tabId: number; title: string; url: string };

chrome.runtime.onMessage.addListener(
    (msg: ExtensionMessage, sender, sendResponse) => {
        const tabId = sender.tab?.id;

        if (msg.type === "PRODUCT_DETECTED" && tabId !== undefined) {
            const product = (msg as ProductDetectedMessage).payload;
            tabProducts.set(tabId, product);
            setBadge(tabId, "$", "#22c55e");

            // Fire-and-forget TEC computation
            getUserProfile().then((profile) => {
                if (!profile) return;
                backendClient
                    .computeTEC(product, profile)
                    .then((tec) => {
                        tabCache.set(tabId, tec);
                        setBadge(tabId, "✓", "#22c55e");
                        logDecisionLocally(tec, product);
                    })
                    .catch(() => {
                        setBadge(tabId, "!", "#ef4444");
                    });
            });
            return false;
        }

        if (msg.type === "PRODUCT_CLEARED" && tabId !== undefined) {
            tabCache.delete(tabId);
            tabProducts.delete(tabId);
            setBadge(tabId, "", "#000000");
            return false;
        }

        if (msg.type === "GET_TEC_DATA") {
            const data = tabCache.get(msg.tabId) ?? null;
            sendResponse(data);
            return false;
        }

        if (msg.type === "GET_PRODUCT_CONTEXT") {
            const ctx = tabProducts.get(msg.tabId) ?? null;
            sendResponse(ctx);
            return false;
        }

        if (msg.type === "CHAT_MESSAGE" && msg.tabId) {
            const product = tabProducts.get(msg.tabId);
            if (!product) {
                sendResponse({ error: "No product context" });
                return false;
            }
            getUserProfile().then((profile) => {
                if (!profile) {
                    sendResponse({ error: "No user profile" });
                    return;
                }
                const tecData = tabCache.get(msg.tabId) ?? null;
                backendClient
                    .chat(msg.message, {
                        productContext: product,
                        tecData,
                        conversationHistory: [],
                        userProfile: profile,
                    })
                    .then((res) => sendResponse(res))
                    .catch((err: Error) => sendResponse({ error: err.message }));
            });
            return true; // async sendResponse
        }

        if (msg.type === "DETECT_FROM_TAB") {
            const { tabId: reqTabId, title, url } = msg as { type: string; tabId: number; title: string; url: string };

            // Detect platform from URL
            const platformMap: Record<string, string> = {
                "amazon": "amazon", "walmart": "walmart", "target": "target",
                "bestbuy": "best_buy", "costco": "costco", "ebay": "ebay",
            };
            let platformId = "unknown";
            for (const [key, id] of Object.entries(platformMap)) {
                if (url.toLowerCase().includes(key)) { platformId = id; break; }
            }

            // Extract product name from title (remove " - Walmart.com" etc.)
            let productName = title
                .replace(/\s*[-–|]\s*(Walmart|Amazon|Target|Best Buy|Costco|eBay).*$/i, "")
                .replace(/\s*[-–|]\s*\w+\.com.*$/i, "")
                .trim();
            if (!productName) productName = title;

            // Create product context from tab info
            const product: ProductContext = {
                productName,
                listedPrice: 0, // Will be filled by LLM
                currency: "USD",
                seller: platformId,
                platformId,
                pageUrl: url,
                pageType: "product",
                extractedAt: new Date().toISOString(),
            };

            tabProducts.set(reqTabId, product);
            setBadge(reqTabId, "$", "#22c55e");

            // Compute TEC
            getUserProfile().then((profile) => {
                if (!profile) {
                    sendResponse({ error: "No user profile. Set up your profile first." });
                    return;
                }
                backendClient
                    .computeTEC(product, profile)
                    .then((tec) => {
                        tabCache.set(reqTabId, tec);
                        setBadge(reqTabId, "✓", "#22c55e");
                        logDecisionLocally(tec, product);
                        sendResponse(tec);
                    })
                    .catch((err: Error) => {
                        setBadge(reqTabId, "!", "#ef4444");
                        sendResponse({ error: err.message });
                    });
            });
            return true; // async
        }

        return false;
    }
);

// Clean up on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
    tabCache.delete(tabId);
    tabProducts.delete(tabId);
});

export { backendClient, getUserProfile, loadApiBaseUrl, validateTECResponse, validateChatResponse, parseErrorResponse };
export type { BackendClient, ChatContext, HistoryFilters, DecisionRecord, DecisionHistory, SyncResult };
