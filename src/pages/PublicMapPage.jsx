import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function PublicMapPage({ reports }) {
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

  const validReports = reports.filter(
    (report) =>
      Number.isFinite(report.latitude) &&
      Number.isFinite(report.longitude)
  );

  return (
    <main className="page map-page">
      <section className="section-heading">
        <span className="section-tag">
          Live Community Mapping
        </span>
        <h1>Community Risk Map</h1>
        <p>View reported water and sanitation risks.</p>
      </section>

      <section className="map-summary-grid">
        {Object.entries(counts).map(([label, count]) => (
          <div
            className={`map-summary-card ${label.toLowerCase()}-card`}
            key={label}
          >
            <h2>{count}</h2>
            <p>{label} hotspots</p>
          </div>
        ))}
      </section>

      <section className="map-layout">
        <div className="map-card">
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
                      {report.riskLabel} · {report.riskScore}/100
                    </p>
                    <p>
                      <strong>Status:</strong> {report.status}
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
        </div>

        <div className="map-side-panel">
          <h2>Priority Response Queue</h2>
          <p>Reports are ranked by risk score.</p>

          {reports.length === 0 ? (
            <p>No reports have been submitted yet.</p>
          ) : (
            <div className="map-queue">
              {[...reports]
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((report) => (
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
