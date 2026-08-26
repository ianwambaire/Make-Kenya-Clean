import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCcw,
  RadioTower,
} from "lucide-react";
import {
  convertSensorAlertToReport,
  loadSensorAlerts,
} from "../services/sensors";
import { formatDate } from "../services/reports";

const simulatedSensorAlerts = [
  {
    id: "SENSOR-DRN-KIB-001",
    name: "Kibera Drainage Level Node",
    type: "Water level",
    locationName: "Kibera, Nairobi",
    coordinates: "-1.3125, 36.7892",
    readingValue: "92 cm",
    thresholdValue: "70 cm",
    riskLevel: "Critical",
    issueType: "Blocked Drainage",
    timestamp: "2026-08-12 08:20",
    status: "New",
    explanation:
      "Drainage channel level is above the flood-risk threshold near a dense settlement corridor.",
    source: "Simulated",
  },
  {
    id: "SENSOR-PRS-EST-014",
    name: "Eastleigh Pipe Pressure Monitor",
    type: "Pressure",
    locationName: "Eastleigh Section III",
    coordinates: "-1.2768, 36.8514",
    readingValue: "1.2 bar",
    thresholdValue: "2.4 bar",
    riskLevel: "Warning",
    issueType: "Water Leak / Burst Pipe",
    timestamp: "2026-08-12 07:55",
    status: "Reviewed",
    explanation:
      "Pressure dropped below the service threshold, suggesting possible leakage, burst pipe, or valve disruption.",
    source: "Simulated",
  },
  {
    id: "SENSOR-TBD-MUK-022",
    name: "Mukuru Water Quality Probe",
    type: "Turbidity",
    locationName: "Mukuru kwa Njenga",
    coordinates: "-1.3257, 36.8724",
    readingValue: "18 NTU",
    thresholdValue: "5 NTU",
    riskLevel: "Critical",
    issueType: "Unsafe Water Point",
    timestamp: "2026-08-12 07:30",
    status: "New",
    explanation:
      "Turbidity is well above the safe-water threshold and should be validated before community use.",
    source: "Simulated",
  },
  {
    id: "SENSOR-WST-DAN-006",
    name: "Dandora Waste Container Sensor",
    type: "Waste fill level",
    locationName: "Dandora Phase 4",
    coordinates: "-1.2483, 36.9048",
    readingValue: "96%",
    thresholdValue: "85%",
    riskLevel: "Warning",
    issueType: "Uncollected Waste",
    timestamp: "2026-08-12 06:45",
    status: "Converted to Report",
    explanation:
      "Waste container fill level exceeds overflow threshold and may create drainage and sanitation risk.",
    source: "Simulated",
  },
  {
    id: "SENSOR-FLD-MAT-011",
    name: "Mathare Stagnant Water Node",
    type: "Flooding / stagnant water",
    locationName: "Mathare Valley",
    coordinates: "-1.2602, 36.8572",
    readingValue: "38 cm",
    thresholdValue: "25 cm",
    riskLevel: "Warning",
    issueType: "Flooding / Stagnant Water",
    timestamp: "2026-08-12 06:10",
    status: "Reviewed",
    explanation:
      "Standing water remains above the intervention threshold and may increase public health risk.",
    source: "Simulated",
  },
];

function countByRisk(alerts, riskLevel) {
  return alerts.filter(
    (alert) => alert.riskLevel === riskLevel
  ).length;
}

function countByStatus(alerts, status) {
  return alerts.filter(
    (alert) => alert.status === status
  ).length;
}

