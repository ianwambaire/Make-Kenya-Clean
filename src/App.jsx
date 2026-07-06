import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
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
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
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

const emptyReportForm = {
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
};

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
    trackingCode: report.tracking_code,
    issueType: report.issue_type,
    locationName: report.location_name,
    area: report.area,
    description: report.description || "",
    latitude: Number(report.latitude),
    longitude: Number(report.longitude),
    urgency: report.urgency || "",
    reporterType: report.reporter_type || "Public Reporter",
    reporterName: report.reporter_name || "",
    reporterPhone: report.reporter_phone || "",
    reporterEmail: report.reporter_email || "",
    isAnonymous: report.is_anonymous ?? true,
    nearSensitiveArea: report.near_sensitive_area || "No",
    riskScore: Number(report.risk_score) || 0,
    riskLabel: report.risk_label || "Low",
    status: report.status || "Reported",
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

  const urgencyScores = {
    Low: 5,
    Medium: 15,
    High: 25,
    Critical: 35,
  };

  const sensitiveAreaScore =
    nearSensitiveArea === "Yes" ? 20 : 0;

  return Math.min(
    30 +
      (issueScores[issueType] || 10) +
      (urgencyScores[urgency] || 5) +
      sensitiveAreaScore,
    100
  );
}

function getRiskLabel(score) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function generateTrackingCode() {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(
    100000 + Math.random() * 900000
  );

  return `MKC-${year}-${randomPart}`;
}

function getIssueChartData(reports) {
  const counts = {};

  reports.forEach((report) => {
    counts[report.issueType] =
      (counts[report.issueType] || 0) + 1;
  });

  return Object.entries(counts).map(
    ([issue, count]) => ({
      issue,
      count,
    })
  );
}

