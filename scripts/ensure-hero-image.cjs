const fs = require("node:fs");
const path = require("node:path");

/** En iyi hero PNG → public/images/pump-operator.png */
function ensureHeroImage(rootDir) {
  const destDir = path.join(rootDir, "public", "images");
  const dest = path.join(destDir, "pump-operator.png");

  const candidates = [
    path.join(rootDir, "assets", "pump-operator-hero.png"),
    path.join(rootDir, "assets", "pump-operator-themed.png"),
    path.join(rootDir, "assets", "pump-operator.png"),
  ];

  const src = candidates.find((p) => fs.existsSync(p));
  if (!src) return false;

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

module.exports = { ensureHeroImage };