function SensorSummaryCard({ icon, label, value }) {
  return (
    <div className="stat-card sensor-stat-card">
      {icon}
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function SensorAlertsTable({
  alerts,
  sourceLabel,
  onConvert,
  busyAlertId,
}) {
  return (
    <div className="reports-table-wrapper">
      <table className="reports-table sensor-alerts-table">
        <thead>
          <tr>
            <th>Sensor</th>
            <th>Type</th>
            <th>Location</th>
            <th>Reading</th>
            <th>Risk</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {alerts.map((alert) => {
            const canConvert =
              sourceLabel === "Live" &&
              ["Warning", "Critical"].includes(
                alert.riskLevel
              ) &&
              alert.status !== "Converted to Report";

            return (
              <tr key={`${sourceLabel}-${alert.id}`}>
                <td>
                  <strong>{alert.name}</strong>
                  <small>{alert.sensorId || alert.id}</small>
                  <small>{alert.explanation}</small>
                  <span className="sensor-source-pill">
                    {sourceLabel}
                  </span>
                </td>
                <td>{alert.type}</td>
                <td>
                  {alert.locationName}
                  <small>{alert.coordinates}</small>
                </td>
                <td>
                  {alert.readingValue}
                  <small>
                    Threshold {alert.thresholdValue}
                  </small>
                </td>
                <td>
                  <span
                    className={`risk-pill small ${alert.riskLevel.toLowerCase()}`}
                  >
                    {alert.riskLevel}
                  </span>
                </td>
                <td>{alert.issueType}</td>
                <td>
                  {alert.status}
                  {alert.convertedTrackingCode && (
                    <small>
                      <Link
                        to={`/reports/${alert.convertedTrackingCode}`}
                      >
                        {alert.convertedTrackingCode}
                      </Link>
                    </small>
                  )}
                </td>
                <td>{formatDate(alert.timestamp)}</td>
                <td>
                  {sourceLabel === "Live" ? (
                    <button
                      type="button"
                      className="btn secondary-btn sensor-action-btn"
                      disabled={
                        !canConvert ||
                        busyAlertId === alert.id
                      }
                      onClick={() => onConvert(alert.id)}
                    >
                      {busyAlertId === alert.id
                        ? "Creating..."
                        : "Create Report"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn secondary-btn sensor-action-btn"
                      disabled
                    >
                      Future integration
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminSensorsPage() {
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyAlertId, setBusyAlertId] = useState(null);

  async function refreshLiveAlerts() {
    setIsLoading(true);
    setMessage("");

    try {
      const alerts = await loadSensorAlerts();
      setLiveAlerts(alerts);
    } catch (error) {
      console.error(
        "Could not load live sensor alerts:",
        error.message
      );
      setMessage(
        "Live sensor alerts could not be loaded. The simulated demo feed is still available."
      );
      setLiveAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialAlerts() {
      try {
        const alerts = await loadSensorAlerts();
        if (!isActive) return;
        setLiveAlerts(alerts);
      } catch (error) {
        if (!isActive) return;
        console.error(
          "Could not load live sensor alerts:",
          error.message
        );
        setMessage(
          "Live sensor alerts could not be loaded. The simulated demo feed is still available."
        );
        setLiveAlerts([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAlerts();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleConvertAlert(alertId) {
    setBusyAlertId(alertId);
    setMessage("");

    try {
      const result =
        await convertSensorAlertToReport(alertId);
      setMessage(
        `Report ${result.tracking_code} was created from the sensor alert.`
      );
      await refreshLiveAlerts();
    } catch (error) {
      console.error(
        "Could not convert sensor alert:",
        error.message
      );
      setMessage(
        error.message ||
          "The sensor alert could not be converted."
      );
    } finally {
      setBusyAlertId(null);
    }
  }

  const totalAlerts = liveAlerts.length;
  const criticalAlerts = countByRisk(
    liveAlerts,
    "Critical"
  );
  const warningAlerts = countByRisk(
    liveAlerts,
    "Warning"
  );
  const reviewedAlerts = countByStatus(
    liveAlerts,
    "Reviewed"
  );
  const convertedAlerts = countByStatus(
    liveAlerts,
    "Converted to Report"
  );

  return (
    <main className="page dashboard-page sensor-page">
      <section className="section-heading">
        <span className="section-tag">
          UrbanPulse Sensors
        </span>

        <h1>Sensor Alerts</h1>

        <p>
          Live ESP32-ready sensor integration with simulated
          sensor data for prototype demonstration. Future
          versions can connect ESP32, Arduino, SCADA,
          pressure, flow, water-level and turbidity sensors.
        </p>
      </section>

      <section className="stats-grid sensor-stats-grid">
        <SensorSummaryCard
          icon={<RadioTower size={30} />}
          label="Live alerts"
          value={totalAlerts}
        />
        <SensorSummaryCard
          icon={<AlertTriangle size={30} />}
          label="Critical live alerts"
          value={criticalAlerts}
        />
        <SensorSummaryCard
          icon={<Activity size={30} />}
          label="Warning live alerts"
          value={warningAlerts}
        />
        <SensorSummaryCard
          icon={<CheckCircle2 size={30} />}
          label="Reviewed live alerts"
          value={reviewedAlerts}
        />
        <SensorSummaryCard
          icon={<Cpu size={30} />}
          label="Converted alerts"
          value={convertedAlerts}
        />
      </section>

      <section className="dashboard-panel sensor-explainer">
        <div>
          <h2>Citizen Reports + IoT Signals</h2>
          <p>
            Live sensor alerts are accepted through a secure
            Supabase Edge Function. Device tokens are checked
            server-side, and admins can convert Warning or
            Critical readings into standard Make Kenya Clean
            reports.
          </p>
        </div>

        <button
          type="button"
          className="btn secondary-btn"
          onClick={refreshLiveAlerts}
          disabled={isLoading}
        >
          <RefreshCcw size={16} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {message && (
        <div className="form-message sensor-message">
          {message}
        </div>
      )}

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Live Sensor Alerts</h2>
            <p>
              Supabase-backed ESP32/HC-SR04 drainage and
              utility sensor readings. No device credentials
              or private user data are shown.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p>Loading live sensor alerts...</p>
        ) : liveAlerts.length === 0 ? (
          <p>
            No live sensor alerts yet. Use the simulated feed
            below while the physical device is being
            registered.
          </p>
        ) : (
          <SensorAlertsTable
            alerts={liveAlerts}
            sourceLabel="Live"
            onConvert={handleConvertAlert}
            busyAlertId={busyAlertId}
          />
        )}
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Simulated Demo Alerts</h2>
            <p>
              Simulated sensor data for prototype
              demonstration. These examples are frontend-only
              and do not expose private user or evidence data.
            </p>
          </div>
        </div>

        <SensorAlertsTable
          alerts={simulatedSensorAlerts}
          sourceLabel="Simulated"
        />
      </section>
    </main>
  );
}
