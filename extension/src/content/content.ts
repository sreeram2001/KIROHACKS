import type { ProductContext, ProductDetectedMessage, ProductClearedMessage } from "../models/product";

// --- Platform detection ---

interface PlatformConfig {
    urlPattern: RegExp;
    platformId: string;
    pageType: ProductContext["pageType"];
}

const PLATFORMS: PlatformConfig[] = [
    { urlPattern: /amazon\.(com|co\.\w+)\/.+/, platformId: "amazon", pageType: "product" },
    { urlPattern: /walmart\.com\/.+/, platformId: "walmart", pageType: "product" },
    { urlPattern: /target\.com\/.+/, platformId: "target", pageType: "product" },
    { urlPattern: /bestbuy\.com\/.+/, platformId: "best_buy", pageType: "product" },
    { urlPattern: /costco\.com\/.+/, platformId: "costco", pageType: "product" },
    { urlPattern: /ebay\.com\/.+/, platformId: "ebay", pageType: "product" },
];

function detectPlatform(): PlatformConfig | null {
    const url = window.location.href;
    return PLATFORMS.find((p) => p.urlPattern.test(url)) ?? null;
}

// --- Strategy 1: JSON-LD structured data (most reliable) ---

function extractFromJsonLd(platform: PlatformConfig): ProductContext | null {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
        try {
            const data = JSON.parse(script.textContent ?? "");
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
                    const name = item.name;
                    let price: number | null = null;

                    // Try offers.price, offers[0].price, offers.lowPrice
                    const offers = item.offers;
                    if (offers) {
                        if (typeof offers.price === "number") price = offers.price;
                        else if (typeof offers.price === "string") price = parseFloat(offers.price);
                        else if (typeof offers.lowPrice === "number") price = offers.lowPrice;
                        else if (typeof offers.lowPrice === "string") price = parseFloat(offers.lowPrice);
                        else if (Array.isArray(offers) && offers[0]?.price) {
                            price = typeof offers[0].price === "number" ? offers[0].price : parseFloat(offers[0].price);
                        }
                    }

                    const seller = offers?.seller?.name ?? item.brand?.name ?? platform.platformId;

                    if (name && price && !isNaN(price)) {
                        return {
                            productName: name,
                            listedPrice: price,
                            currency: offers?.priceCurrency ?? "USD",
                            seller: typeof seller === "string" ? seller : platform.platformId,
                            platformId: platform.platformId,
                            pageUrl: window.location.href,
                            pageType: platform.pageType,
                            extractedAt: new Date().toISOString(),
                        };
                    }
                }
            }
        } catch {
            // Invalid JSON, skip
        }
    }
    return null;
}

// --- Strategy 2: Meta tags (og:title, product:price) ---

function extractFromMeta(platform: PlatformConfig): ProductContext | null {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const priceAmount = document.querySelector('meta[property="product:price:amount"]')?.getAttribute("content")
        ?? document.querySelector('meta[property="og:price:amount"]')?.getAttribute("content");

    if (ogTitle && priceAmount) {
        const price = parseFloat(priceAmount);
        if (!isNaN(price)) {
            return {
                productName: ogTitle,
                listedPrice: price,
                currency: document.querySelector('meta[property="product:price:currency"]')?.getAttribute("content") ?? "USD",
                seller: platform.platformId,
                platformId: platform.platformId,
                pageUrl: window.location.href,
                pageType: platform.pageType,
                extractedAt: new Date().toISOString(),
            };
        }
    }
    return null;
}

// --- Strategy 3: DOM selectors (platform-specific) ---

function queryFirst(selectors: string[]): string | null {
    for (const sel of selectors) {
        try {
            const el = document.querySelector(sel);
            if (el?.textContent?.trim()) return el.textContent.trim();
        } catch { /* invalid selector */ }
    }
    return null;
}

function parsePrice(raw: string | null): number | null {
    if (!raw) return null;
    const match = raw.match(/\$?([\d,]+\.?\d*)/);
    if (!match) return null;
    const value = parseFloat(match[1].replace(/,/g, ""));
    return isNaN(value) ? null : value;
}

