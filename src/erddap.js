// Pulls recent buoy temperature from NERACOOS ERDDAP (tabledap) and bins it
// into animation frames.
import { BUOYS } from "./buoys";

const BASE = import.meta.env.VITE_ERDDAP_BASE ?? "https://data.neracoos.org/erddap";

async function fetchBuoy(buoy, days) {
  const cols = ["station", "time", "longitude", "latitude", "depth", buoy.tempVar];
  const constraints = [`time>=now-${days}days`, `${buoy.tempVar}!=NaN`];
  if (buoy.qcVar) constraints.push(`${buoy.qcVar}=1`);

  const url =
    `${BASE}/tabledap/${buoy.id}.csv?${cols.join(",")}` +
    constraints.map((c) => `&${encodeURIComponent(c)}`).join("") +
    `&orderBy(${encodeURIComponent('"time"')})`;

  const res = await fetch(url);
  if (res.status === 404) return []; // ERDDAP returns 404 when no rows match
  if (!res.ok) throw new Error(`${buoy.id}: ERDDAP ${res.status}`);

  // Line 1 = names, line 2 = units, then rows in the order of `cols`.
  const rows = (await res.text()).trim().split("\n").slice(2);
  return rows.map((row) => {
    const [station, time, lon, lat, depth, value] = row.split(",");
    return {
      id: buoy.id,
      label: buoy.label,
      station,
      t: Date.parse(time),
      lon: +lon,
      lat: +lat,
      depth: +depth,
      value: +value,
    };
  });
}

export async function fetchFrames({ days = 7, stepHours = 3 } = {}) {
  const results = await Promise.allSettled(BUOYS.map((b) => fetchBuoy(b, days)));
  const failed = results.filter((r) => r.status === "rejected").map((r) => r.reason.message);
  const obs = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (obs.length === 0) throw new Error(failed[0] ?? "No observations returned");

  // Bin observations into stepHours buckets, averaging per buoy within a bucket.
  const step = stepHours * 3600_000;
  const bins = new Map(); // binStart -> Map(buoyId -> {sum, n, sample})
  for (const o of obs) {
    const key = Math.floor(o.t / step) * step;
    if (!bins.has(key)) bins.set(key, new Map());
    const perBuoy = bins.get(key);
    const acc = perBuoy.get(o.id) ?? { sum: 0, n: 0, sample: o };
    acc.sum += o.value;
    acc.n += 1;
    perBuoy.set(o.id, acc);
  }

  let min = Infinity;
  let max = -Infinity;
  const frames = [...bins.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, perBuoy]) => ({
      time,
      geojson: {
        type: "FeatureCollection",
        features: [...perBuoy.values()].map(({ sum, n, sample }) => {
          const temp = sum / n;
          min = Math.min(min, temp);
          max = Math.max(max, temp);
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [sample.lon, sample.lat] },
            properties: { t: temp, label: sample.label, depth: sample.depth },
          };
        }),
      },
    }));

  return { frames, range: [min, max], warnings: failed };
}
