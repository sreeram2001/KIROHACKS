export interface ProductContext {
    productName: string;
    listedPrice: number;
    currency: string;
    seller: string;
    platformId: string;
    pageUrl: string;
    pageType: "product" | "booking" | "subscription";
    extractedAt: string; // ISO 8601
}

export interface ProductDetectedMessage {
    type: "PRODUCT_DETECTED";
    payload: ProductContext;
}

export interface ProductClearedMessage {
    type: "PRODUCT_CLEARED";
}
