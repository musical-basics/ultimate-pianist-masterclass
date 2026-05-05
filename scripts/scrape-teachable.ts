import { promises as fs } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { BrowserContext, Page } from "playwright";
import { portTeachableLesson } from "../src/lib/port-teachable";

chromium.use(StealthPlugin());

const REPO_ROOT = process.cwd();
const PROFILE_DIR = path.join(REPO_ROOT, ".teachable-profile");
const CACHE_DIR = path.join(REPO_ROOT, ".teachable-cache");
const CONTENT_ROOT = path.join(REPO_ROOT, "content", "courses");
const SCHOOL = "musicalbasics-academy";
const ACADEMY_HOST = `${SCHOOL}.teachable.com`;
const BASE_URL = `https://${ACADEMY_HOST}`;

function isAuthedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname !== ACADEMY_HOST) return false;
    const p = u.pathname;
    if (p.includes("/sign_in") || p.includes("/identity/login")) return false;
    return p.startsWith("/admin-app") || p.startsWith("/admin");
  } catch {
    return false;
  }
}

async function waitForCloudflare(page: Page, maxMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const title = await page.title().catch(() => "");
    if (!title.toLowerCase().includes("just a moment")) return;
    await page.waitForTimeout(1500);
  }
}

type Lesson = {
  id: string;
  title: string;
  slug: string;
};

type Section = {
  title: string;
  slug: string;
  lessons: Lesson[];
};

type Curriculum = {
  courseId: string;
  courseTitle: string;
  scrapedAt: string;
  sections: Section[];
};

async function openContext(headless: boolean): Promise<BrowserContext> {
  await fs.mkdir(PROFILE_DIR, { recursive: true });
  return chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1280, height: 900 },
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
}

