import { useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import { ListFilter } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const riskFilterOptions = [
  "All",
  "Critical",
  "High",
  "Medium",
  "Low",
];

export default function PublicMapPage({ reports }) {
  const [riskFilter, setRiskFilter] = useState("All");

  const counts = {
    Critical: reports.filter(
      (report) => report.riskLabel === "Critical"
    ).length,
    High: reports.filter(
      (report) => report.riskLabel === "High"
    ).length,
    Medium: reports.filter(
      (report) => report.riskLabel === "Medium"
    ).length,
  };

  const filteredReports =
    riskFilter === "All"
      ? reports
      : reports.filter(
          (report) => report.riskLabel === riskFilter
        );

  const validReports = filteredReports.filter(
    (report) =>
      Number.isFinite(report.latitude) &&
      Number.isFinite(report.longitude)
  );

  const sortedQueue = [...filteredReports].sort(
    (a, b) => b.riskScore - a.riskScore
  );

  return (
    <main className="page map-page">
      <section className="section-heading">
        <span className="section-tag">
          Live Community Mapping
        </span>

        <h1>Community Risk Map</h1>

        <p>
          View reported water and sanitation risks.
        </p>
      </section>

      <section className="map-summary-grid">
        {Object.entries(counts).map(
          ([label, count]) => (
            <div
              className={`map-summary-card ${label.toLowerCase()}-card`}
              key={label}
            >
              <h2>{count}</h2>
              <p>{label} hotspots</p>
            </div>
          )
        )}
      </section>

      <div className="map-filter-bar">
        <ListFilter size={16} />

        <span>Filter by risk:</span>

        <div className="map-filter-chips">
          {riskFilterOptions.map((option) => (
            <button
              type="button"
              key={option}
              className={
                riskFilter === option
                  ? "map-filter-chip active"
                  : "map-filter-chip"
              }
              onClick={() => setRiskFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <section className="map-layout">
        <div className="map-card">
          {validReports.length === 0 ? (
            <div className="map-empty-state">
              <p>
                {riskFilter === "All"
                  ? "No reports have location data yet."
                  : `No ${riskFilter.toLowerCase()} risk reports with location data.`}
              </p>
            </div>
          ) : (
            <MapContainer
              center={[-1.2921, 36.8219]}
              zoom={12}
              scrollWheelZoom
              className="leaflet-map"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {validReports.map((report) => (
                <Marker
                  key={report.id}
                  position={[
                    report.latitude,
                    report.longitude,
                  ]}
                >
                  <Popup>
                    <div className="map-popup">
                      <h3>{report.issueType}</h3>

                      <p>
                        <strong>Code:</strong>{" "}
                        {report.trackingCode}
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        {report.locationName}
                      </p>

                      <p>
                        <strong>Risk:</strong>{" "}
                        {report.riskLabel} ·{" "}
                        {report.riskScore}/100
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {report.status}
                      </p>

                      {report.photoUrl && (
                        <img
                          src={report.photoUrl}
                          alt={report.issueType}
                          className="popup-photo"
                        />
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="map-side-panel">
          <h2>Priority Response Queue</h2>

          <p>
            {riskFilter === "All"
              ? "Reports are ranked by risk score."
              : `Showing ${riskFilter.toLowerCase()} risk reports, ranked by risk score.`}
          </p>

          {sortedQueue.length === 0 ? (
            <p className="queue-empty">
              {reports.length === 0
                ? "No reports have been submitted yet."
                : "No reports match this filter."}
            </p>
          ) : (
            <div className="map-queue">
              {sortedQueue.map((report) => (
                <div
                  className="queue-item"
                  key={report.id}
                >
                  <div>
                    <h3>{report.issueType}</h3>
                    <p>{report.locationName}</p>
                    <small>{report.status}</small>
                  </div>

                  <span
                    className={`risk-pill small ${report.riskLabel.toLowerCase()}`}
                  >
                    {report.riskScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}