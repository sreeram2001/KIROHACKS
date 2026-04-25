import type { TECResponse } from "../../models/tec";
import TECScoreCircle from "./TECScoreCircle";

export type PopupTab = "analysis" | "dashboard" | "profile";

interface HeaderProps {
    tecResponse: TECResponse | null;
    onSettingsClick: () => void;
    activeTab: PopupTab;
    onTabChange: (tab: PopupTab) => void;
}

function getLabel(score: number): string {
    if (score >= 80) return "Great price";
    if (score >= 70) return "Fair price";
    if (score >= 50) return "Okay price";
    return "Poor value";
}

const TABS: { id: PopupTab; label: string }[] = [
    { id: "analysis", label: "Analysis" },
    { id: "dashboard", label: "Dashboard" },
    { id: "profile", label: "Profile" },
];

export default function Header({ tecResponse, onSettingsClick, activeTab, onTabChange }: HeaderProps) {
    const hasTec = tecResponse !== null;
    const score = hasTec
        ? Math.max(0, Math.min(100, Math.round(100 - ((tecResponse.tec - tecResponse.listedPrice) / tecResponse.listedPrice) * 100)))
        : 0;
    const label = hasTec ? getLabel(score) : "";
    const showTec = activeTab === "analysis" && hasTec;

    return (
        <div style={{ background: "#1a2332", flexShrink: 0 }}>
            {/* Top row: brand + TEC + gear */}
            <div style={{
                height: 44, display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "0 14px",
            }}>
                {/* Left: brand + optional TEC */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>
                        TrueCost
                    </span>
                    {showTec && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <TECScoreCircle tec={tecResponse.tec} listedPrice={tecResponse.listedPrice} size={30} />
                            <span style={{ color: "#fff", fontSize: 11, fontWeight: 500, opacity: 0.8 }}>{label}</span>
                        </div>
                    )}
                </div>

                {/* Right: settings gear */}
                <button
                    onClick={onSettingsClick}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        padding: 4, display: "flex", alignItems: "center",
                    }}
                    aria-label="Settings"
                >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16.17 12.5a1.39 1.39 0 00.28 1.53l.05.05a1.69 1.69 0 01-1.19 2.88 1.69 1.69 0 01-1.19-.5l-.05-.04a1.39 1.39 0 00-1.53-.28 1.39 1.39 0 00-.84 1.27v.14a1.69 1.69 0 01-3.38 0v-.07a1.39 1.39 0 00-.91-1.27 1.39 1.39 0 00-1.53.28l-.05.05a1.69 1.69 0 01-2.88-1.19c0-.45.18-.88.5-1.19l.04-.05a1.39 1.39 0 00.28-1.53 1.39 1.39 0 00-1.27-.84h-.14a1.69 1.69 0 010-3.38h.07a1.39 1.39 0 001.27-.91 1.39 1.39 0 00-.28-1.53l-.05-.05A1.69 1.69 0 014.76 3.3c.45 0 .88.18 1.19.5l.05.04a1.39 1.39 0 001.53.28h.07a1.39 1.39 0 00.84-1.27v-.14a1.69 1.69 0 013.38 0v.07a1.39 1.39 0 00.84 1.27 1.39 1.39 0 001.53-.28l.05-.05a1.69 1.69 0 012.38 2.39l-.04.05a1.39 1.39 0 00-.28 1.53v.07a1.39 1.39 0 001.27.84h.14a1.69 1.69 0 010 3.38h-.07a1.39 1.39 0 00-1.27.84z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* Tab bar */}
            <div style={{
                display: "flex", justifyContent: "center", gap: 0,
                borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
                {TABS.map(tab => {
                    const active = activeTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
                            flex: 1, background: "none", border: "none", cursor: "pointer",
                            padding: "8px 0 6px", fontSize: 12, fontWeight: active ? 600 : 400,
                            color: active ? "#14b8a6" : "rgba(255,255,255,0.55)",
                            borderBottom: active ? "2px solid #14b8a6" : "2px solid transparent",
                            transition: "all 0.15s",
                        }}>{tab.label}</button>
                    );
                })}
            </div>
        </div>
    );
}
