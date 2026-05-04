# LMS architecture decisions

This is the running log of strategic decisions made while building the Teachable replacement. Each entry captures the decision, the reasoning, and what we accepted by *not* picking the alternatives. Order roughly reflects the order they were resolved.

## 1. Replace Teachable, don't augment

**Decision:** Build this site so students log in here, watch lessons here, and pay here. Kill the Teachable subscription.

**Why:** The $39/mo Teachable bill is the trigger. Half-measures (using this as authoring-only, or as a hybrid that publishes to Teachable) don't fix the recurring cost. Going all-in is more work but the only path that retires the line item.

**Trade-off accepted:** We're now in production-LMS territory — auth, payments, video hosting, student support. Larger scope than "internal tool," smaller scope than a multi-course catalog.

## 2. Lessons are MDX files in the repo

**Decision:** Each lesson is one MDX file at `content/courses/<course>/<section>/<lesson>/index.mdx`, with custom components for non-prose elements: `<Video>`, `<Pdf>`, `<Quiz>`. Ordinary prose, headings, lists, and inline images are native markdown.

**Why:**
- AI agents edit MDX dramatically better than they orchestrate "create block, set order, attach video" against a CMS API.
- Git is the version history. No CMS to build.
- New components (e.g. `<PracticeLoop bars="5-12" />`) are React components, not schema migrations.
- The repo's existing `content/lessons/` instinct is files-not-DB.

**Trade-off accepted:** No WYSIWYG for non-technical editors. Lionel is the only author (plus an AI agent), so this is fine.

## 3. One product, lifetime access — $197 masterclass

**Decision:** Single Stripe product, one-time $197, lifetime access to the whole masterclass. Sheet-music sales remain a separate channel. No subscription. No per-piece tiers. No Easy/Medium/Full price ladder.

**Why:**
- Landing copy already publicly promises "no subscription trap."
- One course exists today; multi-course infra is premature abstraction.
- The Easy/Medium/Full pedagogy framing is a *learning ladder*, not a *price ladder* — gating it behind paywalls inverts the teaching.
- Schema for one-product → multi-product is a 1-day refactor when (if) needed.

**Existing $1 VIP customers** get a credit toward the masterclass purchase ($196 to upgrade) when this ships. Specifics of that flow are still TBD.

## 4. Auth on Clerk, database on Neon Postgres

**Decision:** Clerk for authentication (email/password + Google/social), Neon serverless Postgres for application data. **Not** Supabase.

**Why Clerk:** Drop-in `<SignIn />` component, password + social out of the box, slick UX for the common case (forgot-password flows, profile management).

**Why Neon over Supabase:** Lionel had a clear "not a fan of Supabase Auth" preference. Neon is a clean serverless Postgres host without the adjacent products.

**Schema sketch (when it lands):**
```
users         id (= clerk user id), email, stripe_customer_id, created_at
purchases     user_id, stripe_payment_intent_id, product='masterclass', amount, purchased_at
lesson_progress  user_id, lesson_slug, completed_at
quiz_attempts    user_id, lesson_slug, quiz_id, score, attempted_at
```

**Stripe → Clerk provisioning flow:** on `checkout.session.completed`, a webhook creates the Clerk user via the Clerk backend SDK, writes a `purchases` row, and sends them a magic-link login. They never see a "sign up" form — they paid, they're in.

## 5. Video on Mux

**Decision:** Mux for video hosting. Each lesson references a Mux playback ID; the player is `<MuxPlayer />` with signed JWT URLs scoped to the user, lesson, and a short expiry.

**Why:**
- Premium player feel — the LMS shouldn't feel "cheap" for $197.
- Native signed-URL piracy story (shared links die in 30 minutes).
- Adaptive bitrate out of the box — students watch on phones, iPads, smart TVs.
- Realistic cost at our scale: ~$17/mo at 100 students; ~$60/mo at 500 students.
- Excellent agent DX: upload via API, paste the playback ID into MDX.

**Trade-off accepted:** Usage-based pricing means a viral moment is a surprise bill. Vimeo Pro at flat $20/mo would have capped that risk but lost the player-quality bump.

## 6. No drip — full access on purchase

**Decision:** Student pays $197, the entire course unlocks. No section-level or per-lesson time-gates. Reserve `unlock_after_days` in the schema for later if data shows we need it.

**Why:**
- Refund risk: a student bought specifically to learn Moonlight and being told "you can't see that lesson for 3 weeks" is a refund driver.
- Brand-aligned: "becoming a stronger pianist" framing trusts the student.
- Solo-creator scope: drip = email automation + "I'm on vacation, unlock everything" support tickets.
- Pacing is a content-design problem, not an access-control problem.

**Adding drip later is a 30-line change** if we see binge-then-quit patterns in Mux analytics.

## 7. Asset storage: co-located, served via API route

**Decision:** Lesson assets (images, PDFs) live in `content/courses/<course>/<section>/<lesson>/assets/`. They're served to the browser via `/api/lesson-asset/<course>/<section>/<lesson>/<filename>`, which streams from disk with a path-traversal guard.

**Why:**
- Assets are versioned alongside their MDX in git. Single source of truth.
- The same API route shape gates assets in v2: today the env-flag (`ENABLE_ADMIN`) returns 404 in prod; tomorrow we swap that for `clerk session + has_masterclass purchase` and the same route serves paying students. PDFs (sheet music, exercise sheets) are *exactly* the kind of asset that needs auth-gating against piracy.
- Repo size at projected scale (~50 lessons × ~500KB images) ≈ 25MB. Fine for git.

**Trade-off accepted:** Static-file serving from `public/` would be slightly faster, but there's no auth story and we'd fight to add one back later.

