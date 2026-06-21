import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await (await b.newContext({ viewport:{width:600,height:600}, deviceScaleFactor:2 })).newPage();
await p.goto("http://localhost:5173/?mock=1",{waitUntil:"load"});
const ack=p.getByRole("button",{name:/I understand/i}); if(await ack.count()) await ack.click();
await p.waitForTimeout(800);
const got=p.getByRole("button",{name:/Got it/i}); if(await got.count()) await got.click();
await p.waitForTimeout(5000); // let it fly a bit
await p.screenshot({ path:"/tmp/rotortrack-flying.png" });
await b.close();
