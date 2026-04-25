import React, { useState, useEffect, useMemo } from "react";
import type {
    UserProfile,
    Membership,
    PaymentMethod,
    CashbackCategory,
    CitizenshipResidency,
} from "../models/profile";
import { findMatchingCards, type KnownCard } from "../data/cardDatabase";

const MEMBERSHIP_PROVIDERS: { id: Membership["provider"]; label: string }[] = [
    { id: "amazon_prime", label: "Amazon Prime" },
    { id: "walmart_plus", label: "Walmart+" },
    { id: "target_circle_360", label: "Target Circle 360" },
    { id: "sams_club", label: "Sam's Club" },
    { id: "costco", label: "Costco" },
];

export function isValidEduEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.edu$/i;
    return pattern.test(email);
}

export function createDefaultProfile(): UserProfile {
    return {
        userId: crypto.randomUUID(),
        displayName: "",
        email: "",
        dateOfBirth: null,
        isSeniorCitizen: false,
        isVeteran: false,
        memberships: [],
        studentStatus: null,
        paymentMethods: [],
        returnComfortLevel: 3,
        citizenshipResidency: null,
        cloudSyncEnabled: false,
        lastModified: new Date().toISOString(),
    };
}

/** Calculate age from ISO date string */
export function calculateAge(dob: string | null | undefined): number | null {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
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

const MEMBERSHIP_COLORS: Record<string, string> = {
    amazon_prime: "#f97316",
    walmart_plus: "#3b82f6",
    target_circle_360: "#ef4444",
    sams_club: "#8b5cf6",
    costco: "#ef4444",
};

const CARD_COLORS: Record<string, string> = {
    Visa: "#1a56db",
    Mastercard: "#eb5b25",
    Amex: "#2e7d32",
    Discover: "#f59e0b",
};

function getCardLetter(name: string): string {
    if (name.toLowerCase().includes("visa")) return "V";
    if (name.toLowerCase().includes("mastercard") || name.toLowerCase().includes("mc")) return "M";
    if (name.toLowerCase().includes("amex")) return "A";
    if (name.toLowerCase().includes("discover")) return "D";
    return name.charAt(0).toUpperCase();
}

function getCardColor(name: string): string {
    for (const [key, color] of Object.entries(CARD_COLORS)) {
        if (name.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return C.primaryTeal;
}

// --- Section Header ---

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 14, marginTop: 28,
        }}>
            <span style={{
                fontSize: 11, fontWeight: 700, color: C.textSecondary,
                textTransform: "uppercase", letterSpacing: 1.2,
            }}>{title}</span>
            {actionLabel && (
                <button onClick={onAction} style={{
                    background: "none", border: "none", color: C.primaryTeal,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0,
                }}>+ {actionLabel}</button>
            )}
        </div>
    );
}

// --- Toggle Switch ---

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
    return (
        <div onClick={onToggle} style={{
            width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer",
            background: enabled ? C.primaryTeal : C.border, transition: "background 0.2s",
            flexShrink: 0,
        }}>
            <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 2,
                left: enabled ? 22 : 2,
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }} />
        </div>
    );
}

// --- Settings Row ---

function SettingsRow({ label, right, onClick }: { label: string; right: React.ReactNode; onClick?: () => void }) {
    return (
        <div onClick={onClick} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 0", borderBottom: `1px solid ${C.border}`,
            cursor: onClick ? "pointer" : undefined,
        }}>
            <span style={{ fontSize: 14, color: C.textPrimary }}>{label}</span>
            {right}
        </div>
    );
}

const COMFORT_LABELS: Record<number, string> = {
    1: "Avoids returns",
    2: "Reluctant",
    3: "Moderate",
    4: "Comfortable",
    5: "Very comfortable",
};

