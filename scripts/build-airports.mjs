// Build-time: fetch OurAirports CSVs, filter to the operating region, and emit a
// compact src/data/airports.json (airports + joined runways). Run: bun run build:airports
// Data: OurAirports (public domain). No API key. CORS-friendly GitHub mirror.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = "https://davidmegginson.github.io/ourairports-data";
// Bounding box around the KEKQ–Russell Springs–Jamestown corridor (+ buffer for divert).
const BOX = { latMin: 36.1, latMax: 37.7, lonMin: -85.9, lonMax: -83.8 };
const KEEP_TYPES = new Set([
  "heliport",
  "small_airport",
  "medium_airport",
  "large_airport",
  "seaplane_base",
]);
const HARD = /ASP|CON|PEM|BIT|TAR|COP|GRE|PAV/i; // asphalt/concrete/paved families

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const num = (v) => (v === "" || v == null ? null : Number(v));
const inBox = (lat, lon) =>
  lat >= BOX.latMin && lat <= BOX.latMax && lon >= BOX.lonMin && lon <= BOX.lonMax;

console.log("Fetching OurAirports CSVs…");
const [airportsCsv, runwaysCsv] = await Promise.all([
  fetch(`${BASE}/airports.csv`).then((r) => r.text()),
  fetch(`${BASE}/runways.csv`).then((r) => r.text()),
]);

const airports = parseCsv(airportsCsv).filter((a) => {
  const lat = num(a.latitude_deg);
  const lon = num(a.longitude_deg);
  return (
    KEEP_TYPES.has(a.type) &&
    a.type !== "closed" &&
    lat != null &&
    lon != null &&
    inBox(lat, lon)
  );
});
const keepIdents = new Set(airports.map((a) => a.ident));

const runwaysByIdent = new Map();
for (const rw of parseCsv(runwaysCsv)) {
  if (!keepIdents.has(rw.airport_ident)) continue;
  if (rw.closed === "1") continue;
  const surface = (rw.surface || "").trim();
  const mk = (pfx) => ({
    ident: rw[`${pfx}_ident`] || "",
    headingT: num(rw[`${pfx}_heading_degT`]),
    lat: num(rw[`${pfx}_latitude_deg`]),
    lon: num(rw[`${pfx}_longitude_deg`]),
  });
  const entry = {
    lengthFt: num(rw.length_ft),
    surface,
    hard: HARD.test(surface),
    le: mk("le"),
    he: mk("he"),
  };
  if (!runwaysByIdent.has(rw.airport_ident)) runwaysByIdent.set(rw.airport_ident, []);
  runwaysByIdent.get(rw.airport_ident).push(entry);
}

const out = airports
  .map((a) => ({
    ident: a.ident,
    name: a.name,
    type: a.type,
    lat: num(a.latitude_deg),
    lon: num(a.longitude_deg),
    elevationFt: num(a.elevation_ft),
    runways: runwaysByIdent.get(a.ident) || [],
  }))
  .sort((a, b) => a.ident.localeCompare(b.ident));

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data");
mkdirSync(dir, { recursive: true });
const file = join(dir, "airports.json");
writeFileSync(file, JSON.stringify(out));
const withRw = out.filter((a) => a.runways.length).length;
console.log(
  `Wrote ${out.length} airports (${withRw} with runway data) → ${file}` +
    `\nIncludes KEKQ: ${out.some((a) => a.ident === "KEKQ")}, KSME: ${out.some((a) => a.ident === "KSME")}`,
);
