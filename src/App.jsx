import { useEffect, useRef, useState } from "react";

import * as maplibregl from "maplibre-gl" ;
import "maplibre-gl/dist/maplibre-gl.css";
//^ need this stylesheet to use maplibre-gl. map will break otherwise.

import { fetchFrames } from "./erddap";
import "./App.css";

const SOURCE = "buoys";
//what is the purpose of this, claude?
//i'm guessing it's a variable in case i want to change the name later
//if i incorporate more data sources that are not buoys.

const COLORS = ["#2c3e8f",
                "#2f7fb8",
                "#5cc2b5",
                "#f2e394",
                "#f29e4c",
                "#c8352b"];

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
  const [data, setData] = useState(null); // { frames, range, warnings }
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);

  // 1. Create the map once.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapEl.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [-68.5, 43.5], // Gulf of Maine; refit once data arrives
      zoom: 5.5,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    //^zoom buttons.
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
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 7, 9, 16],
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
      //^manage behavior + appearance of buoy points here.

      setMapReady(true);
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  // 2. Load buoy data once.
  useEffect(() => {
    fetchFrames({ days: 7, stepHours: 3 }).then(setData).catch((e) => setError(e.message));
  }, []);

  // 3. When both are ready: set the color ramp and fit the map to the buoys.
  useEffect(() => {
    if (!mapReady || !data) return;
    const map = mapRef.current;
    map.setPaintProperty("buoy-points", "circle-color",
      [
      "interpolate", ["linear"], ["get", "t"], ...rampFor(data.range),
    ]);

    const bounds = new maplibregl.LngLatBounds();
    data.frames.forEach((f) =>
      f.geojson.features.forEach((ft) => bounds.extend(ft.geometry.coordinates))
    );
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 80, maxZoom: 8, duration: 0 });
  }, [mapReady, data]);

  // 4. Push the current frame into the map source.
  useEffect(() => {
    if (!mapReady || !data?.frames[idx]) return;
    mapRef.current.getSource(SOURCE).setData(data.frames[idx].geojson);
  }, [mapReady, data, idx]);

  // 5. Playback.
  const count = data?.frames.length ?? 0; //0 instead of undefined, prevents breaking.
  useEffect(() => {
    if (!playing || count === 0) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % count), 400);
    return () => clearInterval(id); //stop playing
  }, [playing, count]);

  const current = data?.frames[idx];

  return (
    <div className="app">
      <div ref={mapEl} className="map" />

      <div className="panel">
        <div className="readout">
          <strong>Buoy water temperature</strong>
          <span>{current ? fmtTime(current.time) : error ? "" : "Loading…"}</span>
        </div>

        {error && <p className="error">Couldn't load buoy data: {error}</p>}
        {data?.warnings.length > 0 && (
          <p className="error">Some buoys failed: {data.warnings.join("; ")}</p>
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
