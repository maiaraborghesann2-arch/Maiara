import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
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

const js = result.outputFiles[0].text;

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
