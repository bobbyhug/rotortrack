import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport:{width:600,height:600}, deviceScaleFactor:2 })).newPage();
await p.goto("http://localhost:5173/?mock=1",{waitUntil:"load"});
let x=p.getByRole("button",{name:/I understand/i}); if(await x.count())await x.click(); await p.waitForTimeout(600);
x=p.getByRole("button",{name:/Got it/i}); if(await x.count())await x.click(); await p.waitForTimeout(3000);
const info = await p.evaluate(() => ({
  rangeRing: !!document.querySelector("svg circle[stroke-dasharray]"),
  ringLabel: (document.querySelector("svg text") && [...document.querySelectorAll("svg text")].map(t=>t.textContent).find(t=>/nm$/.test(t))) || null,
  northArrow: [...document.querySelectorAll("svg text")].some(t=>t.textContent==="N"),
  altShown: /MSL/.test(document.body.innerText),
  voiceBtn: document.body.innerText.includes("🔊") || document.body.innerText.includes("🔇"),
  railButtons: [...document.querySelectorAll(".absolute.bottom-2 button")].length,
}));
console.log(JSON.stringify(info));
await b.close();
