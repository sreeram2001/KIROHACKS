export interface CostLayerBreakdown {
    riskOfLoss: number;
    timeEffort: number;
    behavioralPricing: number;
    userConstraints: number;
    pathEffects: number;
}

export interface Alternative {
    productName: string;
    seller: string;
    platformId: string;
    listedPrice: number;
    tec: number;
    currency: string;
    badge: "Best for you" | "Lowest risk" | "Easiest return";
    productUrl: string;
    layerBreakdown: CostLayerBreakdown;
    dominantLayer: string;
}

export interface ComparisonRow {
    productName: string;
    seller: string;
    listedPrice: number;
    tec: number;
    dominantLayer: string;
    isOriginal: boolean;
}

export interface ScenarioVariation {
    scenarioName: string;
    variableChanged: string;
    adjustedTec: number;
    deltaFromCurrent: number;
}

export interface CounterfactualResult {
    alternativeName: string;
    savingsOrCost: number;
}

export interface ProfileComparisonResult {
    profileLabel: string;
    memberships: string[];
    paymentMethods: string[];
    tec: number;
    deltaFromUser: number;
}

export interface PricingFactor {
    name: string;
    classification: "justified" | "unjustified";
    weight: number;
    explanation: string;
}

export interface FairnessVerdict {
    verdict: "clean" | "flagged" | "halted";
    factors: PricingFactor[];
    explanation: string | null;
    timestamp: string; // ISO 8601
    productId: string;
}

export interface DecisionImpactReport {
    comparisonTable: ComparisonRow[];
    landscapeView: ScenarioVariation[];
    counterfactualAnalysis: CounterfactualResult[];
    profileComparison: ProfileComparisonResult[];
    fairnessVerdict: FairnessVerdict;
}

export interface TECResponse {
    productName: string;
    listedPrice: number;
    tec: number;
    currency: string;
    layerBreakdown: CostLayerBreakdown;
    alternatives: Alternative[];
    alternativesComplete: boolean;
    decisionImpactReport: DecisionImpactReport;
    fairnessVerdict: FairnessVerdict;
}
