# Implementation Plan: TrueCost Engine

## Overview

Implement a Chrome Extension (Manifest V3) with React UI and an AWS serverless backend (CDK, Python Lambdas, DynamoDB, Bedrock) that computes the True Expected Cost of online purchases, surfaces ranked alternatives, provides a conversational chatbot, tracks savings on a dashboard, and enforces ethical pricing analysis. TypeScript for the extension, Python for the backend.

## Tasks

- [x] 1. Project scaffolding and shared data models
  - [x] 1.1 Initialize monorepo structure with extension (TypeScript/React) and backend (Python) directories
    - Create top-level directories: `extension/`, `backend/`, `infra/`
    - Set up `extension/` with `package.json`, `tsconfig.json`, Vite config, Vitest config, and React dependencies
    - Set up `backend/` with `pyproject.toml`, pytest config, Hypothesis config, and Pydantic dependency
    - Set up `infra/` with CDK Python app scaffold (`app.py`, `cdk.json`, `requirements.txt`)
    - _Requirements: 10.5, 11.1, 11.2_

  - [x] 1.2 Define TypeScript data model interfaces for the extension
    - Create `extension/src/models/` with interfaces: `ProductContext`, `UserProfile`, `Membership`, `StudentStatus`, `PaymentMethod`, `CashbackCategory`, `CitizenshipResidency`, `TECResponse`, `CostLayerBreakdown`, `Alternative`, `DecisionImpactReport`, `ComparisonRow`, `ScenarioVariation`, `CounterfactualResult`, `ProfileComparisonResult`, `FairnessVerdict`, `PricingFactor`, `ChatMessage`, `ChatRequest`, `ChatResponse`
    - Include message types: `ProductDetectedMessage`, `ProductClearedMessage`
    - _Requirements: 12.1, 12.2_

  - [x] 1.3 Define Python Pydantic data models for the backend
    - Create `backend/src/models/` with Pydantic models: `ProductData`, `UserProfile`, `Membership`, `StudentStatus`, `PaymentMethod`, `CashbackCategory`, `CitizenshipResidency`, `TECRequest`, `TECResponse`, `CostLayerBreakdown`, `Alternative`, `DecisionImpactReport`, `ComparisonRow`, `ScenarioVariation`, `CounterfactualResult`, `ProfileComparisonResult`, `FairnessVerdict`, `PricingFactor`, `ChatRequest`, `ChatMessage`, `ChatResponse`, `ErrorResponse`, `ValidationErrorDetail`
    - Add Field validators (e.g., `return_comfort_level` between 1–5, `weight` between 0.0–1.0)
    - _Requirements: 12.1, 12.2, 10.6_

  - [ ]* 1.4 Write property test for TEC response serialization round-trip (Python)
    - **Property 16: TEC Response Serialization Round-Trip**
    - Generate random valid `TECResponse` objects with Hypothesis, serialize to JSON, parse back, assert deep equality
    - **Validates: Requirements 12.3**

  - [ ]* 1.5 Write property test for UserProfile serialization round-trip (TypeScript)
    - **Property 17: UserProfile Serialization Round-Trip**
    - Generate random valid `UserProfile` objects with fast-check, serialize to JSON, parse back, assert deep equality
    - **Validates: Requirements 12.4**

