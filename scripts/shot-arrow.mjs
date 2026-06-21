import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport:{width:600,height:600}, deviceScaleFactor:2 })).newPage();
const e=[]; p.on("pageerror",x=>e.push(x.message));
await p.goto("http://localhost:5173/?mock=1",{waitUntil:"load"});
const ack=p.getByRole("button",{name:/I understand/i}); if(await ack.count()) await ack.click();
await p.waitForTimeout(1200);
const got=p.getByRole("button",{name:/Got it/i}); if(await got.count()) await got.click();
await p.waitForTimeout(1500);
await p.keyboard.press("d"); // DIVERT to nearest -> big turn -> arrow shows
await p.waitForTimeout(1500);
await p.screenshot({ path:"/tmp/rotortrack-arrow.png" });
console.log("ERR", e.join("|")||"none");
await b.close();
