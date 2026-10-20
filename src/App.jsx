import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl" ;
import "maplibre-gl/dist/maplibre-gl.css";
import { fetchBuoy, buildFrames, runPool } from "./erddap";
import BUOYS from '../buoys.json' with { type: 'json' };
import "./App.css";

const SOURCE = "buoys";
const MAX_CONCURRENT = 4; // simultaneous ERDDAP requests
const COLORS = ["#2c3e8f", "#2f7fb8", "#5cc2b5", "#f2e394", "#f29e4c", "#c8352b"];

// Evenly spaced stops across the observed range, so a color means the same
// temperature in every frame.
const rampFor = ([lo, hi]) => {
  const span = Math.max(hi - lo, 0.5);
  return COLORS.flatMap((c, i) => [lo + (span * i) / (COLORS.length - 1), c]);
};

const fmtTime = (ms) =>
  new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    timeZone: "UTC",
    timeZoneName: "short",
  });

export default function App() {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [obs, setObs] = useState([]); // observations from every buoy loaded so far
  const [settled, setSettled] = useState(0); // buoys finished (success or failure)
  const [failures, setFailures] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const userMoved = useRef(false);

  const loading = settled < BUOYS.length;
  const data = useMemo(() => (obs.length ? buildFrames(obs, 3) : null), [obs]);

  // 1. Create the map once.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-68.5, 43.5], // Gulf of Maine; refit once data arrives
      zoom: 5.5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));

    map.on("load", () => {
      map.addSource(SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "buoy-points",
        type: "circle",
        source: SOURCE,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5, 9, 12],
          // "circle-radius": 5,
          "circle-color": "#888",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      map.on("click", "buoy-points", (e) => {
        const f = e.features[0];
        const { t, label, depth } = f.properties;
        new maplibregl.Popup({ closeButton: false })
          .setLngLat(f.geometry.coordinates)
          .setHTML(`<strong>${label}</strong><br>${(+t).toFixed(1)} °C at ${depth} m`)
          .addTo(map);
      });
      map.on("mouseenter", "buoy-points", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "buoy-points", () => (map.getCanvas().style.cursor = ""));

      setMapReady(true);
    });

    // Stop auto-fitting once the user pans or zooms (originalEvent is set only for user input).
    map.on("movestart", (e) => {
      if (e.originalEvent) userMoved.current = true;
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // 2. Load every buoy independently; each result is merged in as soon as it arrives.
  useEffect(() => {
    const ctrl = new AbortController();
    runPool(
      BUOYS,
      MAX_CONCURRENT,
      (buoy) =>
        fetchBuoy(buoy, 7, ctrl.signal)
          .then((rows) => setObs((prev) => [...prev, ...rows]))
          .catch((e) => {
            if (e.name !== "AbortError") setFailures((f) => [...f, e.message]);
          })
          .finally(() => {
            if (!ctrl.signal.aborted) setSettled((n) => n + 1);
          }),
      ctrl.signal
    );
    return () => ctrl.abort();
  }, []);

  // 3a. Update the color ramp whenever the observed range changes.
  useEffect(() => {
    if (!mapReady || !data) return;
    mapRef.current.setPaintProperty("buoy-points", "circle-color", [
      "interpolate", ["linear"], ["get", "t"], ...rampFor(data.range),
    ]);
  }, [mapReady, data]);

  // 3b. Fit the map to the buoys, until the user takes over the camera.
  useEffect(() => {
    if (!mapReady || !data || userMoved.current) return;
    const bounds = new maplibregl.LngLatBounds();
    data.frames.forEach((f) =>
      f.geojson.features.forEach((ft) => bounds.extend(ft.geometry.coordinates))
    );
    if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 8, duration: 0 });
  }, [mapReady, data]);

  // 4. Push the current frame into the map source.
  useEffect(() => {
    if (!mapReady || !data?.frames[idx]) return;
    mapRef.current.getSource(SOURCE).setData(data.frames[idx].geojson);
  }, [mapReady, data, idx]);

  // 5. Playback.
  const count = data?.frames.length ?? 0;
  useEffect(() => {
    if (!playing || count === 0) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % count), 400);
    return () => clearInterval(id);
  }, [playing, count]);

  const current = data?.frames[idx];
  const noData = !loading && !data;

  return (
    <div className="app">
      <div ref={mapEl} className="map" />

      <div className="panel">
        <div className="readout">
          <strong>Buoy water temperature</strong>
          <span>{current ? fmtTime(current.time) : loading ? "Loading…" : ""}</span>
        </div>

        {loading && (
          <p className="status">
            Loaded {settled} of {BUOYS.length} buoys…
          </p>
        )}
        {noData && <p className="error">No buoy data returned.</p>}
        {failures.length > 0 && (
          <p className="error">{failures.length} buoy request(s) failed: {failures.join("; ")}</p>
        )}

        <div className="controls">
          <button onClick={() => setPlaying((p) => !p)} disabled={!count}>
            {playing ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(count - 1, 0)}
            value={idx}
            onChange={(e) => {
              setPlaying(false);
              setIdx(+e.target.value);
            }}
            disabled={!count}
            aria-label="Time"
          />
        </div>

        {data && (
          <div className="legend">
            <span>{data.range[0].toFixed(1)} °C</span>
            <div className="bar" />
            <span>{data.range[1].toFixed(1)} °C</span>
          </div>
        )}
      </div>
    </div>
  );
}
