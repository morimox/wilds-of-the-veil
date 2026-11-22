import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const file = path => readFile(new URL(path, root), "utf8");
const [html, originalCss, data, engine, app] = await Promise.all([
  file("index.html"), file("style.css"), file("data.mjs"), file("engine.mjs"), file("app.mjs"),
]);
const destination = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL("dist/雾渡山河.html", root));

// Embed the local images so the resulting HTML can open independently.
let css = originalCss;
for (const [reference, path, type] of originalCss.matchAll(/url\("\.\/(assets\/[a-z-]+\.(webp|png))"\)/g)) {
  const bytes = await readFile(new URL(path, root));
  css = css.replace(reference, `url("data:image/${type};base64,${bytes.toString("base64")}")`);
}

// The three project modules have static imports and a small, known public API.
function moduleBody(source) {
  return source
    .replace(/^import .*?;[ \t]*\r?$/gm, "")
    .replace(/^export (?:default .+;|\{.*\};)[ \t]*\r?$/gm, "")
    .replace(/^export (?=(?:const|function) )/gm, "");
}

const script = `(() => {
const moduleData = (() => {
${moduleBody(data)}
return { default: data, ...data };
})();
const { data } = (() => ({ data: moduleData.default }))();
const { act, createGame, rules, view } = (() => {
${moduleBody(engine)}
return { act, createGame, rules, view };
})();
${moduleBody(app)}
})();`.replace(/<\/script/gi, "<\\/script");

const result = html
  .replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`)
  .replace('  <script type="module" src="./app.mjs"></script>\n', "")
  .replace("</body>", () => `<script>\n${script}\n</script>\n</body>`);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, result, "utf8");
console.log(destination);
