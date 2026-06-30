import { useEffect, useState } from "react";
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
  UserCheck,
  Camera,
  Users,
  Radio,
  Activity,
  ArrowRight,
  Smartphone,
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
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "./lib/supabase";
import "./App.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const initialReports = [
  {
    id: 1,
    issueType: "Sewage Leak",
    locationName: "Near Madaraka Primary School",
    area: "Madaraka",
    description: "Sewage overflowing near a school zone.",
    latitude: -1.3094,
    longitude: 36.8119,
    urgency: "Critical",
    nearSensitiveArea: "Yes",
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
    description: "Drainage blocked after waste build-up.",
    latitude: -1.3107,
    longitude: 36.8124,
    urgency: "High",
    nearSensitiveArea: "Yes",
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
    description: "Residents reported dirty water from a community water point.",
    latitude: -1.3172,
    longitude: 36.8422,
    urgency: "High",
    nearSensitiveArea: "No",
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
    description: "Waste dumped near a drainage channel.",
    latitude: -1.3133,
    longitude: 36.7894,
    urgency: "Medium",
    nearSensitiveArea: "Yes",
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
    description: "Flooding forming near open drainage after rainfall.",
    latitude: -1.3377,
    longitude: 36.7412,
    urgency: "Critical",
    nearSensitiveArea: "No",
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
    description: "Public toilet reported broken and unhygienic.",
    latitude: -1.3069,
    longitude: 36.8219,
    urgency: "Medium",
    nearSensitiveArea: "No",
    riskScore: 61,
    riskLabel: "Medium",
    status: "Resolved",
    reporterType: "Resident",
    createdAt: "Sun, 12:30 PM",
  },
];

const demoChampions = [
  {
    id: 1,
    name: "Amina Otieno",
    role: "Community Health Volunteer",
    area: "Madaraka",
    verifiedReports: 18,
    status: "Active",
  },
  {
    id: 2,
    name: "Brian Mwangi",
    role: "Student Volunteer",
    area: "Strathmore / Madaraka",
    verifiedReports: 12,
    status: "Active",
  },
  {
    id: 3,
    name: "Grace Wanjiku",
    role: "Estate Representative",
    area: "Langata",
    verifiedReports: 9,
    status: "Active",
  },
];

const proofReports = [
  {
    id: 1,
    issueType: "Blocked Drainage",
    locationName: "Strathmore Gate C",
    before: "Drainage blocked with waste and stagnant water",
    after: "Drainage cleared and water flowing normally",
    status: "Community Confirmed",
    resolvedIn: "2 days",
  },
  {
    id: 2,
    issueType: "Broken Public Toilet",
    locationName: "Public toilet near bus stage",
    before: "Facility unusable and reported by residents",
    after: "Facility cleaned, repaired, and reopened",
    status: "Resolved",
    resolvedIn: "1 day",
  },
];

function toSupabaseReport(report) {
  return {
    id: report.id,
    issue_type: report.issueType,
    location_name: report.locationName,
    area: report.area,
    description: report.description || "",
    latitude: report.latitude,
    longitude: report.longitude,
    urgency: report.urgency || "",
    reporter_type: report.reporterType,
    near_sensitive_area: report.nearSensitiveArea || "No",
    risk_score: report.riskScore,
    risk_label: report.riskLabel,
    status: report.status,
    created_at: report.createdAt,
  };
}

function fromSupabaseReport(report) {
  return {
    id: report.id,
    issueType: report.issue_type,
    locationName: report.location_name,
    area: report.area,
    description: report.description || "",
    latitude: report.latitude,
    longitude: report.longitude,
    urgency: report.urgency || "",
    reporterType: report.reporter_type,
    nearSensitiveArea: report.near_sensitive_area || "No",
    riskScore: report.risk_score,
    riskLabel: report.risk_label,
    status: report.status,
    createdAt: report.created_at,
  };
}

