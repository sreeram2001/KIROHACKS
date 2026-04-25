import { useState, useEffect } from "react";
import type { UserProfile } from "../../models/profile";
import { createDefaultProfile } from "../../pages/ProfileSettings";

const C = {
    primaryTeal: "#14b8a6",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    textPrimary: "#1e293b",
    textSecondary: "#64748b",
    successGreen: "#10b981",
    border: "#e2e8f0",
} as const;

const MEMBERSHIP_LABELS: Record<string, string> = {
    amazon_prime: "Amazon Prime",
    walmart_plus: "Walmart+",
    target_circle_360: "Target Circle 360",
    sams_club: "Sam's Club",
    costco: "Costco",
};

const COMFORT_LABELS: Record<number, string> = {
    1: "Avoids returns",
    2: "Reluctant",
    3: "Moderate",
    4: "Comfortable",
    5: "Very comfortable",
};

export default function MiniProfile() {
    const [profile, setProfile] = useState<UserProfile>(createDefaultProfile());

    useEffect(() => {
        chrome.storage.local.get("userProfile", (result) => {
            if (result.userProfile) {
                setProfile(result.userProfile as UserProfile);
            }
        });
    }, []);

    const userName = profile.displayName || "Your Name";
    const initials = userName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";
    const activeMemberships = profile.memberships.filter(m => m.active);
    const isStudent = profile.studentStatus?.verified ?? false;
    const isVeteran = profile.isVeteran ?? false;
    const isSenior = profile.isSeniorCitizen ?? false;

    const openProfile = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("profile.html") });
    };

    const badges: string[] = [];
    if (isStudent) badges.push("Student");
    if (isVeteran) badges.push("Veteran");
    if (isSenior) badges.push("Senior");

    return (
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* User Avatar + Name */}
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "18px 16px", display: "flex", alignItems: "center", gap: 14,
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: "50%", background: C.primaryTeal,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 18, fontWeight: 700, flexShrink: 0,
                }}>{initials}</div>
                <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary }}>{userName}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                        {activeMemberships.length} active membership{activeMemberships.length !== 1 ? "s" : ""}
                    </div>
                    {badges.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {badges.map(b => (
                                <span key={b} style={{
                                    display: "inline-block", background: "rgba(20,184,166,0.1)",
                                    color: C.primaryTeal, padding: "2px 8px", borderRadius: 10,
                                    fontSize: 10, fontWeight: 600,
                                }}>{b}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Memberships Pills */}
            {activeMemberships.length > 0 && (
                <div style={{
                    background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                    padding: "14px 16px",
                }}>
                    <div style={{
                        fontSize: 11, fontWeight: 700, color: C.textSecondary,
                        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
                    }}>Memberships</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {activeMemberships.map(m => (
                            <span key={m.provider} style={{
                                display: "inline-block", background: "rgba(20,184,166,0.1)",
                                color: C.primaryTeal, padding: "4px 12px", borderRadius: 16,
                                fontSize: 12, fontWeight: 600,
                            }}>
                                {MEMBERSHIP_LABELS[m.provider] || m.provider}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Student Status + Return Comfort */}
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12,
            }}>
                {/* Student Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: C.textSecondary }}>Student Status</span>
                    {isStudent ? (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(16,185,129,0.1)", color: C.successGreen,
                            padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                        }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <circle cx="6" cy="6" r="6" fill={C.successGreen} />
                                <path d="M3.5 6l1.5 1.5 3.5-3.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Verified
                        </span>
                    ) : (
                        <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>Not verified</span>
                    )}
                </div>

                {/* Return Comfort Level */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    borderTop: `1px solid ${C.border}`, paddingTop: 12,
                }}>
                    <span style={{ fontSize: 13, color: C.textSecondary }}>Return Comfort</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 600 }}>
                            {profile.returnComfortLevel}/5
                        </span>
                        <span style={{ fontSize: 11, color: C.textSecondary }}>
                            {COMFORT_LABELS[profile.returnComfortLevel]}
                        </span>
                    </div>
                </div>
            </div>

            {/* View Full Profile */}
            <button onClick={openProfile} style={{
                background: "transparent", border: `1.5px solid ${C.primaryTeal}`,
                color: C.primaryTeal, borderRadius: 10, padding: "10px 0",
                fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
                View Full Profile
                <span style={{ fontSize: 15 }}>→</span>
            </button>
        </div>
    );
}
