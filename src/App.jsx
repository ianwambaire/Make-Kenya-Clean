import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Droplets,
  Home,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
  Smartphone,
  Timer,
  UserCheck,
  Users,
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

const statuses = [
  "Reported",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolved",
  "Community Confirmed",
];

const initialReports = [
  {
    id: 1,
    trackingCode: "MKC-2026-1001",
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
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    createdAt: "Today, 9:15 AM",
    photoUrl: "",
  },
  {
    id: 2,
    trackingCode: "MKC-2026-1002",
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
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    createdAt: "Today, 10:40 AM",
    photoUrl: "",
  },
  {
    id: 3,
    trackingCode: "MKC-2026-1003",
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
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    createdAt: "Yesterday, 4:20 PM",
    photoUrl: "",
  },
  {
    id: 4,
    trackingCode: "MKC-2026-1004",
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
    reporterType: "Resident",
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    createdAt: "Yesterday, 2:05 PM",
    photoUrl: "",
  },
  {
    id: 5,
    trackingCode: "MKC-2026-1005",
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
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    createdAt: "Mon, 8:00 AM",
    photoUrl: "",
  },
  {
    id: 6,
    trackingCode: "MKC-2026-1006",
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
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    createdAt: "Sun, 12:30 PM",
    photoUrl: "",
  },
];

const demoChampions = [
  { id: 1, name: "Amina Otieno", role: "Community Health Volunteer", area: "Madaraka", verifiedReports: 18 },
  { id: 2, name: "Brian Mwangi", role: "Student Volunteer", area: "Strathmore / Madaraka", verifiedReports: 12 },
  { id: 3, name: "Grace Wanjiku", role: "Estate Representative", area: "Langata", verifiedReports: 9 },
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
    tracking_code: report.trackingCode,
    issue_type: report.issueType,
    location_name: report.locationName,
    area: report.area,
    description: report.description || "",
    latitude: report.latitude,
    longitude: report.longitude,
    urgency: report.urgency || "",
    reporter_type: report.reporterType || "Public Reporter",
    reporter_name: report.reporterName || "",
    reporter_phone: report.reporterPhone || "",
    reporter_email: report.reporterEmail || "",
    is_anonymous: report.isAnonymous ?? true,
    near_sensitive_area: report.nearSensitiveArea || "No",
    risk_score: report.riskScore,
    risk_label: report.riskLabel,
    status: report.status,
    created_at: report.createdAt,
    photo_url: report.photoUrl || "",
  };
}

function fromSupabaseReport(report) {
  return {
    id: report.id,
    trackingCode: report.tracking_code || `MKC-${new Date().getFullYear()}-${report.id}`,
    issueType: report.issue_type,
    locationName: report.location_name,
    area: report.area,
    description: report.description || "",
    latitude: report.latitude,
    longitude: report.longitude,
    urgency: report.urgency || "",
    reporterType: report.reporter_type || "Public Reporter",
    reporterName: report.reporter_name || "",
    reporterPhone: report.reporter_phone || "",
    reporterEmail: report.reporter_email || "",
    isAnonymous: report.is_anonymous ?? true,
    nearSensitiveArea: report.near_sensitive_area || "No",
    riskScore: report.risk_score,
    riskLabel: report.risk_label,
    status: report.status,
    createdAt: report.created_at,
    photoUrl: report.photo_url || "",
  };
}

function calculateRiskScore(issueType, urgency, nearSensitiveArea) {
  const issueScores = {
    "Sewage Leak": 35,
    "Blocked Drainage": 25,
    "Dirty Water": 30,
    "Burst Pipe": 25,
    "Illegal Dumping": 20,
    Flooding: 35,
    "Broken Public Toilet": 25,
  };
  const urgencyScores = { Low: 5, Medium: 15, High: 25, Critical: 35 };
  const sensitiveAreaScore = nearSensitiveArea === "Yes" ? 20 : 0;
  return Math.min(30 + (issueScores[issueType] || 10) + (urgencyScores[urgency] || 5) + sensitiveAreaScore, 100);
}

function getRiskLabel(score) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function generateTrackingCode() {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `MKC-${year}-${randomPart}`;
}

function getIssueChartData(reports) {
  const counts = {};
  reports.forEach((report) => {
    counts[report.issueType] = (counts[report.issueType] || 0) + 1;
  });
  return Object.entries(counts).map(([issue, count]) => ({ issue, count }));
}

