import { useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Home,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Timer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const demoReports = [
  {
    id: 1,
    issueType: "Sewage Leak",
    locationName: "Near Madaraka Primary School",
    area: "Madaraka",
    latitude: -1.3094,
    longitude: 36.8119,
    riskScore: 94,
    riskLabel: "Critical",
    status: "Verified",
    reporterType: "Resident",
    createdAt: "Today, 9:15 AM",
  },
  {
    id: 2,
    issueType: "Blocked Drainage",
    locationName: "Strathmore Gate C",
    area: "Madaraka",
    latitude: -1.3107,
    longitude: 36.8124,
    riskScore: 78,
    riskLabel: "High",
    status: "Assigned",
    reporterType: "Student",
    createdAt: "Today, 10:40 AM",
  },
  {
    id: 3,
    issueType: "Dirty Water",
    locationName: "South B water point",
    area: "South B",
    latitude: -1.3172,
    longitude: 36.8422,
    riskScore: 83,
    riskLabel: "High",
    status: "In Progress",
    reporterType: "Community Health Volunteer",
    createdAt: "Yesterday, 4:20 PM",
  },
  {
    id: 4,
    issueType: "Illegal Dumping",
    locationName: "Drainage channel near market",
    area: "Kibera",
    latitude: -1.3133,
    longitude: 36.7894,
    riskScore: 69,
    riskLabel: "Medium",
    status: "Reported",
    reporterType: "Maji Champion",
    createdAt: "Yesterday, 2:05 PM",
  },
  {
    id: 5,
    issueType: "Flooding",
    locationName: "Estate road near open drainage",
    area: "Langata",
    latitude: -1.3377,
    longitude: 36.7412,
    riskScore: 91,
    riskLabel: "Critical",
    status: "Verified",
    reporterType: "Estate Manager",
    createdAt: "Mon, 8:00 AM",
  },
  {
    id: 6,
    issueType: "Broken Public Toilet",
    locationName: "Public toilet near bus stage",
    area: "Nairobi West",
    latitude: -1.3069,
    longitude: 36.8219,
    riskScore: 61,
    riskLabel: "Medium",
    status: "Resolved",
    reporterType: "Resident",
    createdAt: "Sun, 12:30 PM",
  },
];

const issueChartData = [
  { issue: "Sewage", count: 4 },
  { issue: "Drainage", count: 6 },
  { issue: "Dirty Water", count: 3 },
  { issue: "Flooding", count: 5 },
  { issue: "Dumping", count: 4 },
  { issue: "Toilets", count: 2 },
];

function LandingPage() {
  return (
    <main className="page hero-page">
      <section className="hero">
        <div className="badge">Community Water & Sanitation Intelligence</div>

        <h1>Make Kenya Clean</h1>

        <p className="hero-text">
          A community-driven platform that helps residents report sanitation risks,
          maps hotspots in real time, and supports faster response through local
          verification and risk scoring.
        </p>

        <div className="hero-actions">
          <Link to="/report" className="btn primary-btn">
            Report an Issue
          </Link>
          <Link to="/dashboard" className="btn secondary-btn">
            View Dashboard
          </Link>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <Droplets size={32} />
          <h3>Report Water & Sanitation Issues</h3>
          <p>
            Residents can report sewage leaks, blocked drainage, dirty water,
            burst pipes, flooding, and illegal dumping.
          </p>
        </div>

        <div className="feature-card">
          <MapPinned size={32} />
          <h3>Live Hotspot Map</h3>
          <p>
            Community reports appear on a map so high-risk areas can be seen,
            verified, and prioritized.
          </p>
        </div>

        <div className="feature-card">
          <ShieldCheck size={32} />
          <h3>Maji Champions</h3>
          <p>
            Trusted local volunteers verify reports, confirm action, and help
            close the accountability loop.
          </p>
        </div>
      </section>
    </main>
  );
}

function calculateRiskScore(issueType, urgency, nearSensitiveArea) {
  let score = 30;

  const issueScores = {
    "Sewage Leak": 35,
    "Blocked Drainage": 25,
    "Dirty Water": 30,
    "Burst Pipe": 25,
    "Illegal Dumping": 20,
    "Flooding": 35,
    "Broken Public Toilet": 25,
  };

  const urgencyScores = {
    Low: 5,
    Medium: 15,
    High: 25,
    Critical: 35,
  };

  score += issueScores[issueType] || 10;
  score += urgencyScores[urgency] || 5;

  if (nearSensitiveArea === "Yes") {
    score += 20;
  }

  return Math.min(score, 100);
}

function getRiskLabel(score) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function ReportIssue() {
  const [formData, setFormData] = useState({
    issueType: "Sewage Leak",
    locationName: "",
    description: "",
    urgency: "Medium",
    reporterType: "Resident",
    nearSensitiveArea: "No",
    latitude: "",
    longitude: "",
  });

  const [submittedReport, setSubmittedReport] = useState(null);

  const riskScore = calculateRiskScore(
    formData.issueType,
    formData.urgency,
    formData.nearSensitiveArea
  );

  const riskLabel = getRiskLabel(riskScore);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newReport = {
      ...formData,
      riskScore,
      riskLabel,
      status: "Reported",
      createdAt: new Date().toLocaleString(),
    };

    setSubmittedReport(newReport);
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">Community Reporting</span>
        <h1>Report a Water or Sanitation Issue</h1>
        <p>
          Help your community identify sanitation risks early. Submit a report,
          receive a Maji Risk Score, and help response teams prioritize urgent
          cases.
        </p>
      </section>

      <section className="report-layout">
        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Issue Type</label>
            <select
              name="issueType"
              value={formData.issueType}
              onChange={handleChange}
            >
              <option>Sewage Leak</option>
              <option>Blocked Drainage</option>
              <option>Dirty Water</option>
              <option>Burst Pipe</option>
              <option>Illegal Dumping</option>
              <option>Flooding</option>
              <option>Broken Public Toilet</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location Name</label>
            <input
              type="text"
              name="locationName"
              placeholder="Example: Near Madaraka Primary School"
              value={formData.locationName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                placeholder="-1.309"
                value={formData.latitude}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                placeholder="36.812"
                value={formData.longitude}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Urgency Level</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Near a school, hospital, market, or water point?</label>
            <select
              name="nearSensitiveArea"
              value={formData.nearSensitiveArea}
              onChange={handleChange}
            >
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reporter Type</label>
            <select
              name="reporterType"
              value={formData.reporterType}
              onChange={handleChange}
            >
              <option>Resident</option>
              <option>Student</option>
              <option>Maji Champion</option>
              <option>Estate Manager</option>
              <option>School Representative</option>
              <option>Community Health Volunteer</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Briefly describe what is happening..."
              value={formData.description}
              onChange={handleChange}
              rows="5"
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Submit Report
          </button>
        </form>

        <aside className="risk-preview-card">
          <span className="section-tag">Maji Risk Index</span>
          <h2>{riskScore}/100</h2>
          <p className={`risk-pill ${riskLabel.toLowerCase()}`}>
            {riskLabel} Risk
          </p>

          <p>
            This score helps prioritize reports based on issue severity, urgency,
            and proximity to sensitive areas such as schools, hospitals, markets,
            or water points.
          </p>

          {submittedReport && (
            <div className="submitted-card">
              <h3>Report Submitted</h3>
              <p>
                <strong>Issue:</strong> {submittedReport.issueType}
              </p>
              <p>
                <strong>Location:</strong> {submittedReport.locationName}
              </p>
              <p>
                <strong>Status:</strong> {submittedReport.status}
              </p>
              <p>
                <strong>Submitted:</strong> {submittedReport.createdAt}
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function MapView() {
  const criticalCount = demoReports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;

  const highCount = demoReports.filter(
    (report) => report.riskLabel === "High"
  ).length;

  const mediumCount = demoReports.filter(
    (report) => report.riskLabel === "Medium"
  ).length;

  return (
    <main className="page map-page">
      <section className="section-heading">
        <span className="section-tag">Live Community Mapping</span>
        <h1>Community Risk Map</h1>
        <p>
          View reported water and sanitation risks across communities. Each
          marker represents a report submitted by residents, students, estate
          managers, or Maji Champions.
        </p>
      </section>

      <section className="map-summary-grid">
        <div className="map-summary-card critical-card">
          <h2>{criticalCount}</h2>
          <p>Critical hotspots</p>
        </div>

        <div className="map-summary-card high-card">
          <h2>{highCount}</h2>
          <p>High-risk hotspots</p>
        </div>

        <div className="map-summary-card medium-card">
          <h2>{mediumCount}</h2>
          <p>Medium-risk hotspots</p>
        </div>
      </section>

      <section className="map-layout">
        <div className="map-card">
          <MapContainer
            center={[-1.3107, 36.8124]}
            zoom={12}
            scrollWheelZoom={true}
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {demoReports.map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
              >
                <Popup>
                  <div className="map-popup">
                    <h3>{report.issueType}</h3>
                    <p>
                      <strong>Location:</strong> {report.locationName}
                    </p>
                    <p>
                      <strong>Area:</strong> {report.area}
                    </p>
                    <p>
                      <strong>Risk:</strong> {report.riskLabel} ·{" "}
                      {report.riskScore}/100
                    </p>
                    <p>
                      <strong>Status:</strong> {report.status}
                    </p>
                    <p>
                      <strong>Reported by:</strong> {report.reporterType}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="map-side-panel">
          <h2>Priority Response Queue</h2>
          <p>
            Reports are ranked using the Make Kenya Clean Risk Index so urgent
            sanitation risks can be addressed first.
          </p>

          <div className="map-queue">
            {[...demoReports]
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((report) => (
                <div className="queue-item" key={report.id}>
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
        </div>
      </section>
    </main>
  );
}

function Dashboard() {
  const totalReports = demoReports.length;
  const criticalReports = demoReports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;
  const resolvedReports = demoReports.filter(
    (report) => report.status === "Resolved"
  ).length;
  const averageRisk = Math.round(
    demoReports.reduce((total, report) => total + report.riskScore, 0) /
      totalReports
  );

  return (
    <main className="page dashboard-page">
      <section className="section-heading">
        <span className="section-tag">Response Intelligence</span>
        <h1>Make Kenya Clean Dashboard</h1>
        <p>
          Track community reports, sanitation hotspots, Maji Risk Index scores,
          and the progress of response teams in one place.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <Droplets size={30} />
          <div>
            <p>Total Reports</p>
            <h2>{totalReports}</h2>
          </div>
        </div>

        <div className="stat-card danger">
          <AlertTriangle size={30} />
          <div>
            <p>Critical Cases</p>
            <h2>{criticalReports}</h2>
          </div>
        </div>

        <div className="stat-card success">
          <CheckCircle2 size={30} />
          <div>
            <p>Resolved Cases</p>
            <h2>{resolvedReports}</h2>
          </div>
        </div>

        <div className="stat-card">
          <Timer size={30} />
          <div>
            <p>Average Risk Score</p>
            <h2>{averageRisk}/100</h2>
          </div>
        </div>
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Issue Categories</h2>
            <p>Most reported water and sanitation challenges.</p>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="issue" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Priority Hotspots</h2>
            <p>Areas requiring urgent attention.</p>
          </div>

          <div className="hotspot-list">
            {demoReports
              .filter((report) => report.riskScore >= 75)
              .map((report) => (
                <div className="hotspot-item" key={report.id}>
                  <div>
                    <h3>{report.area}</h3>
                    <p>{report.issueType}</p>
                  </div>

                  <span className={`risk-pill small ${report.riskLabel.toLowerCase()}`}>
                    {report.riskScore}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="dashboard-panel reports-panel">
        <div className="panel-header">
          <h2>Recent Community Reports</h2>
          <p>
            Reports submitted by residents, students, Maji Champions, and local
            representatives.
          </p>
        </div>

        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Location</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Time</th>
              </tr>
            </thead>

            <tbody>
              {demoReports.map((report) => (
                <tr key={report.id}>
                  <td>{report.issueType}</td>
                  <td>{report.locationName}</td>
                  <td>
                    <span className={`risk-pill table-pill ${report.riskLabel.toLowerCase()}`}>
                      {report.riskLabel} · {report.riskScore}
                    </span>
                  </td>
                  <td>{report.status}</td>
                  <td>{report.reporterType}</td>
                  <td>{report.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Champions() {
  return (
    <main className="page">
      <h1>Maji Champions</h1>
      <p>
        Maji Champions are community volunteers who verify reports and confirm
        whether issues have been resolved.
      </p>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="logo">
          <Droplets size={24} />
          Make Kenya Clean
        </Link>

        <div className="nav-links">
          <Link to="/">
            <Home size={18} />
            Home
          </Link>
          <Link to="/report">Report</Link>
          <Link to="/map">Map</Link>
          <Link to="/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/champions">Champions</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/champions" element={<Champions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;