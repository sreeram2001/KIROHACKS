import React, { useState, useEffect } from "react";
import type { Membership } from "../models/profile";
import type { FairnessVerdict } from "../models/tec";
import TECScoreCircle from "../popup/components/TECScoreCircle";

// --- Types ---

export interface DecisionRecord {
    productName: string;
    date: string;
    amountPaid: number;
    chosenTec: number;
    bestAlternativeTec: number;
    savings: number;
    category: string;
    platform: string;
    isAlternative?: boolean;
}

export interface MembershipROI {
    provider: Membership["provider"];
    label: string;
    totalSavings: number;
    annualCost: number;
    netValue: number;
}

export interface MembershipAlert {
    provider: string;
    label: string;
    renewalDate: string;
    totalSavings: number;
    annualCost: number;
    recommendation: "renew" | "cancel";
}

export interface EthicsLogEntry {
    productName: string;
    date: string;
    verdict: FairnessVerdict;
}

interface Filters {
    category: string;
    platform: string;
    savingsType: string;
    timePeriod: string;
}

// --- Utility functions (exported for tests) ---

export function computeTotalSaved(decisions: DecisionRecord[]): number {
    return decisions.reduce((sum, d) => sum + d.savings, 0);
}

export function filterDecisions(decisions: DecisionRecord[], filters: Filters): DecisionRecord[] {
    return decisions.filter((d) => {
        if (filters.category && d.category !== filters.category) return false;
        if (filters.platform && d.platform !== filters.platform) return false;
        if (filters.savingsType === "positive" && d.savings <= 0) return false;
        if (filters.savingsType === "negative" && d.savings >= 0) return false;
        if (filters.timePeriod) {
            const cutoff = new Date();
            if (filters.timePeriod === "7d") cutoff.setDate(cutoff.getDate() - 7);
            else if (filters.timePeriod === "30d") cutoff.setDate(cutoff.getDate() - 30);
            else if (filters.timePeriod === "90d") cutoff.setDate(cutoff.getDate() - 90);
            if (new Date(d.date) < cutoff) return false;
        }
        return true;
    });
}

export function computeMembershipROI(
    provider: Membership["provider"],
    label: string,
    totalSavings: number,
    annualCost: number
): MembershipROI {
    return { provider, label, totalSavings, annualCost, netValue: totalSavings - annualCost };
}

export function getMembershipAlerts(memberships: Membership[], now: Date = new Date()): MembershipAlert[] {
    const alerts: MembershipAlert[] = [];
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    for (const m of memberships) {
        if (!m.active || !m.renewalDate) continue;
        const renewal = new Date(m.renewalDate);
        const diff = renewal.getTime() - now.getTime();
        if (diff >= 0 && diff <= thirtyDaysMs) {
            alerts.push({
                provider: m.provider,
                label: m.provider.replace(/_/g, " "),
                renewalDate: m.renewalDate,
                totalSavings: 0,
                annualCost: m.annualCost,
                recommendation: "renew",
            });
        }
    }
    return alerts;
}

// --- Design System ---

const C = {
    primaryDark: "#1a2332",
    primaryTeal: "#14b8a6",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
    successGreen: "#10b981",
    dangerRed: "#ef4444",
    border: "#e2e8f0",
} as const;


function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function daysUntil(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

type NavPage = "overview" | "history" | "memberships" | "profile";

const NAV_ITEMS: { id: NavPage; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "history", label: "Decision History", icon: "📋" },
    { id: "memberships", label: "Memberships", icon: "💳" },
    { id: "profile", label: "Profile", icon: "👤" },
];

const CATEGORY_CHIPS = ["All Categories", "Electronics", "Apparel", "Home & Kitchen", "Toys"];
const PLATFORM_CHIPS = ["All Platforms", "Amazon", "Walmart", "Target", "Best Buy"];

const MEMBERSHIP_COLORS: Record<string, string> = {
    amazon_prime: "#f97316",
    walmart_plus: "#3b82f6",
    target_circle_360: "#ef4444",
    sams_club: "#8b5cf6",
    costco: "#10b981",
};

const MEMBERSHIP_LABELS: Record<string, string> = {
    amazon_prime: "Amazon Prime",
    walmart_plus: "Walmart+",
    target_circle_360: "Target Circle 360",
    sams_club: "Sam's Club",
    costco: "Costco",
};

// --- Sidebar ---

