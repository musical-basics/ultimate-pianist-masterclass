import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { lessonComponents } from "@/components/lessons";
import { getCourse, getLesson } from "@/lib/lessons";
import styles from "../../../admin.module.css";

export const dynamic = "force-dynamic";

function rewriteLessonAssetPaths(
  source: string,
  course: string,
  section: string,
  lesson: string,
): string {
  const prefix = `/api/lesson-asset/${encodeURIComponent(course)}/${encodeURIComponent(section)}/${encodeURIComponent(lesson)}`;
  return source
    .replace(/\]\(\.\/assets\/([^)\s]+)\)/g, (_, file) => `](${prefix}/${file})`)
    .replace(
      /(src|href)=(["'])\.\/assets\/([^"']+)\2/g,
      (_, attr, q, file) => `${attr}=${q}${prefix}/${file}${q}`,
    );
}

export default async function LessonPreview({
  params,
}: {
  params: Promise<{ course: string; section: string; lesson: string }>;
}) {
  const { course: courseSlug, section: sectionSlug, lesson: lessonSlug } =
    await params;

  const [course, lesson] = await Promise.all([
    getCourse(courseSlug),
    getLesson(courseSlug, sectionSlug, lessonSlug),
  ]);
  if (!course || !lesson) notFound();

  const section = course.sections.find((s) => s.slug === sectionSlug);

  const rewrittenSource = rewriteLessonAssetPaths(
    lesson.rawContent,
    courseSlug,
    sectionSlug,
    lessonSlug,
  );

  let mdxBody: React.ReactNode;
  let compileError: string | null = null;
  try {
    const compiled = await compileMDX({
      source: rewrittenSource,
      components: lessonComponents,
      options: { parseFrontmatter: false },
    });
    mdxBody = compiled.content;
  } catch (err) {
    compileError = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <nav className={styles.breadcrumbs}>
        <span>
          <Link href="/admin">Courses</Link>
        </span>
        <span>
          <Link href={`/admin/${course.slug}`}>{course.title}</Link>
        </span>
        {section && <span>{section.title}</span>}
        <span>{lesson.title}</span>
      </nav>

      <article className={styles.lessonArticle}>
        <header className={styles.lessonHeader}>
          <h1>{lesson.title}</h1>
          <div className={styles.lessonMeta}>
            {lesson.draft && (
              <span className={`${styles.badge} ${styles.badgeDraft}`}>draft</span>
            )}
            {lesson.publicPreview && (
              <span className={`${styles.badge} ${styles.badgePreview}`}>
                public preview
              </span>
            )}
            {lesson.durationMinutes !== null && (
              <span>{lesson.durationMinutes} min</span>
            )}
            <span>{lesson.filePath.split("/content/")[1]}</span>
          </div>
        </header>

        {compileError ? (
          <pre className={styles.compileError}>
            MDX compile error:{"\n"}
            {compileError}
          </pre>
        ) : (
          mdxBody
        )}
      </article>
    </>
  );
}
