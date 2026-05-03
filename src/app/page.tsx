"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

const freeLevels = [
  {
    level: "Level 1",
    title: "Sit, listen, and find the keys",
    description:
      "Start from zero with posture, hand shape, keyboard geography, and the first patterns that make the piano feel less mysterious.",
  },
  {
    level: "Level 2",
    title: "Rhythm you can actually feel",
    description:
      "Learn pulse, counting, simple note values, and how to stay steady without turning practice into math homework.",
  },
  {
    level: "Level 3",
    title: "Read your first real music",
    description:
      "Build the treble and bass clef foundation so notes on the page start connecting to sounds under your hands.",
  },
  {
    level: "Level 4",
    title: "Use both hands together",
    description:
      "Coordinate left and right hand parts with simple exercises that develop control instead of tension.",
  },
  {
    level: "Level 5",
    title: "Chords and harmony",
    description:
      "Understand major, minor, and basic chord shapes so you can hear what is happening instead of just copying notes.",
  },
  {
    level: "Level 6",
    title: "Scales without boredom",
    description:
      "Use scales as a way to train fingering, movement, and sound, not as a punishment before the music starts.",
  },
  {
    level: "Level 7",
    title: "Phrasing and musical shape",
    description:
      "Learn how to make a melody breathe with dynamics, touch, and timing so even simple music sounds alive.",
  },
  {
    level: "Level 8",
    title: "Practice that sticks",
    description:
      "Break hard passages into small wins, fix mistakes cleanly, and build a repeatable practice system.",
  },
  {
    level: "Level 9",
    title: "Your first performance pieces",
    description:
      "Put the foundations together in short pieces that teach reading, rhythm, coordination, and expression at once.",
  },
  {
    level: "Level 10",
    title: "Ready for the next tier",
    description:
      "Finish with the skills you need to step into harder repertoire, including Lionel's cinematic Nightmare arrangements later on.",
  },
];

