# Growth Model

A private growth model, projection, and tracking web app for solo founders. Built as a design prototype for Charlie Romeis.

## What is this?

This app helps you understand the economics of user acquisition:
- **Lead sources**: Where sign-ups come from and what they cost (organic, SEO, UGC creators, Meta ads, Google ads, etc.)
- **Plans and value**: How much a sign-up is worth based on conversion rates and lifetime value
- **Month-by-month projections**: Plan your spend and see projected profits over time
- **Real numbers tracking**: Enter actual results and compare them to your plan

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
open http://localhost:3847
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

The tests verify the "golden test" numbers from the spec:
- 16,105 sign-ups over 18 months
- $51,950 outreach spend
- $3.23 cost per sign-up
- 3.2% sign-up → paid conversion
- $101 cost per paying user
- $35.40 lifetime value per paying user
- $0.48 value per sign-up
- 0.15× return
- $43,290 most money down
- -$43,290 total profit
- Break-even: not in 18 months

## Code Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind + custom design tokens
│   ├── layout.tsx           # Root layout with fonts
│   └── page.tsx             # Main page component
│
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── Header.tsx           # Business switcher + navigation
│   ├── MetricCard.tsx       # KPI display card
│   ├── FlowLine.tsx         # "spend → signups → payers → value" flow
│   ├── ProfitChart.tsx      # Monthly profit/loss chart
│   ├── RoadmapStrip.tsx     # Stage bands + milestones visualization
│   └── sections/            # Main screen sections
│       ├── Overview.tsx     # Top numbers + charts
│       ├── LeadSources.tsx  # Lead source table + edit panels
│       ├── Plans.tsx        # Plans table + value breakdown
│       ├── MonthGrid.tsx    # Month-by-month input grid
│       ├── Costs.tsx        # Running costs + settings
│       ├── OtherIncome.tsx  # Materials affiliate + contractor leads
│       ├── RealNumbers.tsx  # Actuals entry + plan vs real
│       ├── ChangeLog.tsx    # History of "use real rate" changes
│       └── Scenarios.tsx    # Save/load/compare scenarios
│
└── lib/
    ├── model.ts             # Pure math module (no UI imports)
    ├── model.test.ts        # Golden test verification
    ├── store.ts             # LocalStorage persistence
    ├── context.tsx          # React context for global state
    └── utils.ts             # Tailwind merge utility
```

## The Math Module

All growth model calculations live in `src/lib/model.ts`. This is a **pure TypeScript module** with no React or UI dependencies. It exports:

### Types
- `Scenario` - Complete state for one scenario
- `LeadSource` - A user acquisition channel
- `Plan` - A pricing plan or feature
- `SimResult` - Output of the simulation

### Core Functions
- `sim(scenario)` - Run the month-by-month simulation
- `unitEcon(scenario)` - Calculate per-signup and per-payer economics
- `calcTopMetrics(scenario, simResult, econ)` - Derive KPI summary
- `chanMonth(channel, month, spend)` - Calculate sign-ups and cost for one channel in one month
- `keepOf(plan, settings)` - What you keep per sale after fees
- `staysOf(plan, months)` - How long a subscriber stays (1/churn) or repeat purchases
- `ltvOf(plan, settings, months)` - Lifetime value per buyer
- `whatItTakes(channel, cps, target)` - What needs to change to hit target CPS

### Golden Test
- `verifyGoldenTest()` - Verifies all calculations match the spec's expected values

## Design System

The app follows these visual rules from the spec:

- **Light theme** with warm neutrals (#f9f9f7 background)
- **Serif headings** (Source Serif 4) over **sans body** (Inter)
- **One accent color** (#2f5d50 teal)
- **Tabular numbers** for all financial figures, right-aligned
- **Green/amber/red** only for return ratio and profit (not arbitrary status)
- **No gradients, emoji, or generic "card soup"**

## State Management

State is stored in localStorage under the key `growthModelV1`. The structure:

```typescript
{
  currentBusiness: string,
  businesses: {
    [id]: {
      name: string,
      scenarios: { [id]: Scenario },
      currentScenario: string,
      changeLog: ChangeLogEntry[]
    }
  }
}
```

Changes auto-save on every edit. Use Export/Import to move data between browsers.

## Screens

1. **Overview** - Top numbers (cost per sign-up, conversion, LTV, return), flow line, profit chart, roadmap strip
2. **Lead Sources** - Table with on/off, spend, sign-ups, cost metrics, "what it takes" column, edit panels
3. **Plans and Value** - Table with pricing, conversion, LTV, value per sign-up breakdown
4. **Month by Month** - Editable grid for spend per source and running costs, with "change later months too"
5. **Costs** - Running cost lines, user/fee settings
6. **Other Income** - Materials affiliate and contractor lead modules
7. **Real Numbers** - Actuals entry, plan vs real comparison, "use real rate", "what to fix first"
8. **Scenarios** - Save as new, delete, reset, export/import JSON, compare side-by-side

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** with custom design tokens
- **shadcn/ui** for primitives (Button, Input, Table, Dialog, etc.)
- **Vitest** for unit tests
- **No backend** - all state in localStorage

## What's Not Included (Yet)

Per the spec, these are planned for later phases:
- Authentication (Clerk)
- Database (Supabase)
- Real data connections (Meta API, Google Ads, Stripe, etc.)
- Second business (SafeMomma) with its own modules

## Development

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

---

Built as a design prototype. The math is live and verified against the reference implementation.