- [x] 2. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Ethics Gate module
  - [x] 3.1 Implement Ethics Gate classification and verdict logic
    - Create `backend/src/ethics_gate.py` with `evaluate_ethics()` function
    - Implement factor classification: justified (volume discounts, shipping distance, actuarial risk, supply-demand) vs. unjustified (location as income proxy, dark patterns, demographic pricing without actuarial basis)
    - Implement verdict logic: all justified → "clean"; some unjustified with sum of weights ≤ 0.5 → "flagged" + explanation; unjustified weights > 0.5 → "halted"
    - Each `PricingFactor` must be classified as exactly one of "justified" or "unjustified"
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 3.2 Write property test for Ethics Gate factor classification completeness
    - **Property 13: Ethics Gate Factor Classification Completeness**
    - Generate random lists of `PricingFactor` objects, assert every factor is classified as exactly one of "justified" or "unjustified"
    - **Validates: Requirements 9.1**

  - [ ]* 3.3 Write property test for Ethics Gate verdict logic
    - **Property 14: Ethics Gate Verdict Logic**
    - Generate random classified factor sets, assert: all justified → "clean"; some unjustified ≤ 0.5 weight → "flagged" with non-empty explanation; unjustified > 0.5 → "halted"
    - **Validates: Requirements 9.4, 9.5, 9.6**

  - [ ]* 3.4 Write unit tests for Ethics Gate known factor classifications
    - Test that volume discounts, shipping distance, actuarial risk, supply-demand are classified as justified
    - Test that location-as-income-proxy, dark patterns, demographic pricing without actuarial basis are classified as unjustified
    - _Requirements: 9.2, 9.3_

- [x] 4. TrueCost Engine Lambda — core TEC computation
  - [x] 4.1 Implement cost layer computation functions
    - Create `backend/src/cost_layers.py` with functions for each layer: `compute_risk_of_loss()`, `compute_time_effort()`, `compute_behavioral_pricing()`, `compute_user_constraints()`, `compute_path_effects()`
    - Each function takes `ProductData` and `UserProfile`, returns a float cost value
    - Apply Return Comfort Level weighting to risk_of_loss layer
    - Factor in membership discounts, student discounts, and cashback into relevant layers
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Implement TEC aggregation and alternatives generation
    - Create `backend/src/tec_engine.py` with `compute_tec()` that sums listed_price + all 5 layer costs
    - Implement `generate_alternatives()` producing 3–5 alternatives (same-product-different-seller, different-timing, similar-product-better-value)
    - Rank alternatives by ascending TEC
    - Assign exactly one badge per alternative from {"Best for you", "Lowest risk", "Easiest return"} based on dominant advantage
    - Set `alternatives_complete = False` when fewer than 3 alternatives available
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_

  - [x] 4.3 Implement Decision Impact Report builder
    - Create `backend/src/report_builder.py` with `build_decision_impact_report()`
    - Build comparison table with (1 + alternatives count) rows, each with listed_price, tec, dominant_layer
    - Build landscape view with ≥ 3 scenario variations (timing, platform, behavior changes)
    - Build counterfactual analysis: savings_or_cost = original TEC − alternative TEC
    - Build profile comparison with ≥ 2 hypothetical user profiles
    - Include fairness verdict from Ethics Gate
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 4.4 Write property test for TEC aggregation invariant
    - **Property 1: TEC Aggregation Invariant**
    - Generate random valid `ProductData` and `UserProfile`, assert TEC = listed_price + sum of 5 layers, and layer_breakdown has exactly 5 non-negative entries
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 4.5 Write property test for profile discounts reducing TEC
    - **Property 2: Profile Discounts Reduce TEC (Metamorphic)**
    - Generate two profiles differing only in discount attribute presence, assert TEC with discount ≤ TEC without
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [ ]* 4.6 Write property test for Return Comfort Level affecting risk weighting
    - **Property 3: Return Comfort Level Affects Risk Weighting**
    - Generate two profiles differing only in return_comfort_level (1 vs 5), assert risk_of_loss differs and higher comfort → lower or equal risk cost
    - **Validates: Requirements 2.6**

  - [ ]* 4.7 Write property test for alternatives structural invariants
    - **Property 4: Alternatives Structural Invariants**
    - Generate random TEC results, assert: 0–5 alternatives, sorted by ascending TEC, each has exactly one valid badge, alternatives_complete is False when count < 3
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [ ]* 4.8 Write property test for counterfactual savings derivation
    - **Property 5: Counterfactual Savings Derivation**
    - Generate TEC results with alternatives, assert each counterfactual savings_or_cost = original TEC − alternative TEC
    - **Validates: Requirements 5.4**

  - [ ]* 4.9 Write property test for Decision Impact Report structure
    - **Property 6: Decision Impact Report Structure**
    - Generate valid TEC computations, assert report has: comparison_table with correct row count, landscape_view ≥ 3 entries, profile_comparison ≥ 2 entries, counterfactual_analysis present, fairness_verdict present
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6**