function Sidebar({ activePage, onNavigate, userName }: {
    activePage: NavPage;
    onNavigate: (p: NavPage) => void;
    userName: string;
}) {
    const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "TC";
    return (
        <div style={{
            width: 220, minHeight: "100vh", background: C.primaryDark,
            display: "flex", flexDirection: "column", padding: "24px 0", boxSizing: "border-box",
            position: "fixed", left: 0, top: 0, zIndex: 10,
        }}>
            <div style={{ padding: "0 20px", marginBottom: 32 }}>
                <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>TrueCost</span>
            </div>
            <nav style={{ flex: 1 }}>
                {NAV_ITEMS.map(item => {
                    const active = activePage === item.id;
                    return (
                        <button key={item.id} onClick={() => onNavigate(item.id)} style={{
                            display: "flex", alignItems: "center", gap: 10, width: "calc(100% - 16px)",
                            margin: "2px 8px", padding: "10px 12px", border: "none", borderRadius: 8,
                            background: active ? "rgba(20,184,166,0.15)" : "transparent",
                            color: active ? C.primaryTeal : "rgba(255,255,255,0.8)",
                            fontSize: 14, fontWeight: active ? 600 : 400, cursor: "pointer",
                            textAlign: "left", transition: "all 0.15s",
                        }}>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            {item.label}
                        </button>
                    );
                })}
            </nav>
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%", background: C.primaryTeal,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 13, fontWeight: 700,
                    }}>{initials}</div>
                    <div>
                        <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{userName || "User"}</div>
                        <button onClick={() => onNavigate("profile")} style={{
                            background: "none", border: "none", color: C.primaryTeal,
                            fontSize: 12, cursor: "pointer", padding: 0,
                        }}>Settings</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Top Bar ---

function TopBar({ userName }: { userName: string }) {
    const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "TC";
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 32px", background: C.cardBg, borderBottom: `1px solid ${C.border}`,
        }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>TrueCost</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, background: C.bg,
                    borderRadius: 8, padding: "8px 14px", border: `1px solid ${C.border}`,
                }}>
                    <span style={{ color: C.textSecondary }}>🔍</span>
                    <input placeholder="Search..." style={{
                        border: "none", background: "transparent", outline: "none",
                        fontSize: 13, color: C.textPrimary, width: 180,
                    }} />
                </div>
                <span style={{ fontSize: 18, cursor: "pointer", color: C.textSecondary }}>🔔</span>
                <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: C.primaryTeal,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 12, fontWeight: 700,
                }}>{initials}</div>
            </div>
        </div>
    );
}

// --- Stat Card ---

function StatCard({ icon, label, value, subtitle, subtitleColor }: {
    icon: string; label: string; value: string; subtitle?: string; subtitleColor?: string;
}) {
    return (
        <div style={{
            flex: 1, background: C.cardBg, borderRadius: 12, padding: "20px 24px",
            border: `1px solid ${C.border}`, minWidth: 0,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.textPrimary }}>{value}</div>
            {subtitle && (
                <div style={{ fontSize: 12, color: subtitleColor || C.textSecondary, marginTop: 4 }}>{subtitle}</div>
            )}
        </div>
    );
}

// --- Filter Chip ---

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", fontSize: 13, cursor: "pointer",
            fontWeight: active ? 600 : 400, transition: "all 0.15s",
            background: active ? C.primaryTeal : C.bg,
            color: active ? "#fff" : C.textSecondary,
        }}>{label}</button>
    );
}


// --- Table Styles ---

const thStyle: React.CSSProperties = {
    padding: "10px 12px", fontSize: 11, fontWeight: 600, color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, textAlign: "left",
    borderBottom: `2px solid ${C.border}`,
};
const tdStyle: React.CSSProperties = {
    padding: "12px 12px", fontSize: 13, color: C.textPrimary,
    borderBottom: `1px solid ${C.border}`,
};

// --- Overview Page ---

