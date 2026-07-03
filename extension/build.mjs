import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, "dist");

const copies = [
  ["manifest.json", "manifest.json"],
  ["src/popup/popup.html", "popup.html"],
  ["src/popup/popup.css", "popup.css"],
  ["src/config.js", "config.js"],
  ["src/popup/popup.js", "popup.js"],
  ["src/content/content.js", "content.js"],
  ["src/background/background.js", "background.js"],
  ["icons/icon.svg", "icons/icon.svg"],
  ["icons/logo.svg", "icons/logo.svg"],
];

mkdirSync(join(dist, "icons"), { recursive: true });

for (const [src, dest] of copies) {
  cpSync(join(__dirname, src), join(dist, dest));
}

console.log("Extension built to extension/dist — load as unpacked extension in Chrome");
