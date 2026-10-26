# Growth Model: Cursor handoff

You're picking up Charlie Romeis's internal growth model and tracking app. It's private and used only by Charlie.

## Where things live
- **GitHub (pull from here):** https://github.com/ZeusCode21/homeprojectscalculations (branch `main`)
- **Vercel project:** `homeprojectscalculations` in the `charlie-romeis-projects` team. It deploys automatically on every push to `main`.
- **Spec:** `uploads/SPEC.md` or the original `SPEC.md`, plus `HomeProjects-growth-model.html`, the reference math. **Port the math exactly and improve only the look.**
- Origin copy (older mirror, not the source of truth): https://cursor.com/codebase/charlie-r/growth-model

## Run it
```bash
npm install
npm run dev     # http://localhost:3847
npm run test    # 23 golden tests (must stay green)
```

## Code map
- `src/lib/model.ts`: all of the math, in pure TypeScript with no UI imports. It ports `sim()`, `unitEcon()`, `chanMonth()`, `takes()` and `actuals()`.
- `src/lib/model.test.ts`: the golden test (16,105 sign-ups, $3.23 per sign-up, 3.2% paid, $101 per paying user, $35.40 lifetime value, 0.15× return, $43,290 most money down).
- `src/lib/store.ts` and `context.tsx`: app state, saved in localStorage for now.
- `src/components/sections/`: one file per screen (Overview, Lead sources, Plans & value, Month by month, Costs, Other income, Real numbers, Change log, Scenarios).

## Hierarchy (don't break it)
1. **Level 1:** cost per sign-up, sign-up to paid, cost per paying user, lifetime value per paying user, return.
2. **Level 2:** a row per lead source and a row per plan.
3. **Level 3:** an "Edit" panel with the inputs for one row.

The roadmap or phase strip sits at the **top** of the Overview (Charlie's call). The business is the top level (Home Projects now, SafeMomma next), and each business holds its own scenarios and real data.

## Design rules
- It should look like a professional product (Stripe, Mercury, Linear, Ramp), never like generic AI-generated design.
- Light theme. Headings use Source Serif 4, body text uses Inter, and there's one accent color (#2f5d50).
- Numbers are right-aligned and tabular. Green, amber and red are only for return and profit.
- Copy is in plain words. Never use: automation, AI, solution, streamline, leverage, seamless, game-changer.

## Next steps (in order)
1. Charlie's design feedback, round by round.
2. Sign-in, since it's single-user. Every route must be protected, so nothing is public.
3. Supabase for storage, using **only** the free-plan Supabase org and never ZeusCodes. Follow the data model in SPEC.md section 4. Real numbers belong to the business, and lead sources and plans have stable keys.
4. Real numbers: manual entry plus CSV import. "Use real rate" should close the gap to 1.0×.
5. Connections (SPEC section 3): Supabase sign-ups with UTM and ref first, then Stripe or Whop, then Meta (Ads Insights and Lead Ads), then Google Ads. Access is read-only, tokens stay on the server, it syncs nightly with a "Sync now" button, and anything unmapped is shown rather than dropped.
6. SafeMomma as the second business, with its own modules (sponsorships, Product of the Week, shop, guides).

## Ground rules
- Check with Charlie before any Vercel or Supabase change beyond normal pushes.
- Keep the deployment private using Vercel Deployment Protection or sign-in.
- Don't commit secrets. Keep them in Vercel env vars.
