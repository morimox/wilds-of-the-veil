import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const root = new URL("../", import.meta.url);
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".css": "text/css", ".mjs": "text/javascript", ".webp": "image/webp", ".png": "image/png" };
const pages = new Set([
  "/index.html", "/game.html", "/app.mjs", "/engine.mjs", "/data.mjs", "/economy.mjs", "/alchemy.mjs", "/style.css", "/intro.css",
  "/world.mjs", "/training.mjs", "/river-content.mjs", "/zhao-content.mjs", "/sand-content.mjs", "/late-content.mjs", "/puzzle-content.mjs", "/mechanisms.mjs", "/tournament.mjs",
]);

createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname.replace(/^\/$/, "/game.html");
  if (!pages.has(pathname) && !/^\/assets\/[a-z-]+\.(webp|png)$/.test(pathname)) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const bytes = await readFile(new URL("." + pathname, root));
    response.writeHead(200, { "Content-Type": types[extname(pathname)] + (pathname.startsWith("/assets") ? "" : "; charset=utf-8"), "Cache-Control": "no-cache" }).end(bytes);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`雾渡山河 · http://127.0.0.1:${port}`));
