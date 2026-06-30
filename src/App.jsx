import { useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Droplets, Home, LayoutDashboard, MapPinned, ShieldCheck } from "lucide-react";
import "./App.css";

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
  return (
    <main className="page">
      <h1>Community Risk Map</h1>
      <p>
        This page will show sanitation and water-risk hotspots using a live map.
      </p>
    </main>
  );
}

function Dashboard() {
  return (
    <main className="page">
      <h1>Response Dashboard</h1>
      <p>
        This dashboard will show risk scores, reports, pending cases, and
        resolved sanitation issues.
      </p>
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