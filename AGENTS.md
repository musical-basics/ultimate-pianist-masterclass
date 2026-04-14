<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Next.js **16.2.3** with **React 19**. Breaking changes from older versions — APIs, conventions, and file structure may differ from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next/React code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack
- Next.js 16.2.3 (App Router) · React 19.2.4 · TypeScript · **pnpm** (not npm/yarn)
- Entry point: [src/app/page.tsx](src/app/page.tsx) — the landing page is a single long file, intentionally
- Styling: CSS Modules ([src/app/page.module.css](src/app/page.module.css)) + [src/app/globals.css](src/app/globals.css). No Tailwind.
- Static assets in [public/](public/). Markdown content in [content/](content/).

## Commands
- `pnpm dev` — local dev server
- `pnpm build` — production build (run before claiming a change is shippable)
- `pnpm lint` — ESLint

## Copy & voice rules (enforced)
Canonical copy lives in [docs/website_copy_v1.md](docs/website_copy_v1.md). When writing or editing user-facing text:
- **No em dashes (—) in prose.** Use hyphens, commas, or reword. The one sanctioned exception is operational use as a visual separator in CTAs / labels (e.g. "Reserve My Spot — $1"). Never in sentences.
- **Voice:** Lionel speaking as himself. Direct, personal, conversational. Not corporate "brand voice."
- **CTA consistency:** Primary CTA reads "Reserve My Spot for $1" or "Reserve My Spot — $1" style. Secondary: "Join the free waitlist" / "Notify Me".
- **No-spam reassurance** on every email capture touchpoint.
- **Core reframe:** The pieces are the *vehicle*, not the destination. The destination is becoming a stronger pianist.

## Working conventions
- **Plan first for multi-file or multi-section features.** Propose the approach before editing. Small copy tweaks can go straight to edit.
- **Small focused commits.** Match existing style: `feat:`, `fix:` prefix, one concern per commit.
- **Don't invent sections.** Proposed new landing sections go in a draft `.md` first; only code them after the copy is approved.
- **For UI changes:** run `pnpm dev` and verify in browser before reporting done. Type-checks don't catch layout regressions.

## What not to touch without asking
- Stripe integration ([stripe/](stripe/))
- Payment/reservation flow logic
- Deploy config, `next.config.ts`
