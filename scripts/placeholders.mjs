// Genera imágenes SVG temporales en public/images a partir de src/data/images.json.
// Uso: npm run images:placeholders
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const { images } = JSON.parse(readFileSync("src/data/images.json", "utf8"));
mkdirSync("public/images", { recursive: true });

const flower = (cx, cy, r, color) => {
  const petals = Array.from({ length: 6 }, (_, i) =>
    `<ellipse cx="${cx}" cy="${cy - r * 0.55}" rx="${r * 0.32}" ry="${r * 0.55}" fill="${color}" opacity=".9" transform="rotate(${i * 60} ${cx} ${cy})"/>`
  ).join("");
  return `${petals}<circle cx="${cx}" cy="${cy}" r="${r * 0.24}" fill="#f6d34a"/>`;
};

for (const img of images) {
  if (!img.file.endsWith(".svg")) continue;
  const [w, h] = img.size.split("x").map(Number);
  const white = img.bg === "#ffffff";
  const transparent = img.background === "transparent";
  const r = Math.min(w, h) * 0.18;
  const cx = w / 2;
  const cy = h / 2 - r * 0.2;
  const bg = transparent
    ? ""
    : white
      ? `<rect width="100%" height="100%" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r * 1.9}" fill="#f5eef7"/>`
      : `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${img.bg}"/><stop offset="1" stop-color="${img.bg}" stop-opacity=".7"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>`;
  const bouquet = transparent
    ? flower(cx - r * 0.9, cy + r * 0.2, r * 0.9, "#e0457b") + flower(cx + r * 0.9, cy + r * 0.1, r * 0.85, "#f28fb1") + flower(cx, cy - r * 0.7, r, "#c2185b")
    : flower(cx, cy, r, white ? "#e7a3c4" : "rgba(255,255,255,.75)");
  const label = white || transparent ? `<text x="50%" y="${cy + r * 1.6}" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(r * 0.28)}" fill="#b31f75" opacity=".85">${img.label}</text>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg}${bouquet}${label}</svg>`;
  writeFileSync(`public/images/${img.file}`, svg);
}
console.log(`✓ ${images.length} placeholders en public/images`);
