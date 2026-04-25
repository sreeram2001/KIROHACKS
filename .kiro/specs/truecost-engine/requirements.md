# Requirements Document

## Introduction

TrueCost Engine is a Chrome Extension paired with an AWS backend that reveals the true financial cost of everyday purchasing decisions. Every price a consumer sees online is incomplete — it omits risk of loss, time costs, behavioral pricing tricks, user-specific constraints, and long-term path effects. TrueCost aggregates five hidden cost layers into a single True Expected Cost (TEC) metric, surfaces better alternatives personalized to the user's memberships, student status, payment methods, and history, and provides a conversational chatbot for deeper analysis. A dashboard tracks cumulative savings, membership ROI, and decision history over time. An ethics logic gate halts or flags analysis when pricing differences stem from unjustified or sensitive factors.

## Glossary

- **TrueCost_Extension**: The Chrome Extension (Manifest V3) including the popup UI, content script, dashboard page, and profile settings
- **TrueCost_Engine**: The Python backend service running on AWS Lambda that computes the True Expected Cost and generates alternatives
- **TEC**: True Expected Cost — a single dollar figure representing the full expected cost of a purchase after accounting for all five hidden cost layers
- **Content_Script**: The Manifest V3 content script injected into e-commerce, booking, and subscription pages to detect product context
- **Popup_UI**: The React-based popup interface rendered when the user clicks the extension icon or triggers the overlay, containing the Alternatives Panel and Chatbot Panel
- **Alternatives_Panel**: The top section of the Popup UI displaying the current product's TEC and 3–5 ranked alternatives
- **Chatbot_Panel**: The bottom section of the Popup UI providing a conversational interface powered by Strands Agent and Bedrock
- **Strands_Agent**: The AWS Strands Agents SDK-based chatbot service running on Lambda, backed by Amazon Bedrock for LLM reasoning
- **Decision_Impact_Report**: A structured report for a given product page showing TEC comparison, cost-layer breakdown, landscape view, counterfactual analysis, profile comparison, and ethics verdict
- **User_Profile**: The stored set of user attributes including memberships, student status, citizenship/residency, payment methods, return comfort level, and past decisions
- **Dashboard**: The extension page accessible from the extension icon showing cumulative savings, decision history, membership ROI, alerts, and ethics log
- **Ethics_Gate**: The logic module that evaluates whether pricing differences are driven by justified or unjustified factors and produces a Fairness Verdict
- **Fairness_Verdict**: The output of the Ethics Gate — one of "clean", "flagged", or "halted"
- **Cost_Layer**: One of the five hidden cost dimensions: Risk of Loss, Time and Effort Tax, Behavioral Pricing Dynamics, User Constraints, and Path Effects
- **Risk_of_Loss_Layer**: Cost layer modeling refund denial rates, claim rejection odds, and warranty gaps
- **Time_Effort_Layer**: Cost layer modeling hours on hold, forms to fill, retry loops, and shipping logistics
- **Behavioral_Pricing_Layer**: Cost layer modeling surge pricing, cart abandonment tricks, and loyalty penalties
- **User_Constraints_Layer**: Cost layer modeling urgency, platform lock-in, and payment method restrictions
- **Path_Effects_Layer**: Cost layer modeling renewals at higher rates, upgrade pressure, and compounding decisions
- **API_Gateway**: The AWS API Gateway serving as the HTTP entry point for the TrueCost Engine and Strands Agent Lambda functions
- **Profile_Store**: The DynamoDB table storing User Profiles and decision history
- **Membership**: A user's subscription to a retail or service program (e.g., Amazon Prime, Walmart+, Target Circle 360, Sam's Club, Costco)
- **Student_Status**: A verified student identity confirmed via .edu email, unlocking student-specific discounts (UNiDAYS, Amazon Student, Apple Education, Spotify Student)

## Requirements

### Requirement 1: Product Page Detection

**User Story:** As a shopper, I want the extension to automatically detect when I am on a product, booking, or subscription page, so that TrueCost analysis is available without manual action.

#### Acceptance Criteria

