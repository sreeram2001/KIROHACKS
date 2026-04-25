export interface UserProfile {
    userId: string;
    displayName?: string;
    email?: string;
    dateOfBirth?: string | null; // ISO date string YYYY-MM-DD
    isSeniorCitizen?: boolean;
    isVeteran?: boolean;
    memberships: Membership[];
    studentStatus: StudentStatus | null;
    paymentMethods: PaymentMethod[];
    returnComfortLevel: 1 | 2 | 3 | 4 | 5;
    citizenshipResidency: CitizenshipResidency | null;
    cloudSyncEnabled: boolean;
    lastModified: string; // ISO 8601
}

export interface Membership {
    provider:
    | "amazon_prime"
    | "walmart_plus"
    | "target_circle_360"
    | "sams_club"
    | "costco";
    active: boolean;
    renewalDate: string | null; // ISO 8601
    annualCost: number;
}

export interface StudentStatus {
    eduEmail: string;
    verified: boolean;
    verifiedAt: string; // ISO 8601
}

export interface PaymentMethod {
    id: string;
    name: string;
    cashbackCategories: CashbackCategory[];
}

export interface CashbackCategory {
    category: string;
    percentage: number;
}

export interface CitizenshipResidency {
    country: string; // ISO 3166-1 alpha-2
    region: string | null;
}
