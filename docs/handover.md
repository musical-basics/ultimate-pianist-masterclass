# Handover: LMS migration

You are picking up an in-progress project to replace Teachable with a self-hosted LMS in this repo. Read [AGENTS.md](../AGENTS.md) for repo conventions and [docs/lms-decisions.md](./lms-decisions.md) for the strategic decisions and *why* each one was made — that doc is the single source of truth for architecture context. This file is the operational handover: where we are, what's next, and the gotchas waiting for you.

## TL;DR

A landing page existed; the LMS layer is being added on top. Lessons live as MDX files (`content/courses/<course>/<section>/<lesson>/index.mdx`), rendered behind an env-gated `/admin` UI. A Teachable HTML porter and an authenticated Playwright scraper exist and work for the prose / images / video placeholders / PDF placeholders flow. Auth (Clerk), DB (Neon), payments (Stripe), and the student-facing player (Mux) are *not* built yet.

## Where we are right now

**Active blocker:** the scraper login retest. The first attempt revealed Teachable uses 2FA via `sso.teachable.com` and Cloudflare gates admin paths. Commit `cc5f259` hardens the login command (domain + path aware auth detection, Cloudflare interstitial wait, prints each URL change as the user navigates, exits non-zero on failed detection). Lionel needs to run `pnpm scrape login` and complete the full 2FA flow before we can proceed.

If the hardened login still gets stuck, the printed URL trail will tell us where. Most likely next failures: Cloudflare's CAPTCHA challenges Playwright even in headed mode (then we'd switch to attaching to his real Chrome via CDP), or session cookies expire faster than expected.

## Recent work

Run `git log --oneline main` for the full sequence. Most relevant recent commits:

- `cc5f259` — scraper login: 2FA + Cloudflare hardening
- `1027b80` — scraper feature (login / curriculum / lesson / all subcommands)
- `a9705c4` — `docs/lms-decisions.md` (the architecture log)
- `d264711` — fix: lesson-asset API route so admin images render
- `89615b8` — Teachable HTML porter (`src/lib/port-teachable.ts` + CLI)
- `80567d7` — `/admin` review UI (course list, course detail, lesson preview)
- `3884799` — placeholder Video / Pdf / Quiz components
- `c5e605d` — lesson schema + filesystem loader (`src/lib/lessons.ts`)
- `96f79f4` — landing page reorg into `(marketing)` route group

## Repo tour (LMS-relevant)

```
content/
  courses/
    masterclass/
      _course.json                    Course display title
      00-welcome/
        _section.json                 Section display title
        01-getting-started/
          index.mdx                   Skeleton lesson exercising every component
      02-piano-fundamentals-level-2/
        02-how-pedals-are-marked-in-sheet-music/
          index.mdx                   Real lesson ported from Teachable
          assets/                     Co-located images
                                      (NOTE: this lesson is in the wrong section,
                                       belongs in Level 7: Dynamics. Will be
                                       fixed when the scraper rebuilds the tree.)

src/
  lib/
    lessons.ts                        Filesystem loader (getCourse, getLesson)
    port-teachable.ts                 HTML -> MDX porter (block-by-block)
  components/
    lessons/
      video.tsx, pdf.tsx, quiz.tsx    Placeholder MDX components
      placeholders.module.css
  app/
    layout.tsx                        Generic root layout
    (marketing)/                      Landing page route group
      layout.tsx                      VIP-specific metadata + analytics beacon
      page.tsx                        Landing
    admin/                            /admin/* — env-gated review UI
      layout.tsx                      Gating: NODE_ENV=production && !ENABLE_ADMIN -> 404
      page.tsx                        Course list
      [course]/page.tsx               Course detail (sections + lessons)
      [course]/[section]/[lesson]/page.tsx   MDX preview
    api/
      lesson-asset/[...path]/route.ts Streams images/PDFs from content/.../assets/

scripts/
  port-teachable-lesson.ts            CLI: pnpm port-lesson
  scrape-teachable.ts                 CLI: pnpm scrape

docs/
  lms-decisions.md                    Architecture decisions (read this)
  handover.md                         This file
  website_copy_v1.md                  Canonical landing copy

archive/                              Dead code from prior iterations (do not edit)
```

## Commands cheatsheet

```bash
pnpm dev                                            # local dev server
pnpm build                                          # production build (run before claiming "shippable")
pnpm lint                                           # ESLint

# Lesson tooling
pnpm port-lesson --input <html> --output <dir>      # Teachable HTML -> MDX (manual exports)
pnpm scrape login                                    # one-time browser login (must complete 2FA)
pnpm scrape curriculum --course-id 2767887           # curriculum tree -> .teachable-cache/<id>/curriculum.json
pnpm scrape lesson <lesson-id> --course-id 2767887   # one lesson HTML + assets
pnpm scrape all --course-id 2767887 --course masterclass   # full course chain (scrape + port)
```

