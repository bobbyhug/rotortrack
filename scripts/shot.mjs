// Dev verification: render the app headless at 600x600, ack the disclaimer, let
// the mock fly, capture console/page errors, and screenshot. Not part of the build.
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:5173/?mock=1";
const out = process.argv[3] || "/tmp/rotortrack.png";
const waitMs = Number(process.argv[4] || 5000);

const browser = await chromium.launch({
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const ctx = await browser.newContext({
  viewport: { width: 600, height: 600 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(url, { waitUntil: "load" }).catch(() => {});
const ack = page.getByRole("button", { name: /I understand/i });
if (await ack.count()) await ack.click().catch(() => {});
await page.waitForTimeout(waitMs);
await page.screenshot({ path: out });
console.log("ERRORS:", errors.length ? "\n" + errors.join("\n") : "none");
await browser.close();