const NAME_SELECTORS: Record<string, string[]> = {
    amazon: ["#productTitle", "#title span", "h1 span.a-text-normal"],
    walmart: ["[itemprop='name']", "h1[itemprop='name']", "#main-title", "h1"],
    target: ["[data-test='product-title']", "h1"],
    best_buy: [".sku-title h1", "h1"],
    costco: ["h1[itemprop='name']", ".product-title", "h1"],
    ebay: [".x-item-title__mainTitle span", "h1 span.ux-textspans", "h1"],
};

const PRICE_SELECTORS: Record<string, string[]> = {
    amazon: [".a-price .a-offscreen", ".priceToPay .a-offscreen", "#priceblock_ourprice"],
    walmart: ["[itemprop='price']", "span[itemprop='price']", "[data-testid='price-wrap'] span"],
    target: ["[data-test='product-price']", "span[data-test='current-price']"],
    best_buy: [".priceView-customer-price span", "[data-testid='customer-price'] span"],
    costco: ["#pull-right-price span", ".your-price span"],
    ebay: [".x-price-primary span", "#prcIsum"],
};

function extractFromDom(platform: PlatformConfig): ProductContext | null {
    const nameSelectors = NAME_SELECTORS[platform.platformId] ?? ["h1"];
    const priceSelectors = PRICE_SELECTORS[platform.platformId] ?? [];

    const name = queryFirst(nameSelectors);
    const priceRaw = queryFirst(priceSelectors);
    const price = parsePrice(priceRaw);

    if (name && price) {
        return {
            productName: name,
            listedPrice: price,
            currency: "USD",
            seller: platform.platformId,
            platformId: platform.platformId,
            pageUrl: window.location.href,
            pageType: platform.pageType,
            extractedAt: new Date().toISOString(),
        };
    }
    return null;
}

// --- Strategy 4: Last resort — h1 + first dollar amount on page ---

function extractFallback(platform: PlatformConfig): ProductContext | null {
    const h1 = document.querySelector("h1");
    const name = h1?.textContent?.trim();
    if (!name) return null;

    // Scan page text for first price-like pattern
    const bodyText = document.body.innerText;
    const priceMatch = bodyText.match(/(?:Now\s+)?\$([\d,]+\.?\d{0,2})/);
    if (!priceMatch) return null;

    const price = parseFloat(priceMatch[1].replace(/,/g, ""));
    if (isNaN(price) || price <= 0) return null;

    return {
        productName: name,
        listedPrice: price,
        currency: "USD",
        seller: platform.platformId,
        platformId: platform.platformId,
        pageUrl: window.location.href,
        pageType: platform.pageType,
        extractedAt: new Date().toISOString(),
    };
}

// --- Main extraction: try all strategies in order ---

function extractProduct(platform: PlatformConfig): ProductContext | null {
    return extractFromJsonLd(platform)
        ?? extractFromMeta(platform)
        ?? extractFromDom(platform)
        ?? extractFallback(platform);
}

// --- Messaging ---

function sendProductDetected(product: ProductContext): void {
    const message: ProductDetectedMessage = { type: "PRODUCT_DETECTED", payload: product };
    chrome.runtime.sendMessage(message);
}

function sendProductCleared(): void {
    const message: ProductClearedMessage = { type: "PRODUCT_CLEARED" };
    chrome.runtime.sendMessage(message);
}

// --- Init with retries ---

function init(): void {
    const platform = detectPlatform();
    if (!platform) return;

    let found = false;
    const tryExtract = (attempt: number) => {
        if (found) return;
        const product = extractProduct(platform);
        if (product) {
            found = true;
            sendProductDetected(product);
            return;
        }
        if (attempt < 10) {
            setTimeout(() => tryExtract(attempt + 1), 1500);
        }
    };
    tryExtract(0);
}

// Also watch for SPA navigation (URL changes without full page reload)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        sendProductCleared();
        init();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("beforeunload", () => sendProductCleared());

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