function getDefaultStatusNote(status) {
  const notes = {
    Reported: "Report received successfully.",
    Verified: "The issue has been verified.",
    Assigned:
      "The report has been assigned for response.",
    "In Progress": "Response work has started.",
    Resolved:
      "The issue has been marked as resolved.",
    "Community Confirmed":
      "The community has confirmed that the issue was resolved.",
  };

  return notes[status] || "Report status updated.";
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function LandingPage({ reports }) {
  const totalReports = reports.length;

  const criticalReports = reports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;

  const latestCriticalReport = reports.find(
    (report) => report.riskLabel === "Critical"
  );

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">
            Smart Water & Sanitation Intelligence
          </div>

          <h1>Make Kenya Clean</h1>

          <p className="hero-text">
            A public water and sanitation platform where
            anyone can report issues, upload evidence,
            track progress, and help responsible teams
            prioritize urgent action.
          </p>

          <div className="hero-actions">
            <Link
              to="/report"
              className="btn primary-btn"
            >
              Report an Issue
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/track"
              className="btn secondary-btn"
            >
              Track Report
            </Link>

            <Link
              to="/map"
              className="btn secondary-btn"
            >
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
              <h3>24/7</h3>
              <p>Public reporting</p>
            </div>
          </div>
        </div>

        <div className="hero-demo-card">
          <div className="demo-card-header">
            <span className="pulse-dot"></span>
            Latest Priority Report
          </div>

          {latestCriticalReport ? (
            <>
              <h2>
                {latestCriticalReport.issueType}
              </h2>

              <p>
                {latestCriticalReport.locationName}
              </p>

              <div className="demo-risk-score">
                <span>Risk Score</span>

                <strong>
                  {latestCriticalReport.riskScore}/100
                </strong>
              </div>

              <div className="demo-status-list">
                <div>
                  <MapPinned size={18} />
                  Added to public risk map
                </div>

                <div>
                  <AlertTriangle size={18} />
                  Critical priority
                </div>

                <div>
                  <CheckCircle2 size={18} />
                  Status: {latestCriticalReport.status}
                </div>
              </div>
            </>
          ) : (
            <>
              <h2>No critical reports yet</h2>

              <p>
                New urgent community reports will appear
                here.
              </p>
            </>
          )}
        </div>
      </section>

      <section className="problem-solution-section">
        <div className="problem-card">
          <span className="section-tag">
            Problem
          </span>

          <h2>
            Water and sanitation reports are scattered,
            delayed, and difficult to track.
          </h2>

          <p>
            Issues are often reported through informal
            channels, making it difficult to identify
            hotspots, prioritize urgent cases, and confirm
            whether action was taken.
          </p>
        </div>

        <div className="solution-card">
          <span className="section-tag">
            Solution
          </span>

          <h2>
            One accountability loop from report to
            resolution.
          </h2>

          <p>
            Make Kenya Clean connects public reporting,
            evidence, geolocation, risk scoring,
            verification, response tracking, and public
            progress updates.
          </p>
        </div>
      </section>

      <section className="how-it-works-section">
        <div className="section-heading centered-heading">
          <span className="section-tag">
            How It Works
          </span>

          <h1>
            Report → Verify → Prioritize → Resolve
          </h1>
        </div>

        <div className="steps-grid">
          {[
            [
              "Report",
              Smartphone,
              "Anyone submits an issue with location and photo evidence.",
            ],
            [
              "Verify",
              ShieldCheck,
              "Approved Maji Champions confirm reports.",
            ],
            [
              "Prioritize",
              AlertTriangle,
              "The Maji Risk Index ranks urgent issues.",
            ],
            [
              "Confirm",
              CheckCircle2,
              "Status history shows the journey to resolution.",
            ],
          ].map(([title, Icon, text], index) => (
            <div className="step-card" key={title}>
              <div className="step-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <Icon size={34} />

              <h3>{title}</h3>

              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>
          Built for the public, communities,
          institutions, and authorities.
        </h2>

        <p>
          Make Kenya Clean turns public reports into
          actionable water and sanitation intelligence.
        </p>

        <Link
          to="/report"
          className="btn primary-btn"
        >
          Start Reporting
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

function ReportIssue({ addReport }) {
  const [formData, setFormData] =
    useState(emptyReportForm);

  const [submittedReport, setSubmittedReport] =
    useState(null);

  const [photoFile, setPhotoFile] =
    useState(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const riskScore = calculateRiskScore(
    formData.issueType,
    formData.urgency,
    formData.nearSensitiveArea
  );

  const riskLabel = getRiskLabel(riskScore);

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox" ? checked : value,
    }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      alert(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((current) => ({
          ...current,
          latitude:
            position.coords.latitude.toFixed(6),
          longitude:
            position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        alert(
          "Could not get your location. You can enter it manually."
        );
      }
    );
  }

  async function uploadReportPhoto(reportId) {
    if (!photoFile) return "";

    if (!photoFile.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return "";
    }

    if (photoFile.size > 5 * 1024 * 1024) {
      alert(
        "Image is too large. Please upload an image under 5MB."
      );

      return "";
    }

    const extension =
      photoFile.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath = `${reportId}.${extension}`;

    const { error } = await supabase.storage
      .from("report-photos")
      .upload(filePath, photoFile, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(
        "Could not upload photo:",
        error.message
      );

      alert(
        "The photo could not be uploaded. The report can still be submitted."
      );

      return "";
    }

    const { data } = supabase.storage
      .from("report-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);

    const reportId = Date.now();

    const trackingCode =
      generateTrackingCode();

    const photoUrl =
      await uploadReportPhoto(reportId);

    const newReport = {
      id: reportId,
      trackingCode,
      ...formData,
      reporterName: formData.isAnonymous
        ? ""
        : formData.reporterName.trim(),
      reporterPhone: formData.isAnonymous
        ? ""
        : formData.reporterPhone.trim(),
      reporterEmail: formData.isAnonymous
        ? ""
        : formData.reporterEmail.trim(),
      area: formData.locationName.trim(),
      latitude:
        Number(formData.latitude) || -1.2921,
      longitude:
        Number(formData.longitude) || 36.8219,
      riskScore,
      riskLabel,
      status: "Reported",
      createdAt: new Date().toISOString(),
      photoUrl,
    };

    const savedSuccessfully =
      await addReport(newReport);

    if (!savedSuccessfully) {
      setIsSubmitting(false);
      return;
    }

    setSubmittedReport(newReport);
    setPhotoFile(null);
    setFormData(emptyReportForm);

    alert(
      `Report submitted successfully.\n\nTracking code: ${trackingCode}\n\nSave this code to track your report.`
    );

    setIsSubmitting(false);
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">
          Public Reporting
        </span>

        <h1>
          Report a Water or Sanitation Issue
        </h1>

        <p>
          Anyone can submit a report. No account is
          required.
        </p>
      </section>

      <section className="report-layout">
        <form
          className="report-form"
          onSubmit={handleSubmit}
        >
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
              This helps place the report accurately
              on the risk map.
            </p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>

              <input
                type="number"
                step="any"
                name="latitude"
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
            <label>
              Near a school, hospital, market, or
              water point?
            </label>

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
              <option>Public Reporter</option>
              <option>Resident</option>
              <option>Student</option>
              <option>Visitor</option>
              <option>Business Owner</option>
              <option>Market Trader</option>
              <option>Estate Manager</option>
              <option>School Representative</option>
              <option>
                Community Health Volunteer
              </option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAnonymous"
                checked={formData.isAnonymous}
                onChange={handleChange}
              />

              Report anonymously
            </label>

            <small className="form-hint">
              Leave contact details only if you want
              follow-up.
            </small>
          </div>

          {!formData.isAnonymous && (
            <>
              <div className="form-group">
                <label>Your Name</label>

                <input
                  type="text"
                  name="reporterName"
                  value={formData.reporterName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="reporterPhone"
                  value={formData.reporterPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  name="reporterEmail"
                  value={formData.reporterEmail}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Photo Evidence</label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setPhotoFile(
                  event.target.files?.[0] || null
                )
              }
            />

            <small className="form-hint">
              Upload a clear image under 5MB.
            </small>
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

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting Report..."
              : "Submit Report"}
          </button>
        </form>

        <aside className="risk-preview-card">
          <span className="section-tag">
            Maji Risk Index
          </span>

          <h2>{riskScore}/100</h2>

          <p
            className={`risk-pill ${riskLabel.toLowerCase()}`}
          >
            {riskLabel} Risk
          </p>

          <p>
            This score helps response teams prioritize
            urgent water and sanitation risks.
          </p>

          {submittedReport && (
            <div className="submitted-card">
              <h3>Report Submitted</h3>

              <div className="tracking-code-box">
                <span>Your Tracking Code</span>

                <strong>
                  {submittedReport.trackingCode}
                </strong>

                <small>
                  Save this code to follow your report.
                </small>
              </div>

              <p>
                <strong>Issue:</strong>{" "}
                {submittedReport.issueType}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {submittedReport.locationName}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {submittedReport.status}
              </p>

              <Link
                to="/track"
                className="btn secondary-btn"
              >
                Track This Report
              </Link>

              {submittedReport.photoUrl && (
                <img
                  src={submittedReport.photoUrl}
                  alt="Submitted report evidence"
                  className="submitted-photo"
                />
              )}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function TrackReport() {
  const [trackingCode, setTrackingCode] =
    useState("");

  const [searchedReport, setSearchedReport] =
    useState(null);

  const [updates, setUpdates] = useState([]);

  const [hasSearched, setHasSearched] =
    useState(false);

  const [isSearching, setIsSearching] =
    useState(false);

  async function handleTrackReport(event) {
    event.preventDefault();

    const cleanCode =
      trackingCode.trim().toUpperCase();

    setIsSearching(true);
    setHasSearched(false);
    setSearchedReport(null);
    setUpdates([]);

    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("reports")
      .select("*")
      .eq("tracking_code", cleanCode)
      .maybeSingle();

    if (reportError) {
      console.error(
        "Could not track report:",
        reportError.message
      );

      alert(
        "Something went wrong while searching for the report."
      );

      setIsSearching(false);
      return;
    }

    if (!reportData) {
      setHasSearched(true);
      setIsSearching(false);
      return;
    }

    const report =
      fromSupabaseReport(reportData);

    const {
      data: updateData,
      error: updateError,
    } = await supabase
      .from("report_updates")
      .select("*")
      .eq("report_id", report.id)
      .order("created_at", {
        ascending: true,
      });

    if (updateError) {
      console.error(
        "Could not load report timeline:",
        updateError.message
      );
    }

    setSearchedReport(report);
    setUpdates(updateData || []);
    setHasSearched(true);
    setIsSearching(false);
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">
          Public Report Tracking
        </span>

        <h1>Track Your Report</h1>

        <p>
          Enter your tracking code to follow
          verification, assignment, response, and
          resolution.
        </p>
      </section>

      <section className="track-layout">
        <form
          className="report-form track-form"
          onSubmit={handleTrackReport}
        >
          <div className="form-group">
            <label>Tracking Code</label>

            <input
              type="text"
              placeholder="Example: MKC-2026-123456"
              value={trackingCode}
              onChange={(event) =>
                setTrackingCode(event.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isSearching}
          >
            {isSearching
              ? "Searching..."
              : "Track Report"}
          </button>
        </form>

        <aside className="risk-preview-card">
          {!hasSearched && (
            <>
              <span className="section-tag">
                How It Works
              </span>

              <h2>Follow every stage</h2>

              <p>
                Your tracking code lets you follow a
                report without creating an account.
              </p>
            </>
          )}

          {hasSearched && !searchedReport && (
            <div className="submitted-card">
              <h3>No Report Found</h3>

              <p>
                Check the tracking code and try again.
              </p>
            </div>
          )}

          {searchedReport && (
            <div className="submitted-card">
              <h3>Report Found</h3>

              <div className="tracking-code-box">
                <span>Tracking Code</span>

                <strong>
                  {searchedReport.trackingCode}
                </strong>
              </div>

              <p>
                <strong>Issue:</strong>{" "}
                {searchedReport.issueType}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {searchedReport.locationName}
              </p>

              <p>
                <strong>Current Status:</strong>{" "}
                {searchedReport.status}
              </p>

              <p>
                <strong>Risk:</strong>{" "}
                {searchedReport.riskLabel} ·{" "}
                {searchedReport.riskScore}/100
              </p>

              {searchedReport.photoUrl && (
                <img
                  src={searchedReport.photoUrl}
                  alt="Report evidence"
                  className="submitted-photo"
                />
              )}
            </div>
          )}
        </aside>
      </section>

      {searchedReport && (
        <section className="dashboard-panel timeline-panel">
          <div className="panel-header">
            <h2>Report Timeline</h2>

            <p>
              Follow every recorded action on this
              report.
            </p>
          </div>

          <div className="report-timeline">
            {updates.length === 0 ? (
              <p>
                No timeline updates have been recorded.
              </p>
            ) : (
              updates.map((update, index) => (
                <div
                  className="timeline-item"
                  key={update.id}
                >
                  <div className="timeline-marker">
                    <span>{index + 1}</span>
                  </div>

                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h3>{update.status}</h3>

                      <span>
                        {formatDate(
                          update.created_at
                        )}
                      </span>
                    </div>

                    {update.note && (
                      <p>{update.note}</p>
                    )}

                    <small>
                      Updated by{" "}
                      {update.updated_by_name ||
                        "Make Kenya Clean"}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function MapView({ reports }) {
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
        </div>

        <div className="map-side-panel">
          <h2>Priority Response Queue</h2>

          <p>
            Reports are ranked by risk score.
          </p>

          {reports.length === 0 ? (
            <p>
              No reports have been submitted yet.
            </p>
          ) : (
            <div className="map-queue">
              {[...reports]
                .sort(
                  (a, b) =>
                    b.riskScore - a.riskScore
                )
                .map((report) => (
                  <div
                    className="queue-item"
                    key={report.id}
                  >
                    <div>
                      <h3>{report.issueType}</h3>

                      <p>
                        {report.locationName}
                      </p>

                      <small>
                        {report.status}
                      </small>
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

function Dashboard({
  reports,
  updateReportStatus,
  profile,
}) {
  const totalReports = reports.length;

  const criticalReports = reports.filter(
    (report) => report.riskLabel === "Critical"
  ).length;

  const resolvedReports = reports.filter(
    (report) =>
      [
        "Resolved",
        "Community Confirmed",
      ].includes(report.status)
  ).length;

  const averageRisk = totalReports
    ? Math.round(
        reports.reduce(
          (sum, report) =>
            sum + report.riskScore,
          0
        ) / totalReports
      )
    : 0;

  const canManageReports =
    profile?.role === "admin";

  async function handleStatusChange(
    reportId,
    newStatus
  ) {
    const note = window.prompt(
      `Add an optional note for the "${newStatus}" update:`
    );

    if (note === null) return;

    await updateReportStatus(
      reportId,
      newStatus,
      note.trim()
    );
  }

  return (
    <main className="page dashboard-page">
      <section className="section-heading">
        <span className="section-tag">
          Response Intelligence
        </span>

        <h1>Make Kenya Clean Dashboard</h1>

        <p>
          Logged in as{" "}
          {profile?.full_name || "staff"} (
          {profile?.role || "staff"}).
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

            <p>
              Most reported water and sanitation
              challenges.
            </p>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={getIssueChartData(reports)}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

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

            <p>
              Areas requiring urgent attention.
            </p>
          </div>

          <div className="hotspot-list">
            {reports
              .filter(
                (report) =>
                  report.riskScore >= 75
              )
              .map((report) => (
                <div
                  className="hotspot-item"
                  key={report.id}
                >
                  <div>
                    <h3>{report.area}</h3>

                    <p>
                      {report.issueType}
                    </p>
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
          <h2>Community Reports</h2>

          <p>
            View and manage reports stored in the
            database.
          </p>
        </div>

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
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    No reports have been submitted yet.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      {report.trackingCode}
                    </td>

                    <td>
                      {report.issueType}
                    </td>

                    <td>
                      {report.locationName}
                    </td>

                    <td>
                      <span
                        className={`risk-pill table-pill ${report.riskLabel.toLowerCase()}`}
                      >
                        {report.riskLabel} ·{" "}
                        {report.riskScore}
                      </span>
                    </td>

                    <td>
                      {report.photoUrl ? (
                        <a
                          href={report.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Photo
                        </a>
                      ) : (
                        "No photo"
                      )}
                    </td>

                    <td>
                      {canManageReports ? (
                        <select
                          className="status-select"
                          value={report.status}
                          onChange={(event) =>
                            handleStatusChange(
                              report.id,
                              event.target.value
                            )
                          }
                        >
                          {statuses.map(
                            (status) => (
                              <option
                                key={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        report.status
                      )}
                    </td>

                    <td>
                      {report.isAnonymous
                        ? report.reporterType
                        : report.reporterName ||
                          report.reporterType}
                    </td>

                    <td>
                      {formatDate(
                        report.createdAt
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Champions({
  reports,
  updateReportStatus,
  profile,
}) {
  const pendingVerification = reports.filter(
    (report) => report.status === "Reported"
  );

  const verifiedCount = reports.filter(
    (report) => report.status === "Verified"
  ).length;

  const resolvedCount = reports.filter(
    (report) =>
      [
        "Resolved",
        "Community Confirmed",
      ].includes(report.status)
  ).length;

  const canVerify =
    profile?.role === "champion" ||
    profile?.role === "admin";

  return (
    <main className="page champions-page">
      <section className="section-heading">
        <span className="section-tag">
          Community Verification
        </span>

        <h1>Maji Champions</h1>

        <p>
          Approved verifiers confirm public reports and
          support accountability.
        </p>
      </section>

      <section className="champions-overview-grid">
        <div className="champion-metric-card">
          <UserCheck size={34} />

          <div>
            <p>Pending Verification</p>
            <h2>{pendingVerification.length}</h2>
          </div>
        </div>

        <div className="champion-metric-card">
          <ShieldCheck size={34} />

          <div>
            <p>Verified Reports</p>
            <h2>{verifiedCount}</h2>
          </div>
        </div>

        <div className="champion-metric-card">
          <CheckCircle2 size={34} />

          <div>
            <p>Resolved Reports</p>
            <h2>{resolvedCount}</h2>
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <h2>Reports Awaiting Verification</h2>

          <p>
            Review reports that still need
            confirmation.
          </p>
        </div>

        <div className="verification-list">
          {pendingVerification.length === 0 ? (
            <p>
              No reports are currently pending
              verification.
            </p>
          ) : (
            pendingVerification.map((report) => (
              <div
                className="verification-card"
                key={report.id}
              >
                <div>
                  <h3>{report.issueType}</h3>

                  <p>
                    {report.locationName}
                  </p>

                  <small>
                    {report.trackingCode}
                  </small>
                </div>

                {canVerify && (
                  <button
                    type="button"
                    onClick={() =>
                      updateReportStatus(
                        report.id,
                        "Verified",
                        "Report verified by an approved Maji Champion."
                      )
                    }
                  >
                    Verify
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="community-loop-card">
        <Users size={36} />

        <div>
          <h2>
            The Community Accountability Loop
          </h2>

          <p>
            Report → Verify → Map → Prioritize → Act →
            Confirm → Learn.
          </p>
        </div>
      </section>
    </main>
  );
}

function RequestAccessPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    requestedRole: "champion",
    area: "",
    organizationName: "",
    reason: "",
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);

    const { error } = await supabase
      .from("access_requests")
      .insert({
        full_name: form.fullName.trim(),
        email: form.email
          .trim()
          .toLowerCase(),
        phone: form.phone.trim(),
        requested_role: form.requestedRole,
        area: form.area.trim(),
        organization_name:
          form.organizationName.trim(),
        reason: form.reason.trim(),
        status: "Pending",
      });

    if (error) {
      console.error(
        "Could not submit access request:",
        error.message
      );

      alert(
        "Your access request could not be submitted."
      );

      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    setIsSubmitting(false);
  }

  if (submitted) {
    return (
      <main className="page form-page">
        <section className="section-heading">
          <span className="section-tag">
            Request Received
          </span>

          <h1>
            Your access request has been submitted
          </h1>

          <p>
            An administrator will review your request.
          </p>

          <Link
            to="/"
            className="btn primary-btn"
          >
            Return Home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">
          Staff Access
        </span>

        <h1>Request Access</h1>

        <p>
          Public reporting and tracking do not require
          an account.
        </p>
      </section>

      <section className="track-layout">
        <form
          className="report-form track-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label>Full Name</label>

            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Access Type</label>

            <select
              name="requestedRole"
              value={form.requestedRole}
              onChange={handleChange}
            >
              <option value="champion">
                Maji Champion
              </option>

              <option value="organization">
                Organization
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Area</label>

            <input
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="Example: Kibera, Langata, South B"
            />
          </div>

          {form.requestedRole ===
            "organization" && (
            <div className="form-group">
              <label>Organization Name</label>

              <input
                name="organizationName"
                value={form.organizationName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>
              Why do you need access?
            </label>

            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows="5"
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting Request..."
              : "Request Access"}
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginPage({
  setUser,
  setProfile,
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const [isSendingReset, setIsSendingReset] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleForgotPassword() {
    const email =
      form.email.trim().toLowerCase();

    if (!email) {
      alert(
        "Enter your email address first, then click Forgot password."
      );

      return;
    }

    setIsSendingReset(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

    if (error) {
      console.error(
        "Password reset error:",
        error.message
      );

      alert(error.message);

      setIsSendingReset(false);
      return;
    }

    alert(
      "Password reset email sent. Open the newest email and click the reset link."
    );

    setIsSendingReset(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoggingIn(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: form.email
          .trim()
          .toLowerCase(),
        password: form.password,
      });

    if (error) {
      alert(error.message);
      setIsLoggingIn(false);
      return;
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      await supabase.auth.signOut();

      alert(
        "This account does not have an approved Make Kenya Clean staff profile."
      );

      setIsLoggingIn(false);
      return;
    }

    if (profileData.role === "pending") {
      await supabase.auth.signOut();

      alert(
        "Your staff access is still pending approval."
      );

      setIsLoggingIn(false);
      return;
    }

    setUser(data.user);
    setProfile(profileData);

    setIsLoggingIn(false);
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">
          Staff Access
        </span>

        <h1>Staff Login</h1>

        <p>
          Public reporting and tracking remain open to
          everyone.
        </p>
      </section>

      <section className="track-layout">
        <form
          className="report-form track-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isLoggingIn}
          >
            {isLoggingIn
              ? "Logging In..."
              : "Login"}
          </button>

          <button
            type="button"
            className="link-btn"
            onClick={handleForgotPassword}
            disabled={isSendingReset}
          >
            {isSendingReset
              ? "Sending reset email..."
              : "Forgot password?"}
          </button>

          <Link
            to="/request-access"
            className="link-btn"
          >
            Need staff access? Submit a request
          </Link>
        </form>

        <aside className="risk-preview-card">
          <span className="section-tag">
            Protected Access
          </span>

          <h2>Approved users only</h2>

          <p>
            Accounts are reviewed before users can
            verify reports or access operational tools.
          </p>
        </aside>
      </section>
    </main>
  );
}

function UpdatePasswordPage() {
  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [isCheckingSession, setIsCheckingSession] =
    useState(true);

  const [recoveryReady, setRecoveryReady] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkRecoverySession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        console.error(
          "Recovery session error:",
          error.message
        );
      }

      if (session) {
        setRecoveryReady(true);
      }

      setIsCheckingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (
          event === "PASSWORD_RECOVERY" ||
          (event === "SIGNED_IN" && session)
        ) {
          setRecoveryReady(true);
          setIsCheckingSession(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(event) {
    event.preventDefault();

    if (password.length < 8) {
      alert(
        "Your new password must be at least 8 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      alert("The passwords do not match.");
      return;
    }

    setIsUpdating(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(
        "Password update error:",
        error.message
      );

      alert(error.message);

      setIsUpdating(false);
      return;
    }

    alert(
      "Password updated successfully. You can now log in with your new password."
    );

    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  return (
    <main className="page form-page">
      <section className="section-heading">
        <span className="section-tag">
          Password Recovery
        </span>

        <h1>Set a New Password</h1>

        <p>
          Enter and confirm your new Make Kenya Clean
          password.
        </p>
      </section>

      <section className="track-layout">
        <form
          className="report-form track-form"
          onSubmit={handleUpdatePassword}
        >
          {isCheckingSession && (
            <p>
              Checking your password recovery link...
            </p>
          )}

          {!isCheckingSession &&
            !recoveryReady && (
              <div className="submitted-card">
                <h3>
                  Recovery link not active
                </h3>

                <p>
                  Go back to the login page, enter your
                  email address, click Forgot password,
                  and open the newest email.
                </p>

                <Link
                  to="/login"
                  className="btn secondary-btn"
                >
                  Return to Login
                </Link>
              </div>
            )}

          {recoveryReady && (
            <>
              <div className="form-group">
                <label>New Password</label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  minLength="8"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  minLength="8"
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isUpdating}
              >
                {isUpdating
                  ? "Updating Password..."
                  : "Update Password"}
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

function ProtectedPage({
  user,
  profile,
  allowedRoles,
  children,
}) {
  if (!user || !profile) {
    return (
      <main className="page form-page">
        <section className="section-heading">
          <span className="section-tag">
            Login Required
          </span>

          <h1>Protected Page</h1>

          <p>
            Login with an approved staff account to
            continue.
          </p>

          <Link
            to="/login"
            className="btn primary-btn"
          >
            Login to Continue
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(profile.role)
  ) {
    return (
      <main className="page form-page">
        <section className="section-heading">
          <span className="section-tag">
            Access Restricted
          </span>

          <h1>You do not have permission</h1>

          <p>
            Your current account role cannot access
            this page.
          </p>
        </section>
      </main>
    );
  }

  return children;
}

function App() {
  const [reports, setReports] = useState([]);

  const [
    isLoadingReports,
    setIsLoadingReports,
  ] = useState(true);

  const [user, setUser] = useState(null);

  const [profile, setProfile] =
    useState(null);

  async function loadReports() {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Could not load reports:",
        error.message
      );

      setReports([]);
      setIsLoadingReports(false);
      return;
    }

    setReports(
      (data || []).map(fromSupabaseReport)
    );

    setIsLoadingReports(false);
  }

  async function loadCurrentUser() {
    const { data } =
      await supabase.auth.getUser();

    if (!data.user) {
      setUser(null);
      setProfile(null);
      return;
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(data.user);
    setProfile(profileData);
  }

  useEffect(() => {
    loadReports();
    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      () => {
        loadCurrentUser();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function addReport(newReport) {
    const { error: reportError } =
      await supabase
        .from("reports")
        .insert(
          toSupabaseReport(newReport)
        );

    if (reportError) {
      console.error(
        "Could not save report:",
        reportError.message
      );

      alert(
        "The report could not be saved. Please try again."
      );

      return false;
    }

    const { error: updateError } =
      await supabase
        .from("report_updates")
        .insert({
          report_id: newReport.id,
          status: "Reported",
          note: "Report received successfully.",
          updated_by_name: "Public Reporter",
        });

    if (updateError) {
      console.error(
        "Could not create initial timeline update:",
        updateError.message
      );
    }

    setReports((current) => [
      newReport,
      ...current,
    ]);

    return true;
  }

  async function updateReportStatus(
    reportId,
    newStatus,
    note = ""
  ) {
    const currentReport = reports.find(
      (report) => report.id === reportId
    );

    if (!currentReport) {
      return false;
    }

    const oldStatus = currentReport.status;

    setReports((current) =>
      current.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: newStatus,
            }
          : report
      )
    );

    const { error: statusError } =
      await supabase
        .from("reports")
        .update({
          status: newStatus,
        })
        .eq("id", reportId);

    if (statusError) {
      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: oldStatus,
              }
            : report
        )
      );

      alert(
        "The status could not be updated."
      );

      return false;
    }

    const updaterName =
      profile?.full_name ||
      user?.email ||
      "Make Kenya Clean Staff";

    const { error: timelineError } =
      await supabase
        .from("report_updates")
        .insert({
          report_id: reportId,
          status: newStatus,
          note:
            note ||
            getDefaultStatusNote(newStatus),
          updated_by: user?.id || null,
          updated_by_name: updaterName,
        });

    if (timelineError) {
      console.error(
        "Could not save timeline update:",
        timelineError.message
      );
    }

    return true;
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
  }

  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link
          to="/"
          className="logo"
        >
          <Droplets size={24} />
          Make Kenya Clean
        </Link>

        <div className="nav-links">
          <Link to="/">
            <Home size={18} />
            Home
          </Link>

          <Link to="/report">
            Report
          </Link>

          <Link to="/track">
            Track
          </Link>

          <Link to="/map">
            Map
          </Link>

          <Link to="/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link to="/champions">
            Champions
          </Link>

          {user ? (
            <button
              type="button"
              className="nav-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <Link to="/login">
              Staff Login
            </Link>
          )}
        </div>
      </nav>

      {isLoadingReports ? (
        <main className="page">
          <h1>
            Loading Make Kenya Clean...
          </h1>

          <p>
            Preparing reports and risk data.
          </p>
        </main>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <LandingPage
                reports={reports}
              />
            }
          />

          <Route
            path="/report"
            element={
              <ReportIssue
                addReport={addReport}
              />
            }
          />

          <Route
            path="/track"
            element={<TrackReport />}
          />

          <Route
            path="/map"
            element={
              <MapView
                reports={reports}
              />
            }
          />

          <Route
            path="/request-access"
            element={<RequestAccessPage />}
          />

          <Route
            path="/login"
            element={
              <LoginPage
                setUser={setUser}
                setProfile={setProfile}
              />
            }
          />

          <Route
            path="/update-password"
            element={<UpdatePasswordPage />}
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedPage
                user={user}
                profile={profile}
                allowedRoles={[
                  "admin",
                  "organization",
                ]}
              >
                <Dashboard
                  reports={reports}
                  updateReportStatus={
                    updateReportStatus
                  }
                  profile={profile}
                />
              </ProtectedPage>
            }
          />

          <Route
            path="/champions"
            element={
              <ProtectedPage
                user={user}
                profile={profile}
                allowedRoles={[
                  "admin",
                  "champion",
                ]}
              >
                <Champions
                  reports={reports}
                  updateReportStatus={
                    updateReportStatus
                  }
                  profile={profile}
                />
              </ProtectedPage>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;