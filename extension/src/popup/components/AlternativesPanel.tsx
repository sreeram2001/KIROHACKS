import type { Alternative } from "../../models/tec";
import TECScoreCircle from "./TECScoreCircle";

interface AlternativesPanelProps {
    alternatives: Alternative[];
}

function fmt(value: number, currency: string): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

function AlternativeCard({ alt, isBest }: { alt: Alternative; isBest: boolean }) {
    return (
        <div
            style={{
                minWidth: 160,
                maxWidth: 170,
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 12,
                background: "#ffffff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
            }}
        >
            {isBest && (
                <span
                    style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        background: "#14b8a6",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                    }}
                >
                    Best Deal
                </span>
            )}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: isBest ? 20 : 0,
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                    {alt.seller}
                </span>
                <TECScoreCircle tec={alt.tec} listedPrice={alt.listedPrice} size={30} />
            </div>

            <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>
                {fmt(alt.listedPrice, alt.currency)}
            </div>

            <div
                style={{
                    fontSize: 12,
                    color: "#64748b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {alt.productName}
            </div>

            <a
                href={alt.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: "block",
                    textAlign: "center",
                    border: "1.5px solid #14b8a6",
                    color: "#14b8a6",
                    borderRadius: 8,
                    padding: "5px 0",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    marginTop: "auto",
                    cursor: "pointer",
                }}
            >
                Switch
            </a>
        </div>
    );
}

export default function AlternativesPanel({ alternatives }: AlternativesPanelProps) {
    if (alternatives.length === 0) return null;

    return (
        <div style={{ padding: "12px 0 0 12px" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingRight: 12,
                    marginBottom: 8,
                }}
            >
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                    Alternatives
                </span>
                <span style={{ fontSize: 12, color: "#14b8a6", fontWeight: 500 }}>
                    Scroll →
                </span>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 10,
                    overflowX: "auto",
                    paddingBottom: 12,
                    paddingRight: 12,
                }}
            >
                {alternatives.map((alt, i) => (
                    <AlternativeCard key={`${alt.platformId}-${i}`} alt={alt} isBest={i === 0} />
                ))}
            </div>
        </div>
    );
}
