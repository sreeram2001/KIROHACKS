# TrueCost — Know What You're Really Paying

> A Chrome extension that reveals the **true economic cost** of every online purchase by analyzing five hidden cost layers that price tags don't show you — personalized to your memberships, credit cards, and financial profile.

**Built with [Kiro](https://kiro.dev)** using spec-driven development for the Kiro Spark Challenge.

**Problem Frame:** Economics

**Signal Categories:** Build · Impact · Story

---

## The Problem

Every price you see online is incomplete. A $549 pair of AirPods Max actually costs **$670+** when you factor in:

- Return denial risk (8% of returns get denied or complicated)
- Customer service friction (45 min average, at $25/hr that's real money)
- Dynamic pricing manipulation (platforms charge different users different prices)
- Platform lock-in (switching costs keep you trapped)
- Ecosystem pressure (Apple products lead to $200+ in additional purchases)

American consumers lose over **$200 billion annually** to these invisible costs. And the worst part — these costs are **different for every person**. A Prime member pays less friction than a guest checkout. A student gets discounts others don't. Someone with a Chase Sapphire card gets cashback that changes the math entirely.

Generic price comparison tools ignore all of this. **TrueCost doesn't.**

---

## What TrueCost Does

TrueCost sits on any e-commerce page and instantly computes your **personalized True Economic Cost** — not a generic estimate, but one tailored to YOU.

### Five Hidden Cost Layers

| Layer | What It Measures | How It's Personalized |
|-------|-----------------|----------------------|
| ⚠️ **Risk of Loss** | Refund denial probability, warranty gaps | Prime/Costco members get lower risk scores |
| ⏱️ **Time & Effort** | Hours on hold, forms, shipping logistics | Memberships that streamline returns reduce this |
| 📊 **Behavioral Pricing** | Surge pricing, cart tricks, loyalty penalties | Student discounts reduce behavioral markup |
| 🔒 **User Constraints** | Urgency, platform lock-in, limited options | More memberships = more options = less lock-in |
| 🔄 **Path Effects** | Ecosystem lock-in, renewal traps, upgrades | Apple products: 15%, printers: 20%, subscriptions: 25% |

### Key Features

- **Personalized TEC Score** — Your true cost based on your profile, not generic data
- **AI Chatbot** — Powered by Amazon Bedrock, knows your cards and calculates exact cashback
- **Real Alternatives** — Search links to the same product on other platforms
- **Card Auto-Suggest** — Type "Chase Sapphire" and cashback categories auto-populate from a 20+ card database
- **Ethics Logic Gate** — Flags or halts analysis when pricing is driven by unjustified factors
- **Dashboard** — Tracks savings, membership ROI, and decision history over time
- **Profile System** — Memberships, student/veteran/senior status, payment methods, return comfort level

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Chrome Extension (Manifest V3)            │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Content   │  │ Service      │  │ Popup UI (React)  │  │
│  │ Script    │──│ Worker       │──│ ┌───────────────┐ │  │
│  │           │  │ (coordinator)│  │ │ Cost Breakdown │ │  │
│  │ Detects   │  │              │  │ │ Alternatives   │ │  │
│  │ products  │  │ Caches TEC   │  │ │ AI Chatbot     │ │  │
│  │ on page   │  │ Calls API    │  │ │ Dashboard      │ │  │
│  └──────────┘  └──────┬───────┘  │ │ Profile        │ │  │
│                       │          │ └───────────────┘ │  │
│                       │          └───────────────────┘  │
└───────────────────────┼─────────────────────────────────┘
                        │ HTTPS/JSON
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   AWS Backend (CDK)                       │
│                                                          │
│  ┌─────────────┐    ┌──────────────────────────────┐    │
│  │ API Gateway  │───▶│ TrueCost Engine Lambda       │    │
│  │ REST API     │    │ (Python 3.12)                │    │
│  │              │    │ • Cost layer computation     │    │
│  │ POST /tec    │    │ • Alternatives generation    │    │
│  │ POST /chat   │    │ • Ethics Gate evaluation     │    │
│  │ GET/PUT      │    │ • Decision Impact Report     │    │
│  │  /profile    │    └──────────┬───────────────────┘    │
│  │ GET/POST     │               │                        │
│  │  /decisions  │    ┌──────────▼───────────────────┐    │
│  └─────────────┘    │ DynamoDB                      │    │
│                      │ • truecost-profiles           │    │
│  ┌─────────────┐    │ • truecost-decisions           │    │
│  │ Strands      │    └──────────────────────────────┘    │
│  │ Agent Lambda │                                        │
│  │ (Chatbot)    │───▶ Amazon Bedrock (Claude 3.5 Haiku) │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Spec-Driven Development with Kiro

This entire project was built using **Kiro's spec-driven workflow** — requirements first, then design, then implementation tasks. Every line of code traces back to a formal specification.

### Spec Files

```
.kiro/specs/truecost-engine/
├── .config.kiro          # Spec configuration (requirements-first workflow)
├── requirements.md       # 12 formal requirements with acceptance criteria
├── design.md             # Architecture, data models, 17 correctness properties
└── tasks.md              # 18 implementation tasks (all completed ✅)
```

### Requirements (12)

| # | Requirement | Status |
|---|------------|--------|
| 1 | Product Page Detection | ✅ |
| 2 | True Expected Cost Computation | ✅ |
| 3 | Alternatives Generation & Ranking | ✅ |
| 4 | Alternatives Panel Display | ✅ |
| 5 | Decision Impact Report | ✅ |
| 6 | Chatbot Conversational Interface | ✅ |
| 7 | User Profile Management | ✅ |
| 8 | Dashboard — Savings & History | ✅ |
| 9 | Ethics Logic Gate | ✅ |
| 10 | Backend API Infrastructure | ✅ |
| 11 | Chrome Extension Manifest & Packaging | ✅ |
| 12 | Data Serialization & Parsing | ✅ |

### Correctness Properties (17)

The design includes 17 formal correctness properties validated through property-based testing:
- TEC aggregation invariant (TEC = listed_price + sum of 5 layers)
- Profile discounts reduce TEC (metamorphic property)
- Alternatives sorted by ascending TEC
- Ethics Gate verdict logic (clean/flagged/halted)
- Serialization round-trip properties
- And 12 more...

### Implementation Tasks (18)

All 18 tasks completed with 64 passing tests across Python (pytest + Hypothesis) and TypeScript (Vitest + fast-check).

---

## Kiro Powers & MCP Servers Used

### Powers

| Power | Purpose |
|-------|---------|
| **Figma** | UI/UX design mockups — popup, dashboard, memberships, and profile pages |
| **Cloud Architect** | AWS CDK infrastructure design, Lambda + DynamoDB + API Gateway patterns |
| **AWS Infrastructure as Code** | CloudFormation validation, CDK best practices, compliance checking |
| **Strands Agents SDK** | Chatbot implementation with Amazon Bedrock integration |

### MCP Servers

| Server | Purpose |
|--------|---------|
| **AWS Documentation** (`awslabs.aws-documentation-mcp-server`) | Latest AWS docs for Lambda, DynamoDB, API Gateway, Bedrock |
| **AWS Pricing** (`awslabs.aws-pricing-mcp-server`) | Cost analysis for infrastructure decisions |
| **AWS Knowledge** (`knowledge-mcp.global.api.aws`) | Best practices, SOPs, regional availability |
| **AWS API** (`awslabs.aws-api-mcp-server`) | Direct AWS CLI execution for deployment and verification |
| **Context7** (`@upstash/context7-mcp`) | Up-to-date documentation for React, Chrome Extension APIs, Pydantic |
| **Fetch** (`mcp-server-fetch`) | Web content retrieval for research |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **UI/UX Design** | Figma (mockups for popup, dashboard, profile, memberships) |
| **Extension** | Chrome Manifest V3, React 18, TypeScript, Vite |
| **Backend** | Python 3.12, Pydantic v2, AWS Lambda |
| **AI Chatbot** | Strands Agents SDK, Amazon Bedrock (Claude 3.5 Haiku) |
| **Infrastructure** | AWS CDK (Python), API Gateway, DynamoDB |
| **Testing** | pytest, Hypothesis (Python PBT), Vitest, fast-check (TS PBT) |
| **Deployment** | AWS CDK, us-east-1 region |

---

## Project Structure

```
truecost/
├── .kiro/specs/truecost-engine/     # Kiro spec files (requirements, design, tasks)
├── extension/                        # Chrome Extension (TypeScript/React)
│   ├── src/
│   │   ├── content/content.ts        # Product page detection (4 strategies)
│   │   ├── background/background.ts  # Service worker (API client, caching)
│   │   ├── popup/                    # Popup UI (React components)
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx        # Dark navy header with TEC score
│   │   │   │   ├── CostBreakdown.tsx # 5 hidden cost layers display
│   │   │   │   ├── AlternativesPanel.tsx  # Scrollable alternative cards
│   │   │   │   ├── ChatbotPanel.tsx  # AI chatbot interface
│   │   │   │   ├── MiniDashboard.tsx # Dashboard in popup
│   │   │   │   ├── MiniProfile.tsx   # Profile in popup
│   │   │   │   └── TECScoreCircle.tsx # Circular score indicator
│   │   │   └── Popup.tsx             # Main popup with tabs
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Full dashboard (Overview, History, Memberships)
│   │   │   └── ProfileSettings.tsx   # Profile management
│   │   ├── models/                   # TypeScript interfaces
│   │   └── data/cardDatabase.ts      # 20+ credit card rewards database
│   ├── public/manifest.json          # Manifest V3
│   └── dist/                         # Built extension (load this in Chrome)
├── backend/                          # Python backend
│   ├── src/
│   │   ├── models/                   # Pydantic v2 data models
│   │   ├── cost_layers.py            # 5 hidden cost layer computations
│   │   ├── tec_engine.py             # TEC aggregation + alternatives
│   │   ├── ethics_gate.py            # Ethics Logic Gate (clean/flagged/halted)
│   │   ├── report_builder.py         # Decision Impact Report
│   │   ├── llm_engine.py             # Bedrock-powered analysis
│   │   ├── truecost_handler.py       # Lambda handler for /tec endpoint
│   │   ├── chatbot_handler.py        # Lambda handler for /chat (Strands Agent)
│   │   └── profile_handler.py        # Lambda handler for /profile, /decisions
│   └── tests/                        # 64 passing tests
├── infra/                            # AWS CDK infrastructure
│   ├── app.py                        # CDK app entry point
│   ├── stacks/truecost_stack.py      # All AWS resources
│   └── cdk.json                      # CDK configuration
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- AWS CLI configured with a profile that has Bedrock access
- Chrome browser

### Install & Build

```bash
# Extension
cd extension && npm install && npm run build
cp public/manifest.json dist/

# Backend
cd backend && pip install -e ".[dev]"

# Infrastructure
cd infra && pip install -r requirements.txt
```

### Deploy Backend

```bash
cd infra
AWS_PROFILE=your-profile npx cdk bootstrap
AWS_PROFILE=your-profile npx cdk deploy
```

### Load Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `extension/dist/`
4. Navigate to any product page on Amazon, Walmart, Target, Best Buy, Costco, or eBay

### Run Tests

```bash
# Backend (64 tests)
cd backend && python3 -m pytest tests/ -v

# Extension
cd extension && npx vitest run
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/tec` | Compute True Economic Cost + alternatives |
| POST | `/chat` | AI chatbot (personalized to user profile) |
| GET | `/profile/{userId}` | Get user profile |
| PUT | `/profile/{userId}` | Update user profile |
| GET | `/decisions/{userId}` | Get decision history |
| POST | `/decisions/{userId}` | Record a decision |

---

## Why TrueCost Should Win

**Build** — Full-stack Chrome extension + AWS serverless backend, built entirely through Kiro's spec-driven workflow. 12 requirements, 17 correctness properties, 18 tasks, 64 tests. React + TypeScript frontend, Python + Pydantic backend, CDK infrastructure, Bedrock-powered AI chatbot.

**Impact** — Every online shopper faces hidden costs. TrueCost quantifies them, personalizes them to your financial profile, and saves real money. The same product costs different amounts for different people — TrueCost is the first tool that shows you YOUR number.

**Story** — The gap between what you see and what you pay is the most expensive secret in e-commerce. TrueCost tells that story with data, not guesses.

---

*Built for the Kiro Spark Challenge 2026*

---

## Team Protein

| Member |
|--------|
| Sandrah Bosire |
| Sreeram Saravana Prasad |
| Skandarsini Ramagiri Ramesh |