- [x] 5. TrueCost Engine Lambda — handler and request validation
  - [x] 5.1 Implement Lambda handler with request validation
    - Create `backend/src/truecost_handler.py` with handler function
    - Parse and validate incoming JSON against `TECRequest` Pydantic schema
    - Return HTTP 400 with JSON body listing all validation errors for malformed requests
    - On valid request: call `compute_tec()`, `generate_alternatives()`, `evaluate_ethics()`, `build_decision_impact_report()`
    - If Ethics Gate returns "halted", stop analysis and return partial response with halt reason
    - Log decision and ethics verdict to DynamoDB
    - Return full `TECResponse` as JSON
    - _Requirements: 2.1, 2.2, 9.6, 9.7, 10.2, 10.6, 12.1, 12.5_

  - [x] 5.2 Implement profile CRUD and decision history handlers
    - Add handler functions for: GET `/profile/{userId}`, PUT `/profile/{userId}`, GET `/decisions/{userId}`, POST `/decisions/{userId}`
    - Read/write to DynamoDB Profiles and Decisions tables
    - Validate request bodies; return HTTP 400 for invalid input
    - _Requirements: 10.1, 10.4_

  - [ ]* 5.3 Write property test for malformed request validation
    - **Property 15: Malformed Request Validation**
    - Generate random invalid JSON payloads (missing fields, wrong types, out-of-range values), assert Lambda returns HTTP 400 with non-empty validation error list
    - **Validates: Requirements 10.6, 12.5**

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Strands Agent Lambda — chatbot backend
  - [x] 7.1 Implement Strands Agent Lambda handler
    - Create `backend/src/chatbot_handler.py` with handler function
    - Initialize Strands Agent with BedrockModel (Claude Sonnet), system prompt, and custom tools
    - Register tools: `lookup_tec_data`, `explain_cost_layer`, `analyze_timing`, `compare_alternatives`
    - Process `ChatRequest` with message, product context, TEC data, conversation history, and user profile
    - Return `ChatResponse` with reply and sources
    - Handle Bedrock invocation errors with retry-friendly error responses
    - _Requirements: 6.1, 6.3, 6.4, 10.3_

  - [ ]* 7.2 Write unit tests for Strands Agent chatbot handler
    - Test agent initialization with Bedrock model
    - Test tool registration
    - Test error handling for Bedrock failures (returns 503)
    - Test that responses reference TEC data and user profile
    - _Requirements: 6.1, 6.5, 10.3_

