import path from "node:path";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import TurndownService from "turndown";

type AnyCheerio = cheerio.Cheerio<AnyNode>;

export type PortInput = {
  html: string;
  htmlPath: string;
};

export type PortedAsset = {
  sourceCandidates: string[];
  destFilename: string;
};

export type PortedVideo = {
  playbackId: string;
  provider: "hotmart";
  originalFilename: string | null;
};

export type PortedResource = {
  filename: string;
  slug: string;
};

export type PortResult = {
  title: string;
  mdx: string;
  assets: PortedAsset[];
  videos: PortedVideo[];
  resources: PortedResource[];
  warnings: string[];
};

const VIDEO_SENTINEL = (i: number) => `XPORTVIDEOXX${i}XXEND`;
const RESOURCE_SENTINEL = (i: number) => `XPORTRESOURCEXX${i}XXEND`;
const VIDEO_SENTINEL_RE = /XPORTVIDEOXX(\d+)XXEND/g;
const RESOURCE_SENTINEL_RE = /XPORTRESOURCEXX(\d+)XXEND/g;

function sanitizeFilename(name: string): string {
  return name
    .replace(/ /g, "_")
    .replace(/[\s+]+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractHotmartId(src: string): string | null {
  const direct = src.match(/embed\/([A-Za-z0-9_-]+)/);
  if (direct) return direct[1];
  const filename = path.basename(src, ".html");
  if (/^[A-Za-z0-9_-]+$/.test(filename) && filename.length >= 6) {
    return filename;
  }
  return null;
}

function buildTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    linkStyle: "inlined",
  });
  td.addRule("preserveImageWithEmptyAlt", {
    filter: "img",
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const src = el.getAttribute("src") || "";
      const alt = el.getAttribute("alt") || "";
      return src ? `![${alt}](${src})` : "";
    },
  });
  return td;
}

export function portTeachableLesson(input: PortInput): PortResult {
  const { html, htmlPath } = input;
  const htmlDir = path.dirname(htmlPath);
  const $ = cheerio.load(html);

  const title =
    $('h1[class*="_lectureHeaderName"]').first().text().trim() ||
    ($("title").text().split("|")[0] || "").trim() ||
    "Untitled Lesson";

  const blocks = $("li._content_nhgu3_1, li[class*='_content_nhgu3']").toArray();
  if (blocks.length === 0) {
    blocks.push(...$("[data-testid='attachment-content']").toArray());
  }

  const result: PortResult = {
    title,
    mdx: "",
    assets: [],
    videos: [],
    resources: [],
    warnings: [],
  };

  const turndown = buildTurndown();
  const bodyParts: string[] = [];

  for (const blockEl of blocks) {
    const $block = $(blockEl);
    const kind = ($block.find("p[class*='_contentKind']").first().text() || "")
      .trim()
      .toUpperCase();
    const $content = $block.find("[data-testid='attachment-content']").first();

    if (kind === "TEXT & IMAGES" || kind === "TEXT") {
      const inner = $content.length ? $content : $block;
      bodyParts.push(processTextBlock(inner, $, turndown, htmlDir, result));
    } else if (kind === "VIDEO") {
      const part = processVideoBlock($content.length ? $content : $block, $, result);
      if (part) bodyParts.push(part);
    } else if (kind === "RESOURCE" || kind === "DOWNLOAD" || kind === "FILE") {
      const part = processResourceBlock($content.length ? $content : $block, $, result);
      if (part) bodyParts.push(part);
    } else if (kind === "QUIZ") {
      result.warnings.push(
        `Quiz block detected — quiz porting not implemented. Manually port the quiz content.`,
      );
      bodyParts.push(
        `{/* TODO: port quiz block manually — Teachable quizzes are not auto-converted */}`,
      );
    } else if (kind.length > 0) {
      result.warnings.push(`Unknown block kind: "${kind}" — skipped.`);
    }
  }

  if (bodyParts.length === 0) {
    result.warnings.push(
      "No lesson blocks found. The HTML may not be a Teachable lesson editor export.",
    );
  }

  let body = bodyParts.join("\n\n").trim();

  body = body.replace(VIDEO_SENTINEL_RE, (_, idx) => {
    const v = result.videos[parseInt(idx, 10)];
    const filenameComment = v.originalFilename
      ? `\n{/* TODO: re-upload "${v.originalFilename}" to Mux and replace playbackId */}`
      : `\n{/* TODO: re-upload to Mux and replace playbackId */}`;
    return `<Video playbackId="${v.playbackId}" />${filenameComment}`;
  });

  body = body.replace(RESOURCE_SENTINEL_RE, (_, idx) => {
    const r = result.resources[parseInt(idx, 10)];
    return `<Pdf src="TODO_UPLOAD_${r.slug}.pdf" title="${escapeAttr(r.filename)}" />\n{/* TODO: upload "${r.filename}" to /public or asset storage and replace src */}`;
  });

  const frontmatter = [
    "---",
    `title: ${yamlString(title)}`,
    "public_preview: false",
    "draft: true",
    "---",
    "",
  ].join("\n");

  result.mdx = frontmatter + body + "\n";
  return result;
}

