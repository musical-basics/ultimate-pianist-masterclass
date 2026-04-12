"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

const STRIPE_LINK = "https://buy.stripe.com/4gM6oA9FBdAoeEu8ZVcMM03";

export default function Home() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Show "You're in!" overlay if Stripe redirected with ?reserved=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reserved") === "true") {
      overlayRef.current?.classList.add(styles.show);
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Scroll fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (e) => e.isIntersecting && e.target.classList.add(styles.visible)
        ),
      { threshold: 0.12 }
    );
    document
      .querySelectorAll(`.${styles.fadeIn}`)
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function handleWaitlist(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current!;
    const email = (
      form.querySelector("#email-input") as HTMLInputElement
    ).value.trim();
    if (!email || !email.includes("@")) return;
    const btn = form.querySelector("button")!;
    btn.textContent = "Adding you...";
    btn.setAttribute("disabled", "true");

    // TODO: wire to your DreamPlay email API
    await new Promise((r) => setTimeout(r, 1000));

    form.style.display = "none";
    const note = document.querySelector(
      `.${styles.formNote}`
    ) as HTMLElement;
    if (note) note.style.display = "none";
    successRef.current?.classList.add(styles.visible);
  }

  return (
    <>
      {/* ── RESERVED OVERLAY ── */}
      <div
        className={styles.reservedOverlay}
        id="reserved-overlay"
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.reservedEmoji}>🎹</div>
        <h1 className={styles.reservedTitle}>
          You&apos;re <em>in.</em>
        </h1>
        <p className={styles.reservedSub}>
          Your spot is locked. Check your email: the simplified Moonlight Sonata
          Nightmare sheet music is already on its way.
        </p>
        <div className={styles.reservedPerks}>
          <div className={styles.reservedPerk}>
            <span>✉️</span>
            <span>Sheet music PDF sent to your email</span>
          </div>
          <div className={styles.reservedPerk}>
            <span>💳</span>
            <span>Your $1 is doubled as a DreamPlay keyboard credit</span>
          </div>
          <div className={styles.reservedPerk}>
            <span>🔑</span>
            <span>First access when the masterclass opens</span>
          </div>
        </div>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-muted)",
            maxWidth: 400,
          }}
        >
          I&apos;ll be in touch soon. In the meantime, go sit at your piano. 🎵
        </p>
        <button
          className={styles.reservedClose}
          onClick={() =>
            overlayRef.current?.classList.remove(styles.show)
          }
        >
          Continue to site →
        </button>
      </div>

      {/* ── HERO ── */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.lionelByline}>LIONEL YU</p>
          <h1>
            The <em>Ultimate Pianist</em> Masterclass is coming.
          </h1>
          <p className={styles.heroSub}>
            Learn to play my most popular arrangements, broken down into Easy,
            Medium, and Full versions, taught by me, the person who wrote them.
          </p>
          <p className={styles.heroBody}>
            For years, thousands of you have bought my sheet music but never
            learned it because it&apos;s too hard. I&apos;m fixing that. The
            masterclass opens next week.
          </p>
          <div className={styles.heroCtas}>
            <a
              href={STRIPE_LINK}
              className={styles.btnPrimary}
              id="hero-vip-btn"
            >
              🎹 Join the VIP Waitlist for $1
            </a>
            <a
              href="#waitlist"
              className={styles.btnSecondary}
              id="hero-waitlist-btn"
            >
              Or join the free waitlist
            </a>
          </div>
          <p className={styles.heroNote}>
            Your $1 doubles as a credit toward the DreamPlay keyboard. No spam,
            ever.
          </p>
        </div>
        <div className={styles.scrollIndicator}>
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width={24}
            height={24}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── SOCIAL PROOF ── */}
      <section id="social-proof" className={styles.statsSection}>
        <div className={`${styles.statsInner} ${styles.fadeIn}`}>
          <div className={styles.statItem}>
            <p className={styles.statNumber}>10,000+</p>
            <p className={styles.statLabel}>Sheet music sold</p>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <p className={styles.statNumber}>1M+</p>
            <p className={styles.statLabel}>YouTube subscribers</p>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── ZERO TO EXPERT ── */}
      <section id="journey" className={styles.section}>
        <div className={styles.fadeIn}>
          <p className={styles.sectionLabel}>The Journey</p>
          <h2 className={styles.sectionTitle}>
            From complete beginner<br />to confident pianist.
          </h2>
          <p className={styles.sectionBody} style={{ marginBottom: 56 }}>
            Most piano teachers keep things slow on purpose. They break it into tiny pieces, charge you by the hour, and never show you the mental frameworks that actually make music click. I am going to show you everything, up front.
          </p>
          <div className={styles.journeySteps}>
            {[
              {
                step: "01",
                title: "Start from zero",
                desc: "100+ foundation lessons cover everything from how to sit at the piano to reading music and basic technique. No prior experience needed.",
              },
              {
                step: "02",
                title: "Learn how music actually works",
                desc: "I teach you chord theory, rhythm, and the way professional musicians think, not just how to copy dots on a page. You will start hearing music differently.",
              },
              {
                step: "03",
                title: "Play the pieces you love",
                desc: "Start with the Easy version of any piece. Build muscle memory. Then graduate to Medium, then the full arrangement. Real progress, at your pace.",
              },
              {
                step: "04",
                title: "Master the Nightmare arrangements",
                desc: "The same cinematic arrangements you have seen on YouTube, broken down bar by bar by the person who wrote them. No secrets held back.",
              },
            ].map((s) => (
              <div key={s.step} className={styles.journeyStep}>
                <div className={styles.stepNumber}>{s.step}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── COST COMPARISON ── */}
      <section id="value" className={styles.section}>
        <div className={`${styles.costSection} ${styles.fadeIn}`}>
          <div className={styles.costLeft}>
            <p className={styles.sectionLabel}>The Real Cost of "Waiting"</p>
            <h2 className={styles.sectionTitle}>
              Private lessons cost $200 a month.<br />This does not.
            </h2>
            <p className={styles.sectionBody}>
              The average piano student pays $150 to $200 per month for private lessons. That is $2,400 a year. Over 5 years, that is $12,000 spent on hourly sessions that may or may not get you where you want to go.<br/><br/>
              The Ultimate Pianist is a one-time investment. You get 5 years of access, every lesson, every arrangement, every level. No recurring fees, no scheduling, no waiting for your teacher to get to the good stuff.
            </p>
            <a href={STRIPE_LINK} className={styles.btnPrimary} id="cost-vip-btn" style={{ marginTop: 36, display: "inline-flex" }}>
              🎹 Join the VIP Waitlist for $1
            </a>
          </div>
          <div className={styles.costRight}>
            <div className={styles.costCard + " " + styles.costCardBad}>
              <p className={styles.costCardLabel}>Traditional Lessons</p>
              <p className={styles.costCardAmount}>$12,000</p>
              <p className={styles.costCardSub}>over 5 years, at $200/month</p>
              <ul className={styles.costList}>
                <li>Pay per hour, forever</li>
                <li>Progress at your teacher&apos;s pace</li>
                <li>Miss a week, lose the momentum</li>
                <li>Never own the material</li>
              </ul>
            </div>
            <div className={styles.costCard + " " + styles.costCardGood}>
              <p className={styles.costCardLabel}>The Ultimate Pianist</p>
              <p className={styles.costCardAmount}>$197</p>
              <p className={styles.costCardSub}>one time, 5 years of access</p>
              <ul className={styles.costList}>
                <li>Lifetime-style access, no clock running</li>
                <li>Learn at your own pace, any time</li>
                <li>Pick up exactly where you left off</li>
                <li>Yours to keep</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── WHAT'S INSIDE ── */}
      <section id="inside" className={styles.section}>
        <div className={`${styles.insideSection} ${styles.fadeIn}`}>
          <p className={styles.sectionLabel}>What&apos;s Inside</p>
          <h2 className={styles.sectionTitle}>
            Everything you need to actually play, not just own.
          </h2>
          <p className={styles.sectionBody}>
            Every piece in the masterclass is taught at multiple difficulty
            levels. You choose your starting point and level up at your own
            pace.
          </p>
        </div>
        <div className={`${styles.cardsGrid} ${styles.fadeIn}`}>
          {[
            {
              icon: "🎵",
              title: "Multi-Level Breakdowns",
              desc: "Every piece taught at Easy, Medium, and Full difficulty, so you always have a playable version and a challenge to grow into.",
            },
            {
              icon: "🎹",
              title: "Technique Deep Dives",
              desc: "I show you how I think about each section: fingering, dynamics, timing, the exact things that make a piece sound right.",
            },
            {
              icon: "📄",
              title: "Sheet Music Included",
              desc: "Every level comes with its own arrangement. Download it, print it, put it on your iPad and start with the version that fits you today.",
            },
            {
              icon: "🏛️",
              title: "100+ Foundation Lessons",
              desc: "Brand new to piano? There is a full fundamentals track inside. You are not dropped into the deep end.",
            },
          ].map((card) => (
            <div key={card.title} className={styles.card}>
              <span className={styles.cardIcon}>{card.icon}</span>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardDesc}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── PIECES ── */}
      <section id="pieces" className={styles.section}>
        <div className={styles.fadeIn}>
          <p className={styles.sectionLabel}>First Pieces Launching</p>
          <h2 className={styles.sectionTitle}>
            Start with the pieces
            <br />
            you already love.
          </h2>
          <div className={styles.piecesList}>
            {[
              {
                emoji: "🌙",
                name: "Moonlight Sonata Nightmare",
                levels: "Easy · Medium · Full Arrangement",
                badge: "Launching First",
              },
              {
                emoji: "🌸",
                name: "Fur Elise Nightmare",
                levels: "Easy · Medium · Full Arrangement",
                badge: "Coming Soon",
              },
              {
                emoji: "🎤",
                name: "Still D.R.E.",
                levels: "Easy · Medium · Full Arrangement",
                badge: "Coming Soon",
              },
              {
                emoji: "🎶",
                name: "More pieces added each month",
                levels: "VIP members vote on what gets added next",
                badge: null,
              },
            ].map((piece) => (
              <div key={piece.name} className={styles.pieceRow}>
                <span className={styles.pieceEmoji}>{piece.emoji}</span>
                <div className={styles.pieceInfo}>
                  <div className={styles.pieceName}>{piece.name}</div>
                  <div className={styles.pieceLevels}>{piece.levels}</div>
                </div>
                {piece.badge && (
                  <span className={styles.pieceBadge}>{piece.badge}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── VIP OFFER ── */}
      <section id="vip" className={styles.section}>
        <div className={`${styles.offerSection} ${styles.fadeIn}`}>
          <p className={styles.sectionLabel}>VIP Waitlist</p>
          <h2 className={styles.sectionTitle}>
            Join the VIP Waitlist
            <br />
            before it opens.
          </h2>
          <p className={styles.sectionBody}>
            The masterclass opens next week. VIP members get early access, a
            locked-in rate, and a credit-doubling bonus toward the DreamPlay
            keyboard.
          </p>
          <div className={styles.offerCard}>
            <div className={styles.offerPrice}>$1</div>
            <p className={styles.offerSub}>
              One-time reservation · Fully refundable · No subscription trap
            </p>
            <ul className={styles.offerPerks}>
              {[
                {
                  label: "DOUBLE",
                  text: "your keyboard credits: spend $197 on the masterclass, get $394 toward a DreamPlay keyboard",
                },
                {
                  label: "24-hour early access",
                  text: "before the public launch",
                },
                {
                  label: "Instant download:",
                  text: "simplified Easy arrangement of Moonlight Sonata Nightmare",
                },
                {
                  label: "Vote",
                  text: "on which pieces get added next",
                },
              ].map((perk) => (
                <li key={perk.label} className={styles.offerPerk}>
                  <span className={styles.perkCheck}>✓</span>
                  <span>
                    <strong>{perk.label}</strong> {perk.text}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={STRIPE_LINK}
              className={styles.btnPrimary}
              id="vip-reserve-btn"
              style={{ fontSize: "1rem", padding: "20px 48px" }}
            >
              🎹 Join the VIP Waitlist for $1
            </a>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── FREE WAITLIST ── */}
      <section
        id="waitlist"
        className={styles.section}
        style={{ paddingBottom: 120 }}
      >
        <div className={`${styles.emailSection} ${styles.fadeIn}`}>
          <p className={styles.sectionLabel}>Free Waitlist</p>
          <h2 className={styles.sectionTitle}>
            Not ready for $1?
            <br />
            Stay in the loop.
          </h2>
          <p className={styles.sectionBody} style={{ margin: "0 auto" }}>
            I&apos;ll let you know the moment the masterclass opens. No spam,
            just a single email when we go live.
          </p>
          <form
            className={styles.formGroup}
            id="waitlist-form"
            ref={formRef}
            onSubmit={handleWaitlist}
            noValidate
          >
            <input
              type="email"
              className={styles.formInput}
              id="email-input"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
            <button
              type="submit"
              className={styles.btnPrimary}
              id="waitlist-submit-btn"
              style={{ whiteSpace: "nowrap" }}
            >
              Notify Me
            </button>
          </form>
          <p className={styles.formNote}>
            No spam. Unsubscribe anytime. I respect your inbox.
          </p>
          <div className={styles.successMessage} ref={successRef}>
            <div className={styles.successIcon}>🎹</div>
            <div className={styles.successTitle}>You&apos;re on the list.</div>
            <p className={styles.successBody}>
              I&apos;ll reach out the moment the masterclass opens. In the
              meantime, go find a piano.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <p className={styles.footerSignoff}>More soon. Lionel</p>
        <p style={{ marginTop: 12 }}>
          © 2024 The Ultimate Pianist · Made with love for pianists who refuse
          to give up 🎹
        </p>
      </footer>
    </>
  );
}