- [x] 8. AWS CDK infrastructure
  - [x] 8.1 Implement CDK stack with all constructs
    - Create `infra/stacks/truecost_stack.py` with separate constructs for:
      - API Gateway REST API with endpoints: POST `/tec`, POST `/chat`, GET/PUT `/profile/{userId}`, GET/POST `/decisions/{userId}`
      - TrueCost Engine Lambda (Python runtime) with DynamoDB and Bedrock permissions
      - Strands Agent Lambda (Python runtime) with Bedrock invoke permissions
      - DynamoDB Profiles table (PK: userId) and Decisions table (PK: userId, SK: timestamp)
      - IAM roles with least-privilege policies
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 8.2 Write CDK infrastructure tests
    - CDK snapshot tests for all constructs
    - Assert `cdk synth` produces valid CloudFormation
    - Verify API Gateway paths match spec
    - Verify DynamoDB key schemas
    - Verify Lambda runtime is Python
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [x] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Chrome Extension — Content Script
  - [x] 10.1 Implement Content Script for product page detection and data extraction
    - Create `extension/src/content/content.ts`
    - Detect page type (product, booking, subscription) using URL patterns and DOM heuristics for supported domains (Amazon, Walmart, Target, etc.)
    - Extract product name, listed price, seller, and platform identifier from DOM within 3 seconds
    - Send `ProductDetectedMessage` to Service Worker via `chrome.runtime.sendMessage`
    - Send `ProductClearedMessage` on navigation away
    - Display "Page not supported" message with manual entry fallback when extraction fails
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 10.2 Write unit tests for Content Script
    - Test extraction logic for specific supported domains with mock DOM
    - Test unsupported page fallback message
    - Test context clearing on navigation
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 11. Chrome Extension — Service Worker
  - [x] 11.1 Implement Service Worker as central coordinator
    - Create `extension/src/background/background.ts`
    - Listen for `ProductDetectedMessage` and `ProductClearedMessage` from content scripts
    - Read `UserProfile` from `chrome.storage.local`
    - Implement `BackendClient` with methods: `computeTEC()`, `chat()`, `syncProfile()`, `getDecisionHistory()`
    - Cache TEC responses per tab
    - Update toolbar icon badge on product detection
    - Relay data to popup and extension pages via `chrome.runtime` messaging
    - _Requirements: 1.2, 2.1, 6.1, 7.5, 7.6_

  - [ ]* 11.2 Write unit tests for Service Worker
    - Test toolbar icon badge update on product detection
    - Test API client methods with mocked fetch
    - Test TEC response caching per tab
    - _Requirements: 1.2_

- [x] 12. Chrome Extension — Popup UI (React)
  - [x] 12.1 Implement AlternativesPanel component
    - Create `extension/src/popup/components/AlternativesPanel.tsx`
    - Display current product's listed price, TEC, and per-layer cost breakdown
    - List 3–5 ranked alternatives with product name, seller, listed price, TEC, badge, and link
    - Show loading state with "Calculating true cost..." text
    - Show error state with error message and "Retry" button
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 12.2 Implement ChatbotPanel component
    - Create `extension/src/popup/components/ChatbotPanel.tsx`
    - Text input with submit for user messages
    - Scrollable conversation history with markdown rendering
    - Maintain session-scoped conversation history (cleared on page navigation)
    - Error state with retry for last message
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 12.3 Implement Popup root with navigation
    - Create `extension/src/popup/Popup.tsx` rendering AlternativesPanel (top) and ChatbotPanel (bottom)
    - Add navigation menu with links to Dashboard and Profile Settings pages (opens via `chrome.tabs.create`)
    - _Requirements: 11.2, 11.4, 11.5_

  - [ ]* 12.4 Write unit tests for Popup UI components
    - Test AlternativesPanel renders all fields for mock TEC data
    - Test loading state shows "Calculating true cost..."
    - Test error state shows message + retry button
    - Test ChatbotPanel conversation history persistence
    - Test ChatbotPanel error state with retry
    - Test Popup renders both panels
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.2, 6.5, 11.2_