The course ID is `2767887`, school slug is `musicalbasics-academy`. Both confirmed by the user.

## Immediate next steps (in order)

1. **Confirm scraper login works.** User runs `pnpm scrape login` end-to-end. Once "Login detected" prints, move to step 2.
2. **Test curriculum scrape.** `pnpm scrape curriculum --course-id 2767887`. Verify the printed section/lesson tree matches what Lionel sees in his Teachable admin. The selector strategy is anchor-based (`a[href*="/curriculum/lessons/"]`) and groups by nearest preceding heading — robust but worth a sanity check.
3. **Test one lesson scrape.** `pnpm scrape lesson <some-lesson-id> --course-id 2767887`. Verify HTML + assets land in `.teachable-cache/2767887/<lesson-id>/`. Spot-check a few images.
4. **Nuke and rebuild.** `rm -rf content/courses/masterclass` then `pnpm scrape all --course-id 2767887 --course masterclass` (4-second base delay + 2-second jitter between lessons). Lionel asked for "1 at a time with delays to evade detection" — keep the cadence relaxed.
5. **Verify in `/admin`.** Boot dev, browse `/admin/masterclass`, click through every section. Compare against the live Teachable course.
6. **Manual TODOs after porting:** re-upload every video to Mux, swap each `<Video playbackId="TODO_..." />` placeholder with the real ID. Same for `<Pdf src="TODO_UPLOAD_..." />` once we have a PDF home.

## What's NOT built yet

Everything past content authoring. In rough priority order:

- **Auth (Clerk + Neon Postgres).** Decided in [lms-decisions §4](./lms-decisions.md#4-auth-on-clerk-database-on-neon-postgres). Schema sketched, no code.
- **Mux video integration.** `<Video>` component renders a placeholder; needs to become the real `<MuxPlayer />` with signed JWT URLs.
- **Stripe checkout flow.** A Payment Link exists today (`stripe/stripe-setup-guide.md` documents the $1 VIP funnel). The $197 masterclass purchase + Clerk-user-provisioning webhook is unbuilt.
- **Student-facing routes.** `/learn/<course>/<section>/<lesson>` doesn't exist. Will mirror the admin preview shape but with auth + purchase gating.
- **Quiz porting.** Porter logs a warning + skips quiz blocks because we haven't seen a Teachable quiz HTML to design the conversion against.
- **PDF storage destination.** The porter emits `<Pdf src="TODO_UPLOAD_..." />` placeholders. v1 plan is repo-co-located; if PDFs get heavy we move to Cloudflare R2.

## Things to NOT touch without an explicit ask

- `stripe/` — payment/reservation flow
- `next.config.ts` — deploy config
- Landing page copy in `src/app/(marketing)/page.tsx` and `docs/website_copy_v1.md` — copy rules in AGENTS.md (no em dashes in prose, etc.) apply
- `archive/` — dead code, leave it
- `reference/` — Lionel's source assets (Sibelius files, master PDFs)

## Working norms (Lionel-specific)

These come from `/Users/lionelyu/.claude/CLAUDE.md` and AGENTS.md. Most-load-bearing ones:

- **Always commit and push after every completed change** (his global rule, predates this work — the explanation is in CLAUDE.md). Don't ask first. Push to `main`. Production deploys on every push.
- **Don't bypass pre-commit hooks** (`--no-verify`) or skip signing.
- **Plan first for multi-file features.** Lionel signs off before code lands. Single-file copy tweaks can go straight to edit.
- **No em dashes in prose.** Allowed only as visual separators in CTA labels.
- **Verify UI changes in a browser before reporting "done."** Type-checks don't catch layout regressions. If you can't open a browser, say so explicitly.
- **The Stripe / payment / deploy / next.config bits need explicit asks** before touching.

## Open questions still unresolved

These are listed at the bottom of [lms-decisions.md](./lms-decisions.md#open--deferred). Don't answer them unilaterally — surface them to Lionel:

- $1 VIP grandfathering specifics (Stripe coupon vs separate product vs manual credit)
- Progress tracking model (auto-complete on video-end, manual button, both?)
- Quiz state model (graded server-side, client-only self-check, both?)
- PDF storage destination (repo vs R2)

## If the scraper still gets blocked after the hardened login

Escalation order (we haven't tried any of these yet):

1. Check whether headed mode passes Cloudflare reliably for the curriculum URL. If yes, leave headless off everywhere.
2. If Cloudflare keeps challenging, switch from Playwright-launched browser to **CDP-attach** to Lionel's real Chrome. He'd start Chrome with `--remote-debugging-port=9222`, log in normally, and the script connects via `chromium.connectOverCDP("http://localhost:9222")`. Inherits his real fingerprint.
3. If that also fails, fall back to manual: he opens each lesson in his browser, saves page-as-html, and we run the existing `pnpm port-lesson` against each. Slower but bulletproof.

Don't reach for these unless option 1 has been tried and failed.