1. WHEN a browser tab navigates to a supported e-commerce, booking, or subscription page, THE Content_Script SHALL detect the page type and extract the product name, listed price, seller, and platform identifier within 3 seconds of page load completion.
2. WHEN the Content_Script detects a supported product page, THE TrueCost_Extension SHALL display a non-intrusive activation indicator in the browser toolbar icon.
3. IF the Content_Script cannot extract the required product data from a page, THEN THE TrueCost_Extension SHALL display a message indicating that the page is not supported and provide a manual entry option.
4. WHEN the user navigates away from a product page, THE Content_Script SHALL clear the previously extracted product context.

### Requirement 2: True Expected Cost Computation

**User Story:** As a shopper, I want to see the true expected cost of a product that accounts for hidden cost layers, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHEN the Content_Script sends extracted product data and the User_Profile to the TrueCost_Engine, THE TrueCost_Engine SHALL compute a TEC value by aggregating costs from all five Cost Layers: Risk_of_Loss_Layer, Time_Effort_Layer, Behavioral_Pricing_Layer, User_Constraints_Layer, and Path_Effects_Layer.
2. THE TrueCost_Engine SHALL return the TEC as a single dollar-denominated value alongside a per-layer cost breakdown within 5 seconds of receiving the request.
3. WHEN the User_Profile includes active memberships, THE TrueCost_Engine SHALL factor membership-specific discounts, free shipping thresholds, and return policies into the TEC calculation.
4. WHEN the User_Profile includes verified Student_Status, THE TrueCost_Engine SHALL apply eligible student discounts from UNiDAYS, Amazon Student, Apple Education, and Spotify Student to the TEC calculation.
5. WHEN the User_Profile includes payment method details with cashback categories, THE TrueCost_Engine SHALL subtract applicable cashback amounts from the TEC.
6. THE TrueCost_Engine SHALL weight each Cost_Layer according to the user's Return Comfort Level preference stored in the User_Profile.

### Requirement 3: Alternatives Generation and Ranking

**User Story:** As a shopper, I want to see 3–5 better alternatives ranked by true expected cost, so that I can choose the option that saves me the most money.

#### Acceptance Criteria

1. WHEN the TrueCost_Engine computes the TEC for a product, THE TrueCost_Engine SHALL generate between 3 and 5 alternative options including same-product-different-seller, different-timing, and similar-product-better-value alternatives.
2. THE TrueCost_Engine SHALL rank all alternatives by ascending TEC value, with the lowest TEC alternative listed first.
3. THE TrueCost_Engine SHALL assign exactly one badge to each alternative from the set: "Best for you", "Lowest risk", or "Easiest return", based on the dominant advantage of that alternative relative to the original product.
4. WHEN fewer than 3 alternatives are available, THE TrueCost_Engine SHALL return all available alternatives and indicate that the result set is incomplete.

### Requirement 4: Alternatives Panel Display

**User Story:** As a shopper, I want to see the current product's TEC and ranked alternatives in the extension popup, so that I can quickly compare options.

#### Acceptance Criteria

1. WHEN the user opens the Popup_UI on a detected product page, THE Alternatives_Panel SHALL display the current product's listed price, TEC, and the per-layer cost breakdown.
2. THE Alternatives_Panel SHALL display each alternative with its product name, seller, listed price, TEC, badge, and a link to the alternative's product page.
3. WHEN the TrueCost_Engine response is pending, THE Alternatives_Panel SHALL display a loading indicator with the text "Calculating true cost...".
4. IF the TrueCost_Engine returns an error, THEN THE Alternatives_Panel SHALL display an error message describing the failure and a "Retry" button.

### Requirement 5: Decision Impact Report Generation

**User Story:** As a shopper, I want a detailed Decision Impact Report for the product I am viewing, so that I can understand the full cost landscape before purchasing.

#### Acceptance Criteria

1. WHEN the TrueCost_Engine computes the TEC for a product and its alternatives, THE TrueCost_Engine SHALL generate a Decision_Impact_Report containing a comparison table, per-layer breakdown, landscape view, counterfactual analysis, profile comparison, and Fairness_Verdict.
2. THE Decision_Impact_Report comparison table SHALL list the original product and all alternatives with their listed price, TEC, and the dominant Cost_Layer contributing to each TEC.
3. THE Decision_Impact_Report landscape view SHALL show how changes in timing, platform, and user behavior affect the TEC, with at least 3 scenario variations.
4. THE Decision_Impact_Report counterfactual analysis SHALL compute the savings or additional cost the user would have realized by choosing each alternative, expressed as a dollar amount.
5. THE Decision_Impact_Report profile comparison SHALL show how the same product's TEC differs for at least 2 hypothetical user profiles with different memberships and payment methods.
6. THE Decision_Impact_Report SHALL include the Fairness_Verdict produced by the Ethics_Gate for the current product's pricing.