function OverviewPage({ decisions }: { decisions: DecisionRecord[] }) {
    const totalSaved = computeTotalSaved(decisions);
    const recent = [...decisions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Overview</h1>
                <p style={{ fontSize: 14, color: C.textSecondary, margin: "4px 0 0" }}>
                    Track your savings and make smarter purchasing decisions
                </p>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
                <StatCard icon="💰" label="Total Saved This Year" value={formatCurrency(totalSaved)}
                    subtitle="+12% from last month" subtitleColor={C.successGreen} />
                <StatCard icon="📋" label="Decisions Tracked" value={String(decisions.length)} />
                <StatCard icon="💳" label="Active Memberships" value="3" />
            </div>
            <div style={{ background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, margin: 0 }}>Recent Decisions</h2>
                </div>
                {recent.length === 0 ? (
                    <div style={{ padding: 24, color: C.textSecondary, fontSize: 13, textAlign: "center" }}>
                        No decisions recorded yet. Start shopping to track your savings!
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Product</th>
                                <th style={thStyle}>Platform</th>
                                <th style={thStyle}>What You Paid</th>
                                <th style={thStyle}>TEC Score</th>
                                <th style={thStyle}>Savings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.map((d, i) => (
                                <tr key={i} style={{ transition: "background 0.1s" }}>
                                    <td style={tdStyle}>{new Date(d.date).toLocaleDateString()}</td>
                                    <td style={tdStyle}>{d.productName}</td>
                                    <td style={tdStyle}>{d.platform}</td>
                                    <td style={tdStyle}>{formatCurrency(d.amountPaid)}</td>
                                    <td style={tdStyle}>
                                        <TECScoreCircle tec={d.chosenTec} listedPrice={d.amountPaid} size={36} />
                                    </td>
                                    <td style={{ ...tdStyle, color: d.savings >= 0 ? C.successGreen : C.dangerRed, fontWeight: 600 }}>
                                        {d.savings >= 0 ? "+" : ""}{formatCurrency(d.savings)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// --- Decision History Page ---

function DecisionHistoryPage({ decisions }: { decisions: DecisionRecord[] }) {
    const [activeCategory, setActiveCategory] = useState("All Categories");
    const [activePlatform, setActivePlatform] = useState("All Platforms");

    const filtered = decisions.filter(d => {
        if (activeCategory !== "All Categories" && d.category !== activeCategory) return false;
        if (activePlatform !== "All Platforms" && d.platform !== activePlatform) return false;
        return true;
    });

    const totalSpent = filtered.reduce((s, d) => s + d.amountPaid, 0);
    const totalSaved = computeTotalSaved(filtered);
    const avgScore = filtered.length > 0
        ? Math.round(filtered.reduce((s, d) => s + Math.max(0, Math.min(100, Math.round(100 - ((d.chosenTec - d.amountPaid) / d.amountPaid) * 100))), 0) / filtered.length)
        : 0;

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Decision History</h1>
                <p style={{ fontSize: 14, color: C.textSecondary, margin: "4px 0 0" }}>
                    Review all your past purchasing decisions and savings
                </p>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {CATEGORY_CHIPS.map(c => (
                    <FilterChip key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} />
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {PLATFORM_CHIPS.map(p => (
                    <FilterChip key={p} label={p} active={activePlatform === p} onClick={() => setActivePlatform(p)} />
                ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
                <StatCard icon="📋" label="Total Decisions" value={String(filtered.length)} />
                <StatCard icon="💵" label="Total Spent" value={formatCurrency(totalSpent)} />
                <StatCard icon="💰" label="Total Saved" value={formatCurrency(totalSaved)} subtitleColor={C.successGreen} />
                <StatCard icon="📊" label="Avg TEC Score" value={String(avgScore)} />
            </div>
            <div style={{ background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: 24, color: C.textSecondary, fontSize: 13, textAlign: "center" }}>
                        No decisions match your filters.
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Product</th>
                                <th style={thStyle}>Category</th>
                                <th style={thStyle}>Platform</th>
                                <th style={thStyle}>What You Paid</th>
                                <th style={thStyle}>TEC Score</th>
                                <th style={thStyle}>Savings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((d, i) => (
                                <tr key={i}>
                                    <td style={tdStyle}>{new Date(d.date).toLocaleDateString()}</td>
                                    <td style={tdStyle}>
                                        <div>{d.productName}</div>
                                        {d.isAlternative && (
                                            <span style={{
                                                display: "inline-block", marginTop: 2, fontSize: 10, fontWeight: 600,
                                                color: C.primaryTeal, background: "rgba(20,184,166,0.1)",
                                                padding: "1px 6px", borderRadius: 4,
                                            }}>Alternative</span>
                                        )}
                                    </td>
                                    <td style={tdStyle}>{d.category}</td>
                                    <td style={tdStyle}>{d.platform}</td>
                                    <td style={tdStyle}>{formatCurrency(d.amountPaid)}</td>
                                    <td style={tdStyle}>
                                        <TECScoreCircle tec={d.chosenTec} listedPrice={d.amountPaid} size={36} />
                                    </td>
                                    <td style={{ ...tdStyle, color: d.savings >= 0 ? C.successGreen : C.dangerRed, fontWeight: 600 }}>
                                        {d.savings >= 0 ? "+" : ""}{formatCurrency(d.savings)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}


// --- Memberships Page ---

function MembershipsPage({ memberships, decisions, onNavigate }: { memberships: Membership[]; decisions: DecisionRecord[]; onNavigate: (p: NavPage) => void }) {
    const activeMemberships = memberships.filter(m => m.active);
    const totalAnnualCost = activeMemberships.reduce((s, m) => s + m.annualCost, 0);

    // Compute per-membership savings from decisions (simplified: attribute savings by platform match)
    const membershipSavings: Record<string, number> = {};
    const platformToProvider: Record<string, string> = {
        Amazon: "amazon_prime", Walmart: "walmart_plus", Target: "target_circle_360",
    };
    for (const d of decisions) {
        const prov = platformToProvider[d.platform];
        if (prov) membershipSavings[prov] = (membershipSavings[prov] || 0) + d.savings;
    }

    const totalValue = Object.values(membershipSavings).reduce((s, v) => s + Math.max(0, v), 0);
    const netSavings = totalValue - totalAnnualCost;
    const alerts = getMembershipAlerts(memberships);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Memberships</h1>
                    <p style={{ fontSize: 14, color: C.textSecondary, margin: "4px 0 0" }}>
                        Track your membership costs and value received
                    </p>
                </div>
                <button onClick={() => onNavigate("profile")} style={{
                    background: C.primaryTeal, color: "#fff", border: "none", borderRadius: 8,
                    padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>+ Add Membership</button>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
                <StatCard icon="💵" label="Total Annual Cost" value={formatCurrency(totalAnnualCost)} />
                <StatCard icon="📈" label="Total Value Received" value={formatCurrency(totalValue)} subtitleColor={C.primaryTeal} />
                <StatCard icon="💰" label="Net Savings" value={(netSavings >= 0 ? "+" : "") + formatCurrency(netSavings)}
                    subtitleColor={netSavings >= 0 ? C.successGreen : C.dangerRed} />
            </div>

            {/* Alerts */}
            {alerts.map((alert, i) => {
                const days = daysUntil(alert.renewalDate);
                return (
                    <div key={i} style={{
                        background: "rgba(239,68,68,0.06)", border: `1px solid rgba(239,68,68,0.2)`,
                        borderRadius: 12, padding: "16px 20px", marginBottom: 16,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>
                                {MEMBERSHIP_LABELS[alert.provider] || alert.label} Renewal in {days} Days
                            </div>
                            <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                                Annual cost: {formatCurrency(alert.annualCost)}. Review your usage before renewal.
                            </div>
                            <button style={{
                                background: "none", border: "none", color: C.primaryTeal,
                                fontSize: 12, cursor: "pointer", padding: 0, marginTop: 6,
                            }}>View full usage breakdown →</button>
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <button style={{
                                background: "transparent", border: `1px solid ${C.dangerRed}`, color: C.dangerRed,
                                borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>Cancel Membership</button>
                            <button style={{
                                background: "none", border: "none", color: C.textSecondary,
                                fontSize: 12, cursor: "pointer",
                            }}>Keep It</button>
                        </div>
                    </div>
                );
            })}

            {/* Membership Cards */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {activeMemberships.map(m => {
                    const label = MEMBERSHIP_LABELS[m.provider] || m.provider;
                    const color = MEMBERSHIP_COLORS[m.provider] || C.primaryTeal;
                    const savings = membershipSavings[m.provider] || 0;
                    const valueReceived = Math.max(0, savings);
                    const netValue = valueReceived - m.annualCost;
                    const maxBar = Math.max(valueReceived, m.annualCost, 1);
                    const days = m.renewalDate ? daysUntil(m.renewalDate) : null;

                    return (
                        <div key={m.provider} style={{
                            flex: "1 1 280px", background: C.cardBg, borderRadius: 12,
                            border: `1px solid ${C.border}`, padding: 20, minWidth: 260,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: "50%", background: color,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontSize: 16, fontWeight: 700,
                                }}>{label[0]}</div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: C.textPrimary }}>{label}</div>
                                    {days !== null && (
                                        <div style={{ fontSize: 11, color: C.textSecondary }}>Renewal in {days} days</div>
                                    )}
                                </div>
                            </div>

                            {/* Value Received bar */}
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                                    <span>Value Received</span>
                                    <span style={{ color: C.primaryTeal, fontWeight: 600 }}>{formatCurrency(valueReceived)}</span>
                                </div>
                                <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                                    <div style={{
                                        height: "100%", borderRadius: 3, background: C.primaryTeal,
                                        width: `${(valueReceived / maxBar) * 100}%`, transition: "width 0.3s",
                                    }} />
                                </div>
                            </div>

                            {/* Annual Cost bar */}
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                                    <span>Annual Cost</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(m.annualCost)}</span>
                                </div>
                                <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                                    <div style={{
                                        height: "100%", borderRadius: 3, background: C.primaryDark,
                                        width: `${(m.annualCost / maxBar) * 100}%`, transition: "width 0.3s",
                                    }} />
                                </div>
                            </div>

                            {/* Net Value + Manage */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                <div>
                                    <span style={{ fontSize: 12, color: C.textSecondary }}>Net Value </span>
                                    <span style={{
                                        fontSize: 16, fontWeight: 700,
                                        color: netValue >= 0 ? C.successGreen : C.dangerRed,
                                    }}>{netValue >= 0 ? "+" : ""}{formatCurrency(netValue)}</span>
                                </div>
                                <button style={{
                                    background: "none", border: "none", color: C.primaryTeal,
                                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                                }}>Manage</button>
                            </div>

                            {/* Warning for negative ROI */}
                            {netValue < 0 && (
                                <div style={{
                                    marginTop: 12, padding: "8px 12px", borderRadius: 8,
                                    background: "rgba(239,68,68,0.06)", fontSize: 12, color: C.dangerRed,
                                }}>
                                    ⚠ This membership costs more than it saves. Consider canceling before renewal.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {activeMemberships.length === 0 && (
                <div style={{
                    background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                    padding: 32, textAlign: "center", color: C.textSecondary, fontSize: 13,
                }}>
                    No active memberships. Add one to start tracking your ROI.
                </div>
            )}
        </div>
    );
}


// --- Inline Profile Page (embedded in dashboard) ---

function ProfilePage() {
    // Delegates to the standalone ProfileSettings but embedded in the dashboard layout
    const ProfileSettings = React.lazy(() => import("./ProfileSettings"));
    return (
        <React.Suspense fallback={<div style={{ color: C.textSecondary, padding: 24 }}>Loading...</div>}>
            <ProfileSettings />
        </React.Suspense>
    );
}

// --- Main Dashboard ---

export default function Dashboard() {
    const [activePage, setActivePage] = useState<NavPage>("overview");
    const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
    const [memberships, setMemberships] = useState<Membership[]>([]);
    const [_ethicsLog, setEthicsLog] = useState<EthicsLogEntry[]>([]);
    const [userName, setUserName] = useState("User");

    useEffect(() => {
        chrome.storage.local.get(["decisionHistory", "userProfile", "ethicsLog"], (result) => {
            if (result.decisionHistory) setDecisions(result.decisionHistory as DecisionRecord[]);
            if (result.userProfile) {
                const profile = result.userProfile as { memberships: Membership[]; displayName?: string; userId?: string };
                // Migrate membership costs if they're 0
                const COSTS: Record<string, number> = {
                    amazon_prime: 139, walmart_plus: 98, target_circle_360: 49,
                    sams_club: 50, costco: 65,
                };
                const fixedMemberships = profile.memberships.map(m => ({
                    ...m,
                    annualCost: m.annualCost > 0 ? m.annualCost : (COSTS[m.provider] ?? 0),
                }));
                setMemberships(fixedMemberships);
                if (profile.displayName) setUserName(profile.displayName);
                // Save back if costs were fixed
                if (fixedMemberships.some((m, i) => m.annualCost !== profile.memberships[i].annualCost)) {
                    chrome.storage.local.set({ userProfile: { ...profile, memberships: fixedMemberships } });
                }
            }
            if (result.ethicsLog) setEthicsLog(result.ethicsLog as EthicsLogEntry[]);
        });
    }, []);

    const renderPage = () => {
        switch (activePage) {
            case "overview": return <OverviewPage decisions={decisions} />;
            case "history": return <DecisionHistoryPage decisions={decisions} />;
            case "memberships": return <MembershipsPage memberships={memberships} decisions={decisions} onNavigate={setActivePage} />;
            case "profile": return <ProfilePage />;
        }
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
            <Sidebar activePage={activePage} onNavigate={setActivePage} userName={userName} />
            <div style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column" }}>
                <TopBar userName={userName} />
                <div style={{ flex: 1, padding: 32 }}>
                    {renderPage()}
                </div>
            </div>
        </div>
    );
}
