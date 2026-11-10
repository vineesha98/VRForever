// Generate a broadly supported JPEG link preview from the footer engraving.
// sharp is installed transiently at build time so existing lockfile-based CI stays compatible.
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const input = resolve("public/assets/art/engraving.webp");
const output = resolve("public/assets/share-preview.jpg");

// Install before resolving the module; Node's ESM loader caches failed resolutions.
execFileSync("npm", ["install", "--no-save", "--no-package-lock", "sharp@0.34.4"], {
  stdio: "inherit",
});
const sharp = (await import("sharp")).default;

await mkdir(dirname(output), { recursive: true });
await sharp(input)
  .resize(1200, 630, {
    fit: "contain",
    background: "#231821",
  })
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(output);
console.log("Generated JPEG social preview:", output);
