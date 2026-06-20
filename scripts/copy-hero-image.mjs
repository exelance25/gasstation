import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destDir = join(root, "public", "images");
const dest = join(destDir, "pump-operator.png");

const candidates = [
  join(root, "assets", "pump-operator-hero.png"),
  join(root, "assets", "pump-operator-themed.png"),
  join(root, "assets", "pump-operator.png"),
];

const src = candidates.find((p) => existsSync(p));

if (!src) {
  console.warn("Hero görseli bulunamadı — assets/pump-operator*.png");
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("OK:", dest);
console.log("Kaynak:", src);
