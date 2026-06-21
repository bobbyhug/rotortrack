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
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(",") : v);
  const bbox = one(req.query?.bbox);
  let qs: string;
  if (bbox) {
    // minLat,minLon,maxLat,maxLon — return all reporting stations in the area
    qs = `bbox=${encodeURIComponent(bbox.replace(/[^0-9.,-]/g, "").slice(0, 64))}`;
  } else {
    const ids = (one(req.query?.ids) ?? "KEKQ,KSME").replace(/[^A-Z0-9,]/gi, "").slice(0, 200);
    qs = `ids=${encodeURIComponent(ids)}`;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");

  try {
    const r = await fetch(
      `https://aviationweather.gov/api/data/metar?${qs}&format=json`,
      { headers: { "User-Agent": "RotorTrack/1.0 (VFR SA aid)" } },
    );
    const body = await r.text();
    res.status(r.ok ? 200 : 502).send(body);
  } catch {
    res.status(502).json({ error: "metar fetch failed" });
  }
}
