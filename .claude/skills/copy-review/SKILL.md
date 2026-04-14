---
name: copy-review
description: Review or draft user-facing copy (landing page, video scripts, email) for The Ultimate Pianist. Enforces voice, tone, and hard rules like no em dashes and CTA consistency. Use when the user asks to review, rewrite, tighten, or draft marketing/landing copy.
---

# Copy review — The Ultimate Pianist

Use this when the user asks you to review, draft, rewrite, or tighten copy for:
- Landing page sections ([src/app/page.tsx](../../../src/app/page.tsx), [website_copy_v1.md](../../../docs/website_copy_v1.md))
- Video scripts (`announcement_video_script*.md`)
- Emails, social posts, CTAs, button labels

## Hard rules (non-negotiable)

1. **No em dashes (—) in prose.** In sentences, never. Use a hyphen, comma, period, colon, or reword. The **one sanctioned exception** is operational use as a visual separator in CTAs and labels (e.g. "Reserve My Spot — $1", "First Pieces — Launching"). That's not literary punctuation, it's a typographic separator. If you're unsure whether a given em dash is prose or operator: if you could read it aloud as "and" or "pause," it's prose, remove it.
2. **CTA consistency.** Primary CTA is "Reserve My Spot for $1" or "Reserve My Spot — $1" (em dash allowed here as an operator). Secondary is "Join the free waitlist" or "Notify Me". Don't invent new CTA phrasings without flagging it.
3. **No-spam reassurance** on every email capture. Short is fine ("No spam, ever").
4. **Price is $1** for VIP reservation. Refundable. One-time. No subscription.

## Voice

- **It's Lionel talking**, not a brand. First person. Conversational. The reader is one person, not "you all."
- **Direct and honest** — the "Honest Truth" framing in Section 1 of [website_copy_v1.md](../../../docs/website_copy_v1.md) is the tonal north star.
- **Concrete over abstract.** "Moonlight Sonata Nightmare" beats "pieces." "30M views" beats "popular."
- **Short sentences outperform long ones.** If a sentence has two commas, consider splitting it.
- **Don't hype.** No "revolutionary," "game-changing," "unlock your potential." Lionel's credibility comes from the work, not the adjectives.

## The core reframe (preserve this)

The pieces (Moonlight Sonata, Für Elise, Still D.R.E.) are the **vehicle**. The destination is becoming a fundamentally stronger pianist. If copy makes it sound like the product is "learn these three songs," it's wrong. It's "become the pianist who can play anything, using these songs as the path."

## Social proof (use sparingly, accurately)

- Carnegie Hall & Kennedy Center performer
- 1M+ YouTube subscribers
- 30M+ combined views on Moonlight Sonata Nightmare

Don't stack all three in one sentence — it reads as bragging. One per section max.

## Review checklist

When reviewing existing copy, check in this order:

1. **Em dashes in prose** — scan first. Flag every instance in sentence context. Em dashes inside CTAs and short labels ("Reserve My Spot — $1") are fine.
2. **CTAs** — do they match the canonical phrasings?
3. **Voice drift** — any sentence that sounds like a marketer wrote it? Flag and rewrite.
4. **Hype words** — "revolutionary," "ultimate" (except in the product name), "unlock," "transform." Flag.
5. **Vehicle vs. destination** — does the copy sell songs, or sell becoming a stronger pianist?
6. **Length** — is any paragraph longer than 3 sentences? Propose a cut.
7. **No-spam reassurance** — present on every email capture?

## Drafting checklist

When writing new copy from scratch:

1. Read [website_copy_v1.md](../../../docs/website_copy_v1.md) first for tone reference.
2. Draft in a `.md` file before touching [src/app/page.tsx](../../../src/app/page.tsx). Get the words right in markdown, then port.
3. Run the review checklist on your own draft before showing it.
4. Propose 2 variants for any headline or CTA so Lionel can pick.

## Output format

For **reviews**, structure your response as:
- **Hard-rule violations** (em dashes, CTA mismatches, missing no-spam) — fix these or flag them
- **Voice/tone issues** — line-by-line suggestions with rewrites
- **Structural notes** — sections that should be cut, merged, or reordered
- End with a **one-line verdict**: ship / tighten / rewrite

For **drafts**, output the copy in markdown, then a short "what I chose and why" note underneath (2-4 bullets max).
