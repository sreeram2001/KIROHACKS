import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import type { PopupTab } from "./components/Header";
import CostBreakdown from "./components/CostBreakdown";
import AlternativesPanel from "./components/AlternativesPanel";
import ChatbotPanel from "./components/ChatbotPanel";
import MiniDashboard from "./components/MiniDashboard";
import MiniProfile from "./components/MiniProfile";
import type { TECResponse } from "../models/tec";
import type { ChatMessage } from "../models/chat";

export default function Popup() {
    const [tecResponse, setTecResponse] = useState<TECResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [tabId, setTabId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<PopupTab>("analysis");

    const fetchTecData = useCallback(() => {
        if (tabId === null) return;
        setLoading(true);
        setError(null);
        chrome.runtime.sendMessage({ type: "GET_TEC_DATA", tabId }, (response: TECResponse | null) => {
            if (response) {
                setLoading(false);
                setTecResponse(response);
            } else {
                // Fallback: detect product from tab title/URL
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    const tab = tabs[0];
                    if (tab?.id && tab.title && tab.url) {
                        chrome.runtime.sendMessage(
                            { type: "DETECT_FROM_TAB", tabId: tab.id, title: tab.title, url: tab.url },
                            (tecOrError: TECResponse | { error: string } | null) => {
                                setLoading(false);
                                if (tecOrError && "tec" in tecOrError) {
                                    setTecResponse(tecOrError as TECResponse);
                                } else if (tecOrError && "error" in tecOrError) {
                                    setError((tecOrError as { error: string }).error);
                                } else {
                                    setTecResponse(null);
                                }
                            }
                        );
                    } else {
                        setLoading(false);
                        setTecResponse(null);
                    }
                });
            }
        });
    }, [tabId]);

    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab?.id) {
                setTabId(activeTab.id);
            }
        });
    }, []);

    useEffect(() => {
        if (tabId !== null) {
            fetchTecData();
        }
    }, [tabId, fetchTecData]);

    const handleRetry = () => {
        fetchTecData();
    };

    const handleSendMessage = (message: string) => {
        if (tabId === null) return;
        setLastMessage(message);
        setChatLoading(true);
        setChatError(null);

        const userMsg: ChatMessage = {
            role: "user",
            content: message,
            timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, userMsg]);

        chrome.runtime.sendMessage(
            { type: "CHAT_MESSAGE", message, tabId },
            (response: { reply: string; sources: string[] } | { error: string }) => {
                setChatLoading(false);
                if ("error" in response) {
                    setChatError(response.error);
                    return;
                }
                const assistantMsg: ChatMessage = {
                    role: "assistant",
                    content: response.reply,
                    timestamp: new Date().toISOString(),
                };
                setChatMessages((prev) => [...prev, assistantMsg]);
            }
        );
    };

    const handleChatRetry = () => {
        if (lastMessage) {
            setChatMessages((prev) => prev.slice(0, -1));
            handleSendMessage(lastMessage);
        }
    };

    const openSettings = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("profile.html") });
    };

    return (
        <div
            style={{
                width: 400,
                height: 600,
                maxHeight: 800,
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                display: "flex",
                flexDirection: "column",
                background: "#f8fafc",
                overflow: "hidden",
            }}
        >
            <Header
                tecResponse={tecResponse}
                onSettingsClick={openSettings}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Scrollable content area */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {activeTab === "analysis" && (
                    <>
                        {loading && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
                                <div
                                    style={{
                                        width: 32, height: 32,
                                        border: "3px solid #e2e8f0", borderTopColor: "#14b8a6",
                                        borderRadius: "50%", animation: "spin 0.8s linear infinite",
                                    }}
                                />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                <span style={{ marginTop: 12, fontSize: 13, color: "#64748b" }}>
                                    Calculating true cost...
                                </span>
                            </div>
                        )}

                        {!loading && error && (
                            <div style={{ padding: 24, textAlign: "center" }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                                <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{error}</div>
                                <button
                                    onClick={handleRetry}
                                    style={{
                                        background: "#14b8a6", color: "#fff", border: "none",
                                        borderRadius: 8, padding: "8px 20px", fontSize: 13,
                                        fontWeight: 600, cursor: "pointer",
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!loading && !error && !tecResponse && (
                            <div style={{ padding: 32, textAlign: "center" }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>
                                    No product detected
                                </div>
                                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                                    Navigate to a supported product page to see the true cost analysis.
                                </div>
                            </div>
                        )}

                        {!loading && !error && tecResponse && (
                            <>
                                <CostBreakdown tecResponse={tecResponse} />
                                <AlternativesPanel alternatives={tecResponse.alternatives} />
                            </>
                        )}
                    </>
                )}

                {activeTab === "dashboard" && <MiniDashboard />}
                {activeTab === "profile" && <MiniProfile />}
            </div>

            {/* Chat pinned to bottom — only on Analysis tab */}
            {activeTab === "analysis" && (
                <ChatbotPanel
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    loading={chatLoading}
                    error={chatError}
                    onRetry={handleChatRetry}
                />
            )}
        </div>
    );
}
