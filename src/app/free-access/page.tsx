import type { Metadata } from "next";
import Link from "next/link";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Check Your Email | The Ultimate Pianist",
  description:
    "Your free Ultimate Pianist access link is on its way. Watch the intro lesson while you wait.",
};

export default function FreeAccessConfirmation() {
  return (
    <main className={styles.confirmationPage}>
      <section className={styles.confirmationHero}>
        <p className={styles.sectionLabel}>Free Access</p>
        <h1 className={styles.confirmationTitle}>
          Check your email for your access link.
        </h1>
        <p className={styles.confirmationBody}>
          I just sent the next step to your inbox. While you wait, watch the
          intro video here so the first lesson already has a little context.
        </p>
        <div className={`${styles.videoPlaceholder} ${styles.confirmationVideo}`}>
          <div className={styles.playMark} />
          <p>Intro video placeholder</p>
          <span>Embed the welcome or first lesson video here when it is ready.</span>
        </div>
        <Link href="/" className={styles.quietLink}>
          Back to the course overview
        </Link>
      </section>
    </main>
  );
}