const stats = [
  { value: "10,000+", label: "Sheet music sold" },
  { value: "1M+", label: "YouTube subscribers" },
  { value: "50", label: "Free foundation lessons" },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        }),
      { threshold: 0.12 }
    );

    document
      .querySelectorAll(`.${styles.fadeIn}`)
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const metadata = Object.fromEntries(
      new URLSearchParams(window.location.search).entries()
    );

    try {
      const response = await fetch("/api/free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          metadata: {
            ...metadata,
            sourcePath: window.location.pathname,
          },
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { redirectTo?: string; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Please try again in a moment.");
      }

      window.location.assign(result?.redirectTo || "/free-access");
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "Please try again in a moment."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <section className={styles.hero} id="hero">
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.lionelByline}>The Ultimate Pianist</p>
          <h1>
            The first <em>50 lessons</em> are on me.
          </h1>
          <p className={styles.heroSub}>
            Start becoming an ultimate pianist with ten levels of real
            foundation work, taught by Lionel Yu.
          </p>
          <form className={styles.signupForm} onSubmit={handleSignup}>
            <label className={styles.srOnly} htmlFor="hero-email">
              Email address
            </label>
            <div className={styles.signupRow}>
              <input
                id="hero-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                aria-describedby="hero-form-note hero-form-error"
                className={styles.emailInput}
              />
              <button
                className={styles.btnPrimary}
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Get free access"}
              </button>
            </div>
            {error && (
              <p
                className={styles.formError}
                id="hero-form-error"
                role="alert"
              >
                {error}
              </p>
            )}
            <p className={styles.formNote} id="hero-form-note">
              No spam. Unsubscribe anytime. I respect your inbox.
            </p>
          </form>
        </div>
      </section>

      <div className={styles.divider} />

      <section id="inside" className={styles.section}>
        <div className={`${styles.sectionIntro} ${styles.fadeIn}`}>
          <p className={styles.sectionLabel}>What You Get Free</p>
          <h2 className={styles.sectionTitle}>
            The first 10 levels of the curriculum.
          </h2>
          <p className={styles.sectionBody}>
            The full foundation tier. Ten levels that take you from the first
            time at the piano to a place where harder music finally lands.
          </p>
        </div>
        <div className={`${styles.levelsGrid} ${styles.fadeIn}`}>
          {freeLevels.map((item) => (
            <article className={styles.levelCard} key={item.level}>
              <p className={styles.levelNumber}>{item.level}</p>
              <h3 className={styles.levelTitle}>{item.title}</h3>
              <p className={styles.levelDescription}>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      <section id="sample" className={styles.section}>
        <div className={`${styles.sampleSection} ${styles.fadeIn}`}>
          <div>
            <p className={styles.sectionLabel}>Sample Lesson</p>
            <h2 className={styles.sectionTitle}>
              See the teaching style before you sign up.
            </h2>
            <p className={styles.sectionBody}>
              The best way to know if a course will work for you is to watch a
              lesson. Drop the intro or first free lesson here as soon as the
              video is ready.
            </p>
          </div>
          <div
            className={styles.videoPlaceholder}
            role="img"
            aria-label="Sample lesson video placeholder"
          >
            <div className={styles.playMark} />
            <p>Sample lesson video placeholder</p>
            <span>Embed the intro lesson here when it is ready.</span>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      <section id="why" className={styles.section}>
        <div className={`${styles.aboutSection} ${styles.fadeIn}`}>
          <div className={styles.aboutImage}>
            <Image
              src="/lionel-concert-hall.jpg"
              alt="Lionel Yu performing in a concert hall"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
          <div className={styles.aboutContent}>
            <p className={styles.sectionLabel}>The Foundation</p>
            <h2 className={styles.sectionTitle}>
              Where most people get stuck.
            </h2>
            <p className={styles.sectionBody}>
              If you have ever bought sheet music and felt lost at the piano,
              this is the layer you were missing.
            </p>
            <p className={styles.sectionBody}>
              The pieces are the vehicle. The destination is becoming a
              stronger pianist.
            </p>
            <p className={styles.aboutSignoff}>Lionel Yu</p>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      <section id="social-proof" className={styles.statsSection}>
        <div className={`${styles.statsInner} ${styles.fadeIn}`}>
          {stats.map((stat) => (
            <div className={styles.statItem} key={stat.label}>
              <p className={styles.statNumber}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      <section id="testimonials" className={styles.section}>
        <div className={`${styles.testimonialSection} ${styles.fadeIn}`}>
          <p className={styles.sectionLabel}>Student Notes</p>
          <h2 className={styles.sectionTitle}>
            Add student proof here when it is ready.
          </h2>
          <p className={styles.sectionBody}>
            This space is reserved for a few short student quotes, screenshots,
            or YouTube comments once the free tier has its first real feedback.
          </p>
        </div>
      </section>

      <div className={styles.divider} />

      <section id="next" className={styles.section}>
        <div className={`${styles.nextSection} ${styles.fadeIn}`}>
          <p className={styles.sectionLabel}>What Comes After</p>
          <h2 className={styles.sectionTitle}>
            After the foundation, the path keeps going.
          </h2>
          <p className={styles.sectionBody}>
            When you finish the foundation, the advanced masterclass picks up:
            Nightmare arrangements, deeper technique, harder repertoire.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>The Ultimate Pianist</p>
          <nav className={styles.footerLinks} aria-label="Footer links">
            <a
              href="https://www.youtube.com/@MusicalBasics"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube
            </a>
            <a href="mailto:musicalbasics@gmail.com">Email Lionel</a>
            <a
              href="https://dreamplaypianos.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              We also make pianos
            </a>
          </nav>
          <p className={styles.footerFine}>
            &copy; 2026 The Ultimate Pianist. Built for pianists who refuse to
            give up.
          </p>
        </div>
      </footer>
    </main>
  );
}
