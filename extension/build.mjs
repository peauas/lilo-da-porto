import { cpSync, mkdirSync, createWriteStream, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");
const root = join(__dirname, "..");

const copies = [
  ["manifest.json", "manifest.json"],
  ["src/popup/popup.html", "popup.html"],
  ["src/popup/popup.css", "popup.css"],
  ["src/config.js", "config.js"],
  ["src/shared/capture-shared.js", "capture-shared.js"],
  ["src/popup/popup.js", "popup.js"],
  ["src/content/content.js", "content.js"],
  ["src/content/panel.js", "panel.js"],
  ["src/background/background.js", "background.js"],
  ["icons/icon-16.png", "icons/icon-16.png"],
  ["icons/icon-32.png", "icons/icon-32.png"],
  ["icons/icon-48.png", "icons/icon-48.png"],
  ["icons/icon-128.png", "icons/icon-128.png"],
  ["icons/logo.png", "icons/logo.png"],
];

mkdirSync(join(dist, "icons"), { recursive: true });

for (const [src, dest] of copies) {
  cpSync(join(__dirname, src), join(dist, dest));
}

console.log("Extension built to extension/dist — load as unpacked extension in Chrome");

// Empacota o dist num .zip servido estaticamente pelo site (public/downloads),
// para o usuário baixar e instalar via "Carregar sem compactação".
const downloadsDir = join(root, "public", "downloads");
mkdirSync(downloadsDir, { recursive: true });
const zipPath = join(downloadsDir, "lilo-da-porto-extension.zip");

const output = createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

archive.on("error", (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(dist, "lilo-da-porto-extension");
archive.finalize();

output.on("close", () => {
  const { version } = JSON.parse(readFileSync(join(__dirname, "manifest.json"), "utf8"));
  console.log(`Extension v${version} zipped to public/downloads/lilo-da-porto-extension.zip`);
});
