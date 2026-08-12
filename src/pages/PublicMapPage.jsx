import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import {
  AlertTriangle,
  Layers,
  ListFilter,
  MapPinned,
} from "lucide-react";
import { REPORT_FILTER_CATEGORIES } from "../constants/reportCategories";

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

const allValue = "All";
const unresolvedStatuses = new Set([
  "Reported",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolution Submitted",
]);

function getReportDateValue(report) {
  if (!report.createdAt) return "";

  const reportDate = new Date(report.createdAt);

  if (Number.isNaN(reportDate.getTime())) return "";

  return reportDate.toISOString().slice(0, 10);
}

function getTopEntry(counts) {
  return Object.entries(counts).sort(
    ([, firstCount], [, secondCount]) =>
      secondCount - firstCount
  )[0];
}

export default function PublicMapPage({ reports }) {
  const [filters, setFilters] = useState({
    issueType: allValue,
    status: allValue,
    riskLabel: allValue,
    dateFrom: "",
    dateTo: "",
  });

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          reports
            .map((report) => report.status)
            .filter(Boolean)
        )
      ).sort(),
    [reports]
  );

  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        if (
          filters.issueType !== allValue &&
          report.issueType !== filters.issueType
        ) {
          return false;
        }

        if (
          filters.status !== allValue &&
          report.status !== filters.status
        ) {
          return false;
        }

        if (
          filters.riskLabel !== allValue &&
          report.riskLabel !== filters.riskLabel
        ) {
          return false;
        }

        const reportDateValue = getReportDateValue(report);

        if (
          filters.dateFrom &&
          (!reportDateValue ||
            reportDateValue < filters.dateFrom)
        ) {
          return false;
        }

        if (
          filters.dateTo &&
          (!reportDateValue || reportDateValue > filters.dateTo)
        ) {
          return false;
        }

        return true;
      }),
    [filters, reports]
  );

  const validReports = useMemo(
    () =>
      filteredReports.filter(
        (report) =>
          Number.isFinite(report.latitude) &&
          Number.isFinite(report.longitude)
      ),
    [filteredReports]
  );

  const sortedQueue = useMemo(
    () =>
      [...filteredReports].sort(
        (a, b) => b.riskScore - a.riskScore
      ),
    [filteredReports]
  );

  const hotspotSummary = useMemo(() => {
    const issueCounts = {};
    const areaCounts = {};
    let criticalCount = 0;
    let highCount = 0;

    filteredReports.forEach((report) => {
      issueCounts[report.issueType] =
        (issueCounts[report.issueType] || 0) + 1;

      const areaName =
        report.locationName?.trim() ||
        report.area?.trim() ||
        "Unknown location";

      areaCounts[areaName] = (areaCounts[areaName] || 0) + 1;

      if (report.riskLabel === "Critical") criticalCount += 1;
      if (report.riskLabel === "High") highCount += 1;
    });

    const topIssue = getTopEntry(issueCounts);
    const topAreas = Object.entries(areaCounts)
      .sort(
        ([, firstCount], [, secondCount]) =>
          secondCount - firstCount
      )
      .slice(0, 4);

    const highestRiskUnresolved = sortedQueue.find((report) =>
      unresolvedStatuses.has(report.status)
    );

    return {
      totalVisible: filteredReports.length,
      criticalCount,
      highCount,
      topIssueType: topIssue
        ? `${topIssue[0]} (${topIssue[1]})`
        : "None yet",
      highestRiskUnresolved,
      topAreas,
    };
  }, [filteredReports, sortedQueue]);

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      issueType: allValue,
      status: allValue,
      riskLabel: allValue,
      dateFrom: "",
      dateTo: "",
    });
  }

  return (
    <main className="page map-page">
      <section className="section-heading">
        <span className="section-tag">
          Live Community Mapping
        </span>

        <h1>Community Risk Map</h1>

        <p>
          Explore public-safe urban water, sanitation,
          drainage, and utility risk reports.
        </p>
      </section>

      <section className="map-summary-grid">
        <div className="map-summary-card">
          <MapPinned size={20} />
          <h2>{hotspotSummary.totalVisible}</h2>
          <p>Visible reports</p>
        </div>

        <div className="map-summary-card critical-card">
          <AlertTriangle size={20} />
          <h2>{hotspotSummary.criticalCount}</h2>
          <p>Critical visible reports</p>
        </div>

        <div className="map-summary-card high-card">
          <Layers size={20} />
          <h2>{hotspotSummary.highCount}</h2>
          <p>High-risk visible reports</p>
        </div>
      </section>

      <div className="map-filter-bar">
        <ListFilter size={16} />

        <span>UrbanPulse filters</span>

        <div className="map-filter-controls">
          <label>
            Issue
            <select
              value={filters.issueType}
              onChange={(event) =>
                updateFilter("issueType", event.target.value)
              }
            >
              <option>{allValue}</option>
              {REPORT_FILTER_CATEGORIES.map((category) => (
                <option key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter("status", event.target.value)
              }
            >
              <option>{allValue}</option>
              {statusOptions.map((status) => (
                <option key={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select
              value={filters.riskLabel}
              onChange={(event) =>
                updateFilter("riskLabel", event.target.value)
              }
            >
              {riskFilterOptions.map((option) => (
                <option key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            From
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) =>
                updateFilter("dateFrom", event.target.value)
              }
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) =>
                updateFilter("dateTo", event.target.value)
              }
            />
          </label>

          <button
            type="button"
            className="map-filter-chip"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      <section className="map-intelligence-panel">
        <div>
          <span>Top issue type</span>
          <strong>{hotspotSummary.topIssueType}</strong>
        </div>

        <div>
          <span>Highest-risk unresolved</span>
          {hotspotSummary.highestRiskUnresolved ? (
            <strong>
              {hotspotSummary.highestRiskUnresolved.issueType} ·{" "}
              {hotspotSummary.highestRiskUnresolved.riskScore}/100
            </strong>
          ) : (
            <strong>None in current view</strong>
          )}
        </div>

        <div className="hotspot-areas">
          <span>Hotspot areas</span>
          {hotspotSummary.topAreas.length === 0 ? (
            <strong>None yet</strong>
          ) : (
            <div className="hotspot-area-list">
              {hotspotSummary.topAreas.map(
                ([areaName, count]) => (
                  <span key={areaName}>
                    {areaName} · {count}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="map-layout">
        <div className="map-card">
          {validReports.length === 0 ? (
            <div className="map-empty-state">
              <p>
                {reports.length === 0
                  ? "No reports have location data yet."
                  : "No reports match the active filters with location data."}
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
                        <strong>Maji Risk Index:</strong>{" "}
                        {report.riskLabel} ·{" "}
                        {report.riskScore}/100
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {report.status}
                      </p>

                      {report.trackingCode && (
                        <Link
                          to={`/reports/${report.trackingCode}`}
                          className="map-popup-link"
                        >
                          View report detail
                        </Link>
                      )}

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
            Reports matching the active filters are ranked by
            urban utility risk score.
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

                  <div className="queue-item-actions">
                    <span
                      className={`risk-pill small ${report.riskLabel.toLowerCase()}`}
                    >
                      {report.riskScore}
                    </span>

                    {report.trackingCode && (
                      <Link to={`/reports/${report.trackingCode}`}>
                        Details
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
