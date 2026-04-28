import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const clientDir = join(process.cwd(), "dist", "client");
const assetsDir = join(clientDir, "assets");

const files = await readdir(assetsDir);
const entry = files.find((file) => /^index-[\w-]+\.js$/.test(file));
const cssFiles = files.filter((file) => /^index-[\w-]+\.css$/.test(file) || /^styles-[\w-]+\.css$/.test(file));

if (!entry) {
  throw new Error("Could not find the client entry chunk in dist/client/assets.");
}

const styles = cssFiles
  .map((file) => `    <link rel="stylesheet" href="/assets/${file}">`)
  .join("\n");

const html = `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Carousel Generator</title>
    <meta name="description" content="Crea caroselli Instagram con template editoriali, multilingua, brand persistente ed export PNG 1080x1350.">
${styles}
    <script type="module" src="/assets/${entry}"></script>
  </head>
  <body></body>
</html>
`;

await mkdir(clientDir, { recursive: true });
await writeFile(join(clientDir, "index.html"), html);
await writeFile(join(clientDir, "404.html"), html);
await writeFile(join(clientDir, "_redirects"), "/* /index.html 200\n");
await rm(join(clientDir, "wrangler.json"), { force: true });
await rm(join(process.cwd(), ".wrangler", "deploy", "config.json"), { force: true });