export default function ProfileSettings() {
    const [profile, setProfile] = useState<UserProfile>(createDefaultProfile());
    const [eduEmail, setEduEmail] = useState("");
    const [eduError, setEduError] = useState<string | null>(null);
    const [newCardName, setNewCardName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newPercentage, setNewPercentage] = useState("");
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState("");
    const [saved, setSaved] = useState(false);

    // New state for edit mode and status menu
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editDob, setEditDob] = useState("");
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
    const [notificationsExpanded, setNotificationsExpanded] = useState(false);

    useEffect(() => {
        chrome.storage.local.get("userProfile", (result) => {
            if (result.userProfile) {
                const p = result.userProfile as UserProfile;
                setProfile(p);
                if (p.studentStatus?.eduEmail) {
                    setEduEmail(p.studentStatus.eduEmail);
                }
                const cr = p.citizenshipResidency;
                if (cr) { setCountry(cr.country); setRegion(cr.region ?? ""); }
            }
        });
    }, []);

    const saveProfile = (updated: UserProfile) => {
        const withTimestamp = { ...updated, lastModified: new Date().toISOString() };
        setProfile(withTimestamp);
        chrome.storage.local.set({ userProfile: withTimestamp });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // --- Derived values ---
    const displayName = profile.displayName || "Your Name";
    const displayEmail = profile.email || profile.studentStatus?.eduEmail || "";
    const initials = displayName.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase() || "?";
    const age = useMemo(() => calculateAge(profile.dateOfBirth), [profile.dateOfBirth]);
    const isSeniorFromAge = age !== null && age >= 65;
    const activeMemberships = profile.memberships.filter(m => m.active);

    // --- Edit profile handlers ---
    const enterEditMode = () => {
        setEditName(profile.displayName || "");
        setEditEmail(profile.email || "");
        setEditDob(profile.dateOfBirth || "");
        setEditMode(true);
    };

    const cancelEdit = () => { setEditMode(false); };

    const saveEdit = () => {
        const newAge = calculateAge(editDob || null);
        const autoSenior = newAge !== null && newAge >= 65;
        saveProfile({
            ...profile,
            displayName: editName.trim(),
            email: editEmail.trim(),
            dateOfBirth: editDob || null,
            isSeniorCitizen: autoSenior || profile.isSeniorCitizen,
        });
        setEditMode(false);
    };

    // --- Membership ---
    const toggleMembership = (providerId: Membership["provider"]) => {
        const existing = profile.memberships.find((m) => m.provider === providerId);
        let memberships: Membership[];
        if (existing) {
            memberships = profile.memberships.filter((m) => m.provider !== providerId);
        } else {
            const costs: Record<string, number> = {
                amazon_prime: 139, walmart_plus: 98, target_circle_360: 49,
                sams_club: 50, costco: 65,
            };
            memberships = [...profile.memberships, {
                provider: providerId, active: true, renewalDate: null,
                annualCost: costs[providerId] ?? 0,
            }];
        }
        saveProfile({ ...profile, memberships });
    };

    // --- Student / Veteran / Senior ---
    const handleEduSubmit = () => {
        if (!isValidEduEmail(eduEmail)) { setEduError("Please enter a valid .edu email address"); return; }
        setEduError(null);
        saveProfile({ ...profile, studentStatus: { eduEmail, verified: true, verifiedAt: new Date().toISOString() } });
    };

    const clearStudentStatus = () => {
        setEduEmail(""); setEduError(null);
        saveProfile({ ...profile, studentStatus: null });
    };

    const toggleVeteran = () => {
        saveProfile({ ...profile, isVeteran: !profile.isVeteran });
    };

    const toggleSenior = () => {
        saveProfile({ ...profile, isSeniorCitizen: !profile.isSeniorCitizen });
    };

    // --- Payment ---
    const [cardSuggestions, setCardSuggestions] = useState<KnownCard[]>([]);

    const handleCardNameChange = (value: string) => {
        setNewCardName(value);
        if (value.trim().length >= 2) {
            setCardSuggestions(findMatchingCards(value).slice(0, 5));
        } else {
            setCardSuggestions([]);
        }
    };

    const selectCardSuggestion = (card: KnownCard) => {
        const pm: PaymentMethod = {
            id: crypto.randomUUID(),
            name: card.displayName,
            cashbackCategories: [...card.cashback],
        };
        saveProfile({ ...profile, paymentMethods: [...profile.paymentMethods, pm] });
        setNewCardName("");
        setCardSuggestions([]);
    };

    const addPaymentMethod = () => {
        if (!newCardName.trim()) return;
        // Check if it matches a known card and auto-populate
        const matches = findMatchingCards(newCardName);
        const cashback = matches.length > 0 ? [...matches[0].cashback] : [];
        const displayName = matches.length > 0 ? matches[0].displayName : newCardName.trim();
        const pm: PaymentMethod = { id: crypto.randomUUID(), name: displayName, cashbackCategories: cashback };
        saveProfile({ ...profile, paymentMethods: [...profile.paymentMethods, pm] });
        setNewCardName("");
    };

    const removePaymentMethod = (id: string) => {
        saveProfile({ ...profile, paymentMethods: profile.paymentMethods.filter((p) => p.id !== id) });
        if (expandedCardId === id) setExpandedCardId(null);
    };

    const addCashbackCategory = (pmId: string) => {
        if (!newCategory.trim() || !newPercentage) return;
        const pct = parseFloat(newPercentage);
        if (isNaN(pct) || pct < 0) return;
        const cat: CashbackCategory = { category: newCategory.trim(), percentage: pct };
        const updated = profile.paymentMethods.map((pm) =>
            pm.id === pmId ? { ...pm, cashbackCategories: [...pm.cashbackCategories, cat] } : pm
        );
        saveProfile({ ...profile, paymentMethods: updated });
        setNewCategory(""); setNewPercentage("");
    };

    const handleComfortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5;
        saveProfile({ ...profile, returnComfortLevel: val });
    };

    const saveCitizenship = () => {
        const cr: CitizenshipResidency | null = country.trim()
            ? { country: country.trim(), region: region.trim() || null } : null;
        saveProfile({ ...profile, citizenshipResidency: cr });
    };

    const toggleCloudSync = () => {
        saveProfile({ ...profile, cloudSyncEnabled: !profile.cloudSyncEnabled });
    };

    // --- Verified statuses list ---
    const verifiedStatuses: { label: string; active: boolean }[] = [];
    if (profile.studentStatus?.verified) verifiedStatuses.push({ label: "Student", active: true });
    if (profile.isVeteran) verifiedStatuses.push({ label: "Veteran", active: true });
    if (profile.isSeniorCitizen || isSeniorFromAge) verifiedStatuses.push({ label: "Senior Citizen", active: true });
    const discountCount = verifiedStatuses.filter(s => s.active).length * 23;

    // Available statuses for the "+ Add status" dropdown
    const availableStatuses: { label: string; onAdd: () => void }[] = [];
    if (!profile.studentStatus?.verified) availableStatuses.push({ label: "Student (verify .edu email)", onAdd: () => { setStatusMenuOpen(false); } });
    if (!profile.isVeteran) availableStatuses.push({ label: "Veteran", onAdd: () => { toggleVeteran(); setStatusMenuOpen(false); } });
    if (!profile.isSeniorCitizen && !isSeniorFromAge) availableStatuses.push({ label: "Senior Citizen", onAdd: () => { toggleSenior(); setStatusMenuOpen(false); } });

    return (
        <div style={{
            maxWidth: 680, margin: "0 auto", padding: "32px 24px",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}>
            {saved && (
                <div style={{
                    background: "rgba(16,185,129,0.1)", color: C.successGreen, padding: "10px 16px",
                    borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
                    border: `1px solid rgba(16,185,129,0.2)`,
                }}>✓ Changes saved</div>
            )}

            {/* ===== USER CARD ===== */}
            <div style={{
                background: C.cardBg, borderRadius: 16, border: `1px solid ${C.border}`,
                padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    {/* Avatar */}
                    <div style={{
                        width: 64, height: 64, borderRadius: "50%", background: C.primaryTeal,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 22, fontWeight: 700, flexShrink: 0,
                    }}>{initials}</div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        {!editMode ? (
                            <>
                                <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary }}>{displayName}</div>
                                {displayEmail && <div style={{ fontSize: 14, color: C.textSecondary, marginTop: 2 }}>{displayEmail}</div>}
                                {age !== null && (
                                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Age {age}</div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Display name" style={{
                                        padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
                                        fontSize: 14, outline: "none", background: C.bg, color: C.textPrimary, boxSizing: "border-box",
                                    }} />
                                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="Email address" type="email" style={{
                                        padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
                                        fontSize: 14, outline: "none", background: C.bg, color: C.textPrimary, boxSizing: "border-box",
                                    }} />
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <label style={{ fontSize: 12, color: C.textSecondary, whiteSpace: "nowrap" }}>Date of Birth</label>
                                    <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)}
                                        style={{
                                            padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
                                            fontSize: 14, outline: "none", background: C.bg, color: C.textPrimary, boxSizing: "border-box",
                                        }} />
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Edit / Save / Cancel buttons */}
                    {!editMode ? (
                        <button onClick={enterEditMode} style={{
                            background: "transparent", border: `1.5px solid ${C.primaryTeal}`,
                            color: C.primaryTeal, borderRadius: 8, padding: "8px 18px",
                            fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                        }}>Edit Profile</button>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                            <button onClick={saveEdit} style={{
                                background: C.primaryTeal, border: "none", color: "#fff",
                                borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}>Save</button>
                            <button onClick={cancelEdit} style={{
                                background: "transparent", border: `1.5px solid ${C.border}`,
                                color: C.textSecondary, borderRadius: 8, padding: "8px 18px",
                                fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}>Cancel</button>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== VERIFIED STATUSES ===== */}
            <SectionHeader title="Verified Statuses" actionLabel="Add status" onAction={() => setStatusMenuOpen(!statusMenuOpen)} />
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", position: "relative",
            }}>
                {/* Add-status dropdown menu */}
                {statusMenuOpen && availableStatuses.length > 0 && (
                    <div style={{
                        position: "absolute", top: -4, right: 0, zIndex: 10,
                        background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 220, overflow: "hidden",
                    }}>
                        {availableStatuses.map(s => (
                            <button key={s.label} onClick={s.onAdd} style={{
                                display: "block", width: "100%", textAlign: "left", background: "none",
                                border: "none", padding: "10px 16px", fontSize: 13, color: C.textPrimary,
                                cursor: "pointer", borderBottom: `1px solid ${C.border}`,
                            }}>{s.label}</button>
                        ))}
                    </div>
                )}

                {/* Edu email input (hidden when verified) */}
                {!profile.studentStatus?.verified && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <input type="email" value={eduEmail} onChange={(e) => setEduEmail(e.target.value)}
                            placeholder="you@university.edu" style={{
                                flex: 1, padding: "8px 12px", border: `1px solid ${C.border}`,
                                borderRadius: 8, fontSize: 13, outline: "none", background: C.bg,
                                color: C.textPrimary, boxSizing: "border-box",
                            }} />
                        <button onClick={handleEduSubmit} style={{
                            background: C.primaryTeal, color: "#fff", border: "none",
                            borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}>Verify</button>
                        {profile.studentStatus && (
                            <button onClick={clearStudentStatus} style={{
                                background: "transparent", color: C.dangerRed, border: `1px solid ${C.dangerRed}`,
                                borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}>Clear</button>
                        )}
                    </div>
                )}
                {eduError && <div style={{ color: C.dangerRed, fontSize: 12, marginBottom: 8 }}>{eduError}</div>}

                {/* Verified pills */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {verifiedStatuses.filter(s => s.active).map(s => (
                        <span key={s.label} style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "rgba(20,184,166,0.1)", color: C.primaryTeal,
                            padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <circle cx="7" cy="7" r="7" fill={C.primaryTeal} />
                                <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {s.label}
                        </span>
                    ))}
                    {profile.studentStatus?.verified && (
                        <button onClick={clearStudentStatus} style={{
                            background: "none", border: "none", color: C.textSecondary,
                            fontSize: 12, cursor: "pointer", padding: "6px 8px",
                        }}>Remove student ×</button>
                    )}
                    {profile.isVeteran && (
                        <button onClick={toggleVeteran} style={{
                            background: "none", border: "none", color: C.textSecondary,
                            fontSize: 12, cursor: "pointer", padding: "6px 8px",
                        }}>Remove veteran ×</button>
                    )}
                    {(profile.isSeniorCitizen || isSeniorFromAge) && !isSeniorFromAge && (
                        <button onClick={toggleSenior} style={{
                            background: "none", border: "none", color: C.textSecondary,
                            fontSize: 12, cursor: "pointer", padding: "6px 8px",
                        }}>Remove senior ×</button>
                    )}
                    {isSeniorFromAge && (
                        <span style={{ fontSize: 11, color: C.textSecondary, alignSelf: "center" }}>(auto-detected from DOB)</span>
                    )}
                </div>

                {/* Green info bar */}
                {verifiedStatuses.length > 0 && (
                    <div style={{
                        background: "rgba(16,185,129,0.08)", border: `1px solid rgba(16,185,129,0.2)`,
                        borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="8" fill={C.successGreen} />
                            <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: 13, color: C.successGreen, fontWeight: 500 }}>
                            Your verified statuses unlock {discountCount} additional discounts across retail partners
                        </span>
                    </div>
                )}
            </div>

            {/* ===== PAYMENT CARDS ===== */}
            <SectionHeader title="Payment Cards" actionLabel="Add card" onAction={addPaymentMethod} />
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
            }}>
                {profile.paymentMethods.length === 0 && (
                    <div style={{ padding: "20px", textAlign: "center", color: C.textSecondary, fontSize: 13 }}>
                        No payment cards added yet
                    </div>
                )}
                {profile.paymentMethods.map((pm, idx) => {
                    const isExpanded = expandedCardId === pm.id;
                    return (
                        <div key={pm.id}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                                borderBottom: (idx < profile.paymentMethods.length - 1 || isExpanded) ? `1px solid ${C.border}` : "none",
                            }}>
                                {/* Card icon circle */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: "50%",
                                    background: getCardColor(pm.name),
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
                                }}>{getCardLetter(pm.name)}</div>
                                {/* Card info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{pm.name}</div>
                                    <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 1 }}>
                                        {pm.cashbackCategories.length > 0
                                            ? pm.cashbackCategories.map(c => `${c.percentage}% on ${c.category}`).join(", ")
                                            : "No cashback categories set"}
                                    </div>
                                </div>
                                {/* Manage / expand */}
                                <button onClick={() => setExpandedCardId(isExpanded ? null : pm.id)} style={{
                                    background: "none", border: "none", color: C.primaryTeal,
                                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                                }}>{isExpanded ? "Close" : "Manage"}</button>
                            </div>
                            {/* Expanded edit area */}
                            {isExpanded && (
                                <div style={{ padding: "12px 20px 16px 74px", background: C.bg }}>
                                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                        <input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                                            style={{
                                                flex: 1, padding: "6px 10px", border: `1px solid ${C.border}`,
                                                borderRadius: 6, fontSize: 12, outline: "none", background: "#fff",
                                                color: C.textPrimary, boxSizing: "border-box",
                                            }} />
                                        <input placeholder="%" type="number" value={newPercentage} onChange={(e) => setNewPercentage(e.target.value)}
                                            style={{
                                                width: 60, padding: "6px 10px", border: `1px solid ${C.border}`,
                                                borderRadius: 6, fontSize: 12, outline: "none", background: "#fff",
                                                color: C.textPrimary, boxSizing: "border-box",
                                            }} />
                                        <button onClick={() => addCashbackCategory(pm.id)} style={{
                                            background: C.primaryTeal, color: "#fff", border: "none",
                                            borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                                        }}>Add</button>
                                    </div>
                                    <button onClick={() => removePaymentMethod(pm.id)} style={{
                                        background: "transparent", color: C.dangerRed, border: `1px solid ${C.dangerRed}`,
                                        borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}>Remove Card</button>
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Add card input */}
                <div style={{
                    display: "flex", gap: 8, padding: "12px 20px",
                    borderTop: profile.paymentMethods.length > 0 ? `1px solid ${C.border}` : "none",
                    position: "relative",
                }}>
                    <input placeholder="Type card name (e.g. Chase Sapphire, Amex Gold...)" value={newCardName}
                        onChange={(e) => handleCardNameChange(e.target.value)} style={{
                            flex: 1, padding: "8px 12px", border: `1px solid ${C.border}`,
                            borderRadius: 8, fontSize: 13, outline: "none", background: C.bg,
                            color: C.textPrimary, boxSizing: "border-box",
                        }} />
                    <button onClick={addPaymentMethod} style={{
                        background: C.primaryTeal, color: "#fff", border: "none",
                        borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>Add Card</button>

                    {/* Auto-suggest dropdown */}
                    {cardSuggestions.length > 0 && (
                        <div style={{
                            position: "absolute", left: 0, right: 0, top: "100%", zIndex: 20,
                            background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 10,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: 4,
                        }}>
                            <div style={{ padding: "6px 12px", fontSize: 10, color: C.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Known cards — rewards auto-filled
                            </div>
                            {cardSuggestions.map((card) => (
                                <button key={card.displayName} onClick={() => selectCardSuggestion(card)} style={{
                                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                                    textAlign: "left", background: "none", border: "none",
                                    padding: "10px 12px", cursor: "pointer",
                                    borderTop: `1px solid ${C.border}`,
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: "50%", background: C.primaryTeal,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0,
                                    }}>{card.letter}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{card.displayName}</div>
                                        <div style={{ fontSize: 11, color: C.textSecondary }}>
                                            {card.cashback.map(c => `${c.percentage}% ${c.category.replace(/_/g, " ")}`).join(" · ")}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MEMBERSHIPS ===== */}
            <SectionHeader title="Memberships" />
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden",
            }}>
                {MEMBERSHIP_PROVIDERS.map((mp, idx) => {
                    const active = activeMemberships.some(m => m.provider === mp.id);
                    const color = MEMBERSHIP_COLORS[mp.id] || C.primaryTeal;
                    return (
                        <div key={mp.id} style={{
                            display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                            borderBottom: idx < MEMBERSHIP_PROVIDERS.length - 1 ? `1px solid ${C.border}` : "none",
                            opacity: active ? 1 : 0.5,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: "50%", background: color,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0,
                            }}>{mp.label[0]}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{mp.label}</div>
                                <div style={{
                                    fontSize: 12, marginTop: 1,
                                    color: active ? C.primaryTeal : C.textSecondary,
                                    fontWeight: active ? 600 : 400,
                                }}>{active ? "active" : "inactive"}</div>
                            </div>
                            <button onClick={() => toggleMembership(mp.id)} style={{
                                background: active ? "transparent" : C.primaryTeal,
                                border: active ? `1.5px solid ${C.dangerRed}` : "none",
                                color: active ? C.dangerRed : "#fff",
                                borderRadius: 8, padding: "6px 16px",
                                fontSize: 13, fontWeight: 600, cursor: "pointer",
                            }}>{active ? "Remove" : "Add"}</button>
                        </div>
                    );
                })}
            </div>

            {/* ===== ACCOUNT SETTINGS ===== */}
            <SectionHeader title="Account Settings" />
            <div style={{
                background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`,
                padding: "4px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
                {/* Notification Preferences */}
                <SettingsRow label="Notification Preferences" onClick={() => setNotificationsExpanded(!notificationsExpanded)} right={
                    <span style={{ color: C.textSecondary, fontSize: 18, cursor: "pointer", transform: notificationsExpanded ? "rotate(90deg)" : undefined, display: "inline-block", transition: "transform 0.2s" }}>→</span>
                } />
                {notificationsExpanded && (
                    <div style={{ padding: "8px 0 14px", fontSize: 13, color: C.textSecondary }}>
                        Notification preferences coming soon. You'll be able to configure price-drop alerts, deal notifications, and weekly summaries.
                    </div>
                )}

                {/* Cloud Sync */}
                <SettingsRow label="Cloud Sync" right={
                    <Toggle enabled={profile.cloudSyncEnabled} onToggle={toggleCloudSync} />
                } />

                {/* Return Comfort Level */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 0",
                }}>
                    <span style={{ fontSize: 14, color: C.textPrimary }}>Return Comfort Level</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, color: C.textSecondary }}>
                            {COMFORT_LABELS[profile.returnComfortLevel]}
                        </span>
                        <input type="range" min={1} max={5} step={1} value={profile.returnComfortLevel}
                            onChange={handleComfortChange} style={{
                                width: 100, accentColor: C.primaryTeal,
                            }} />
                        <span style={{
                            fontSize: 16, fontWeight: 700, color: C.primaryTeal, minWidth: 20, textAlign: "center",
                        }}>{profile.returnComfortLevel}</span>
                    </div>
                </div>
            </div>

            {/* Citizenship (hidden section, still functional) */}
            <div style={{ marginTop: 20, display: "none" }}>
                <input value={country} onChange={(e) => setCountry(e.target.value)} />
                <input value={region} onChange={(e) => setRegion(e.target.value)} />
                <button onClick={saveCitizenship}>Save</button>
            </div>
        </div>
    );
}