async function getOrOpenPage(context: BrowserContext): Promise<Page> {
  const pages = context.pages();
  return pages.length > 0 ? pages[0] : await context.newPage();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function paddedIndex(i: number): string {
  return i.toString().padStart(2, "0");
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/ /g, "_")
    .replace(/[\s+]+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto(`${BASE_URL}/admin-app/courses`, { waitUntil: "domcontentloaded" });
  await waitForCloudflare(page);
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  return isAuthedUrl(page.url());
}

async function cmdLogin(_args: string[]) {
  console.log("Opening a browser. Log in fully, including 2FA if prompted.");
  console.log("");
  console.log("Steps:");
  console.log("  1. Enter your email + password");
  console.log("  2. Complete the OTP / 2FA step if Teachable asks");
  console.log("  3. Wait until you reach the admin dashboard");
  console.log("");
  console.log(
    "The browser will close itself once you're on the academy admin app.",
  );
  console.log("If anything goes wrong, close the browser and re-run this command.");
  console.log("");

  const context = await openContext(false);
  const page = await getOrOpenPage(context);
  await page.goto(`${BASE_URL}/admin/sign_in`, { waitUntil: "domcontentloaded" });

  const start = Date.now();
  const TIMEOUT_MS = 5 * 60 * 1000;
  let lastUrl = "";
  let detected = false;
  while (Date.now() - start < TIMEOUT_MS) {
    const url = page.url();
    if (url !== lastUrl) {
      console.log(`  -> ${url}`);
      lastUrl = url;
    }
    if (isAuthedUrl(url)) {
      detected = true;
      break;
    }
    await page.waitForTimeout(1000);
  }

  if (detected) {
    console.log("");
    console.log("Login detected. Letting cookies settle for 3s.");
    await page.waitForTimeout(3000);
  } else {
    console.log("Login not detected within 5 minutes; closing anyway.");
  }
  await context.close();
  console.log(`Profile: ${PROFILE_DIR}`);
  if (detected) {
    console.log("");
    console.log("Run: pnpm scrape curriculum --course-id 2767887");
  } else {
    console.log("");
    console.log("Login appears incomplete. Run: pnpm scrape login   (try again)");
    process.exit(1);
  }
}

async function cmdCurriculum(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      "course-id": { type: "string" },
      headless: { type: "boolean", default: false },
    },
  });
  const courseId = values["course-id"];
  if (!courseId) {
    console.error("Missing --course-id");
    process.exit(1);
  }

  const context = await openContext(values.headless ?? false);
  const page = await getOrOpenPage(context);

  if (!(await isLoggedIn(page))) {
    console.error("Not logged in. Run 'pnpm scrape login' first.");
    await context.close();
    process.exit(1);
  }

  const curriculumUrl = `${BASE_URL}/admin-app/courses/${courseId}/curriculum`;
  console.log(`Loading ${curriculumUrl}`);
  await page.goto(curriculumUrl, { waitUntil: "domcontentloaded" });
  await waitForCloudflare(page);

  await page.waitForSelector('a[href*="/curriculum/lessons/"]', { timeout: 30000 });
  await page.waitForTimeout(1500);

  let courseTitle = await page
    .locator("h1, h2")
    .filter({ hasText: /.+/ })
    .first()
    .textContent()
    .then((t) => t?.trim() ?? "");

  if (!courseTitle || courseTitle.toLowerCase() === "curriculum") {
    const pageTitle = await page.title();
    const parts = pageTitle.split("|").map((s) => s.trim()).filter(Boolean);
    const candidate = parts.find(
      (p) => p.toLowerCase() !== "curriculum" && p.toLowerCase() !== "teachable",
    );
    if (candidate) courseTitle = candidate;
  }

  const sections = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll("*"));
    const headingPositions: { el: Element; text: string; index: number }[] = [];
    const lessonPositions: { id: string; title: string; index: number }[] = [];

    allElements.forEach((el, index) => {
      const tag = el.tagName.toUpperCase();
      if (tag === "H1" || tag === "H2" || tag === "H3") {
        const text = (el.textContent || "").trim();
        if (text.length > 0 && text.length < 200) {
          headingPositions.push({ el, text, index });
        }
      } else if (tag === "A") {
        const a = el as HTMLAnchorElement;
        const m = a.href.match(/\/curriculum\/lessons\/(\d+)/);
        if (m) {
          const title = (a.textContent || "").trim();
          if (title.length > 0) {
            lessonPositions.push({ id: m[1], title, index });
          }
        }
      }
    });

    const seen = new Set<string>();
    const order: string[] = [];
    const grouped = new Map<string, { id: string; title: string }[]>();

    for (const lesson of lessonPositions) {
      if (seen.has(lesson.id)) continue;
      seen.add(lesson.id);

      let sectionTitle = "Uncategorized";
      for (let i = headingPositions.length - 1; i >= 0; i--) {
        if (headingPositions[i].index < lesson.index) {
          sectionTitle = headingPositions[i].text;
          break;
        }
      }

      if (!grouped.has(sectionTitle)) {
        grouped.set(sectionTitle, []);
        order.push(sectionTitle);
      }
      grouped.get(sectionTitle)!.push({ id: lesson.id, title: lesson.title });
    }

    return order.map((title) => ({
      title,
      lessons: grouped.get(title) || [],
    }));
  });

  const enriched: Curriculum = {
    courseId,
    courseTitle,
    scrapedAt: new Date().toISOString(),
    sections: sections.map((s, sectionIdx) => ({
      title: s.title,
      slug: `${paddedIndex(sectionIdx)}-${slugify(s.title)}`,
      lessons: s.lessons.map((l, lessonIdx) => ({
        id: l.id,
        title: l.title,
        slug: `${paddedIndex(lessonIdx + 1)}-${slugify(l.title)}`,
      })),
    })),
  };

  const outDir = path.join(CACHE_DIR, courseId);
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "curriculum.json");
  await fs.writeFile(outPath, JSON.stringify(enriched, null, 2), "utf8");

  console.log("");
  console.log(`Course: ${enriched.courseTitle || "(no title found)"}`);
  console.log(`Sections: ${enriched.sections.length}`);
  for (const section of enriched.sections) {
    console.log(`  ${section.slug} (${section.lessons.length} lessons)`);
    for (const lesson of section.lessons) {
      console.log(`    ${lesson.slug}  [${lesson.id}]`);
    }
  }
  console.log("");
  console.log(`Wrote ${outPath}`);

  await context.close();
}

