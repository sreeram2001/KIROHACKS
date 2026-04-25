import { useState, useEffect } from "react";
import type { DecisionRecord } from "../../pages/Dashboard";

const C = {
    primaryTeal: "#14b8a6",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
    successGreen: "#10b981",
    border: "#e2e8f0",
} as const;

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export default function MiniDashboard() {
    const [decisions, setDecisions] = useState<DecisionRecord[]>([]);

    useEffect(() => {
        chrome.storage.local.get("decisionHistory", (result) => {
            if (result.decisionHistory && Array.isArray(result.decisionHistory)) {
                setDecisions(result.decisionHistory as DecisionRecord[]);
            }
        });
    }, []);

    const totalSaved = decisions.reduce((sum, d) => sum + d.savings, 0);
    const recent = [...decisions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    const openDashboard = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    };

    return (
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Total Saved Card */}
            <div style={{
                background: `linear-gradient(135deg, ${C.primaryTeal}, #0d9488)`,
                borderRadius: 12, padding: "18px 20px", color: "#fff",
            }}>
                <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85, marginBottom: 4 }}>Total Saved</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatCurrency(totalSaved)}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                    {decisions.length} decision{decisions.length !== 1 ? "s" : ""} tracked
                </div>
            </div>

            {/* Recent Decisions */}
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                overflow: "hidden",
            }}>
                <div style={{
                    padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
                    fontSize: 12, fontWeight: 700, color: C.textSecondary,
                    textTransform: "uppercase", letterSpacing: 0.5,
                }}>Recent Decisions</div>

                {recent.length === 0 ? (
                    <div style={{ padding: "20px 14px", textAlign: "center", color: C.textSecondary, fontSize: 13 }}>
                        No decisions yet. Start shopping!
                    </div>
                ) : (
                    recent.map((d, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                            borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none",
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 600, color: C.textPrimary,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{d.productName}</div>
                                <div style={{ fontSize: 11, color: C.textSecondary }}>{d.platform}</div>
                            </div>
                            <span style={{
                                fontSize: 13, fontWeight: 700, flexShrink: 0,
                                color: d.savings >= 0 ? C.successGreen : "#ef4444",
                            }}>
                                {d.savings >= 0 ? "+" : ""}{formatCurrency(d.savings)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* View Full Dashboard */}
            <button onClick={openDashboard} style={{
                background: "transparent", border: `1.5px solid ${C.primaryTeal}`,
                color: C.primaryTeal, borderRadius: 10, padding: "10px 0",
                fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
                View Full Dashboard
                <span style={{ fontSize: 15 }}>→</span>
            </button>
        </div>
    );
}
