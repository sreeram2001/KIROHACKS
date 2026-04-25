import type { TECResponse } from "../../models/tec";

interface CostBreakdownProps {
    tecResponse: TECResponse;
}

function fmt(value: number, currency: string): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

const LAYER_INFO: { key: keyof TECResponse["layerBreakdown"]; label: string; icon: string; description: string }[] = [
    {
        key: "riskOfLoss",
        label: "Risk of Loss",
        icon: "⚠️",
        description: "Refund denial probability, warranty gaps, claim rejection risk",
    },
    {
        key: "timeEffort",
        label: "Time & Effort",
        icon: "⏱️",
        description: "Hours on hold, forms, shipping logistics, retry loops",
    },
    {
        key: "behavioralPricing",
        label: "Behavioral Pricing",
        icon: "📊",
        description: "Surge pricing, cart abandonment tricks, loyalty penalties",
    },
    {
        key: "userConstraints",
        label: "User Constraints",
        icon: "🔒",
        description: "Urgency markup, platform lock-in, limited payment options",
    },
    {
        key: "pathEffects",
        label: "Path Effects",
        icon: "🔄",
        description: "Renewal traps, upgrade pressure, compounding future costs",
    },
];

export default function CostBreakdown({ tecResponse }: CostBreakdownProps) {
    const { listedPrice, tec, currency, layerBreakdown } = tecResponse;
    const totalHidden = tec - listedPrice;

    return (
        <div style={{
            background: "#ffffff", borderRadius: 12, padding: "14px 16px",
            margin: "12px 12px 0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
            {/* Base price */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", fontSize: 14,
            }}>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>Listed Price</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>{fmt(listedPrice, currency)}</span>
            </div>

            {/* Hidden costs header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0 4px", marginTop: 4,
                borderTop: "1px solid #e2e8f0",
            }}>
                <span style={{
                    fontSize: 11, fontWeight: 700, color: "#64748b",
                    textTransform: "uppercase", letterSpacing: 0.8,
                }}>Hidden Cost Layers</span>
                <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: totalHidden > 0 ? "#ef4444" : "#10b981",
                }}>+{fmt(totalHidden, currency)}</span>
            </div>

            {/* 5 hidden cost layers */}
            {LAYER_INFO.map((layer) => {
                const value = layerBreakdown[layer.key];
                const pct = listedPrice > 0 ? ((value / listedPrice) * 100).toFixed(1) : "0";
                const barWidth = listedPrice > 0 ? Math.min((value / listedPrice) * 100 * 5, 100) : 0;

                return (
                    <div key={layer.key} style={{ padding: "6px 0" }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 2,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12 }}>{layer.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
                                    {layer.label}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11, color: "#94a3b8" }}>{pct}%</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>
                                    +{fmt(value, currency)}
                                </span>
                            </div>
                        </div>
                        {/* Mini bar */}
                        <div style={{
                            height: 3, background: "#f1f5f9", borderRadius: 2, overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%", borderRadius: 2,
                                background: value > 0 ? "#ef4444" : "#e2e8f0",
                                width: `${barWidth}%`,
                                transition: "width 0.3s",
                                opacity: 0.6,
                            }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                            {layer.description}
                        </div>
                    </div>
                );
            })}

            {/* True Economic Cost total */}
            <div style={{
                borderTop: "2px solid #1a2332", marginTop: 8, paddingTop: 10,
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a2332" }}>
                    True Economic Cost
                </span>
                <span style={{ fontWeight: 700, fontSize: 20, color: "#1a2332" }}>
                    {fmt(tec, currency)}
                </span>
            </div>
        </div>
    );
}
