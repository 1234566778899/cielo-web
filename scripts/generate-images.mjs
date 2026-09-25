// Genera las imágenes reales con la API de OpenAI (gpt-image-1) usando los prompts de src/data/images.json.
// Requiere OPENAI_API_KEY en .env.local.
// Uso: npm run images:generate            -> todas las que aún son placeholder (.svg)
//      npm run images:generate -- hero-bouquet p-girasoles   -> solo esas
import { readFileSync, writeFileSync } from "node:fs";

try { process.loadEnvFile(".env.local"); } catch {}
const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error("Falta OPENAI_API_KEY en .env.local");

const path = "src/data/images.json";
const data = JSON.parse(readFileSync(path, "utf8"));
const only = process.argv.slice(2);
const targets = data.images.filter((i) => (only.length ? only.includes(i.key) : i.file.endsWith(".svg")));

for (const img of targets) {
  process.stdout.write(`→ ${img.key}… `);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: `${img.prompt} ${data.style}`,
      size: img.size,
      quality: "high",
      background: img.background ?? "opaque",
      output_format: img.background === "transparent" ? "png" : "webp",
    }),
  });
  if (!res.ok) { console.log(`error ${res.status}: ${await res.text()}`); continue; }
  const { data: [out] } = await res.json();
  const file = `${img.key}.${img.background === "transparent" ? "png" : "webp"}`;
  writeFileSync(`public/images/${file}`, Buffer.from(out.b64_json, "base64"));
  img.file = file;
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ ${file}`);
}
