import { build } from "esbuild";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

/** Resolves the project's `@/…` alias, which esbuild does not know about. */
const aliasPlugin = {
  name: "at-alias",
  setup(b) {
    b.onResolve({ filter: /^@\// }, (args) => {
      const base = resolve(root, args.path.slice(2));
      for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts", ""]) {
        try {
          const candidate = base + ext;
          readFileSync(candidate);
          return { path: candidate };
        } catch {
          /* try the next extension */
        }
      }
      return { errors: [{ text: `cannot resolve ${args.path}` }] };
    });
  },
};

const result = await build({
  entryPoints: [resolve(here, "entry.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: ["es2020"],
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [aliasPlugin],
  write: false,
  logLevel: "warning",
});

let js = result.outputFiles[0].text;

/*
 * The opening is a video file, and this bundle is a single self-contained HTML
 * page with no network access of its own — the artifact host blocks every
 * external request except Google Fonts, so a `/media/...` src would resolve to
 * nothing and the preview would open on a blank ivory screen.
 *
 * So the footage is inlined, and if it will not fit, this build *fails* rather
 * than writing a bundle whose opening is missing. The last time these two
 * outputs were allowed to disagree, the shared link ran two whole acts short of
 * the dev server and nothing caught it.
 */
const VIDEO = resolve(root, "public/media/ekklesia-seed-to-tree.mp4");
// Base64 inflates by four thirds, and the host caps a rendered artifact at
// 16 MB. This leaves room for the bundle and the stylesheet on top.
const INLINE_BUDGET = 10 * 1024 * 1024;

const videoBytes = statSync(VIDEO).size;
if (videoBytes > INLINE_BUDGET) {
  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.error(
    [
      "",
      `A prévia compartilhável não pode ser gerada: ${mb(videoBytes)} MB de vídeo.`,
      "",
      "  O bundle é um HTML único, sem requisições externas — o vídeo precisa ir",
      `  embutido, e em base64 ele viraria ${mb((videoBytes * 4) / 3)} MB, acima do limite`,
      `  de 16 MB do artifact. Orçamento para embutir: ${mb(INLINE_BUDGET)} MB.`,
      "",
      "  Gerar um master leve — e, de quebra, um que possa ser percorrido:",
      "",
      "    ffmpeg -i public/media/ekklesia-seed-to-tree.mp4 \\",
      "      -vf scale=1280:-2 -c:v libx264 -profile:v high -crf 26 \\",
      "      -g 1 -keyint_min 1 -sc_threshold 0 -an -movflags +faststart \\",
      "      public/media/scrub.mp4",
      "",
      "  Depois: mv public/media/scrub.mp4 public/media/ekklesia-seed-to-tree.mp4",
      "",
      "  `-g 1` põe um keyframe em cada quadro. É o que torna o scrubbing",
      "  instantâneo; sem isso cada busca decodifica desde o keyframe anterior.",
      "",
      "  O site em si (`npm run dev`, `npm run build`) funciona com o arquivo",
      "  atual — esta checagem é só da prévia.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const videoData = `data:video/mp4;base64,${readFileSync(VIDEO).toString("base64")}`;
js = js.replaceAll("/media/ekklesia-seed-to-tree.mp4", videoData);

// Inline the stylesheet too — the artifact host allows no external requests
// except Google Fonts.
const tokens = readFileSync(resolve(root, "styles/tokens.css"), "utf8");
const globals = readFileSync(resolve(root, "app/globals.css"), "utf8").replace(
  /@import\s+"[^"]+";\s*/,
  "",
);

const html = `<title>Ekklesia Connect</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --font-cormorant: "Cormorant Garamond";
  --font-inter: "Inter";
}
${tokens}
${globals}
</style>
<div id="root"></div>
<script>${js}</script>
`;

writeFileSync(resolve(here, "ekklesia-preview.html"), html);
console.log(`ekklesia-preview.html written — ${(html.length / 1024 / 1024).toFixed(2)} MB`);