async function scrapeLessonHtml(
  context: BrowserContext,
  courseId: string,
  lessonId: string,
): Promise<{ html: string; localizedHtmlPath: string; localizedDir: string; assetCount: number }> {
  const page = await getOrOpenPage(context);
  const lessonUrl = `${BASE_URL}/admin-app/courses/${courseId}/curriculum/lessons/${lessonId}`;

  console.log(`  Loading ${lessonUrl}`);
  await page.goto(lessonUrl, { waitUntil: "domcontentloaded" });
  await waitForCloudflare(page);
  await page
    .waitForSelector(
      'div[class*="_lectureEditorContainer"], [data-testid="attachment-content"]',
      { timeout: 30000 },
    )
    .catch(() => {
      console.warn(
        `  ! Lecture editor container not found within 30s — page may still load`,
      );
    });
  await page.waitForTimeout(1500);

  const html = await page.content();

  const lessonDir = path.join(CACHE_DIR, courseId, lessonId);
  const assetsDir = path.join(lessonDir, "assets");
  await fs.mkdir(assetsDir, { recursive: true });

  const imageUrls = await page.$$eval(
    'img[src^="https://uploads.teachablecdn.com"]',
    (imgs) => imgs.map((i) => (i as HTMLImageElement).src),
  );

  let assetCount = 0;
  const urlToLocal = new Map<string, string>();

  for (const url of imageUrls) {
    const u = new URL(url);
    const original = decodeURIComponent(path.basename(u.pathname));
    const localFilename = sanitizeFilename(original);
    if (urlToLocal.has(url)) continue;

    try {
      const response = await context.request.get(url);
      if (!response.ok()) {
        console.warn(`  ! Failed to fetch ${url}: HTTP ${response.status()}`);
        continue;
      }
      const buffer = await response.body();
      await fs.writeFile(path.join(assetsDir, localFilename), buffer);
      urlToLocal.set(url, `./assets/${localFilename}`);
      assetCount += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`  ! Failed to download ${url}: ${message}`);
    }
  }

  let localizedHtml = html;
  for (const [url, local] of urlToLocal) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    localizedHtml = localizedHtml.replace(new RegExp(escaped, "g"), local);
  }

  const htmlPath = path.join(lessonDir, "lesson.html");
  await fs.writeFile(htmlPath, localizedHtml, "utf8");

  return { html: localizedHtml, localizedHtmlPath: htmlPath, localizedDir: lessonDir, assetCount };
}

async function cmdLesson(args: string[]) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      "course-id": { type: "string" },
      headless: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });
  const lessonId = positionals[0];
  const courseId = values["course-id"];
  if (!lessonId || !courseId) {
    console.error("Usage: pnpm scrape lesson <lesson-id> --course-id <course-id>");
    process.exit(1);
  }

  const context = await openContext(values.headless ?? false);
  const page = await getOrOpenPage(context);
  if (!(await isLoggedIn(page))) {
    console.error("Not logged in. Run 'pnpm scrape login' first.");
    await context.close();
    process.exit(1);
  }

  const result = await scrapeLessonHtml(context, courseId, lessonId);
  console.log("");
  console.log(`Wrote ${result.localizedHtmlPath}`);
  console.log(`  Assets: ${result.assetCount}`);

  await context.close();
}

