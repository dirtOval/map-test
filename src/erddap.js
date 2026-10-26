// Pulls recent buoy temperature from NERACOOS ERDDAP (tabledap).
// fetchBuoy loads one dataset; buildFrames bins whatever has arrived so far.

const BASE = import.meta.env.VITE_ERDDAP_BASE ?? "https://data.neracoos.org/erddap";

export async function fetchBuoy(buoy, days = 7, signal) {
  const cols = [buoy.label, "time", "longitude", "latitude", buoy.tempVar];
  const constraints = [`time>=now-${days}days`, `${buoy.tempVar}!=NaN`];
  // if (buoy.depth) cols.push(buoy.depth)

  //fix this later?
  //specifically, the URI buoys have no single qcVar for temperature, and only a 4 - 9 var for overall qartod aggregate.
  //so i put them in complexQCVarBuoyJail.json for now. will retrieve later when i make a more robust system to deal with em.
  if (buoy.qcVar) constraints.push(`${buoy.qcVar}=1`);

  const url =
    `${BASE}/tabledap/${buoy.id}.csv?${cols.join(",")}` +
    constraints.map((c) => `&${encodeURIComponent(c)}`).join("") +
    `&orderBy(${encodeURIComponent('"time"')})`;

  const res = await fetch(url, { signal });
  if (res.status === 404) return []; // ERDDAP returns 404 when no rows match
  if (!res.ok) {
    throw new Error(`${buoy.id}: ERDDAP ${res.status}`);
  }
  // Line 1 = names, line 2 = units, then rows in the order of `cols`.
  const rows = (await res.text()).trim().split("\n").slice(2);
  return rows.map((row) => {
    const [label, time, lon, lat, value] = row.split(",");
    const obj = {
      id: buoy.id,
      label: label,
      t: Date.parse(time),
      lon: +lon,
      lat: +lat,
      value: +value,
      // depth: +depth,
    }
    // if (buoy.depth) obj.depth = +depth
    return obj;
  });
}

// Bin observations into stepHours buckets, averaging per buoy within a bucket.
export function buildFrames(obs, stepHours = 3) {
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

  return { frames, range: [min, max] };
}

// Runs worker(item) for every item with at most `limit` calls in flight.
// Each runner loops, claiming the next unclaimed item until the queue is empty.
// `worker` must handle its own errors, or that runner stops early.
export async function runPool(items, limit, worker, signal) {
  let next = 0;
  const runner = async () => {
    while (next < items.length && !signal?.aborted) {
      await worker(items[next++]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
}