## 8. Route structure: route groups

**Decision:**
```
src/app/
  layout.tsx                       ← html/body, fonts, globals (truly shared)
  globals.css
  (marketing)/
    layout.tsx                     ← VIP-specific metadata + DpAnalyticsBeacon
    page.tsx                       ← landing page at "/"
  admin/                           ← /admin/...
    layout.tsx                     ← env-gated admin chrome
    [course]/[section]/[lesson]/page.tsx
  api/
    lesson-asset/[...path]/route.ts
```

**Why:** `(marketing)` is a Next.js route group — parens make it organizational only, the URL stays `/`. Marketing-specific concerns (VIP page metadata, analytics beacon) move out of the root layout so future routes don't inherit them. Admin lives at `/admin/*` with its own layout that handles gating. API routes are siblings.

## 9. Admin gating: env-flag for v1

**Decision:** Admin layout (and the lesson-asset API route) returns `notFound()` whenever `NODE_ENV === "production"` && `ENABLE_ADMIN !== "true"`. Local dev: always works. Production: invisible until you flip the env var in Vercel.

**Why:** Real auth (Clerk admin role) is coming, but for the next few weeks Lionel is the only person who needs admin access and he can do it from local dev. Env-flag is reversible in 30 seconds.

**Will be replaced** by a Clerk session check + admin role/email allowlist when auth lands.

## 10. Folder convention: numeric prefixes + JSON metadata

**Decision:**
- Course/section/lesson folders use numeric prefixes: `00-welcome/`, `01-piano-fundamentals-level-1/`, `02-...`.
- Lexicographic sort = display order. No `order:` frontmatter.
- Optional `_course.json` / `_section.json` provides display titles that don't degrade the URL slug. Underscored names sort before lessons.
- Lesson frontmatter: `title`, `public_preview` (bool), `draft` (bool), `duration_minutes` (number). That's it. No drip field. No tags yet.

**Why:** Conventions over configuration. The slug *is* the URL, the prefix *is* the order, the title comes from JSON or is derived from the slug.

## 11. MDX runtime: `next-mdx-remote/rsc`

**Decision:** Lessons are compiled at request time via `next-mdx-remote/rsc`, not via `@next/mdx` (which would require lessons to live inside `app/` and be bundler-imported).

**Why:**
- Lessons live at `content/courses/...`, outside `app/`.
- We want filesystem reads, not bundler-resolved imports.
- New lessons are visible without a rebuild in dev — `pnpm port-lesson` writes a file, reload the browser.

## 12. Teachable HTML porter

**Decision:** `src/lib/port-teachable.ts` walks the Teachable editor-view DOM block-by-block (each `<li class="_content_...">` has a `_contentKind` label of `TEXT & IMAGES`, `VIDEO`, `RESOURCE`, `QUIZ`, etc.) and dispatches per kind: prose → markdown via turndown, videos → `<Video playbackId="..." />` with TODO comments, PDFs → `<Pdf src="TODO_UPLOAD_..." />`. CLI is `pnpm port-lesson --input <html> --output <lesson-folder>`.

**Why:** Block-kind dispatch matches Teachable's mental model and produces predictable output. Sentinel strings survive turndown's escaping; post-process replaces them with JSX components.

**Limitations:**
- Editor view doesn't expose PDF download URLs (placeholder `"Download link visible"` instead). Filename preserved; the actual file must be uploaded manually.
- Hotmart playback IDs are preserved as Mux placeholders. Re-upload to Mux required.
- Quiz blocks not implemented yet — no sample HTML to design against.

## 13. Teachable scraper: Playwright persistent context + stealth

**Decision:** Authenticated scraping uses Playwright with a persistent browser profile (`.teachable-profile/`). Lionel logs in once via the popped-up browser; future scrapes reuse the cookies. `playwright-extra` + `puppeteer-extra-plugin-stealth` strips the Playwright fingerprints anti-bot systems check for. Output goes to `.teachable-cache/<course-id>/...`, both gitignored.

**Why over alternatives:**
- **CDP-attach to existing Chrome** would require remembering to start Chrome with `--remote-debugging-port=9222`. Fragile.
- **Browser extension** is too invasive for a one-creator workflow.
- **Cookie copy-paste** breaks every time cookies expire.

**Workflow:**
```
pnpm scrape login                                # one-time
pnpm scrape curriculum --course-id 2767887       # writes curriculum.json
pnpm scrape lesson 61037582 --course-id 2767887  # writes lesson.html + assets/
pnpm scrape-and-port --course-id 2767887 --course masterclass   # full chain
```

The orchestrator chains scrape → port for the whole course, with rate-limit delays.

---

## Open / deferred

These are decisions we know we need but haven't made yet:

- **Quiz porting & student-side quiz state.** Need a Teachable quiz HTML to design against.
- **$1 VIP grandfathering specifics.** Stripe coupon vs separate product vs manual credit — TBD.
- **Progress tracking model.** Auto-complete on video-end, manual mark-complete button, or both?
- **Course → section restructure.** Lesson 2: Pedals is currently misplaced (Level 2 instead of Level 7). Will be corrected when the scraper reproduces the full curriculum and we delete + re-port everything from scratch.
- **PDF upload destination.** Repo `assets/` matches images, but per-lesson PDFs may be heavier. Cloudflare R2 is the next-step option.

## Out of scope

These pieces of the repo are **deliberately not touched** by the LMS work without explicit asks:

- Stripe integration (`stripe/`) — payment/reservation flow logic
- `next.config.ts` deploy config
- Landing page content beyond the structural reorg into `(marketing)/`