async function cmdAll(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      "course-id": { type: "string" },
      course: { type: "string" },
      headless: { type: "boolean", default: false },
      delay: { type: "string", default: "6000" },
      force: { type: "boolean", default: false },
    },
  });
  const courseId = values["course-id"];
  const courseSlug = values.course;
  if (!courseId || !courseSlug) {
    console.error(
      "Usage: pnpm scrape all --course-id <id> --course <content-slug>",
    );
    process.exit(1);
  }
  const baseDelayMs = parseInt(values.delay ?? "6000", 10);

  const curriculumPath = path.join(CACHE_DIR, courseId, "curriculum.json");
  const curriculumRaw = await fs.readFile(curriculumPath, "utf8").catch(() => null);
  if (!curriculumRaw) {
    console.error(
      `No curriculum at ${curriculumPath}. Run 'pnpm scrape curriculum --course-id ${courseId}' first.`,
    );
    process.exit(1);
  }
  const curriculum = JSON.parse(curriculumRaw) as Curriculum;

  const context = await openContext(values.headless ?? false);
  const page = await getOrOpenPage(context);
  if (!(await isLoggedIn(page))) {
    console.error("Not logged in. Run 'pnpm scrape login' first.");
    await context.close();
    process.exit(1);
  }

  const courseRoot = path.join(CONTENT_ROOT, courseSlug);
  await fs.mkdir(courseRoot, { recursive: true });
  await fs.writeFile(
    path.join(courseRoot, "_course.json"),
    JSON.stringify({ title: curriculum.courseTitle || courseSlug }, null, 2) + "\n",
    "utf8",
  );

  let scraped = 0;
  let ported = 0;
  let skipped = 0;
  for (const section of curriculum.sections) {
    const sectionDir = path.join(courseRoot, section.slug);
    await fs.mkdir(sectionDir, { recursive: true });
    await fs.writeFile(
      path.join(sectionDir, "_section.json"),
      JSON.stringify({ title: section.title }, null, 2) + "\n",
      "utf8",
    );

    for (const lesson of section.lessons) {
      const lessonDir = path.join(sectionDir, lesson.slug);
      const indexPath = path.join(lessonDir, "index.mdx");

      const existing = await fs
        .stat(indexPath)
        .then(() => true)
        .catch(() => false);
      if (existing && !values.force) {
        console.log("");
        console.log(`Skipping ${section.slug}/${lesson.slug} (already ported; --force to redo)`);
        skipped += 1;
        continue;
      }

      console.log("");
      console.log(`Scraping ${section.slug}/${lesson.slug} [${lesson.id}]`);

      const scrapeResult = await scrapeLessonHtml(context, courseId, lesson.id);
      scraped += 1;

      await fs.mkdir(lessonDir, { recursive: true });
      const lessonAssetsDir = path.join(lessonDir, "assets");
      await fs.mkdir(lessonAssetsDir, { recursive: true });

      const portResult = portTeachableLesson({
        html: scrapeResult.html,
        htmlPath: scrapeResult.localizedHtmlPath,
      });

      let assetsCopied = 0;
      for (const asset of portResult.assets) {
        let copied = false;
        for (const candidate of asset.sourceCandidates) {
          try {
            await fs.copyFile(
              candidate,
              path.join(lessonAssetsDir, asset.destFilename),
            );
            copied = true;
            assetsCopied += 1;
            break;
          } catch {
            // try next candidate
          }
        }
        if (!copied) {
          portResult.warnings.push(
            `Could not locate asset "${asset.destFilename}" in scrape cache`,
          );
        }
      }

      await fs.writeFile(path.join(lessonDir, "index.mdx"), portResult.mdx, "utf8");
      ported += 1;

      console.log(
        `  -> ${path.relative(REPO_ROOT, lessonDir)}/index.mdx ` +
          `(videos=${portResult.videos.length}, pdfs=${portResult.resources.length}, ` +
          `images=${assetsCopied}/${portResult.assets.length})`,
      );
      if (portResult.warnings.length > 0) {
        for (const w of portResult.warnings) console.log(`     ! ${w}`);
      }

      const offset = Math.floor((Math.random() - 0.5) * 2000);
      const sleep = Math.max(0, baseDelayMs + offset);
      console.log(`  (sleeping ${sleep}ms before next lesson)`);
      await page.waitForTimeout(sleep);
    }
  }

  console.log("");
  console.log(
    `Done. Scraped ${scraped} new, ported ${ported} to MDX, skipped ${skipped} already-ported.`,
  );
  console.log(`Output: ${path.relative(REPO_ROOT, courseRoot)}`);
  console.log("Next: re-upload videos to Mux, upload PDFs, swap TODO_UPLOAD placeholders.");

  await context.close();
}

function printHelp() {
  console.log(
    [
      "Usage: pnpm scrape <command> [options]",
      "",
      "Commands:",
      "  login                                       Open browser; log in to Teachable manually",
      "  curriculum --course-id <id>                 Fetch curriculum tree -> .teachable-cache/<id>/curriculum.json",
      "  lesson <lesson-id> --course-id <id>         Fetch one lesson -> .teachable-cache/<id>/<lesson-id>/",
      "  all --course-id <id> --course <slug>        Scrape every lesson and port to content/courses/<slug>/",
      "",
      "Common flags:",
      "  --headless           Run without a visible browser window (login won't work headless;",
      "                       Cloudflare also blocks the academy admin paths in headless)",
      "  --delay <ms>         (all) Base delay between lessons; actual sleep is base ±1000ms.",
      "                       Default 6000ms (so 5-7s per lesson).",
      "  --force              (all) Re-scrape lessons even if their index.mdx already exists.",
      "                       Default: skip already-ported lessons (so the run resumes safely).",
    ].join("\n"),
  );
}

async function main() {
  const [, , subcommand, ...rest] = process.argv;
  switch (subcommand) {
    case "login":
      await cmdLogin(rest);
      break;
    case "curriculum":
      await cmdCurriculum(rest);
      break;
    case "lesson":
      await cmdLesson(rest);
      break;
    case "all":
      await cmdAll(rest);
      break;
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      break;
    default:
      console.error(`Unknown command: ${subcommand}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
