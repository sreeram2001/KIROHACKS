import React, { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../../models/chat";

interface ChatbotPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

function renderMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br/>");
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
    const isUser = msg.role === "user";
    return (
        <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div
                style={{
                    maxWidth: "80%",
                    padding: "8px 12px",
                    borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    fontSize: 13,
                    lineHeight: 1.5,
                    background: isUser ? "#14b8a6" : "#f1f5f9",
                    color: isUser ? "#fff" : "#1e293b",
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
        </div>
    );
}

export default function ChatbotPanel({ messages, onSendMessage, loading, error, onRetry }: ChatbotPanelProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) return;
        onSendMessage(trimmed);
        setInput("");
    };

    const hasMessages = messages.length > 0 || loading || error;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid #e2e8f0",
                background: "#ffffff",
                flexShrink: 0,
            }}
        >
            {/* Chat messages area — only visible when there are messages */}
            {hasMessages && (
                <div
                    ref={scrollRef}
                    style={{
                        maxHeight: 300,
                        overflowY: "auto",
                        padding: "10px 12px 4px",
                    }}
                >
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} msg={msg} />
                    ))}
                    {loading && (
                        <div style={{ color: "#64748b", fontSize: 12, padding: "2px 0 6px" }}>
                            Thinking...
                        </div>
                    )}
                    {error && (
                        <div style={{ color: "#ef4444", fontSize: 12, padding: "2px 0 6px" }}>
                            {error}{" "}
                            <button
                                onClick={onRetry}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#14b8a6",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    fontSize: 12,
                                    padding: 0,
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Input bar */}
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 12px",
                    gap: 8,
                }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask TrueCost anything about this product..."
                    style={{
                        flex: 1,
                        border: "1px solid #e2e8f0",
                        borderRadius: 20,
                        padding: "8px 14px",
                        fontSize: 13,
                        outline: "none",
                        color: "#1e293b",
                        background: "#f8fafc",
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "none",
                        background: loading || !input.trim() ? "#94a3b8" : "#14b8a6",
                        cursor: loading || !input.trim() ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "background 0.15s",
                    }}
                >
                    {/* Paper plane icon */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M14.5 1.5L7.25 8.75M14.5 1.5L10 14.5L7.25 8.75M14.5 1.5L1.5 6L7.25 8.75"
                            stroke="#fff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </form>
        </div>
    );
}