function calculateRiskScore(issueType, urgency, nearSensitiveArea) {
  let score = 30;

  const issueScores = {
    "Sewage Leak": 35,
    "Blocked Drainage": 25,
    "Dirty Water": 30,
    "Burst Pipe": 25,
    "Illegal Dumping": 20,
    Flooding: 35,
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

function getIssueChartData(reports) {
  const categories = {
    Sewage: reports.filter((report) => report.issueType === "Sewage Leak")
      .length,
    Drainage: reports.filter((report) => report.issueType === "Blocked Drainage")
      .length,
    "Dirty Water": reports.filter((report) => report.issueType === "Dirty Water")
      .length,
    Flooding: reports.filter((report) => report.issueType === "Flooding").length,
    Dumping: reports.filter((report) => report.issueType === "Illegal Dumping")
      .length,
    Toilets: reports.filter(
      (report) => report.issueType === "Broken Public Toilet"
    ).length,
  };

  return Object.entries(categories).map(([issue, count]) => ({ issue, count }));
}

function LandingPage({ reports }) {
  const totalReports = reports.length;
  const criticalReports = reports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">Smart Water & Sanitation Innovation</div>

          <h1>Make Kenya Clean</h1>

          <p className="hero-text">
            A community-driven water and sanitation intelligence platform that
            helps residents report risks, maps sanitation hotspots, prioritizes
            urgent cases using the Maji Risk Index, and supports low-cost IoT
            early warning sensors.
          </p>

          <div className="hero-actions">
            <Link to="/report" className="btn primary-btn">
              Report an Issue
              <ArrowRight size={18} />
            </Link>

            <Link to="/map" className="btn secondary-btn">
              View Risk Map
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <h3>{totalReports}</h3>
              <p>Total reports</p>
            </div>

            <div>
              <h3>{criticalReports}</h3>
              <p>Critical hotspots</p>
            </div>

            <div>
              <h3>100%</h3>
              <p>Community-focused</p>
            </div>
          </div>
        </div>

        <div className="hero-demo-card">
          <div className="demo-card-header">
            <span className="pulse-dot"></span>
            Live Risk Alert
          </div>

          <h2>Sewage Leak Detected</h2>
          <p>Near Madaraka Primary School</p>

          <div className="demo-risk-score">
            <span>Risk Score</span>
            <strong>94/100</strong>
          </div>

          <div className="demo-status-list">
            <div>
              <CheckCircle2 size={18} />
              Report verified by Maji Champion
            </div>

            <div>
              <MapPinned size={18} />
              Added to community risk map
            </div>

            <div>
              <AlertTriangle size={18} />
              Marked as critical priority
            </div>
          </div>
        </div>
      </section>

      <section className="problem-solution-section">
        <div className="problem-card">
          <span className="section-tag">The Problem</span>
          <h2>Water and sanitation issues are reported late and tracked poorly.</h2>
          <p>
            In many communities, blocked drainage, sewage leaks, dirty water,
            illegal dumping, and flooding are reported through informal channels.
            This makes it difficult to identify hotspots, prioritize urgent
            cases, and confirm whether action has actually been taken.
          </p>
        </div>

        <div className="solution-card">
          <span className="section-tag">Our Solution</span>
          <h2>A community-powered intelligence loop.</h2>
          <p>
            Make Kenya Clean turns community reports into real-time risk data.
            Residents report problems, Maji Champions verify them, the system
            maps and scores each case, and response teams can track action until
            the community confirms resolution.
          </p>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="section-heading centered-heading">
          <span className="section-tag">How It Works</span>
          <h1>From complaint to verified action</h1>
          <p>
            The platform creates a simple but powerful accountability loop for
            clean water, sanitation, and public health.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <Smartphone size={34} />
            <h3>Report</h3>
            <p>
              Residents submit a sanitation or water issue using a mobile-friendly
              web app, WhatsApp/SMS flow, or community volunteer.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <ShieldCheck size={34} />
            <h3>Verify</h3>
            <p>
              Maji Champions confirm reports locally to reduce fake, duplicate,
              or unclear complaints.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <Activity size={34} />
            <h3>Prioritize</h3>
            <p>
              The Maji Risk Index scores each case based on severity, urgency,
              sensitive areas, and hotspot history.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">04</div>
            <CheckCircle2 size={34} />
            <h3>Confirm</h3>
            <p>
              Before-and-after proof and community confirmation show whether the
              issue was truly resolved.
            </p>
          </div>
        </div>
      </section>

      <section className="iot-section">
        <div className="iot-content">
          <span className="section-tag">IoT Extension</span>
          <h2>Low-cost sensors for early warning</h2>
          <p>
            In high-risk areas, Make Kenya Clean can connect low-cost IoT sensors
            to detect drainage overflow, rising water levels, and sewage-related
            hazards before they become public health emergencies.
          </p>

          <div className="iot-list">
            <div>
              <Radio size={20} />
              Smart drainage overflow alerts
            </div>

            <div>
              <Activity size={20} />
              Sensor-based risk updates
            </div>

            <div>
              <AlertTriangle size={20} />
              Early warning for flood and sanitation hazards
            </div>
          </div>
        </div>

        <div className="sensor-card">
          <div className="sensor-visual">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <h3>Drainage Sensor MKC-01</h3>
          <p>Status: Warning</p>

          <div className="sensor-reading">
            <span>Water Level</span>
            <strong>78%</strong>
          </div>

          <div className="sensor-reading">
            <span>Overflow Risk</span>
            <strong>High</strong>
          </div>
        </div>
      </section>

      <section className="impact-section">
        <div className="section-heading centered-heading">
          <span className="section-tag">Expected Impact</span>
          <h1>Designed for communities, institutions, and counties</h1>
        </div>

        <div className="impact-grid">
          <div className="impact-card">
            <h3>For Residents</h3>
            <p>
              Faster reporting, better visibility, and a clear way to confirm
              whether sanitation issues have been solved.
            </p>
          </div>

          <div className="impact-card">
            <h3>For Schools & Estates</h3>
            <p>
              A simple system to detect and escalate water and sanitation risks
              before they affect learners, tenants, or staff.
            </p>
          </div>

          <div className="impact-card">
            <h3>For Counties & NGOs</h3>
            <p>
              Real-time hotspot data, response tracking, and evidence for better
              planning, budgeting, and community interventions.
            </p>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>Make Kenya Clean is not just a reporting app.</h2>
        <p>
          It is a community and sensor-powered sanitation intelligence system for
          cleaner, safer, and healthier communities.
        </p>

        <Link to="/dashboard" className="btn primary-btn">
          Explore Prototype
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

function ReportIssue({ addReport }) {
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

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((currentData) => ({
          ...currentData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        alert("Could not get your location. You can enter it manually.");
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newReport = {
      id: Date.now(),
      ...formData,
      area: formData.locationName || "Community Report",
      latitude: Number(formData.latitude) || -1.2921,
      longitude: Number(formData.longitude) || 36.8219,
      riskScore,
      riskLabel,
      status: "Reported",
      createdAt: new Date().toLocaleString(),
    };

    await addReport(newReport);
    setSubmittedReport(newReport);

    setFormData({
      issueType: "Sewage Leak",
      locationName: "",
      description: "",
      urgency: "Medium",
      reporterType: "Resident",
      nearSensitiveArea: "No",
      latitude: "",
      longitude: "",
    });
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

          <div className="location-helper">
            <button
              type="button"
              className="location-btn"
              onClick={handleUseCurrentLocation}
            >
              Use My Current Location
            </button>
            <p>
              This helps place the report accurately on the community risk map.
            </p>
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
                <strong>Risk:</strong> {submittedReport.riskLabel} ·{" "}
                {submittedReport.riskScore}/100
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

function MapView({ reports }) {
  const criticalCount = reports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;

  const highCount = reports.filter(
    (report) => report.riskLabel === "High"
  ).length;

  const mediumCount = reports.filter(
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

            {reports.map((report) => (
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
            {[...reports]
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

function Dashboard({ reports, updateReportStatus, resetDemoData }) {
  const totalReports = reports.length;

  const criticalReports = reports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;

  const resolvedReports = reports.filter(
    (report) =>
      report.status === "Resolved" || report.status === "Community Confirmed"
  ).length;

  const averageRisk =
    totalReports === 0
      ? 0
      : Math.round(
          reports.reduce((total, report) => total + report.riskScore, 0) /
            totalReports
        );

  const issueChartData = getIssueChartData(reports);

  return (
    <main className="page dashboard-page">
      <section className="section-heading dashboard-heading-row">
        <div>
          <span className="section-tag">Response Intelligence</span>
          <h1>Make Kenya Clean Dashboard</h1>
          <p>
            Track community reports, sanitation hotspots, Maji Risk Index scores,
            and the progress of response teams in one place.
          </p>
        </div>

        <button type="button" className="reset-btn" onClick={resetDemoData}>
          Reset Demo Data
        </button>
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
            {reports
              .filter((report) => report.riskScore >= 75)
              .map((report) => (
                <div className="hotspot-item" key={report.id}>
                  <div>
                    <h3>{report.area}</h3>
                    <p>{report.issueType}</p>
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
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.issueType}</td>
                  <td>{report.locationName}</td>
                  <td>
                    <span
                      className={`risk-pill table-pill ${report.riskLabel.toLowerCase()}`}
                    >
                      {report.riskLabel} · {report.riskScore}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={report.status}
                      onChange={(event) =>
                        updateReportStatus(report.id, event.target.value)
                      }
                    >
                      <option>Reported</option>
                      <option>Verified</option>
                      <option>Assigned</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                      <option>Community Confirmed</option>
                    </select>
                  </td>
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

function Champions({ reports, updateReportStatus }) {
  const pendingVerification = reports.filter(
    (report) => report.status === "Reported" || report.status === "Assigned"
  );

  return (
    <main className="page champions-page">
      <section className="section-heading">
        <span className="section-tag">Community Verification</span>
        <h1>Maji Champions</h1>
        <p>
          Maji Champions are trusted community volunteers who verify reports,
          support clean-up action, and confirm whether water and sanitation
          issues have truly been resolved.
        </p>
      </section>

      <section className="champions-overview-grid">
        <div className="champion-metric-card">
          <UserCheck size={34} />
          <div>
            <p>Active Maji Champions</p>
            <h2>{demoChampions.length}</h2>
          </div>
        </div>

        <div className="champion-metric-card">
          <ShieldCheck size={34} />
          <div>
            <p>Verified Reports</p>
            <h2>
              {demoChampions.reduce(
                (total, champion) => total + champion.verifiedReports,
                0
              )}
            </h2>
          </div>
        </div>

        <div className="champion-metric-card">
          <Camera size={34} />
          <div>
            <p>Proof Cases</p>
            <h2>{proofReports.length}</h2>
          </div>
        </div>
      </section>

      <section className="champions-layout">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Trusted Community Verifiers</h2>
            <p>
              Local volunteers help reduce fake reports and ensure issues are
              confirmed on the ground.
            </p>
          </div>

          <div className="champion-list">
            {demoChampions.map((champion) => (
              <div className="champion-card" key={champion.id}>
                <div className="champion-avatar">
                  {champion.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>

                <div>
                  <h3>{champion.name}</h3>
                  <p>{champion.role}</p>
                  <small>{champion.area}</small>
                </div>

                <span>{champion.verifiedReports} verified</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Pending Verification</h2>
            <p>
              Reports that need local confirmation before escalation or response.
            </p>
          </div>

          <div className="verification-list">
            {pendingVerification.length === 0 ? (
              <p>No reports are currently pending verification.</p>
            ) : (
              pendingVerification.map((report) => (
                <div className="verification-card" key={report.id}>
                  <div>
                    <h3>{report.issueType}</h3>
                    <p>{report.locationName}</p>
                    <small>Reported by {report.reporterType}</small>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateReportStatus(report.id, "Verified")}
                  >
                    Verify
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-panel proof-panel">
        <div className="panel-header">
          <h2>Before & After Proof</h2>
          <p>
            Every resolved issue can include visual proof and community
            confirmation, creating transparency and accountability.
          </p>
        </div>

        <div className="proof-grid">
          {proofReports.map((report) => (
            <div className="proof-card" key={report.id}>
              <div className="proof-header">
                <div>
                  <h3>{report.issueType}</h3>
                  <p>{report.locationName}</p>
                </div>

                <span>{report.resolvedIn}</span>
              </div>

              <div className="proof-images">
                <div className="proof-image before-proof">
                  <Camera size={28} />
                  <strong>Before</strong>
                  <p>{report.before}</p>
                </div>

                <div className="proof-image after-proof">
                  <CheckCircle2 size={28} />
                  <strong>After</strong>
                  <p>{report.after}</p>
                </div>
              </div>

              <div className="proof-status">
                <ShieldCheck size={18} />
                {report.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="community-loop-card">
        <Users size={36} />
        <div>
          <h2>The Community Accountability Loop</h2>
          <p>
            Report → Verify → Map → Prioritize → Act → Confirm → Learn. This is
            what makes Make Kenya Clean different from ordinary complaint
            platforms.
          </p>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [reports, setReports] = useState(initialReports);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  useEffect(() => {
    async function loadReports() {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Could not load reports:", error.message);

        const savedReports = localStorage.getItem("makeKenyaCleanReports");

        if (savedReports) {
          setReports(JSON.parse(savedReports));
        } else {
          setReports(initialReports);
        }

        setIsLoadingReports(false);
        return;
      }

      if (data.length === 0) {
        setReports(initialReports);
      } else {
        setReports(data.map(fromSupabaseReport));
      }

      setIsLoadingReports(false);
    }

    loadReports();
  }, []);

  useEffect(() => {
    localStorage.setItem("makeKenyaCleanReports", JSON.stringify(reports));
  }, [reports]);

  async function addReport(newReport) {
    setReports((currentReports) => [newReport, ...currentReports]);

    const { error } = await supabase
      .from("reports")
      .insert(toSupabaseReport(newReport));

    if (error) {
      console.error("Could not save report:", error.message);
      alert(
        "The report was added locally, but it could not be saved online. Check Supabase settings."
      );
    }
  }

  async function updateReportStatus(reportId, newStatus) {
    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === reportId ? { ...report, status: newStatus } : report
      )
    );

    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", reportId);

    if (error) {
      console.error("Could not update report status:", error.message);
      alert("Status changed locally, but it could not be saved online.");
    }
  }

  async function resetDemoData() {
    const confirmed = window.confirm(
      "This will reset reports back to the original demo data. Continue?"
    );

    if (!confirmed) return;

    setReports(initialReports);

    const { error: deleteError } = await supabase
      .from("reports")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.error("Could not clear online reports:", deleteError.message);
      alert("Local demo data was reset, but online reports were not cleared.");
      return;
    }

    const { error: insertError } = await supabase
      .from("reports")
      .insert(initialReports.map(toSupabaseReport));

    if (insertError) {
      console.error("Could not reset online demo data:", insertError.message);
      alert("Local demo data was reset, but online demo data was not restored.");
    }
  }

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

      {isLoadingReports ? (
        <main className="page">
          <h1>Loading Make Kenya Clean...</h1>
          <p>Preparing community reports and risk dashboard.</p>
        </main>
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage reports={reports} />} />
          <Route
            path="/report"
            element={<ReportIssue addReport={addReport} />}
          />
          <Route path="/map" element={<MapView reports={reports} />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                reports={reports}
                updateReportStatus={updateReportStatus}
                resetDemoData={resetDemoData}
              />
            }
          />
          <Route
            path="/champions"
            element={
              <Champions
                reports={reports}
                updateReportStatus={updateReportStatus}
              />
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;