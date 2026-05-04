import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Admin · The Ultimate Pianist",
  robots: { index: false, follow: false },
};

const isAdminGated =
  process.env.NODE_ENV === "production" && process.env.ENABLE_ADMIN !== "true";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isAdminGated) {
    notFound();
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topBarTitle}>
          <Link href="/admin">The Ultimate Pianist · Admin</Link>
        </div>
        <div className={styles.topBarMeta}>
          {process.env.NODE_ENV === "production" ? "production" : "local dev"}
        </div>
      </header>
      <div className={styles.container}>{children}</div>
    </div>
  );
}