function processTextBlock(
  $content: AnyCheerio,
  $: cheerio.CheerioAPI,
  turndown: TurndownService,
  htmlDir: string,
  result: PortResult,
): string {
  const $clone = $content.clone();
  $clone.find("[class]").removeAttr("class");
  $clone.find("[style]").removeAttr("style");
  $clone.find("[data-imageloader]").removeAttr("data-imageloader");
  $clone.find("[data-imageloader-src]").removeAttr("data-imageloader-src");
  $clone.find("[data-testid]").removeAttr("data-testid");

  $clone.find("img").each((_, el) => {
    const $img = $(el);
    const localSrc = $img.attr("src") || "";
    if (!localSrc) return;
    if (/^https?:\/\//i.test(localSrc)) {
      result.warnings.push(
        `Image references remote URL (not localized): ${localSrc}`,
      );
      return;
    }
    const decoded = decodeURIComponent(localSrc);
    const original = path.basename(decoded);
    const destFilename = sanitizeFilename(original);
    const sourceCandidates = [
      path.resolve(htmlDir, decoded),
      path.join(htmlDir, original),
      path.join(path.dirname(htmlDir), original),
    ];
    result.assets.push({ sourceCandidates, destFilename });
    $img.attr("src", `./assets/${destFilename}`);
    if (!$img.attr("alt")) $img.attr("alt", "");
  });

  return turndown.turndown($.html($clone)).trim();
}

function processVideoBlock(
  $content: AnyCheerio,
  $: cheerio.CheerioAPI,
  result: PortResult,
): string | null {
  const $iframe = $content.find("iframe[name='hotmart_embed'], iframe[src*='hotmart']").first();
  if ($iframe.length === 0) {
    result.warnings.push("Video block has no Hotmart iframe — skipped.");
    return null;
  }
  const src = $iframe.attr("src") || "";
  const playbackId = extractHotmartId(src);
  if (!playbackId) {
    result.warnings.push(`Could not extract Hotmart playback ID from: ${src}`);
    return null;
  }
  const originalFilename =
    $content.find("div[class*='_filename']").first().text().trim() || null;
  result.videos.push({ playbackId, provider: "hotmart", originalFilename });
  return VIDEO_SENTINEL(result.videos.length - 1);
}

function processResourceBlock(
  $content: AnyCheerio,
  _$: cheerio.CheerioAPI,
  result: PortResult,
): string | null {
  const filename =
    $content.find("div[class*='_filename']").first().text().trim() || "";
  if (!filename) {
    result.warnings.push("Resource block has no filename — skipped.");
    return null;
  }
  const slug = slugify(filename) || `resource-${result.resources.length + 1}`;
  result.resources.push({ filename, slug });
  return RESOURCE_SENTINEL(result.resources.length - 1);
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

function yamlString(s: string): string {
  if (/[":\n#]/.test(s)) {
    return `"${s.replace(/"/g, '\\"')}"`;
  }
  return `"${s}"`;
}