- [x] 13. Chrome Extension — Profile Settings Page
  - [x] 13.1 Implement Profile Settings page
    - Create `extension/src/pages/ProfileSettings.tsx`
    - Memberships section: add/edit/remove from predefined list (Amazon Prime, Walmart+, Target Circle 360, Sam's Club, Costco)
    - Student Status: .edu email input with format validation
    - Payment Methods: card name + cashback category percentages
    - Return Comfort Level: slider 1–5
    - Citizenship/Residency: country/region selector
    - Cloud Sync toggle: enable/disable DynamoDB sync
    - Store profile in `chrome.storage.local`; sync to DynamoDB when cloud sync enabled
    - Resolve sync conflicts using most-recent-timestamp strategy
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 13.2 Write property test for .edu email validation
    - **Property 7: Student Email Validation**
    - Generate random strings with fast-check, assert validator accepts iff string matches valid email format ending with ".edu"
    - **Validates: Requirements 7.2**

  - [ ]* 13.3 Write property test for sync conflict resolution
    - **Property 8: Sync Conflict Resolution**
    - Generate two `UserProfile` versions with different `lastModified` timestamps, assert resolver always selects the more recent version
    - **Validates: Requirements 7.6**

  - [ ]* 13.4 Write unit tests for Profile Settings
    - Test membership CRUD operations
    - Test payment method CRUD
    - Test Return Comfort Level slider
    - Test citizenship/residency setting
    - _Requirements: 7.1, 7.3, 7.4, 7.7_

- [x] 14. Chrome Extension — Dashboard Page
  - [x] 14.1 Implement Dashboard page
    - Create `extension/src/pages/Dashboard.tsx`
    - Total Saved: running total of cumulative savings
    - Decision History: filterable list with product name, date, amount paid, chosen TEC, best alternative TEC
    - Filters: category, platform, savings type, time period
    - Membership ROI: per-membership savings vs. cost with net value
    - Membership Alerts: renewal warnings within 30 days with renew/cancel recommendation
    - Ethics Log: past Fairness Verdicts with product, date, and status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 14.2 Write property test for Dashboard Total Saved aggregation
    - **Property 9: Dashboard Total Saved Aggregation**
    - Generate random decision history lists with fast-check, assert Total Saved = sum of individual savings
    - **Validates: Requirements 8.1**

  - [ ]* 14.3 Write property test for Decision History filter correctness
    - **Property 10: Decision History Filter Correctness**
    - Generate random decision lists and filters, assert every filtered record matches criteria and no matching record is excluded
    - **Validates: Requirements 8.3**

  - [ ]* 14.4 Write property test for Membership ROI computation
    - **Property 11: Membership ROI Computation**
    - Generate random membership savings and costs, assert net_value = total_savings − annual_cost
    - **Validates: Requirements 8.4**

  - [ ]* 14.5 Write property test for Membership Renewal Alert timing
    - **Property 12: Membership Renewal Alert Timing**
    - Generate random memberships with various renewal dates, assert alert generated iff renewal within 30 days
    - **Validates: Requirements 8.5**

  - [ ]* 14.6 Write unit tests for Dashboard
    - Test ethics log rendering
    - Test decision history list rendering
    - Test membership ROI section rendering
    - _Requirements: 8.2, 8.4, 8.6_

- [x] 15. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Chrome Extension — Manifest and packaging
  - [x] 16.1 Create manifest.json and wire all extension components
    - Create `extension/public/manifest.json` with Manifest V3
    - Declare permissions: `activeTab`, `storage`, host permissions for supported e-commerce domains
    - Register Content Script for supported domains
    - Register Service Worker as background script
    - Register popup HTML entry point
    - Register Dashboard and Profile Settings as extension pages
    - _Requirements: 11.1, 11.3, 11.4, 11.5_

  - [ ]* 16.2 Write unit tests for manifest validation
    - Verify Manifest V3 format
    - Verify permissions are limited to activeTab, storage, and host permissions
    - Verify content script registration
    - _Requirements: 11.1, 11.3_

- [x] 17. Integration wiring and end-to-end validation
  - [x] 17.1 Wire extension Service Worker to backend API endpoints
    - Connect `BackendClient` methods to actual API Gateway URLs
    - Implement error handling: timeout, 4xx, 5xx responses with user-friendly messages
    - Implement JSON response schema validation on extension side; log raw response on failure
    - _Requirements: 12.1, 12.2, 12.6_

  - [ ]* 17.2 Write integration tests
    - Test end-to-end: product detection → TEC computation → alternatives display
    - Test cloud sync round-trip: local → DynamoDB → local
    - Test chatbot responds to return risk questions referencing Risk_of_Loss_Layer
    - Test chatbot responds to timing questions referencing Behavioral_Pricing_Layer
    - Test Ethics Gate logs verdicts to DynamoDB with all required fields
    - _Requirements: 6.3, 6.4, 9.7, 12.1, 12.2_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (17 properties total)
- Unit tests validate specific examples and edge cases
- TypeScript property tests use fast-check; Python property tests use Hypothesis
- TypeScript unit tests use Vitest + React Testing Library; Python unit tests use pytest
