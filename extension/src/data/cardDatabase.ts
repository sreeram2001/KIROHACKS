/**
 * Known credit/debit card rewards database.
 * When a user types a card name, we fuzzy-match against this list
 * and auto-populate cashback categories.
 */

import type { CashbackCategory } from "../models/profile";

export interface KnownCard {
    /** Search keywords (lowercase) */
    keywords: string[];
    /** Display name */
    displayName: string;
    /** Card network icon letter */
    letter: string;
    /** Default cashback categories */
    cashback: CashbackCategory[];
}

export const KNOWN_CARDS: KnownCard[] = [
    // --- Chase ---
    {
        keywords: ["chase sapphire preferred", "sapphire preferred", "csp"],
        displayName: "Chase Sapphire Preferred",
        letter: "C",
        cashback: [
            { category: "travel", percentage: 5 },
            { category: "dining", percentage: 3 },
            { category: "online_grocery", percentage: 3 },
            { category: "streaming", percentage: 3 },
        ],
    },
    {
        keywords: ["chase sapphire reserve", "sapphire reserve", "csr"],
        displayName: "Chase Sapphire Reserve",
        letter: "C",
        cashback: [
            { category: "travel", percentage: 10 },
            { category: "dining", percentage: 3 },
            { category: "online_grocery", percentage: 3 },
        ],
    },
    {
        keywords: ["chase freedom unlimited", "freedom unlimited", "cfu"],
        displayName: "Chase Freedom Unlimited",
        letter: "C",
        cashback: [
            { category: "all_purchases", percentage: 1.5 },
            { category: "dining", percentage: 3 },
            { category: "drugstores", percentage: 3 },
            { category: "travel", percentage: 5 },
        ],
    },
    {
        keywords: ["chase freedom flex", "freedom flex", "cff"],
        displayName: "Chase Freedom Flex",
        letter: "C",
        cashback: [
            { category: "rotating_categories", percentage: 5 },
            { category: "dining", percentage: 3 },
            { category: "drugstores", percentage: 3 },
            { category: "travel", percentage: 5 },
        ],
    },
    {
        keywords: ["chase amazon", "amazon visa", "amazon prime visa", "prime visa"],
        displayName: "Amazon Prime Visa",
        letter: "A",
        cashback: [
            { category: "amazon", percentage: 5 },
            { category: "whole_foods", percentage: 5 },
            { category: "dining", percentage: 2 },
            { category: "gas_stations", percentage: 2 },
            { category: "all_purchases", percentage: 1 },
        ],
    },

    // --- Amex ---
    {
        keywords: ["amex gold", "american express gold", "amex preferred"],
        displayName: "Amex Gold Card",
        letter: "A",
        cashback: [
            { category: "restaurants", percentage: 4 },
            { category: "groceries", percentage: 4 },
            { category: "flights", percentage: 3 },
        ],
    },
    {
        keywords: ["amex platinum", "american express platinum"],
        displayName: "Amex Platinum",
        letter: "A",
        cashback: [
            { category: "flights", percentage: 5 },
            { category: "hotels", percentage: 5 },
        ],
    },
    {
        keywords: ["amex blue cash preferred", "blue cash preferred", "bcp"],
        displayName: "Amex Blue Cash Preferred",
        letter: "A",
        cashback: [
            { category: "groceries", percentage: 6 },
            { category: "streaming", percentage: 6 },
            { category: "transit", percentage: 3 },
            { category: "gas_stations", percentage: 3 },
        ],
    },
    {
        keywords: ["amex blue cash everyday", "blue cash everyday", "bce"],
        displayName: "Amex Blue Cash Everyday",
        letter: "A",
        cashback: [
            { category: "groceries", percentage: 3 },
            { category: "online_shopping", percentage: 3 },
            { category: "gas_stations", percentage: 3 },
        ],
    },

    // --- Citi ---
    {
        keywords: ["citi double cash", "double cash", "citi 2%"],
        displayName: "Citi Double Cash",
        letter: "C",
        cashback: [
            { category: "all_purchases", percentage: 2 },
        ],
    },
    {
        keywords: ["citi custom cash", "custom cash"],
        displayName: "Citi Custom Cash",
        letter: "C",
        cashback: [
            { category: "top_eligible_category", percentage: 5 },
            { category: "all_purchases", percentage: 1 },
        ],
    },
    {
        keywords: ["costco anywhere visa", "costco visa", "costco citi"],
        displayName: "Costco Anywhere Visa",
        letter: "C",
        cashback: [
            { category: "gas_stations", percentage: 4 },
            { category: "restaurants", percentage: 3 },
            { category: "travel", percentage: 3 },
            { category: "costco", percentage: 2 },
            { category: "all_purchases", percentage: 1 },
        ],
    },

    // --- Capital One ---
    {
        keywords: ["capital one savor", "savor", "savor one"],
        displayName: "Capital One SavorOne",
        letter: "C",
        cashback: [
            { category: "dining", percentage: 3 },
            { category: "entertainment", percentage: 3 },
            { category: "streaming", percentage: 3 },
            { category: "groceries", percentage: 3 },
        ],
    },
    {
        keywords: ["capital one venture", "venture", "venture x"],
        displayName: "Capital One Venture X",
        letter: "C",
        cashback: [
            { category: "travel", percentage: 10 },
            { category: "all_purchases", percentage: 2 },
        ],
    },
    {
        keywords: ["capital one quicksilver", "quicksilver"],
        displayName: "Capital One Quicksilver",
        letter: "C",
        cashback: [
            { category: "all_purchases", percentage: 1.5 },
        ],
    },

    // --- Discover ---
    {
        keywords: ["discover it", "discover cashback", "discover"],
        displayName: "Discover it Cash Back",
        letter: "D",
        cashback: [
            { category: "rotating_categories", percentage: 5 },
            { category: "all_purchases", percentage: 1 },
        ],
    },

    // --- Wells Fargo ---
    {
        keywords: ["wells fargo active cash", "active cash", "wells fargo 2%"],
        displayName: "Wells Fargo Active Cash",
        letter: "W",
        cashback: [
            { category: "all_purchases", percentage: 2 },
        ],
    },

    // --- Bank of America ---
    {
        keywords: ["bank of america customized cash", "bofa customized", "boa cash"],
        displayName: "BofA Customized Cash Rewards",
        letter: "B",
        cashback: [
            { category: "chosen_category", percentage: 3 },
            { category: "groceries", percentage: 2 },
            { category: "all_purchases", percentage: 1 },
        ],
    },

    // --- Target ---
    {
        keywords: ["target redcard", "redcard", "target debit", "target credit"],
        displayName: "Target RedCard",
        letter: "T",
        cashback: [
            { category: "target", percentage: 5 },
        ],
    },

    // --- Walmart ---
    {
        keywords: ["walmart rewards", "capital one walmart", "walmart credit"],
        displayName: "Capital One Walmart Rewards",
        letter: "W",
        cashback: [
            { category: "walmart_online", percentage: 5 },
            { category: "walmart_store", percentage: 2 },
            { category: "restaurants", percentage: 2 },
            { category: "travel", percentage: 2 },
            { category: "all_purchases", percentage: 1 },
        ],
    },
];

/**
 * Find matching cards by fuzzy keyword search.
 * Returns cards sorted by match quality (best first).
 */
export function findMatchingCards(query: string): KnownCard[] {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];

    return KNOWN_CARDS
        .map((card) => {
            let score = 0;
            for (const kw of card.keywords) {
                if (kw === q) { score = 100; break; }
                if (kw.includes(q)) score = Math.max(score, 80);
                if (q.includes(kw)) score = Math.max(score, 70);
                // Partial word match
                const words = q.split(/\s+/);
                const kwWords = kw.split(/\s+/);
                const matchedWords = words.filter((w) => kwWords.some((kw2) => kw2.includes(w)));
                if (matchedWords.length > 0) {
                    score = Math.max(score, (matchedWords.length / words.length) * 60);
                }
            }
            return { card, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((r) => r.card);
}
