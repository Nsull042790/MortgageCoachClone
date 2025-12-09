# Loan Scenario Comparison Tool - Technical Specification

**Version:** 1.1.3
**Last Updated:** December 2024
**Prepared for:** Luminate Bank (NMLS 1281698)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Technology Stack](#technology-stack)
3. [Features Overview](#features-overview)
4. [Core Calculations](#core-calculations)
5. [Data Models](#data-models)
6. [Component Architecture](#component-architecture)
7. [HubSpot Launch Checklist](#hubspot-launch-checklist)
8. [Security Considerations](#security-considerations)
9. [Performance Specifications](#performance-specifications)

---

## Executive Summary

The Loan Scenario Comparison Tool is a React-based web application that enables loan officers to create, compare, and share mortgage loan scenarios with clients. It provides real-time calculations for multiple loan types, AI-powered recommendations, and professional PDF exports.

### Key Capabilities
- Compare up to 4 loan products side-by-side
- Real-time mortgage calculations with PMI, MIP, and funding fees
- AI-powered loan recommendations based on borrower profile
- Shareable client view with unique URLs
- PDF export with branding and compliance
- Vimeo video integration for personalized messages
- Local storage for saved scenarios

---

## Technology Stack

### Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI component library |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| Vite | 7.2.4 | Build tool and dev server |
| Tailwind CSS | 4.1.17 | Utility-first CSS framework |

### Key Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| jsPDF | 3.0.4 | PDF generation |
| html2canvas | 1.4.1 | DOM to canvas rendering |
| Recharts | 3.5.1 | Data visualization charts |
| @heroicons/react | 2.2.0 | Icon library |
| uuid | 13.0.0 | Unique ID generation |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| ESLint | 9.39.1 | Code linting |
| TypeScript ESLint | 8.46.4 | TypeScript-specific linting |

---

## Features Overview

### 1. Loan Input Configuration
- **Home Price** - Purchase price input with currency formatting
- **Down Payment** - Amount or percentage toggle
- **Credit Score** - 9 credit score ranges (760+ to <620)
- **Property Taxes** - Annual tax amount
- **Homeowner's Insurance** - Annual premium
- **HOA Fees** - Monthly association fees
- **Borrower Count** - Single or multiple borrowers
- **First-Time Homebuyer** - Toggle for special programs
- **PMI Option** - BPMI, LPMI, Single Premium (PIF/Financed)

### 2. Loan Types Supported
| Loan Type | Term | Key Features |
|-----------|------|--------------|
| Conventional 30-Year | 360 months | PMI if LTV > 80% |
| Conventional 15-Year | 180 months | Lower rate, faster equity |
| FHA 30-Year | 360 months | 1.75% upfront MIP + annual MIP |
| VA 30-Year | 360 months | Funding fee, no monthly MI |
| USDA 30-Year | 360 months | 1% upfront + 0.35% annual fee |

### 3. Interest Rate Management
- Individual rate entry per loan type
- Default rates pre-populated
- Real-time recalculation on rate change

### 4. Comparison Cards
- Side-by-side loan comparison (up to 4)
- Monthly payment breakdown
- Cash to close calculation
- Total cost over loan life
- Visual highlighting for lowest values

### 5. AI Recommendations Engine
- **Best Loan Picker** - Scores loans based on time horizon and affordability
- **Credit Score Alerts** - Identifies threshold improvements
- **Down Payment Optimization** - PMI elimination analysis
- **PMI Strategy** - Monthly vs Single Premium recommendations
- **Affordability Check** - DTI ratio warnings (43% threshold)
- **Time Horizon Recommendations** - 30-year vs 15-year guidance
- **FHA/VA Consideration** - Program eligibility suggestions

### 6. Payment Analysis Charts
- Monthly payment breakdown pie chart
- Principal vs Interest over time
- Payment comparison bar charts

### 7. Rate Simulator
- Visualize impact of rate changes (+/- 2%)
- Monthly payment sensitivity analysis

### 8. Closing Costs Breakdown
- Itemized closing cost categories
- Title insurance calculations
- Prepaid items and escrow

### 9. Amortization Schedule
- Monthly and yearly view toggle
- CSV export functionality
- PMI end date tracking
- Interest vs Principal visualization
- Milestone tracking (50%, 75% payoff)

### 10. Client Sharing
- Unique shareable URLs with Base64-encoded data
- Client view mode (read-only)
- Client name personalization
- View tracking capability

### 11. Video Messages
- Vimeo integration for loan officer videos
- Video widget in client view
- Thumbnail display

### 12. PDF Export
- Professional branded output
- Luminate Bank logo
- Comparison grid layout
- Payment breakdown charts
- Full compliance footer
- Client name personalization

### 13. Saved Scenarios
- Local storage persistence
- Multiple scenario management
- Sidebar navigation

---

## Core Calculations

### 1. Monthly Principal & Interest (P&I)

```
Formula: M = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
  M = Monthly payment
  P = Principal (loan amount)
  r = Monthly interest rate (annual rate / 12 / 100)
  n = Number of payments (term in months)
```

**Implementation:** `calculateMonthlyPI()` in `mortgageCalculations.ts`

### 2. Loan-to-Value (LTV)

```
LTV = (Loan Amount / Home Price) × 100

Example:
  Home Price: $400,000
  Down Payment: $80,000
  Loan Amount: $320,000
  LTV = (320,000 / 400,000) × 100 = 80%
```

### 3. Private Mortgage Insurance (PMI)

**Conventional Loans (LTV > 80%):**

| Credit Score | 80-85% LTV | 85-90% LTV | 90-95% LTV | 95%+ LTV |
|--------------|------------|------------|------------|----------|
| 760+ | 0.30% | 0.38% | 0.52% | 0.78% |
| 740-759 | 0.35% | 0.44% | 0.58% | 0.85% |
| 720-739 | 0.40% | 0.50% | 0.65% | 0.92% |
| 700-719 | 0.50% | 0.60% | 0.78% | 1.05% |
| 680-699 | 0.60% | 0.75% | 0.95% | 1.25% |
| 660-679 | 0.75% | 0.95% | 1.15% | 1.45% |
| 640-659 | 0.90% | 1.10% | 1.35% | 1.65% |
| 620-639 | 1.05% | 1.25% | 1.50% | 1.85% |
| <620 | 1.20% | 1.45% | 1.75% | 2.10% |

**Monthly PMI Calculation:**
```
Monthly PMI = (Loan Amount × Annual PMI Rate) / 12
```

**PMI Options:**
- **BPMI** - Monthly premium added to payment
- **LPMI** - Higher interest rate, no monthly payment
- **Single Premium PIF** - One-time upfront payment at closing
- **Single Premium Financed** - Added to loan amount

### 4. FHA Mortgage Insurance Premium (MIP)

```
Upfront MIP = Loan Amount × 1.75%

Annual MIP (loans > 15 years):
  - LTV ≤ 90%: 0.50% (loans ≤ $726,200) or 0.70% (larger loans)
  - LTV > 90%: 0.55% (loans ≤ $726,200) or 0.75% (larger loans)

Monthly MIP = (Loan Amount × Annual MIP Rate) / 12
```

### 5. VA Funding Fee

| Down Payment | First Use | Subsequent Use |
|--------------|-----------|----------------|
| < 5% | 2.15% | 3.30% |
| 5-9.99% | 1.50% | 1.50% |
| ≥ 10% | 1.25% | 1.25% |

```
VA Funding Fee = Loan Amount × Fee Rate
```

### 6. USDA Fees

```
Upfront Guarantee Fee = Loan Amount × 1.00%
Annual Fee = Loan Amount × 0.35%
Monthly Fee = (Loan Amount × 0.35%) / 12
```

### 7. Annual Percentage Rate (APR)

Uses Newton-Raphson iteration to find the rate where:

```
Net Loan Amount = Present Value of All Payments

Net Loan = Loan Amount - Upfront Fees - Closing Costs

Iteration solves for APR where:
  Σ [Payment / (1 + monthly_rate)^n] = Net Loan
```

**Implementation:** Up to 100 iterations with convergence threshold of $0.01

### 8. Cash to Close

```
Cash to Close = Down Payment + Upfront Fees + Estimated Closing Costs

Estimated Closing Costs = Loan Amount × 3%
```

### 9. Total Cost Over Loan Life

```
Total Cost = (Monthly Payment × Term Months) + Down Payment + Upfront Fees
```

### 10. Debt-to-Income Ratio (DTI)

```
DTI = ((Monthly Mortgage Payment + Other Monthly Debts) / Gross Monthly Income) × 100

Warning Thresholds:
  - > 36%: Caution
  - > 43%: Warning (exceeds conventional limit)
  - > 50%: Critical (exceeds FHA limit)
```

### 11. Title Insurance (Closing Costs)

```
Base Rate:
  - First $100,000: $5.75 per $1,000
  - Next $100,000: $5.00 per $1,000
  - Next $200,000: $2.50 per $1,000
  - Over $400,000: $2.25 per $1,000

Example ($400,000 home):
  $575 + $500 + $500 + $0 = $1,575
```

### 12. AI Best Loan Scoring Algorithm

```
Score Weighting by Time Horizon:
  - Short-term (≤5 years): 60% monthly, 25% cash, 15% total
  - Medium-term (5-10 years): 50% monthly, 30% total, 20% cash
  - Long-term (10+ years): 45% monthly, 35% total, 20% cash

Affordability Penalties:
  - Payment 10-20% higher: -8 points
  - Payment 20-30% higher: -15 points
  - Payment 30%+ higher: -25 points

15-Year Specific:
  - Bonus (+5): Payment ≤25% higher AND time horizon ≥10 years
  - Penalty (-10): Payment >35% higher

No PMI Bonus: +5 points
High Upfront Fees Penalty: -3 points
```

---

## Data Models

### LoanInputs Interface

```typescript
interface LoanInputs {
  homePrice: number;
  downPayment: number;
  creditScore: CreditScoreRange;
  annualTaxes: number;
  annualInsurance: number;
  monthlyHOA: number;
  interestRates: Record<LoanType, number>;
  borrowerCount: 'single' | 'multi';
  firstTimeHomeBuyer: boolean;
  pmiOption: 'bpmi' | 'lpmi' | 'singlePIF' | 'singleFin' | 'none';
  timeHorizon?: number;
  monthlyIncome?: number;
  monthlyDebts?: number;
  isVeteran?: boolean;
  isRural?: boolean;
}
```

### LoanCalculation Interface

```typescript
interface LoanCalculation {
  loanType: LoanType;
  loanAmount: number;
  interestRate: number;
  apr: number;
  termMonths: number;
  monthlyPI: number;
  monthlyMI: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  totalMonthly: number;
  upfrontFees: number;
  cashToClose: number;
  totalCost: number;
}
```

### LoanScenario Interface

```typescript
interface LoanScenario {
  id: string;
  name: string;
  clientName?: string;
  trackingId?: string;
  createdAt: string;
  updatedAt: string;
  inputs: LoanInputs;
  selectedLoanTypes: LoanType[];
  calculations: LoanCalculation[];
  emailTracking: EmailTracking;
  videoMessage?: VideoMessage;
}
```

---

## Component Architecture

```
App.tsx
├── LoanProvider (Context)
├── Header
│   ├── PDFOptionsModal
│   └── ShareModal
├── SavedScenariosSidebar
├── ClientNameInput
├── LoanInputs
├── InterestRates
├── LoanTypeSelector
├── ComparisonGrid
│   └── ComparisonCard (×4)
├── AIRecommendations
├── PaymentCharts
├── RateSimulator
├── ClosingCostsBreakdown
├── AmortizationSchedule
├── Compliance Footer
└── VideoWidget
```

---

## HubSpot Launch Checklist

### Phase 1: Infrastructure Setup

#### Hosting & Deployment
- [ ] **Select hosting platform** (Vercel, Netlify, AWS S3 + CloudFront, or HubSpot CMS)
- [ ] **Configure custom domain** (e.g., loans.luminatebank.com)
- [ ] **SSL certificate** - Ensure HTTPS for all traffic
- [ ] **CDN configuration** - For global performance
- [ ] **Environment variables** - Set production API keys

#### HubSpot Integration
- [ ] **HubSpot account setup** - Marketing Hub or CMS Hub
- [ ] **Embed method selection:**
  - Option A: Embed as iframe in HubSpot landing page
  - Option B: Host directly on HubSpot CMS
  - Option C: External hosting with HubSpot tracking
- [ ] **HubSpot tracking code** - Add to app for analytics
- [ ] **Form integration** - Connect lead capture to HubSpot CRM
- [ ] **Workflow triggers** - Set up automation for new leads

### Phase 2: Backend Services (Required for 500 Users)

#### User Management
- [ ] **Authentication system** - Auth0, Firebase Auth, or custom
- [ ] **User roles:**
  - Loan Officer (full access)
  - Manager (reporting + all LO scenarios)
  - Admin (configuration)
- [ ] **SSO integration** - If using enterprise identity provider
- [ ] **Session management** - Token refresh, logout handling

#### Data Persistence (Replace LocalStorage)
- [ ] **Database selection:**
  - PostgreSQL (recommended for relational data)
  - MongoDB (if flexible schema needed)
  - Firebase Firestore (quick setup)
- [ ] **API layer:**
  - Node.js + Express
  - Next.js API routes
  - AWS Lambda + API Gateway
- [ ] **Data migration plan** - From localStorage to cloud database

#### Required API Endpoints
```
POST   /api/scenarios          - Create scenario
GET    /api/scenarios          - List user's scenarios
GET    /api/scenarios/:id      - Get single scenario
PUT    /api/scenarios/:id      - Update scenario
DELETE /api/scenarios/:id      - Delete scenario
GET    /api/scenarios/shared/:trackingId - Get shared scenario
POST   /api/analytics/view     - Track client view
```

### Phase 3: Scalability for 500 Users

#### Performance Requirements
- [ ] **Expected concurrent users:** ~50-100 (10-20% of 500)
- [ ] **Expected scenarios:** ~5,000-10,000 (10-20 per user)
- [ ] **Database capacity:** Plan for 50GB+ with growth
- [ ] **API rate limiting** - Prevent abuse
- [ ] **Caching layer** - Redis for frequent queries

#### Load Testing
- [ ] **Stress test** - Simulate 100 concurrent users
- [ ] **PDF generation load** - Test bulk PDF generation
- [ ] **Database query optimization** - Index key fields

### Phase 4: Security & Compliance

#### Security Measures
- [ ] **Input validation** - Sanitize all user inputs
- [ ] **XSS protection** - Already using React (safe by default)
- [ ] **CSRF tokens** - For API mutations
- [ ] **Content Security Policy** - Restrict resource loading
- [ ] **Rate limiting** - Prevent brute force attacks
- [ ] **Audit logging** - Track user actions

#### Data Privacy
- [ ] **PII handling** - Client names, income data
- [ ] **Data encryption** - At rest and in transit
- [ ] **Data retention policy** - How long to keep scenarios
- [ ] **User data export** - GDPR/CCPA compliance
- [ ] **Privacy policy** - Update for app usage

#### Financial Compliance
- [ ] **NMLS disclosure** - ✅ Already in footer
- [ ] **Equal Housing Opportunity** - ✅ Already in footer
- [ ] **Not an offer disclaimer** - ✅ Already in footer
- [ ] **Rate disclaimer** - Rates subject to change
- [ ] **Calculation disclaimer** - Estimates only

### Phase 5: HubSpot-Specific Configuration

#### CRM Integration
- [ ] **Contact creation** - When client views shared link
- [ ] **Deal creation** - Optional for loan pipeline
- [ ] **Activity logging** - Track scenario shares
- [ ] **Custom properties:**
  - Scenario ID
  - Loan Types Compared
  - Best Recommended Loan
  - Client View Count
  - Last Viewed Date

#### Email Integration
- [ ] **Share via HubSpot email** - Track opens/clicks
- [ ] **Email templates** - Branded scenario share emails
- [ ] **Personalization tokens** - Client name, loan officer name

#### Analytics & Reporting
- [ ] **HubSpot dashboard** - Key metrics widget
- [ ] **Custom reports:**
  - Scenarios created per LO
  - Client engagement rates
  - Most compared loan types
  - Conversion tracking

### Phase 6: User Onboarding & Training

#### Documentation
- [ ] **User guide** - How to create/share scenarios
- [ ] **Video tutorials** - Screen recordings
- [ ] **FAQ document** - Common questions
- [ ] **Quick reference card** - One-page guide

#### Training
- [ ] **Admin training** - System configuration
- [ ] **LO training sessions** - Feature walkthrough
- [ ] **Support process** - Escalation path

### Phase 7: Monitoring & Maintenance

#### Monitoring
- [ ] **Uptime monitoring** - Pingdom, UptimeRobot
- [ ] **Error tracking** - Sentry, LogRocket
- [ ] **Performance monitoring** - Core Web Vitals
- [ ] **Usage analytics** - Google Analytics or Mixpanel

#### Maintenance Plan
- [ ] **Backup schedule** - Daily database backups
- [ ] **Update process** - Deployment pipeline
- [ ] **Rate updates** - Process for updating default rates
- [ ] **Support hours** - Define availability

---

## Security Considerations

### Current Implementation
- Client-side only (no server)
- LocalStorage for persistence (browser-specific)
- Base64 encoding for shareable URLs (not encryption)
- No authentication (single user per browser)

### Production Recommendations
1. **Add authentication** for multi-user support
2. **Server-side storage** for data persistence
3. **Encrypt sensitive data** (income, debts)
4. **Implement rate limiting** on API endpoints
5. **Add audit logging** for compliance
6. **Regular security audits** and penetration testing

---

## Performance Specifications

### Current Bundle Size
| Asset | Size | Gzipped |
|-------|------|---------|
| Main JS | 1,093 KB | 332 KB |
| CSS | 34 KB | 6.8 KB |
| html2canvas | 201 KB | 47 KB |
| jsPDF (via index.es) | 159 KB | 53 KB |

### Recommended Optimizations
1. **Code splitting** - Lazy load PDF/chart components
2. **Tree shaking** - Remove unused code
3. **Image optimization** - Compress logo assets
4. **Caching strategy** - Service worker for offline

### Target Performance Metrics
| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3.0s | ~2.5s |
| Lighthouse Score | > 90 | ~85 |

---

## Appendix: Brand Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| Navy | #0d173c | Primary, Conv 30yr |
| Light Blue | #96daf8 | Conv 15yr |
| Pink | #ce92c1 | FHA |
| Purple | #967db9 | VA |
| Gold | #ffd159 | USDA, Highlights |

---

*Document prepared for Luminate Bank internal use.*
*© 2024 Luminate Bank. All rights reserved.*
