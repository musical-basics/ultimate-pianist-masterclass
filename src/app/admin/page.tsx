import Link from "next/link";
import { getCourses } from "@/lib/lessons";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const courses = await getCourses();
  const totalLessons = courses.reduce(
    (sum, course) =>
      sum + course.sections.reduce((s, section) => s + section.lessons.length, 0),
    0,
  );

  return (
    <>
      <h1 className={styles.pageTitle}>Courses</h1>
      <p className={styles.pageSubtitle}>
        {courses.length} course{courses.length === 1 ? "" : "s"} · {totalLessons}{" "}
        lesson{totalLessons === 1 ? "" : "s"} total
      </p>

      {courses.length === 0 ? (
        <div className={styles.empty}>
          No courses found. Add a folder under <code>content/courses/</code>.
        </div>
      ) : (
        <ul className={styles.list}>
          {courses.map((course) => {
            const lessonCount = course.sections.reduce(
              (s, section) => s + section.lessons.length,
              0,
            );
            return (
              <li key={course.slug} className={styles.listItem}>
                <Link href={`/admin/${course.slug}`}>
                  <p className={styles.itemTitle}>{course.title}</p>
                  <div className={styles.itemMeta}>
                    <span>{course.sections.length} sections</span>
                    <span>{lessonCount} lessons</span>
                    <span>slug: {course.slug}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
