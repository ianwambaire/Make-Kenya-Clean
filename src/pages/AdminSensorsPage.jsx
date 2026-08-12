import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RadioTower,
} from "lucide-react";

const sensorAlerts = [
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
  },
  {
    id: "SENSOR-PRS-EST-014",
    name: "Eastleigh Pipe Pressure Monitor",
    type: "Pressure",
    locationName: "Eastleigh Section III",
    coordinates: "-1.2768, 36.8514",
    readingValue: "1.2 bar",
    thresholdValue: "2.4 bar",
    riskLevel: "High",
    issueType: "Water Leak / Burst Pipe",
    timestamp: "2026-08-12 07:55",
    status: "Reviewed",
    explanation:
      "Pressure dropped below the service threshold, suggesting possible leakage, burst pipe, or valve disruption.",
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
  },
  {
    id: "SENSOR-WST-DAN-006",
    name: "Dandora Waste Container Sensor",
    type: "Waste fill level",
    locationName: "Dandora Phase 4",
    coordinates: "-1.2483, 36.9048",
    readingValue: "96%",
    thresholdValue: "85%",
    riskLevel: "High",
    issueType: "Uncollected Waste",
    timestamp: "2026-08-12 06:45",
    status: "Converted to Report",
    explanation:
      "Waste container fill level exceeds overflow threshold and may create drainage and sanitation risk.",
  },
  {
    id: "SENSOR-FLD-MAT-011",
    name: "Mathare Stagnant Water Node",
    type: "Flooding / stagnant water",
    locationName: "Mathare Valley",
    coordinates: "-1.2602, 36.8572",
    readingValue: "38 cm",
    thresholdValue: "25 cm",
    riskLevel: "High",
    issueType: "Flooding / Stagnant Water",
    timestamp: "2026-08-12 06:10",
    status: "Reviewed",
    explanation:
      "Standing water remains above the intervention threshold and may increase public health risk.",
  },
];

function countByRisk(riskLevel) {
  return sensorAlerts.filter(
    (alert) => alert.riskLevel === riskLevel
  ).length;
}

function countByStatus(status) {
  return sensorAlerts.filter(
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

export default function AdminSensorsPage() {
  const totalAlerts = sensorAlerts.length;
  const criticalAlerts = countByRisk("Critical");
  const highRiskAlerts = countByRisk("High");
  const reviewedAlerts = countByStatus("Reviewed");
  const convertedAlerts = countByStatus(
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
          Simulated sensor data for prototype demonstration.
          Future versions can connect ESP32, Arduino, SCADA,
          pressure, flow, water-level and turbidity sensors.
        </p>
      </section>

      <section className="stats-grid sensor-stats-grid">
        <SensorSummaryCard
          icon={<RadioTower size={30} />}
          label="Total alerts"
          value={totalAlerts}
        />
        <SensorSummaryCard
          icon={<AlertTriangle size={30} />}
          label="Critical alerts"
          value={criticalAlerts}
        />
        <SensorSummaryCard
          icon={<Activity size={30} />}
          label="High-risk alerts"
          value={highRiskAlerts}
        />
        <SensorSummaryCard
          icon={<CheckCircle2 size={30} />}
          label="Reviewed alerts"
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
            These simulated alerts show how Make Kenya Clean
            can combine community reports with utility sensor
            readings to detect drainage, water quality, pipe
            pressure, waste overflow and flooding risks.
          </p>
        </div>

        <button
          type="button"
          className="btn secondary-btn"
          disabled
        >
          Create Report from Alert
        </button>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Simulated Sensor Alert Feed</h2>
            <p>
              Prototype alerts are frontend-only and do not
              expose private user or evidence data.
            </p>
          </div>
        </div>

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
              </tr>
            </thead>

            <tbody>
              {sensorAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <strong>{alert.name}</strong>
                    <small>{alert.id}</small>
                    <small>{alert.explanation}</small>
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
                  <td>{alert.status}</td>
                  <td>{alert.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
