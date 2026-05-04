import { promises as fs } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { portTeachableLesson } from "../src/lib/port-teachable";

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: false,
  });

  if (values.help || !values.input || !values.output) {
    console.log(
      [
        "Usage: pnpm port-lesson --input <html-path> --output <output-dir>",
        "",
        "Ports a Teachable lesson HTML export into an MDX file plus copied",
        "image assets at the output directory.",
        "",
        "  --input, -i   Path to the Teachable lesson .html file",
        "  --output, -o  Lesson folder, e.g.",
        "                content/courses/masterclass/02-fundamentals/02-pedals",
        "",
        "After porting:",
        "  - re-upload videos to Mux and replace TODO_UPLOAD playbackIds",
        "  - upload PDF resources and replace TODO_UPLOAD src paths",
      ].join("\n"),
    );
    process.exit(values.help ? 0 : 1);
  }

  const inputPath = path.resolve(values.input);
  const outputDir = path.resolve(values.output);

  const html = await fs.readFile(inputPath, "utf8");
  const result = portTeachableLesson({ html, htmlPath: inputPath });

  await fs.mkdir(outputDir, { recursive: true });
  const assetsDir = path.join(outputDir, "assets");
  if (result.assets.length > 0) {
    await fs.mkdir(assetsDir, { recursive: true });
  }

  let assetsCopied = 0;
  for (const asset of result.assets) {
    let copied = false;
    let lastError = "";
    for (const candidate of asset.sourceCandidates) {
      try {
        await fs.copyFile(candidate, path.join(assetsDir, asset.destFilename));
        copied = true;
        assetsCopied += 1;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }
    if (!copied) {
      result.warnings.push(
        `Could not locate image "${asset.destFilename}". Tried ${asset.sourceCandidates.length} paths. Last error: ${lastError}`,
      );
    }
  }

  const mdxPath = path.join(outputDir, "index.mdx");
  await fs.writeFile(mdxPath, result.mdx, "utf8");

  console.log(`Ported: "${result.title}"`);
  console.log(`  -> ${mdxPath}`);
  console.log("");
  console.log(`  Videos: ${result.videos.length}`);
  result.videos.forEach((v, i) => {
    const fname = v.originalFilename ? `  (${v.originalFilename})` : "";
    console.log(`    ${i + 1}. ${v.provider}:${v.playbackId}${fname}`);
  });
  console.log(`  PDFs: ${result.resources.length}`);
  result.resources.forEach((r, i) => {
    console.log(`    ${i + 1}. ${r.filename}  -> TODO_UPLOAD_${r.slug}.pdf`);
  });
  console.log(`  Images copied: ${assetsCopied} / ${result.assets.length}`);

  if (result.warnings.length > 0) {
    console.log("");
    console.log(`  Warnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => console.log(`    - ${w}`));
  }

  console.log("");
  console.log("Next steps:");
  if (result.videos.length > 0) {
    console.log("  1. Re-upload videos to Mux; swap each <Video playbackId=...>");
  }
  if (result.resources.length > 0) {
    console.log("  2. Upload PDFs; swap each <Pdf src=TODO_UPLOAD_...>");
  }
  console.log("  3. Open /admin in dev to preview the lesson");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