function LandingPage({ reports }) {
  const totalReports = reports.length;
  const criticalReports = reports.filter((report) => report.riskLabel === "Critical").length;

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">Smart Water & Sanitation Innovation</div>
          <h1>Make Kenya Clean</h1>
          <p className="hero-text">
            A public water and sanitation intelligence platform where anyone in Kenya can report issues,
            upload evidence, track progress, and help authorities prioritize response.
          </p>

          <div className="hero-actions">
            <Link to="/report" className="btn primary-btn">
              Report an Issue <ArrowRight size={18} />
            </Link>
            <Link to="/track" className="btn secondary-btn">Track Report</Link>
            <Link to="/map" className="btn secondary-btn">View Risk Map</Link>
          </div>

          <div className="hero-stats">
            <div><h3>{totalReports}</h3><p>Total reports</p></div>
            <div><h3>{criticalReports}</h3><p>Critical hotspots</p></div>
            <div><h3>24/7</h3><p>Public reporting</p></div>
          </div>
        </div>

        <div className="hero-demo-card">
          <div className="demo-card-header"><span className="pulse-dot"></span> Live Risk Alert</div>
          <h2>Sewage Leak Detected</h2>
          <p>Near Madaraka Primary School</p>
          <div className="demo-risk-score"><span>Risk Score</span><strong>94/100</strong></div>
          <div className="demo-status-list">
            <div><CheckCircle2 size={18} /> Verified by Maji Champion</div>
            <div><MapPinned size={18} /> Added to risk map</div>
            <div><AlertTriangle size={18} /> Critical priority</div>
          </div>
        </div>
      </section>

      <section className="problem-solution-section">
        <div className="problem-card">
          <span className="section-tag">Problem</span>
          <h2>Reports are scattered, delayed, and hard to verify.</h2>
          <p>
            Water and sanitation problems are often reported through informal channels, making it difficult
            for responsible authorities to identify hotspots, prioritize urgent cases, and prove action.
          </p>
        </div>
        <div className="solution-card">
          <span className="section-tag">Solution</span>
          <h2>One loop from report to verified resolution.</h2>
          <p>
            Make Kenya Clean connects public reporting, photo evidence, geolocation, risk scoring,
            community verification, dashboards, and progress tracking.
          </p>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="section-heading centered-heading">
          <span className="section-tag">How It Works</span>
          <h1>Report → Verify → Prioritize → Resolve</h1>
        </div>
        <div className="steps-grid">
          {[
            ["Report", Smartphone, "Anyone submits a water or sanitation issue with location and photo evidence."],
            ["Verify", ShieldCheck, "Maji Champions confirm reports and reduce fake or duplicate cases."],
            ["Prioritize", AlertTriangle, "The Maji Risk Index ranks urgent issues for faster response."],
            ["Confirm", CheckCircle2, "Before-and-after evidence shows whether the issue was truly resolved."],
          ].map(([title, Icon, text], index) => (
            <div className="step-card" key={title}>
              <div className="step-number">{String(index + 1).padStart(2, "0")}</div>
              <Icon size={34} />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>Built for citizens, communities, institutions, and authorities.</h2>
        <p>Make Kenya Clean turns public reports into actionable sanitation intelligence.</p>
        <Link to="/report" className="btn primary-btn">
          Start Reporting <ArrowRight size={18} />
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
    reporterType: "Public Reporter",
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    isAnonymous: true,
    nearSensitiveArea: "No",
    latitude: "",
    longitude: "",
  });
  const [submittedReport, setSubmittedReport] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const riskScore = calculateRiskScore(formData.issueType, formData.urgency, formData.nearSensitiveArea);
  const riskLabel = getRiskLabel(riskScore);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
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
      () => alert("Could not get your location. You can enter it manually.")
    );
  }

  async function uploadReportPhoto(reportId) {
    if (!photoFile) return "";

    if (!photoFile.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return "";
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      alert("Image is too large. Please upload an image under 5MB.");
      return "";
    }

    const extension = photoFile.name.split(".").pop() || "jpg";
    const filePath = `${reportId}.${extension}`;

    const { error } = await supabase.storage
      .from("report-photos")
      .upload(filePath, photoFile, { cacheControl: "3600", upsert: true });

    if (error) {
      console.error("Could not upload photo:", error.message);
      alert("Report was submitted, but photo upload failed.");
      return "";
    }

    const { data } = supabase.storage.from("report-photos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    const reportId = Date.now();
    const trackingCode = generateTrackingCode();
    const photoUrl = await uploadReportPhoto(reportId);

    const newReport = {
      id: reportId,
      trackingCode,
      ...formData,
      reporterName: formData.isAnonymous ? "" : formData.reporterName,
      reporterPhone: formData.isAnonymous ? "" : formData.reporterPhone,
      reporterEmail: formData.isAnonymous ? "" : formData.reporterEmail,
      area: formData.locationName || "Community Report",
      latitude: Number(formData.latitude) || -1.2921,
      longitude: Number(formData.longitude) || 36.8219,
      riskScore,
      riskLabel,
      status: "Reported",
      createdAt: new Date().toLocaleString(),
      photoUrl,
    };

    await addReport(newReport);
    setSubmittedReport(newReport);
    setPhotoFile(null);
    event.target.reset();

    setFormData({
      issueType: "Sewage Leak",
      locationName: "",
      description: "",
      urgency: "Medium",
      reporterType: "Public Reporter",
      reporterName: "",
      reporterPhone: "",
      reporterEmail: "",
      isAnonymous: true,
      nearSensitiveArea: "No",
      latitude: "",
      longitude: "",
    });

    setIsSubmitting(false);
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">Public Reporting</span>
        <h1>Report a Water or Sanitation Issue</h1>
        <p>Anyone can report an issue. Login is not required.</p>
      </section>

      <section className="report-layout">
        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Issue Type</label>
            <select name="issueType" value={formData.issueType} onChange={handleChange}>
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
            <button type="button" className="location-btn" onClick={handleUseCurrentLocation}>
              Use My Current Location
            </button>
            <p>This helps place the report accurately on the community risk map.</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Urgency Level</label>
            <select name="urgency" value={formData.urgency} onChange={handleChange}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Near a school, hospital, market, or water point?</label>
            <select name="nearSensitiveArea" value={formData.nearSensitiveArea} onChange={handleChange}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reporter Type</label>
            <select name="reporterType" value={formData.reporterType} onChange={handleChange}>
              <option>Public Reporter</option>
              <option>Resident</option>
              <option>Student</option>
              <option>Visitor</option>
              <option>Business Owner</option>
              <option>Market Trader</option>
              <option>Estate Manager</option>
              <option>School Representative</option>
              <option>Community Health Volunteer</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" name="isAnonymous" checked={formData.isAnonymous} onChange={handleChange} />
              Report anonymously
            </label>
            <small className="form-hint">Leave contact details only if you want follow-up.</small>
          </div>

          {!formData.isAnonymous && (
            <>
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" name="reporterName" value={formData.reporterName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="reporterPhone" value={formData.reporterPhone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="reporterEmail" value={formData.reporterEmail} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Photo Evidence</label>
            <input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files[0])} />
            <small className="form-hint">Upload a clear photo. Maximum recommended size: 5MB.</small>
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

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Submitting Report..." : "Submit Report"}
          </button>
        </form>

        <aside className="risk-preview-card">
          <span className="section-tag">Maji Risk Index</span>
          <h2>{riskScore}/100</h2>
          <p className={`risk-pill ${riskLabel.toLowerCase()}`}>{riskLabel} Risk</p>
          <p>This score helps authorities prioritize urgent water and sanitation risks.</p>

          {submittedReport && (
            <div className="submitted-card">
              <h3>Report Submitted</h3>
              <p><strong>Tracking Code:</strong> {submittedReport.trackingCode}</p>
              <p><strong>Issue:</strong> {submittedReport.issueType}</p>
              <p><strong>Location:</strong> {submittedReport.locationName}</p>
              <p><strong>Status:</strong> {submittedReport.status}</p>
              <p><strong>Risk:</strong> {submittedReport.riskLabel} · {submittedReport.riskScore}/100</p>
              <p><strong>Submitted:</strong> {submittedReport.createdAt}</p>
              <Link to="/track" className="btn secondary-btn">Track This Report</Link>
              {submittedReport.photoUrl && (
                <img src={submittedReport.photoUrl} alt="Submitted report evidence" className="submitted-photo" />
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function TrackReport({ reports }) {
  const [trackingCode, setTrackingCode] = useState("");
  const [searchedReport, setSearchedReport] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  function handleTrackReport(event) {
    event.preventDefault();
    const cleanCode = trackingCode.trim().toUpperCase();
    const foundReport = reports.find((report) => report.trackingCode?.toUpperCase() === cleanCode);
    setSearchedReport(foundReport || null);
    setHasSearched(true);
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">Public Report Tracking</span>
        <h1>Track Your Report</h1>
        <p>Enter your tracking code to check verification, assignment, and resolution progress.</p>
      </section>

      <section className="track-layout">
        <form className="report-form track-form" onSubmit={handleTrackReport}>
          <div className="form-group">
            <label>Tracking Code</label>
            <input
              type="text"
              placeholder="Example: MKC-2026-8392"
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">Track Report</button>
        </form>

        <aside className="risk-preview-card">
          {!hasSearched && (
            <>
              <span className="section-tag">How It Works</span>
              <h2>Use your report code</h2>
              <p>After submitting a report, use your tracking code here to follow its progress.</p>
            </>
          )}

          {hasSearched && !searchedReport && (
            <div className="submitted-card">
              <h3>No Report Found</h3>
              <p>Check the code and try again.</p>
            </div>
          )}

          {searchedReport && (
            <div className="submitted-card">
              <h3>Report Found</h3>
              <p><strong>Tracking Code:</strong> {searchedReport.trackingCode}</p>
              <p><strong>Issue:</strong> {searchedReport.issueType}</p>
              <p><strong>Location:</strong> {searchedReport.locationName}</p>
              <p><strong>Status:</strong> {searchedReport.status}</p>
              <p><strong>Risk:</strong> {searchedReport.riskLabel} · {searchedReport.riskScore}/100</p>
              <p><strong>Submitted:</strong> {searchedReport.createdAt}</p>
              {searchedReport.photoUrl && (
                <img src={searchedReport.photoUrl} alt="Report evidence" className="submitted-photo" />
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function MapView({ reports }) {
  const counts = {
    Critical: reports.filter((report) => report.riskLabel === "Critical").length,
    High: reports.filter((report) => report.riskLabel === "High").length,
    Medium: reports.filter((report) => report.riskLabel === "Medium").length,
  };

  return (
    <main className="page map-page">
      <section className="section-heading">
        <span className="section-tag">Live Community Mapping</span>
        <h1>Community Risk Map</h1>
        <p>View reported water and sanitation risks across communities.</p>
      </section>

      <section className="map-summary-grid">
        {Object.entries(counts).map(([label, count]) => (
          <div className={`map-summary-card ${label.toLowerCase()}-card`} key={label}>
            <h2>{count}</h2>
            <p>{label} hotspots</p>
          </div>
        ))}
      </section>

      <section className="map-layout">
        <div className="map-card">
          <MapContainer center={[-1.3107, 36.8124]} zoom={12} scrollWheelZoom className="leaflet-map">
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {reports.map((report) => (
              <Marker key={report.id} position={[report.latitude, report.longitude]}>
                <Popup>
                  <div className="map-popup">
                    <h3>{report.issueType}</h3>
                    <p><strong>Code:</strong> {report.trackingCode}</p>
                    <p><strong>Location:</strong> {report.locationName}</p>
                    <p><strong>Area:</strong> {report.area}</p>
                    <p><strong>Risk:</strong> {report.riskLabel} · {report.riskScore}/100</p>
                    <p><strong>Status:</strong> {report.status}</p>
                    {report.photoUrl && <img src={report.photoUrl} alt={report.issueType} className="popup-photo" />}
                    <p><strong>Reported by:</strong> {report.reporterType}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="map-side-panel">
          <h2>Priority Response Queue</h2>
          <p>Reports are ranked by risk score so urgent sanitation risks can be addressed first.</p>
          <div className="map-queue">
            {[...reports].sort((a, b) => b.riskScore - a.riskScore).map((report) => (
              <div className="queue-item" key={report.id}>
                <div>
                  <h3>{report.issueType}</h3>
                  <p>{report.locationName}</p>
                  <small>{report.status}</small>
                </div>
                <span className={`risk-pill small ${report.riskLabel.toLowerCase()}`}>{report.riskScore}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Dashboard({ reports, updateReportStatus, resetDemoData, profile }) {
  const totalReports = reports.length;
  const criticalReports = reports.filter((report) => report.riskLabel === "Critical").length;
  const resolvedReports = reports.filter((report) => ["Resolved", "Community Confirmed"].includes(report.status)).length;
  const averageRisk = totalReports ? Math.round(reports.reduce((sum, report) => sum + report.riskScore, 0) / totalReports) : 0;

  return (
    <main className="page dashboard-page">
      <section className="section-heading dashboard-heading-row">
        <div>
          <span className="section-tag">Response Intelligence</span>
          <h1>Make Kenya Clean Dashboard</h1>
          <p>
            Logged in as {profile?.full_name || "staff"} ({profile?.role || "staff"}). Track reports, hotspots, and response progress.
          </p>
        </div>
        <button type="button" className="reset-btn" onClick={resetDemoData}>Reset Demo Data</button>
      </section>

      <section className="stats-grid">
        <div className="stat-card"><Droplets size={30} /><div><p>Total Reports</p><h2>{totalReports}</h2></div></div>
        <div className="stat-card danger"><AlertTriangle size={30} /><div><p>Critical Cases</p><h2>{criticalReports}</h2></div></div>
        <div className="stat-card success"><CheckCircle2 size={30} /><div><p>Resolved Cases</p><h2>{resolvedReports}</h2></div></div>
        <div className="stat-card"><Timer size={30} /><div><p>Average Risk Score</p><h2>{averageRisk}/100</h2></div></div>
      </section>

      <section className="dashboard-layout">
        <div className="dashboard-panel">
          <div className="panel-header"><h2>Issue Categories</h2><p>Most reported water and sanitation challenges.</p></div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getIssueChartData(reports)}>
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
          <div className="panel-header"><h2>Priority Hotspots</h2><p>Areas requiring urgent attention.</p></div>
          <div className="hotspot-list">
            {reports.filter((report) => report.riskScore >= 75).map((report) => (
              <div className="hotspot-item" key={report.id}>
                <div><h3>{report.area}</h3><p>{report.issueType}</p></div>
                <span className={`risk-pill small ${report.riskLabel.toLowerCase()}`}>{report.riskScore}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-panel reports-panel">
        <div className="panel-header"><h2>Recent Community Reports</h2><p>Manage reports from the public and partner institutions.</p></div>
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Tracking Code</th>
                <th>Issue</th>
                <th>Location</th>
                <th>Risk</th>
                <th>Photo</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.trackingCode}</td>
                  <td>{report.issueType}</td>
                  <td>{report.locationName}</td>
                  <td><span className={`risk-pill table-pill ${report.riskLabel.toLowerCase()}`}>{report.riskLabel} · {report.riskScore}</span></td>
                  <td>{report.photoUrl ? <a href={report.photoUrl} target="_blank" rel="noreferrer">View Photo</a> : "No photo"}</td>
                  <td>
                    <select className="status-select" value={report.status} onChange={(event) => updateReportStatus(report.id, event.target.value)}>
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{report.isAnonymous ? report.reporterType : `${report.reporterName || report.reporterType}`}</td>
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
  const pendingVerification = reports.filter((report) => ["Reported", "Assigned"].includes(report.status));

  return (
    <main className="page champions-page">
      <section className="section-heading">
        <span className="section-tag">Community Verification</span>
        <h1>Maji Champions</h1>
        <p>Trusted verifiers confirm reports, reduce false cases, and support accountability.</p>
      </section>

      <section className="champions-overview-grid">
        <div className="champion-metric-card"><UserCheck size={34} /><div><p>Active Maji Champions</p><h2>{demoChampions.length}</h2></div></div>
        <div className="champion-metric-card"><ShieldCheck size={34} /><div><p>Verified Reports</p><h2>{demoChampions.reduce((sum, champion) => sum + champion.verifiedReports, 0)}</h2></div></div>
        <div className="champion-metric-card"><Camera size={34} /><div><p>Proof Cases</p><h2>{proofReports.length}</h2></div></div>
      </section>

      <section className="champions-layout">
        <div className="dashboard-panel">
          <div className="panel-header"><h2>Trusted Community Verifiers</h2><p>Local volunteers confirm issues on the ground.</p></div>
          <div className="champion-list">
            {demoChampions.map((champion) => (
              <div className="champion-card" key={champion.id}>
                <div className="champion-avatar">{champion.name.split(" ").map((part) => part[0]).join("")}</div>
                <div><h3>{champion.name}</h3><p>{champion.role}</p><small>{champion.area}</small></div>
                <span>{champion.verifiedReports} verified</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header"><h2>Pending Verification</h2><p>Reports needing local confirmation.</p></div>
          <div className="verification-list">
            {pendingVerification.length === 0 ? (
              <p>No reports are currently pending verification.</p>
            ) : (
              pendingVerification.map((report) => (
                <div className="verification-card" key={report.id}>
                  <div><h3>{report.issueType}</h3><p>{report.locationName}</p><small>{report.trackingCode}</small></div>
                  <button type="button" onClick={() => updateReportStatus(report.id, "Verified")}>Verify</button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-panel proof-panel">
        <div className="panel-header"><h2>Before & After Proof</h2><p>Visual proof and community confirmation create transparency.</p></div>
        <div className="proof-grid">
          {proofReports.map((report) => (
            <div className="proof-card" key={report.id}>
              <div className="proof-header"><div><h3>{report.issueType}</h3><p>{report.locationName}</p></div><span>{report.resolvedIn}</span></div>
              <div className="proof-images">
                <div className="proof-image before-proof"><Camera size={28} /><strong>Before</strong><p>{report.before}</p></div>
                <div className="proof-image after-proof"><CheckCircle2 size={28} /><strong>After</strong><p>{report.after}</p></div>
              </div>
              <div className="proof-status"><ShieldCheck size={18} />{report.status}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="community-loop-card">
        <Users size={36} />
        <div><h2>The Community Accountability Loop</h2><p>Report → Verify → Map → Prioritize → Act → Confirm → Learn.</p></div>
      </section>
    </main>
  );
}

function LoginPage({ setUser, setProfile }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    role: "champion",
    area: "",
    organizationName: "",
    email: "",
    password: "",
  });

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function loadProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return data;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) return alert(error.message);

      if (!data.session) {
        alert("Account created. Check your email to confirm it, then log in.");
        return;
      }

      const profilePayload = {
        id: data.user.id,
        full_name: form.fullName,
        role: form.role,
        area: form.area,
        organization_name: form.organizationName,
      };

      const { error: profileError } = await supabase.from("profiles").insert(profilePayload);
      if (profileError) return alert(`Account created, but profile failed: ${profileError.message}`);

      setUser(data.user);
      setProfile(profilePayload);
      alert("Account created successfully.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) return alert(error.message);

    setUser(data.user);
    setProfile(await loadProfile(data.user.id));
    alert("Logged in successfully.");
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">Authority Access</span>
        <h1>{mode === "login" ? "Login" : "Create Staff Account"}</h1>
        <p>Public reporting stays open. Login is for Maji Champions, admins, counties, schools, estates, and partner organizations.</p>
      </section>

      <section className="track-layout">
        <form className="report-form track-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div className="form-group"><label>Full Name</label><input name="fullName" value={form.fullName} onChange={updateField} required /></div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={updateField}>
                  <option value="champion">Maji Champion</option>
                  <option value="admin">Admin</option>
                  <option value="organization">Organization</option>
                </select>
              </div>
              <div className="form-group"><label>Area</label><input name="area" value={form.area} onChange={updateField} placeholder="Example: Madaraka" /></div>
              <div className="form-group"><label>Organization Name</label><input name="organizationName" value={form.organizationName} onChange={updateField} placeholder="County / school / estate / NGO" /></div>
            </>
          )}

          <div className="form-group"><label>Email Address</label><input type="email" name="email" value={form.email} onChange={updateField} required /></div>
          <div className="form-group"><label>Password</label><input type="password" name="password" value={form.password} onChange={updateField} minLength="6" required /></div>

          <button type="submit" className="submit-btn">{mode === "login" ? "Login" : "Create Account"}</button>
          <button type="button" className="link-btn" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Need an account? Create one" : "Already have an account? Login"}
          </button>
        </form>

        <aside className="risk-preview-card">
          <span className="section-tag">Protected Access</span>
          <h2>Who should log in?</h2>
          <p>Only users who verify, manage, or respond to reports need accounts.</p>
          <div className="demo-status-list">
            <div><ShieldCheck size={18} /> Maji Champions verify reports.</div>
            <div><LayoutDashboard size={18} /> Admins manage response status.</div>
            <div><Users size={18} /> Organizations track hotspots and impact.</div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ProtectedPage({ user, children }) {
  if (!user) {
    return (
      <main className="page form-page">
        <section className="section-heading">
          <span className="section-tag">Login Required</span>
          <h1>Protected Page</h1>
          <p>This page is for Maji Champions, admins, county teams, schools, estates, and partner organizations.</p>
          <Link to="/login" className="btn primary-btn">Login to Continue <ArrowRight size={18} /></Link>
        </section>
      </main>
    );
  }
  return children;
}

function App() {
  const [reports, setReports] = useState(initialReports);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  async function loadCurrentUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(data.user);
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    setProfile(profileData);
  }

  useEffect(() => {
    async function loadReports() {
      const { data, error } = await supabase.from("reports").select("*").order("id", { ascending: false });

      if (error) {
        console.error("Could not load reports:", error.message);
        const savedReports = localStorage.getItem("makeKenyaCleanReports");
        setReports(savedReports ? JSON.parse(savedReports) : initialReports);
      } else {
        setReports(data.length ? data.map(fromSupabaseReport) : initialReports);
      }

      setIsLoadingReports(false);
    }

    loadReports();
    loadCurrentUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => loadCurrentUser());
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("makeKenyaCleanReports", JSON.stringify(reports));
  }, [reports]);

  async function addReport(newReport) {
    setReports((currentReports) => [newReport, ...currentReports]);

    const { error } = await supabase.from("reports").insert(toSupabaseReport(newReport));
    if (error) {
      console.error("Could not save report:", error.message);
      alert("The report was added locally, but it could not be saved online. Check Supabase settings.");
    }
  }

  async function updateReportStatus(reportId, newStatus) {
    setReports((currentReports) =>
      currentReports.map((report) => (report.id === reportId ? { ...report, status: newStatus } : report))
    );

    const { error } = await supabase.from("reports").update({ status: newStatus }).eq("id", reportId);
    if (error) {
      console.error("Could not update report status:", error.message);
      alert("Status changed locally, but it could not be saved online.");
    }
  }

  async function resetDemoData() {
    const confirmed = window.confirm("This will reset reports back to the original demo data. Continue?");
    if (!confirmed) return;

    setReports(initialReports);

    const { error: deleteError } = await supabase.from("reports").delete().neq("id", 0);
    if (deleteError) return alert("Local demo data was reset, but online reports were not cleared.");

    const { error: insertError } = await supabase.from("reports").insert(initialReports.map(toSupabaseReport));
    if (insertError) alert("Local demo data was reset, but online demo data was not restored.");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="logo"><Droplets size={24} /> Make Kenya Clean</Link>
        <div className="nav-links">
          <Link to="/"><Home size={18} /> Home</Link>
          <Link to="/report">Report</Link>
          <Link to="/track">Track</Link>
          <Link to="/map">Map</Link>
          <Link to="/dashboard"><LayoutDashboard size={18} /> Dashboard</Link>
          <Link to="/champions">Champions</Link>
          {user ? <button type="button" className="nav-button" onClick={handleLogout}>Logout</button> : <Link to="/login">Login</Link>}
        </div>
      </nav>

      {isLoadingReports ? (
        <main className="page"><h1>Loading Make Kenya Clean...</h1><p>Preparing community reports and risk dashboard.</p></main>
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage reports={reports} />} />
          <Route path="/report" element={<ReportIssue addReport={addReport} />} />
          <Route path="/track" element={<TrackReport reports={reports} />} />
          <Route path="/map" element={<MapView reports={reports} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} setProfile={setProfile} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedPage user={user}>
                <Dashboard reports={reports} updateReportStatus={updateReportStatus} resetDemoData={resetDemoData} profile={profile} />
              </ProtectedPage>
            }
          />
          <Route
            path="/champions"
            element={
              <ProtectedPage user={user}>
                <Champions reports={reports} updateReportStatus={updateReportStatus} />
              </ProtectedPage>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