### Requirement 6: Chatbot Conversational Interface

**User Story:** As a shopper, I want to ask questions about a product's cost in a conversational chatbot, so that I can explore specific concerns like return risk or sale timing.

#### Acceptance Criteria

1. WHEN the user types a message in the Chatbot_Panel and submits it, THE Strands_Agent SHALL respond with a contextually relevant answer referencing the current product's TEC data, Cost_Layer breakdown, and User_Profile within 8 seconds.
2. THE Chatbot_Panel SHALL maintain conversation history for the duration of the current product page session, allowing follow-up questions.
3. WHEN the user asks a question about return risk, THE Strands_Agent SHALL reference the Risk_of_Loss_Layer data and the user's Return Comfort Level in the response.
4. WHEN the user asks about optimal purchase timing, THE Strands_Agent SHALL reference the Behavioral_Pricing_Layer data and historical pricing trends in the response.
5. IF the Strands_Agent cannot generate a response due to a backend error, THEN THE Chatbot_Panel SHALL display an error message and allow the user to retry the last message.

### Requirement 7: User Profile Management

**User Story:** As a user, I want to configure my memberships, student status, citizenship, payment methods, and return comfort level, so that TrueCost analysis is personalized to my situation.

#### Acceptance Criteria

1. THE TrueCost_Extension SHALL provide a Profile Settings page accessible from the extension icon menu where the user can add, edit, and remove memberships from a predefined list including Amazon Prime, Walmart+, Target Circle 360, Sam's Club, and Costco.
2. WHEN the user enters a .edu email address for student verification, THE TrueCost_Extension SHALL validate the email format and store the verified Student_Status in the User_Profile.
3. THE TrueCost_Extension SHALL allow the user to add payment methods with associated cashback category percentages.
4. THE TrueCost_Extension SHALL allow the user to set a Return Comfort Level on a scale from 1 (avoids returns) to 5 (comfortable with returns).
5. THE TrueCost_Extension SHALL store the User_Profile in local storage by default and provide an option to enable cloud sync to the Profile_Store in DynamoDB.
6. WHEN the user enables cloud sync, THE TrueCost_Extension SHALL synchronize the local User_Profile with the Profile_Store, resolving conflicts by using the most recently modified version.
7. THE TrueCost_Extension SHALL allow the user to set citizenship or residency information that affects tax calculations, import duties, and regional pricing in the TEC computation.

### Requirement 8: Dashboard — Savings and Decision History

**User Story:** As a user, I want a dashboard showing my cumulative savings, decision history, and membership ROI, so that I can track the value TrueCost provides over time.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Total Saved" running total representing the cumulative difference between the listed price of purchased items and the TEC of the chosen alternative.
2. THE Dashboard SHALL display a Decision History list showing each past decision with the product name, date, amount paid, TEC of the chosen option, and the TEC of the best alternative not chosen.
3. THE Dashboard SHALL provide filters for the Decision History by category, platform, savings type, and time period.
4. THE Dashboard SHALL display a Membership ROI section showing, for each active membership, the total savings attributed to that membership, the membership cost, and the net value (savings minus cost).
5. WHEN a membership renewal date is within 30 days, THE Dashboard SHALL display an alert showing the renewal date, total savings from that membership in the current period, the membership fee, and a recommendation to renew or cancel based on net value.
6. THE Dashboard SHALL display an Ethics Log listing all past Fairness Verdicts with the associated product, date, and verdict status.

### Requirement 9: Ethics Logic Gate

**User Story:** As a user, I want the system to flag or halt analysis when pricing differences are driven by unjustified or sensitive factors, so that I am not complicit in unfair pricing practices.

#### Acceptance Criteria

