import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content", "courses");

export type LessonFrontmatter = {
  title?: string;
  public_preview?: boolean;
  draft?: boolean;
  duration_minutes?: number;
};

export type Lesson = {
  slug: string;
  course: string;
  section: string;
  title: string;
  publicPreview: boolean;
  draft: boolean;
  durationMinutes: number | null;
  rawContent: string;
  filePath: string;
};

export type Section = {
  slug: string;
  course: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  slug: string;
  title: string;
  sections: Section[];
};

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function deriveTitleFromSlug(slug: string): string {
  return slug
    .replace(/^\d+[-_]/, "")
    .split("-")
    .map((word) => (word.length === 0 ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

async function listSubdirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

async function loadLesson(
  courseSlug: string,
  sectionSlug: string,
  lessonSlug: string,
): Promise<Lesson | null> {
  const filePath = path.join(
    CONTENT_ROOT,
    courseSlug,
    sectionSlug,
    lessonSlug,
    "index.mdx",
  );
  const raw = await fs.readFile(filePath, "utf8").catch(() => null);
  if (raw === null) return null;

  const { data, content } = matter(raw);
  const fm = data as LessonFrontmatter;

  return {
    slug: lessonSlug,
    course: courseSlug,
    section: sectionSlug,
    title: fm.title ?? deriveTitleFromSlug(lessonSlug),
    publicPreview: fm.public_preview ?? false,
    draft: fm.draft ?? false,
    durationMinutes: fm.duration_minutes ?? null,
    rawContent: content,
    filePath,
  };
}

async function loadSection(
  courseSlug: string,
  sectionSlug: string,
): Promise<Section | null> {
  const sectionDir = path.join(CONTENT_ROOT, courseSlug, sectionSlug);
  const stat = await fs.stat(sectionDir).catch(() => null);
  if (!stat?.isDirectory()) return null;

  const meta = await readJson<{ title: string }>(
    path.join(sectionDir, "_section.json"),
  );
  const title = meta?.title ?? deriveTitleFromSlug(sectionSlug);

  const lessonSlugs = await listSubdirectories(sectionDir);
  const lessons = await Promise.all(
    lessonSlugs.map((slug) => loadLesson(courseSlug, sectionSlug, slug)),
  );

  return {
    slug: sectionSlug,
    course: courseSlug,
    title,
    lessons: lessons.filter((l): l is Lesson => l !== null),
  };
}

export async function getCourse(courseSlug: string): Promise<Course | null> {
  const courseDir = path.join(CONTENT_ROOT, courseSlug);
  const stat = await fs.stat(courseDir).catch(() => null);
  if (!stat?.isDirectory()) return null;

  const meta = await readJson<{ title: string }>(
    path.join(courseDir, "_course.json"),
  );
  const title = meta?.title ?? deriveTitleFromSlug(courseSlug);

  const sectionSlugs = await listSubdirectories(courseDir);
  const sections = await Promise.all(
    sectionSlugs.map((slug) => loadSection(courseSlug, slug)),
  );

  return {
    slug: courseSlug,
    title,
    sections: sections.filter((s): s is Section => s !== null),
  };
}

export async function getCourses(): Promise<Course[]> {
  const courseSlugs = await listSubdirectories(CONTENT_ROOT);
  const courses = await Promise.all(courseSlugs.map((slug) => getCourse(slug)));
  return courses.filter((c): c is Course => c !== null);
}

export async function getLesson(
  courseSlug: string,
  sectionSlug: string,
  lessonSlug: string,
): Promise<Lesson | null> {
  return loadLesson(courseSlug, sectionSlug, lessonSlug);
}
