// Vercel serverless function: same-origin METAR proxy.
// The FAA Aviation Weather Center API has no CORS header, so a browser can't call
// it directly. This adds CORS + a short edge cache. Returns the AWC JSON verbatim.

interface Req {
  query?: Record<string, string | string[] | undefined>;
}
interface Res {
  setHeader(k: string, v: string): void;
  status(c: number): Res;
  send(b: string): void;
  json(o: unknown): void;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const raw = req.query?.ids ?? "KEKQ,KSME";
  const ids = (Array.isArray(raw) ? raw.join(",") : String(raw))
    .replace(/[^A-Z0-9,]/gi, "")
    .slice(0, 200);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");

  try {
    const r = await fetch(
      `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(ids)}&format=json`,
      { headers: { "User-Agent": "RotorTrack/1.0 (VFR SA aid)" } },
    );
    const body = await r.text();
    res.status(r.ok ? 200 : 502).send(body);
  } catch {
    res.status(502).json({ error: "metar fetch failed" });
  }
}