1. WHEN the TrueCost_Engine evaluates pricing differences between alternatives, THE Ethics_Gate SHALL classify each pricing factor as justified or unjustified.
2. THE Ethics_Gate SHALL classify the following factors as justified: volume discounts, shipping distance-based pricing, risk-based pricing with actuarial basis, and supply-and-demand pricing.
3. THE Ethics_Gate SHALL classify the following factors as unjustified: location used as an income proxy, dark patterns, and demographic-based pricing without actuarial basis.
4. WHEN all pricing factors are classified as justified, THE Ethics_Gate SHALL produce a Fairness_Verdict of "clean".
5. WHEN at least one pricing factor is classified as unjustified but the unjustified factors do not dominate the price difference, THE Ethics_Gate SHALL produce a Fairness_Verdict of "flagged" with an explanation of the flagged factors.
6. WHEN unjustified pricing factors dominate the price difference, THE Ethics_Gate SHALL produce a Fairness_Verdict of "halted" and THE TrueCost_Engine SHALL stop the analysis and display the reason to the user.
7. THE Ethics_Gate SHALL log every Fairness_Verdict with the associated product identifier, timestamp, verdict, and contributing factors to the Profile_Store.

### Requirement 10: Backend API Infrastructure

**User Story:** As a developer, I want the backend deployed as AWS infrastructure using CDK, so that the system is scalable, maintainable, and reproducible.

#### Acceptance Criteria

1. THE API_Gateway SHALL expose RESTful endpoints for TEC computation, alternatives retrieval, chatbot messaging, user profile CRUD operations, and decision history retrieval.
2. THE TrueCost_Engine Lambda function SHALL be implemented in Python and accept product data and User_Profile as input, returning the TEC, per-layer breakdown, alternatives, and Decision_Impact_Report as a JSON response.
3. THE Strands_Agent Lambda function SHALL use the Strands Agents SDK with Amazon Bedrock as the LLM provider for chatbot reasoning.
4. THE Profile_Store DynamoDB table SHALL store User_Profile records keyed by user identifier and decision history records keyed by user identifier and timestamp.
5. THE infrastructure SHALL be defined using AWS CDK in Python, with separate constructs for the API Gateway, Lambda functions, DynamoDB tables, and IAM roles.
6. WHEN a Lambda function receives a malformed request, THE Lambda function SHALL return an HTTP 400 response with a JSON body describing the validation error.

### Requirement 11: Chrome Extension Manifest and Packaging

**User Story:** As a developer, I want the Chrome Extension built with Manifest V3 and React, so that it meets Chrome Web Store requirements and provides a modern UI.

#### Acceptance Criteria

1. THE TrueCost_Extension SHALL use Manifest V3 with declared permissions limited to activeTab, storage, and host permissions for supported e-commerce domains.
2. THE TrueCost_Extension popup SHALL be built with React and render the Alternatives_Panel and Chatbot_Panel as separate components within a single popup view.
3. THE Content_Script SHALL be registered in the manifest to run on supported e-commerce, booking, and subscription domains.
4. THE TrueCost_Extension SHALL include a Dashboard page implemented as an extension page (chrome-extension:// URL) accessible from the popup menu.
5. THE TrueCost_Extension SHALL include a Profile Settings page implemented as an extension page accessible from the popup menu.

### Requirement 12: Data Serialization and Parsing

**User Story:** As a developer, I want all data exchanged between the extension and backend to be serialized and parsed reliably, so that no data is lost or corrupted in transit.

#### Acceptance Criteria

1. THE TrueCost_Extension SHALL serialize all API requests as JSON and THE TrueCost_Engine SHALL parse incoming JSON request bodies into validated Python data structures.
2. THE TrueCost_Engine SHALL serialize all API responses as JSON and THE TrueCost_Extension SHALL parse incoming JSON response bodies into validated TypeScript data structures.
3. THE TrueCost_Engine JSON serializer SHALL format TEC response objects into valid JSON and THE TrueCost_Engine JSON parser SHALL parse that JSON back into equivalent TEC response objects (round-trip property).
4. THE TrueCost_Extension JSON serializer SHALL format User_Profile objects into valid JSON and THE TrueCost_Extension JSON parser SHALL parse that JSON back into equivalent User_Profile objects (round-trip property).
5. IF the TrueCost_Engine receives a JSON request body that fails schema validation, THEN THE TrueCost_Engine SHALL return an HTTP 400 response with a JSON body listing all validation errors.
6. IF the TrueCost_Extension receives a JSON response body that fails schema validation, THEN THE TrueCost_Extension SHALL display a user-friendly error message and log the raw response for debugging.
