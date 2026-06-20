// Dev verification of the spinning rotor: confirms the .rotor CSS animation is
// applied and its transform changes over time (spinning), reads the eased heading
// transform, screenshots, and reports console errors. Needs playwright (dev only).
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:5173/?mock=1";
const out = process.argv[3] || "/tmp/rotortrack-rotor.png";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await (await browser.newContext({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 2 })).newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(url, { waitUntil: "load" }).catch(() => {});
const ack = page.getByRole("button", { name: /I understand/i });
if (await ack.count()) await ack.click().catch(() => {});
await page.waitForTimeout(4000);

const sample = () =>
  page.evaluate(() => {
    const rotor = document.querySelector(".rotor");
    const rot = document.querySelector(".ownship-rot");
    const cs = rotor ? getComputedStyle(rotor) : null;
    return {
      rotorAnim: cs?.animationName ?? "none",
      rotorMatrix: cs?.transform ?? "none",
      headingTransform: rot?.style.transform ?? "none",
      parked: document.querySelector(".ownship")?.classList.contains("parked") ?? null,
    };
  });

const a = await sample();
await page.waitForTimeout(300);
const b = await sample();
await page.screenshot({ path: out });
await browser.close();

console.log("rotorAnim:", a.rotorAnim);
console.log("spinning (matrix changed in 300ms):", a.rotorMatrix !== b.rotorMatrix);
console.log("headingTransform:", a.headingTransform);
console.log("parked:", a.parked);
console.log("ERRORS:", errors.length ? "\n" + errors.join("\n") : "none");
