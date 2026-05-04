import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/lib/lessons";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: courseSlug } = await params;
  const course = await getCourse(courseSlug);
  if (!course) notFound();

  return (
    <>
      <nav className={styles.breadcrumbs}>
        <span>
          <Link href="/admin">Courses</Link>
        </span>
        <span>{course.title}</span>
      </nav>

      <h1 className={styles.pageTitle}>{course.title}</h1>
      <p className={styles.pageSubtitle}>
        {course.sections.length} sections ·{" "}
        {course.sections.reduce((s, section) => s + section.lessons.length, 0)}{" "}
        lessons
      </p>

      {course.sections.length === 0 ? (
        <div className={styles.empty}>No sections yet.</div>
      ) : (
        course.sections.map((section) => (
          <section key={section.slug}>
            <h2 className={styles.sectionHeader}>{section.title}</h2>
            {section.lessons.length === 0 ? (
              <div className={styles.empty}>No lessons in this section.</div>
            ) : (
              <ul className={styles.list}>
                {section.lessons.map((lesson) => (
                  <li key={lesson.slug} className={styles.listItem}>
                    <Link
                      href={`/admin/${course.slug}/${section.slug}/${lesson.slug}`}
                    >
                      <p className={styles.itemTitle}>{lesson.title}</p>
                      <div className={styles.itemMeta}>
                        {lesson.draft && (
                          <span className={`${styles.badge} ${styles.badgeDraft}`}>
                            draft
                          </span>
                        )}
                        {lesson.publicPreview && (
                          <span
                            className={`${styles.badge} ${styles.badgePreview}`}
                          >
                            public preview
                          </span>
                        )}
                        {lesson.durationMinutes !== null && (
                          <span>{lesson.durationMinutes} min</span>
                        )}
                        <span>slug: {lesson.slug}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </>
  );
}
