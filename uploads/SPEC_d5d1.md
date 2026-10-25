# Growth Model site: design spec

**Need (Charlie's words):** "What I care about is leads, where they're coming from, and how much they cost. Then once they're inside, what is the conversion per signup, and then what is the LTV." I want to see the important numbers at the top, click into any of them to change the details, plan my spend each month, save scenarios, and connect my real lead sources and payments so I can see how I'm actually doing and what to fix.

**Who uses it:** Charlie only (solo founder). One login. Several businesses: Home Projects first, SafeMomma next, so every model belongs to a **business**.

**Reference implementation:** `HomeProjects-growth-model.html` in this folder. It's a single working file with every formula, screen and default value. Port its math exactly (the `sim()`, `unitEcon()`, `chanMonth()`, `takes()` and `actuals()` functions) and match its numbers (see "Golden test" below). Improve the look, not the math.

---

## 1. The hierarchy (the most important part)

Every screen follows the same three levels. The top is the answer; you click down to the inputs.

```
LEVEL 1  Top numbers (one row, always visible)
         Cost per sign-up → Sign-up → paid % → Cost per paying user → Lifetime value per paying user → Return

LEVEL 2  Per lead source                        Per plan / feature
         spend, sign-ups, cost per sign-up,     price, you keep per sale, conversion,
         sign-ups per $100, cost per paying     how long they pay, lifetime value per buyer,
         user, return, "what it takes"          worth per sign-up, buyers

LEVEL 3  The weeds: "Edit" opens the inputs for that one row
         (CPM, click-through, landing %, views per creator, churn, render use, fees...)
```

Plus two working areas: the **month-by-month plan** (spend per source and running costs per month) and **real numbers** (what actually happened, compared with the plan).

### Definitions (use these words in the UI)

| Term | Meaning | Formula |
|---|---|---|
| Sign-up (lead) | A new user from any source | from lead source formulas, × (1 + referrals per user) |
| Cost per sign-up | What one sign-up costs | spend ÷ sign-ups |
| Sign-ups per $100 | Sign-up to cost ratio | sign-ups ÷ spend × 100 |
| Conversion | Share of new sign-ups who buy a plan | per plan, % of new sign-ups |
| Sign-up → paid | Share who buy anything | sum of conversion of plans that are on (cap 100%) |
| Cost per paying user | What one payer costs | cost per sign-up ÷ sign-up → paid |
| You keep per sale | After fees and usage | price × (1 − blended fee) − renders × render price − other cost |
| Blended fee | Web vs App Store | web% × web fee + (1 − web%) × App Store fee |
| How long they pay | Monthly: 1 ÷ monthly churn. One-time: purchases per buyer | |
| Lifetime value per buyer | | you keep × how long they pay |
| Worth per sign-up (per plan) | | conversion × lifetime value per buyer |
| Value per sign-up | What an average sign-up is worth, paying or not | Σ worth per sign-up + materials commissions per user − free-user cost per user |
| Free-user cost per user | | (free renders × render price + text cost) × months a user stays |
| Value per paying user | LTV of a payer | Σ worth per sign-up (plans only) ÷ sign-up → paid |
| Return | LTV:CAC | value per sign-up ÷ cost per sign-up. Green ≥ healthy target (default 3×), amber 1 to 3×, red < 1× |

Show both views, because sign-ups and payers are different people: **per sign-up** (value per sign-up vs cost per sign-up) and **per payer** (value per paying user vs cost per paying user). They give the same return; the payer view is easier to feel.

---

## 2. Screens

### 2.1 Overview (home for a business)
- Scenario picker at the top (see 2.8).
- **Flow line**: "$X on lead sources → N sign-ups at $Y each → Z% pay = ~P paying users at $C each → each payer worth $L → every $1 spent returns $R".
- **Level 1 cards (5, emphasised):** cost per sign-up, sign-up → paid, cost per paying user, lifetime value per paying user, return.
- **Secondary cards (5):** value per sign-up, total sign-ups, first month it stays above water (profit ≥ 0 and revenue > 0 from that month to the end), most money down at any point, total profit.
- Toggle for the period: whole plan / a chosen month / last 3 months.
- Profit chart: monthly profit bars (green/red) + active users line.
- Roadmap strip: stage bands from the month plan, pills for plan launches, source starts, materials links, contractor leads, a dashed line at break-even.
- If real numbers exist, show "Real" next to each Level 1 number (e.g. "Cost per sign-up $3.23 · real $5.10").

### 2.2 Lead sources
Table, one row per source: on/off switch, name, type, spend, sign-ups, cost per sign-up, sign-ups per $100, cost per paying user, return, **what it takes**, Edit, remove.
- **Target cost per sign-up** input above the table (default $5) and **healthy return** (default 3×).
- **What it takes** column: if cost per sign-up is above target, show the needed value of the source's main rate = today's rate × today's cost ÷ target. Show alternatives (e.g. for ads: landing %, click-through, or max CPM). Mark any percentage over 100% as impossible.
- Edit opens the inputs for that type (table below). Changing the type keeps old values and fills defaults for new fields.
- "+ Add lead source" with a type picker.

| Type | Inputs | Sign-ups per month | Cost per month |
|---|---|---|---|
| Views (your reels) | views first month, growth %/mo, cap, sign-ups per 1,000 views | min(cap, views × (1+g)^(m−start)) ÷ 1000 × rate | month-plan cost |
| Search (SEO) | visits first month, growth, cap, visit→sign-up % | min(cap, visits × (1+g)^(m−start)) × % | month-plan cost |
| Creators (UGC) | views per creator, base pay, pay per 1,000 views, sign-ups per 1,000 | creators × views ÷ 1000 × rate | creators × base + creators × views ÷ 1000 × bonus |
| Impressions (Meta, TikTok) | CPM, click-through %, landing → sign-up % | spend ÷ CPM × 1000 × CTR × landing % | spend |
| Clicks (Google) | CPC, click → sign-up % | spend ÷ CPC × % | spend |
| Pay per sign-up | price per sign-up | spend ÷ price | spend |
| Fixed (in person, email) | sign-ups per month | that number | month-plan cost |

Nothing counts before a source's start month or while it's off. Creators' month-plan value is the number of creators, not dollars.

### 2.3 Plans and value
Table, one row per plan/feature: on/off, name, type (monthly / one-time), price, you keep per sale, conversion, how long they pay, lifetime value per buyer, worth per sign-up, buyers over the plan, Edit, remove.
- Edit inputs: name, type, price, launch month, conversion % of new sign-ups, cancel per month % (monthly) or purchases per buyer (one-time), renders used (per month or per purchase), other cost per sale, fixed cost per month, % bought on the web.
- Under the table, **"What one sign-up is worth"** breakdown: each plan's line, + materials commissions, − free-user cost, = value per sign-up; ÷ share who pay = value per paying user; vs cost per sign-up = return.
- Setting (in Costs): "A plan's launch month also sells to users already active" (default on).

### 2.4 Month by month
A grid: columns = months (default 18, adjustable 6 to 48), sticky first column.
- Row **Stage** (text, names the roadmap bands).
- One row per lead source (spend, or # creators). Off sources shown dimmed.
- One row per running cost line.
- Calculated rows (read-only): free-user renders + text, new sign-ups, cost per sign-up, new paying users, active users, revenue, all costs, profit, running total.
- **"Change later months too"** switch (default on): typing in month 6 fills months 7 onward. For the stage row it only fills the following months that had the same old label.
- Nice to have: drag to fill, copy a month, and +/− 10% buttons for a whole row.

### 2.5 Costs to maintain
- Running cost lines (add, rename, remove); their monthly values live in the grid.
- Settings: months a user stays active, new users each user brings, cost per render, free renders per active user per month, text/assistant cost per active user, web payment fee %, App Store fee %, launch-month-sells-to-existing switch.

### 2.6 Other income (business-specific modules)
Home Projects: materials affiliate (start month, % of active users who open a list, % who buy, order size, commission) and contractor referrals (start month, minimum active users, % who request, % sold, price per lead). Materials counts in value per sign-up; contractor leads don't (they depend on reaching the minimum). Build these as optional modules so SafeMomma can have its own (e.g. sponsorships).

### 2.7 Real numbers
- Same grid shape as the month plan: per source "spend" and "sign-ups" rows; per plan "new buyers" rows. Blank = not entered.
- **Plan vs real** table: per source → months entered, real spend, real sign-ups, real cost per sign-up, planned cost per sign-up for the same months, gap (real ÷ plan; above 1.15× red). Per plan → real conversion (buyers ÷ all real sign-ups in those months), planned, gap (below 0.87× red).
- **Use real rate** button per row: updates the model so the plan matches reality. For sources, scale the main rate by (real sign-ups per $ ÷ planned sign-ups per $). Paid types use sign-ups per $; free types use sign-ups. For plans, set conversion to the real value. Log every change (what, old, new, when).
- **What to fix first**: ranked list, real-number problems first, then model problems, each by money at stake:
  1. Source costs > 1.15× plan → show the main rate and what it takes to hit target.
  2. Plan converts < 0.87× plan → "test the offer, price or where it's shown".
  3. Source return < 1× → what it takes to break even (target = value per sign-up).
  4. Value per sign-up ≤ 0 → "fix plan value before spending on ads".

### 2.8 Scenarios
- Each business has named scenarios. Every edit autosaves to the current scenario.
- Save as new (copy), rename, delete (keep at least one), reset to defaults.
- **Compare**: pick 2 to 4 scenarios and see their Level 1 numbers, break-even month and most money down side by side.
- Export / import JSON (same shape as the reference file's export).

---

## 3. Connecting real data (phase 2)

Goal: fill section 2.7 automatically every day instead of typing. Keep manual entry and CSV import as the fallback for every source.

| Data | Where it comes from | What to pull |
|---|---|---|
| Meta ad spend + results | Meta Marketing API, Insights on the ad account, by campaign by day | spend, impressions, clicks, leads/registrations |
| Meta lead-form leads | Lead Ads (form leads) or the Leads Center CSV | lead id, created time, campaign/ad, platform |
| Google ads | Google Ads API (GAQL report by campaign by day) | cost, clicks, conversions |
| TikTok ads (later) | TikTok Marketing API reporting | spend, clicks, conversions |
| Creators / organic / in person | UTM links and ref codes (e.g. `?ref=creator-name`, QR codes) saved on the sign-up | sign-ups per ref |
| Sign-ups | The product's own database (Supabase users table) with first-touch `utm_source`, `utm_campaign`, `ref` | count per day per source |
| Payments | Stripe and/or Whop (webhooks + API); RevenueCat if iOS subscriptions | new buyers per plan, renewals, cancellations, refunds, revenue |

Rules:
- **Mapping screen:** map each campaign / UTM source / ref code to one lead source in the model. Unmapped items show in an "Unmapped" bucket so nothing silently disappears.
- **Attribution:** first touch, stored on the user row at sign-up. A purchase is attributed to the buyer's sign-up source.
- **Cohort conversion:** real conversion = buyers within 30 days of sign-up ÷ sign-ups in that month. Show it by sign-up month and by source, so you can see which source brings people who pay.
- **Real churn and real LTV:** monthly churn from the payment provider (cancellations ÷ active subscribers at start of month); realised revenue per payer so far vs the projected lifetime value.
- **Real cost per paying user by source**: spend ÷ payers attributed to that source. This is the number that decides where money goes.
- Read-only access everywhere. Tokens stored server-side, never in the browser. Nightly sync + a "Sync now" button. Show "last synced" time per connection.
- Check each API's current docs before building; field names and versions change.

---

## 4. Data model (suggested)

```
business(id, name)
scenario(id, business_id, name, months, settings_json, created_at, updated_at)
lead_source(id, scenario_id, name, type, on, start_month, params_json, sort)
plan(id, scenario_id, name, type, on, launch_month, price, conversion, churn, purchases_per_buyer,
     renders, other_cost, fixed_cost, web_share, sort)
running_cost(id, scenario_id, name, sort)
month_value(scenario_id, row_kind['stage'|'source'|'cost'], row_id, month, value)
module(id, scenario_id, kind['materials'|'contractor_leads'|...], on, params_json)
-- real data (belongs to the business, not a scenario)
actual_source_day(business_id, lead_source_key, date, spend, signups, raw_json)
actual_plan_day(business_id, plan_key, date, new_buyers, cancellations, revenue)
mapping(business_id, external_kind, external_id, lead_source_key | plan_key)
change_log(id, scenario_id, what, old, new, reason['use real rate'|'manual'], at)
```
Real numbers live on the business, so every scenario compares against the same reality. Lead sources and plans need a stable `key` shared across scenarios for that to work.

---

## 5. Tech and quality

- Charlie's stack: Next.js + Supabase + Clerk + Vercel. Single user; protect every route.
- Put the model math in one pure TypeScript module (no UI imports) with unit tests. The UI only calls it.
- Live recalculation on every keystroke (< 50 ms for 48 months × 20 rows). Never lose focus while typing.
- Desktop first; the month grid can scroll sideways on mobile.
- Light theme, serif headings over a sans body, one accent colour, numbers right-aligned, green/amber/red only for the return and profit.

### Golden test (reference defaults must reproduce these)
With the reference file's defaults (18 months, Home Projects plans, sources and month plan):
- Sign-ups over 18 months: **16,105**; outreach spend **$51,950**; cost per sign-up **$3.23**
- Sign-up → paid **3.2%**; cost per paying user **$101**
- Lifetime value per paying user **$35.40**; value per sign-up **$0.48**; return **0.15×**
- Design Plus: you keep $11.41, 5.0 months, lifetime value $57.05
- Most money down **$43,290**; total profit **−$43,290**; break-even "not in 18 months"

---

## 6. Build order

1. **Model + Level 1 + lead sources + plans** with Edit panels, one business, one scenario. Done when the golden test passes and every number updates as you type.
2. **Month-by-month grid + costs + other income modules + roadmap strip + chart.** Done when "change later months too" works and the stage bands follow the stage row.
3. **Scenarios** (save as new, rename, delete, compare, export/import). Done when two scenarios compare side by side.
4. **Real numbers, manual + CSV**, plan vs real, use real rate, fix list, change log. Done when entering one month of real Meta spend/sign-ups shows the gap and "use real rate" closes it to 1.0×.
5. **Connections** (Supabase sign-ups with UTM/ref first, then Stripe/Whop, then Meta, then Google). Done when yesterday's numbers appear without typing and unmapped items are visible.
6. **Second business (SafeMomma)** using the same screens with its own modules.

## Out of scope for v1
Team accounts, forecasting with uncertainty bands, writing anything back to ad platforms or payment providers.
