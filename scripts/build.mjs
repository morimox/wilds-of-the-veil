import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const file = async path => (await readFile(new URL(path, root), "utf8")).replace(/\r\n/g, "\n");
const [html, style, intro, data, economy, alchemy, engine, app] = await Promise.all([
  file("game.html"), file("style.css"), file("intro.css"), file("data.mjs"), file("economy.mjs"), file("alchemy.mjs"), file("engine.mjs"), file("app.mjs"),
]);
const originalCss = `${style}\n${intro}`;
const destination = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL("dist/雾渡山河.html", root));

// Embed the local images so the resulting HTML can open independently.
let css = originalCss;
for (const [reference, path, type] of originalCss.matchAll(/url\("\.\/(assets\/[a-z-]+\.(webp|png))"\)/g)) {
  const bytes = await readFile(new URL(path, root));
  css = css.replace(reference, `url("data:image/${type};base64,${bytes.toString("base64")}")`);
}

// Each module is scoped separately so the standalone bundle behaves like the module build.
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
const economyModule = (() => {
${moduleBody(economy)}
return { economyData, initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo };
})();
const { economyData, initialEconomyState, economyView, economyAction, recordPurchase, marketStock, merchantInfo } = economyModule;
const { alchemyData, initialAlchemyState, alchemyView, alchemyAction } = (() => {
${moduleBody(alchemy)}
return { alchemyData, initialAlchemyState, alchemyView, alchemyAction };
})();
const { act, createGame, rules, view } = (() => {
${moduleBody(engine)}
return { act, createGame, rules, view };
})();
${moduleBody(app)}
})();`.replace(/<\/script/gi, "<\\/script");

const result = html
  .replace('<link rel="stylesheet" href="./style.css">', () => `<style>\n${css}\n</style>`)
  .replace('  <link rel="stylesheet" href="./intro.css">\n', "")
  .replace('  <script type="module" src="./app.mjs"></script>\n', "")
  .replace("</body>", () => `<script>\n${script}\n</script>\n</body>`);
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, "<!-- 由 scripts/build.mjs 生成。请编辑 game.html 与源码。 -->\n" + result, "utf8");
console.log(destination);
