import {
  useCallback,
  useEffect,
  useState,
} from "react";
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

const assignmentStatuses = [
  "Unassigned",
  "Assigned",
  "In Progress",
  "Awaiting Resolution Review",
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

const publicReportColumns = [
  "id",
  "tracking_code",
  "issue_type",
  "location_name",
  "area",
  "description",
  "latitude",
  "longitude",
  "urgency",
  "reporter_type",
  "is_anonymous",
  "near_sensitive_area",
  "risk_score",
  "risk_label",
  "status",
  "created_at",
  "photo_url",
].join(", ");

const staffReportColumns = [
  publicReportColumns,
  "reporter_name",
  "reporter_phone",
  "reporter_email",
].join(", ");

const publicTimelineColumns = [
  "id",
  "report_id",
  "status",
  "note",
  "updated_by_name",
  "created_at",
].join(", ");

const accessRequestColumns = [
  "id",
  "full_name",
  "email",
  "phone",
  "requested_role",
  "area",
  "organization_name",
  "reason",
  "status",
  "created_at",
  "reviewed_by",
  "reviewed_at",
].join(", ");

const profileColumns = [
  "id",
  "full_name",
  "role",
  "area",
  "organization_name",
  "organization_id",
].join(", ");

const organizationColumns = [
  "id",
  "name",
  "organization_type",
  "area",
  "contact_email",
  "contact_phone",
  "status",
  "created_at",
].join(", ");

const assignmentColumns = [
  "id",
  "report_id",
  "organization_id",
  "assigned_by",
  "assigned_at",
  "accepted_by",
  "accepted_at",
  "status",
  "note",
  "created_at",
  "updated_at",
  `reports(${staffReportColumns})`,
  `organizations(${organizationColumns})`,
].join(", ");

const actionColumns = [
  "id",
  "report_id",
  "assignment_id",
  "organization_id",
  "action_type",
  "note",
  "visibility",
  "created_by",
  "created_at",
].join(", ");

const evidenceColumns = [
  "id",
  "report_id",
  "assignment_id",
  "organization_id",
  "photo_path",
  "note",
  "completed_at",
  "submitted_by",
  "submitted_at",
  "review_status",
  "reviewed_by",
  "reviewed_at",
  "review_note",
].join(", ");

const communityConfirmationColumns = [
  "id",
  "report_id",
  "tracking_code",
  "confirmation",
  "note",
  "submitted_at",
  "review_status",
  "reviewed_by",
  "reviewed_at",
  "review_note",
  `reports(${staffReportColumns})`,
].join(", ");

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

function toPublicReport(report) {
  return {
    ...report,
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
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

function fromAssignment(assignment) {
  return {
    ...assignment,
    report: assignment.reports
      ? fromSupabaseReport(assignment.reports)
      : null,
    organization:
      assignment.organizations || null,
  };
}

function getActiveAssignment(assignments, reportId) {
  return assignments.find(
    (assignment) =>
      assignment.report_id === reportId &&
      ["Assigned", "Accepted"].includes(
        assignment.status
      )
  );
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

  const [confirmationNote, setConfirmationNote] =
    useState("");

  const [
    confirmationMessage,
    setConfirmationMessage,
  ] = useState("");

  const [
    isSubmittingConfirmation,
    setIsSubmittingConfirmation,
  ] = useState(false);

  async function handleTrackReport(event) {
    event.preventDefault();

    const cleanCode =
      trackingCode.trim().toUpperCase();

    setIsSearching(true);
    setHasSearched(false);
    setSearchedReport(null);
    setUpdates([]);
    setConfirmationMessage("");

    const {
      data: reportData,
      error: reportError,
    } = await supabase
      .from("public_reports")
      .select(publicReportColumns)
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
      .select(publicTimelineColumns)
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

  async function handleCommunityConfirmation(
    confirmation
  ) {
    if (!searchedReport || isSubmittingConfirmation) {
      return;
    }

    setIsSubmittingConfirmation(true);
    setConfirmationMessage("");

    const { data, error } = await supabase.rpc(
      "submit_community_confirmation",
      {
        p_tracking_code:
          searchedReport.trackingCode,
        p_confirmation: confirmation,
        p_note: confirmationNote.trim(),
      }
    );

    if (error || data?.success === false) {
      setConfirmationMessage(
        error?.message ||
          data?.error ||
          "Community confirmation could not be submitted."
      );
      setIsSubmittingConfirmation(false);
      return;
    }

    setConfirmationMessage(
      confirmation === "Confirmed"
        ? "Thank you. Your feedback has been submitted for review."
        : "Thank you. Your dispute has been submitted for review."
    );

    const { data: updateData } = await supabase
      .from("report_updates")
      .select(publicTimelineColumns)
      .eq("report_id", searchedReport.id)
      .order("created_at", {
        ascending: true,
      });

    setUpdates(updateData || updates);
    setConfirmationNote("");
    setIsSubmittingConfirmation(false);
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

      {searchedReport?.status === "Resolved" && (
        <section className="dashboard-panel confirmation-panel">
          <div className="panel-header">
            <h2>Community Confirmation</h2>

            <p>
              Was this issue actually resolved?
              Feedback is reviewed before any final
              status change.
            </p>
          </div>

          {confirmationMessage && (
            <div className="form-message success-message">
              {confirmationMessage}
            </div>
          )}

          <div className="form-group">
            <label>Optional Note</label>

              <textarea
                rows="3"
                maxLength="500"
                value={confirmationNote}
              onChange={(event) =>
                setConfirmationNote(
                  event.target.value
                )
              }
              placeholder="Share what you observed..."
            />
          </div>

          <div className="access-request-actions">
            <button
              type="button"
              className="approve-btn"
              disabled={isSubmittingConfirmation}
              onClick={() =>
                handleCommunityConfirmation(
                  "Confirmed"
                )
              }
            >
              Yes, resolved
            </button>

            <button
              type="button"
              className="reject-btn"
              disabled={isSubmittingConfirmation}
              onClick={() =>
                handleCommunityConfirmation(
                  "Disputed"
                )
              }
            >
              No, still unresolved
            </button>
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

function OrganizationDashboard({
  profile,
  operations,
  onAcceptAssignment,
  onAddAction,
  onSubmitResolution,
}) {
  const assignments = operations?.assignments || [];
  const actions = operations?.actions || [];
  const evidence = operations?.evidence || [];
  const [busyOperation, setBusyOperation] =
    useState("");
  const [actionForms, setActionForms] =
    useState({});
  const [resolutionForms, setResolutionForms] =
    useState({});

  const newlyAssigned = assignments.filter(
    (assignment) => assignment.status === "Assigned"
  );
  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === "Accepted"
  );
  const awaitingReview = assignments.filter(
    (assignment) =>
      assignment.report?.status ===
      "Resolution Submitted"
  );
  const completedAssignments = assignments.filter(
    (assignment) =>
      assignment.status === "Completed" ||
      ["Resolved", "Community Confirmed"].includes(
        assignment.report?.status
      )
  );

  async function handleAccept(assignmentId) {
    setBusyOperation(`accept:${assignmentId}`);
    const result = await onAcceptAssignment(
      assignmentId
    );
    setBusyOperation("");

    if (!result?.success) {
      alert(
        result?.error ||
          "Assignment could not be accepted."
      );
    }
  }

  async function handleAddAction(assignmentId) {
    const form = actionForms[assignmentId] || {};

    if (!form.note?.trim()) {
      alert("Add a short action note first.");
      return;
    }

    setBusyOperation(`action:${assignmentId}`);

    const result = await onAddAction(
      assignmentId,
      form.actionType || "Other",
      form.note.trim(),
      form.visibility || "Public"
    );

    setBusyOperation("");

    if (!result?.success) {
      alert(
        result?.error ||
          "The action update could not be saved."
      );
      return;
    }

    setActionForms((current) => ({
      ...current,
      [assignmentId]: {
        actionType: "Inspection",
        visibility: "Public",
        note: "",
      },
    }));
  }

  async function handleSubmitResolution(
    assignmentId
  ) {
    const form = resolutionForms[assignmentId] || {};

    if (!form.file) {
      alert("Upload resolution photo evidence first.");
      return;
    }

    setBusyOperation(`resolution:${assignmentId}`);

    const result = await onSubmitResolution(
      assignmentId,
      form.file,
      form.note || "",
      form.completedAt || ""
    );

    setBusyOperation("");

    if (!result?.success) {
      alert(
        result?.error ||
          "Resolution evidence could not be submitted."
      );
      return;
    }

    setResolutionForms((current) => ({
      ...current,
      [assignmentId]: {
        note: "",
        completedAt: "",
        file: null,
      },
    }));
  }

  function renderAssignmentCard(assignment, mode) {
    const report = assignment.report;
    const actionForm =
      actionForms[assignment.id] || {
        actionType: "Inspection",
        visibility: "Public",
        note: "",
      };
    const resolutionForm =
      resolutionForms[assignment.id] || {};
    const assignmentActions = actions.filter(
      (action) =>
        action.assignment_id === assignment.id
    );
    const assignmentEvidence = evidence.filter(
      (item) =>
        item.assignment_id === assignment.id
    );

    return (
      <article
        className="operation-card"
        key={assignment.id}
      >
        <div className="operation-card-header">
          <div>
            <h3>
              {report?.issueType || "Assigned report"}
            </h3>

            <p>
              {report?.locationName} ·{" "}
              {report?.trackingCode}
            </p>
          </div>

          <span
            className={`risk-pill small ${report?.riskLabel?.toLowerCase() || "medium"}`}
          >
            {report?.riskScore || 0}
          </span>
        </div>

        <p>{report?.description}</p>

        {report?.photoUrl && (
          <a
            href={report.photoUrl}
            target="_blank"
            rel="noreferrer"
          >
            View original evidence
          </a>
        )}

        <div className="assignment-summary">
          <strong>Status: {report?.status}</strong>
          <span>
            Assigned {formatDate(assignment.assigned_at)}
          </span>
          {assignment.note && (
            <p>{assignment.note}</p>
          )}
        </div>

        {mode === "new" && (
          <button
            type="button"
            className="approve-btn"
            disabled={
              busyOperation ===
              `accept:${assignment.id}`
            }
            onClick={() =>
              handleAccept(assignment.id)
            }
          >
            {busyOperation ===
            `accept:${assignment.id}`
              ? "Accepting..."
              : "Accept Assignment"}
          </button>
        )}

        {mode === "active" && (
          <div className="organization-workflow">
            <div className="assignment-controls">
              <select
                value={actionForm.actionType}
                onChange={(event) =>
                  setActionForms((current) => ({
                    ...current,
                    [assignment.id]: {
                      ...actionForm,
                      actionType:
                        event.target.value,
                    },
                  }))
                }
              >
                {[
                  "Inspection",
                  "Team Dispatched",
                  "Work Started",
                  "Repair",
                  "Cleaning",
                  "Drainage Clearing",
                  "Water Testing",
                  "Follow-up",
                  "Other",
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>

              <select
                value={actionForm.visibility}
                onChange={(event) =>
                  setActionForms((current) => ({
                    ...current,
                    [assignment.id]: {
                      ...actionForm,
                      visibility:
                        event.target.value,
                    },
                  }))
                }
              >
                <option>Public</option>
                <option>Staff Only</option>
              </select>

              <input
                type="text"
                placeholder="Action note"
                value={actionForm.note}
                onChange={(event) =>
                  setActionForms((current) => ({
                    ...current,
                    [assignment.id]: {
                      ...actionForm,
                      note: event.target.value,
                    },
                  }))
                }
              />

              <button
                type="button"
                className="approve-btn"
                disabled={
                  busyOperation ===
                  `action:${assignment.id}`
                }
                onClick={() =>
                  handleAddAction(assignment.id)
                }
              >
                Add Action
              </button>
            </div>

            <div className="assignment-controls">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setResolutionForms((current) => ({
                    ...current,
                    [assignment.id]: {
                      ...resolutionForm,
                      file:
                        event.target.files?.[0] ||
                        null,
                    },
                  }))
                }
              />

              <input
                type="date"
                value={
                  resolutionForm.completedAt || ""
                }
                onChange={(event) =>
                  setResolutionForms((current) => ({
                    ...current,
                    [assignment.id]: {
                      ...resolutionForm,
                      completedAt:
                        event.target.value,
                    },
                  }))
                }
              />

              <input
                type="text"
                placeholder="Resolution note"
                value={resolutionForm.note || ""}
                onChange={(event) =>
                  setResolutionForms((current) => ({
                    ...current,
                    [assignment.id]: {
                      ...resolutionForm,
                      note: event.target.value,
                    },
                  }))
                }
              />

              <button
                type="button"
                className="approve-btn"
                disabled={
                  busyOperation ===
                  `resolution:${assignment.id}`
                }
                onClick={() =>
                  handleSubmitResolution(
                    assignment.id
                  )
                }
              >
                {busyOperation ===
                `resolution:${assignment.id}`
                  ? "Submitting..."
                  : "Request Resolution"}
              </button>
            </div>
          </div>
        )}

        {assignmentActions.length > 0 && (
          <div className="mini-list">
            <strong>Latest Actions</strong>
            {assignmentActions.slice(0, 3).map(
              (action) => (
                <p key={action.id}>
                  {action.action_type}: {action.note}
                </p>
              )
            )}
          </div>
        )}

        {assignmentEvidence.length > 0 && (
          <div className="mini-list">
            <strong>Resolution Evidence</strong>
            {assignmentEvidence.map((item) => (
              <p key={item.id}>
                {item.review_status} ·{" "}
                {formatDate(item.submitted_at)}
              </p>
            ))}
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="page dashboard-page">
      <section className="section-heading">
        <span className="section-tag">
          Organization Operations
        </span>

        <h1>Organization Dashboard</h1>

        <p>
          Logged in as{" "}
          {profile?.organization_name ||
            profile?.full_name ||
            "organization"}.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <LayoutDashboard size={30} />
          <div>
            <p>New Assignments</p>
            <h2>{newlyAssigned.length}</h2>
          </div>
        </div>
        <div className="stat-card">
          <Timer size={30} />
          <div>
            <p>Active Cases</p>
            <h2>{activeAssignments.length}</h2>
          </div>
        </div>
        <div className="stat-card danger">
          <AlertTriangle size={30} />
          <div>
            <p>Awaiting Review</p>
            <h2>{awaitingReview.length}</h2>
          </div>
        </div>
        <div className="stat-card success">
          <CheckCircle2 size={30} />
          <div>
            <p>Completed</p>
            <h2>{completedAssignments.length}</h2>
          </div>
        </div>
      </section>

      <section className="dashboard-panel operations-panel">
        <div className="panel-header">
          <h2>Newly Assigned</h2>
          <p>Accept assignments before starting work.</p>
        </div>
        <div className="operation-card-list">
          {newlyAssigned.length === 0 ? (
            <p>No newly assigned cases.</p>
          ) : (
            newlyAssigned.map((assignment) =>
              renderAssignmentCard(
                assignment,
                "new"
              )
            )
          )}
        </div>
      </section>

      <section className="dashboard-panel operations-panel">
        <div className="panel-header">
          <h2>Active / In Progress</h2>
          <p>
            Record action updates and submit resolution
            evidence.
          </p>
        </div>
        <div className="operation-card-list">
          {activeAssignments.length === 0 ? (
            <p>No active cases.</p>
          ) : (
            activeAssignments.map((assignment) =>
              renderAssignmentCard(
                assignment,
                "active"
              )
            )
          )}
        </div>
      </section>

      <section className="dashboard-panel operations-panel">
        <div className="panel-header">
          <h2>Awaiting Resolution Review</h2>
          <p>
            Submitted cases waiting for administrator
            approval.
          </p>
        </div>
        <div className="operation-card-list">
          {awaitingReview.length === 0 ? (
            <p>No cases awaiting review.</p>
          ) : (
            awaitingReview.map((assignment) =>
              renderAssignmentCard(
                assignment,
                "review"
              )
            )
          )}
        </div>
      </section>

      <section className="dashboard-panel operations-panel">
        <div className="panel-header">
          <h2>Completed</h2>
          <p>Resolved and confirmed assignments.</p>
        </div>
        <div className="operation-card-list">
          {completedAssignments.length === 0 ? (
            <p>No completed cases yet.</p>
          ) : (
            completedAssignments.map((assignment) =>
              renderAssignmentCard(
                assignment,
                "completed"
              )
            )
          )}
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  reports,
  profile,
  operations,
  onAssignReport,
  onAcceptAssignment,
  onAddAction,
  onSubmitResolution,
  onReviewResolution,
  onReviewCommunityConfirmation,
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

  const [
    activeOperationsFilter,
    setActiveOperationsFilter,
  ] = useState("Unassigned");

  const [
    selectedOrganizations,
    setSelectedOrganizations,
  ] = useState({});

  const [assignmentNotes, setAssignmentNotes] =
    useState({});

  const [busyOperation, setBusyOperation] =
    useState("");

  const organizations =
    operations?.organizations || [];
  const assignments =
    operations?.assignments || [];
  const evidence =
    operations?.evidence || [];
  const communityConfirmations =
    operations?.communityConfirmations || [];

  const activeAssignments = assignments.filter(
    (assignment) =>
      ["Assigned", "Accepted"].includes(
        assignment.status
      )
  );

  const assignedReportIds = new Set(
    activeAssignments.map(
      (assignment) => assignment.report_id
    )
  );

  const reportsForFilter = reports.filter((report) => {
    if (activeOperationsFilter === "Unassigned") {
      return (
        report.status === "Verified" &&
        !assignedReportIds.has(report.id)
      );
    }

    if (activeOperationsFilter === "Assigned") {
      return report.status === "Assigned";
    }

    if (activeOperationsFilter === "In Progress") {
      return report.status === "In Progress";
    }

    if (
      activeOperationsFilter ===
      "Awaiting Resolution Review"
    ) {
      return (
        report.status === "Resolution Submitted"
      );
    }

    if (activeOperationsFilter === "Resolved") {
      return report.status === "Resolved";
    }

    if (
      activeOperationsFilter ===
      "Community Confirmed"
    ) {
      return (
        report.status === "Community Confirmed"
      );
    }

    return true;
  });

  const pendingEvidence = evidence.filter(
    (item) => item.review_status === "Submitted"
  );

  const pendingCommunityConfirmations =
    communityConfirmations.filter(
      (item) => item.review_status === "Pending"
    );

  if (profile?.role === "organization") {
    return (
      <OrganizationDashboard
        profile={profile}
        operations={operations}
        onAcceptAssignment={
          onAcceptAssignment
        }
        onAddAction={onAddAction}
        onSubmitResolution={
          onSubmitResolution
        }
      />
    );
  }

  async function handleAssignReport(reportId) {
    const organizationId =
      selectedOrganizations[reportId];

    if (!organizationId) {
      alert("Choose an organization first.");
      return;
    }

    setBusyOperation(`assign:${reportId}`);

    const result = await onAssignReport(
      reportId,
      organizationId,
      assignmentNotes[reportId] || ""
    );

    setBusyOperation("");

    if (!result?.success) {
      alert(
        result?.error ||
          "The report could not be assigned."
      );
      return;
    }

    setAssignmentNotes((current) => ({
      ...current,
      [reportId]: "",
    }));
  }

  async function handleReviewEvidence(
    evidenceId,
    approved
  ) {
    const note = window.prompt(
      approved
        ? "Optional approval note:"
        : "Explain what needs more work:"
    );

    if (note === null) return;

    setBusyOperation(`review:${evidenceId}`);

    const result = await onReviewResolution(
      evidenceId,
      approved,
      note.trim()
    );

    setBusyOperation("");

    if (!result?.success) {
      alert(
        result?.error ||
          "Resolution review could not be saved."
      );
    }
  }

  async function handleReviewCommunityConfirmation(
    confirmationId,
    decision
  ) {
    const note = window.prompt(
      decision === "Approved"
        ? "Optional approval note:"
        : "Explain why this feedback is rejected:"
    );

    if (note === null) return;

    setBusyOperation(
      `community:${confirmationId}`
    );

    const result =
      await onReviewCommunityConfirmation(
        confirmationId,
        decision,
        note.trim()
      );

    setBusyOperation("");

    if (!result?.success) {
      alert(
        result?.error ||
          "Community feedback review could not be saved."
      );
    }
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

      {canManageReports && (
        <section className="dashboard-panel operations-panel">
          <div className="panel-header">
            <div>
              <h2>Response Coordination</h2>

              <p>
                Assign verified reports, monitor active
                cases, and review resolution evidence.
              </p>
            </div>
          </div>

          <div className="request-tabs">
            {assignmentStatuses.map((status) => (
              <button
                type="button"
                className={
                  activeOperationsFilter === status
                    ? "request-tab active"
                    : "request-tab"
                }
                key={status}
                onClick={() =>
                  setActiveOperationsFilter(status)
                }
              >
                {status}
                <span>
                  {
                    reports.filter((report) => {
                      if (status === "Unassigned") {
                        return (
                          report.status ===
                            "Verified" &&
                          !assignedReportIds.has(
                            report.id
                          )
                        );
                      }
                      if (
                        status ===
                        "Awaiting Resolution Review"
                      ) {
                        return (
                          report.status ===
                          "Resolution Submitted"
                        );
                      }
                      return report.status === status;
                    }).length
                  }
                </span>
              </button>
            ))}
          </div>

          <div className="operation-card-list">
            {reportsForFilter.length === 0 ? (
              <p>
                No reports in this operations view.
              </p>
            ) : (
              reportsForFilter.map((report) => {
                const assignment =
                  getActiveAssignment(
                    assignments,
                    report.id
                  ) ||
                  assignments.find(
                    (item) =>
                      item.report_id === report.id
                  );

                return (
                  <article
                    className="operation-card"
                    key={report.id}
                  >
                    <div className="operation-card-header">
                      <div>
                        <h3>{report.issueType}</h3>

                        <p>
                          {report.locationName} ·{" "}
                          {report.trackingCode}
                        </p>
                      </div>

                      <span
                        className={`risk-pill small ${report.riskLabel.toLowerCase()}`}
                      >
                        {report.riskScore}
                      </span>
                    </div>

                    <p>{report.description}</p>

                    {assignment && (
                      <div className="assignment-summary">
                        <strong>
                          Assigned to{" "}
                          {assignment.organization
                            ?.name ||
                            "organization"}
                        </strong>

                        <span>
                          {assignment.status} ·{" "}
                          {formatDate(
                            assignment.assigned_at
                          )}
                        </span>
                      </div>
                    )}

                    {report.status === "Verified" &&
                      !assignment && (
                        <div className="assignment-controls">
                          <select
                            value={
                              selectedOrganizations[
                                report.id
                              ] || ""
                            }
                            onChange={(event) =>
                              setSelectedOrganizations(
                                (current) => ({
                                  ...current,
                                  [report.id]:
                                    event.target.value,
                                })
                              )
                            }
                          >
                            <option value="">
                              Select organization
                            </option>

                            {organizations.map(
                              (organization) => (
                                <option
                                  key={
                                    organization.id
                                  }
                                  value={
                                    organization.id
                                  }
                                >
                                  {organization.name}
                                </option>
                              )
                            )}
                          </select>

                          <input
                            type="text"
                            placeholder="Assignment note"
                            value={
                              assignmentNotes[
                                report.id
                              ] || ""
                            }
                            onChange={(event) =>
                              setAssignmentNotes(
                                (current) => ({
                                  ...current,
                                  [report.id]:
                                    event.target.value,
                                })
                              )
                            }
                          />

                          <button
                            type="button"
                            className="approve-btn"
                            disabled={
                              busyOperation ===
                              `assign:${report.id}`
                            }
                            onClick={() =>
                              handleAssignReport(
                                report.id
                              )
                            }
                          >
                            {busyOperation ===
                            `assign:${report.id}`
                              ? "Assigning..."
                              : "Assign"}
                          </button>
                        </div>
                      )}
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {canManageReports && (
        <section className="dashboard-panel operations-panel">
          <div className="panel-header">
            <div>
              <h2>Resolution Review</h2>

              <p>
                Review submitted resolution evidence
                before marking cases resolved.
              </p>
            </div>
          </div>

          <div className="operation-card-list">
            {pendingEvidence.length === 0 ? (
              <p>
                No resolution evidence is awaiting
                review.
              </p>
            ) : (
              pendingEvidence.map((item) => {
                const assignment =
                  assignments.find(
                    (current) =>
                      current.id ===
                      item.assignment_id
                  );
                const report = assignment?.report;

                return (
                  <article
                    className="operation-card"
                    key={item.id}
                  >
                    <div className="operation-card-header">
                      <div>
                        <h3>
                          {report?.issueType ||
                            "Resolution evidence"}
                        </h3>

                        <p>
                          {report?.trackingCode} ·{" "}
                          {assignment?.organization
                            ?.name ||
                            "organization"}
                        </p>
                      </div>

                      <span className="request-status">
                        {item.review_status}
                      </span>
                    </div>

                    <p>{item.note}</p>

                    {item.signed_url && (
                      <a
                        href={item.signed_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View resolution photo
                      </a>
                    )}

                    <div className="access-request-actions">
                      <button
                        type="button"
                        className="approve-btn"
                        disabled={
                          busyOperation ===
                          `review:${item.id}`
                        }
                        onClick={() =>
                          handleReviewEvidence(
                            item.id,
                            true
                          )
                        }
                      >
                        Approve Resolution
                      </button>

                      <button
                        type="button"
                        className="reject-btn"
                        disabled={
                          busyOperation ===
                          `review:${item.id}`
                        }
                        onClick={() =>
                          handleReviewEvidence(
                            item.id,
                            false
                          )
                        }
                      >
                        Reject Evidence
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {canManageReports && (
        <section className="dashboard-panel operations-panel">
          <div className="panel-header">
            <div>
              <h2>Community Feedback Review</h2>

              <p>
                Review public confirmation or dispute
                feedback before changing the final case
                status.
              </p>
            </div>
          </div>

          <div className="operation-card-list">
            {pendingCommunityConfirmations.length ===
            0 ? (
              <p>
                No community feedback is awaiting
                review.
              </p>
            ) : (
              pendingCommunityConfirmations.map(
                (item) => {
                  const report = item.reports;

                  return (
                    <article
                      className="operation-card"
                      key={item.id}
                    >
                      <div className="operation-card-header">
                        <div>
                          <h3>
                            {report?.issue_type ||
                              "Community feedback"}
                          </h3>

                          <p>
                            {item.tracking_code} ·{" "}
                            {formatDate(
                              item.submitted_at
                            )}
                          </p>
                        </div>

                        <span className="request-status">
                          {item.confirmation}
                        </span>
                      </div>

                      <p>
                        {item.note ||
                          "No community note provided."}
                      </p>

                      <div className="access-request-actions">
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={
                            busyOperation ===
                            `community:${item.id}`
                          }
                          onClick={() =>
                            handleReviewCommunityConfirmation(
                              item.id,
                              "Approved"
                            )
                          }
                        >
                          Approve Feedback
                        </button>

                        <button
                          type="button"
                          className="reject-btn"
                          disabled={
                            busyOperation ===
                            `community:${item.id}`
                          }
                          onClick={() =>
                            handleReviewCommunityConfirmation(
                              item.id,
                              "Rejected"
                            )
                          }
                        >
                          Reject Feedback
                        </button>
                      </div>
                    </article>
                  );
                }
              )
            )}
          </div>
        </section>
      )}

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
                      <span className="request-status">
                        {report.status}
                      </span>
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

function AdminAccessRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] =
    useState("Pending");
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [activeAction, setActiveAction] =
    useState("");

  async function loadAccessRequests() {
    const { data, error } = await supabase
      .from("access_requests")
      .select(accessRequestColumns)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Could not load access requests:",
        error.message
      );

      setErrorMessage(
        "Access requests could not be loaded."
      );
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setRequests(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadRequestsForPage() {
      const { data, error } = await supabase
        .from("access_requests")
        .select(accessRequestColumns)
        .order("created_at", {
          ascending: false,
        });

      if (!isMounted) return;

      if (error) {
        console.error(
          "Could not load access requests:",
          error.message
        );

        setErrorMessage(
          "Access requests could not be loaded."
        );
        setRequests([]);
        setIsLoading(false);
        return;
      }

      setRequests(data || []);
      setIsLoading(false);
    }

    loadRequestsForPage();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshRequests() {
    setIsLoading(true);
    await loadAccessRequests();
  }

  async function handleReject(requestId) {
    if (activeAction) return;

    setErrorMessage("");
    setSuccessMessage("");
    setActiveAction(`reject:${requestId}`);

    const { data, error } = await supabase.rpc(
      "reject_access_request",
      {
        request_id: String(requestId),
      }
    );

    if (error) {
      console.error(
        "Reject access request failed:",
        error.message
      );

      setErrorMessage(error.message);
      setActiveAction("");
      return;
    }

    if (data?.success === false) {
      setErrorMessage(
        data.error ||
          "The request could not be rejected."
      );
      setActiveAction("");
      return;
    }

    setSuccessMessage(
      "Access request rejected successfully."
    );
    setActiveAction("");
    await refreshRequests();
    setActiveTab("Rejected");
  }

  async function handleApprove(requestId) {
    if (activeAction) return;

    setErrorMessage("");
    setSuccessMessage("");
    setActiveAction(`approve:${requestId}`);

    const { data, error } =
      await supabase.functions.invoke(
        "approve-access-request",
        {
          body: {
            request_id: String(requestId),
          },
        }
      );

    if (error) {
      console.error(
        "Approve access request failed:",
        error.message
      );

      setErrorMessage(error.message);
      setActiveAction("");
      return;
    }

    if (data?.success === false) {
      setErrorMessage(
        data.error ||
          "The request could not be approved."
      );
      setActiveAction("");
      return;
    }

    setSuccessMessage(
      data?.invitation_sent
        ? "Access approved and invitation sent."
        : "Access approved. Existing user profile updated."
    );
    setActiveAction("");
    await refreshRequests();
    setActiveTab("Approved");
  }

  const visibleRequests = requests.filter(
    (request) => request.status === activeTab
  );

  return (
    <main className="page dashboard-page">
      <section className="section-heading">
        <span className="section-tag">
          Admin Review
        </span>

        <h1>Access Requests</h1>

        <p>
          Review Maji Champion and organization access
          requests.
        </p>
      </section>

      <section className="dashboard-panel access-requests-panel">
        <div className="panel-header">
          <div>
            <h2>Staff Access Review</h2>

            <p>
              Pending requests can be approved or
              rejected by administrators.
            </p>
          </div>
        </div>

        <div className="request-tabs">
          {["Pending", "Approved", "Rejected"].map(
            (status) => {
              const count = requests.filter(
                (request) =>
                  request.status === status
              ).length;

              return (
                <button
                  type="button"
                  className={
                    activeTab === status
                      ? "request-tab active"
                      : "request-tab"
                  }
                  key={status}
                  onClick={() =>
                    setActiveTab(status)
                  }
                >
                  {status}
                  <span>{count}</span>
                </button>
              );
            }
          )}
        </div>

        {errorMessage && (
          <div className="form-message error-message">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="form-message success-message">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <p>Loading access requests...</p>
        ) : visibleRequests.length === 0 ? (
          <p>
            No {activeTab.toLowerCase()} access requests.
          </p>
        ) : (
          <div className="access-request-list">
            {visibleRequests.map((request) => {
              const approveAction =
                activeAction ===
                `approve:${request.id}`;
              const rejectAction =
                activeAction ===
                `reject:${request.id}`;
              const actionDisabled =
                Boolean(activeAction) ||
                request.status !== "Pending";

              return (
                <article
                  className="access-request-card"
                  key={request.id}
                >
                  <div className="access-request-header">
                    <div>
                      <h3>
                        {request.full_name ||
                          "Unnamed applicant"}
                      </h3>

                      <p>{request.email}</p>
                    </div>

                    <span
                      className={`request-status ${request.status?.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div className="access-request-grid">
                    <div>
                      <span>Phone</span>
                      <strong>
                        {request.phone ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Requested Role</span>
                      <strong>
                        {request.requested_role}
                      </strong>
                    </div>

                    <div>
                      <span>Area</span>
                      <strong>
                        {request.area ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Organization</span>
                      <strong>
                        {request.organization_name ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Submitted</span>
                      <strong>
                        {formatDate(
                          request.created_at
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Reviewed</span>
                      <strong>
                        {request.reviewed_at
                          ? formatDate(
                              request.reviewed_at
                            )
                          : "Not reviewed"}
                      </strong>
                    </div>
                  </div>

                  <div className="access-request-reason">
                    <span>Reason</span>
                    <p>
                      {request.reason ||
                        "No reason provided."}
                    </p>
                  </div>

                  {request.status === "Pending" && (
                    <div className="access-request-actions">
                      <button
                        type="button"
                        className="approve-btn"
                        disabled={actionDisabled}
                        onClick={() =>
                          handleApprove(request.id)
                        }
                      >
                        {approveAction
                          ? "Approving..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        className="reject-btn"
                        disabled={actionDisabled}
                        onClick={() =>
                          handleReject(request.id)
                        }
                      >
                        {rejectAction
                          ? "Rejecting..."
                          : "Reject"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
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
      .select(profileColumns)
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
  const [publicReports, setPublicReports] =
    useState([]);

  const [staffReports, setStaffReports] =
    useState([]);

  const [operations, setOperations] = useState({
    organizations: [],
    assignments: [],
    actions: [],
    evidence: [],
    communityConfirmations: [],
  });

  const [
    isLoadingReports,
    setIsLoadingReports,
  ] = useState(true);

  const [user, setUser] = useState(null);

  const [profile, setProfile] =
    useState(null);

  const hasStaffAccess =
    profile &&
    ["admin", "champion", "organization"].includes(
      profile.role
    );

  const operationalReports = hasStaffAccess
    ? staffReports
    : publicReports;

  const loadPublicReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("public_reports")
      .select(publicReportColumns)
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Could not load public reports:",
        error.message
      );

      setPublicReports([]);
      setIsLoadingReports(false);
      return;
    }

    setPublicReports(
      (data || []).map(fromSupabaseReport)
    );

    setIsLoadingReports(false);
  }, []);

  const loadStaffReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("reports")
      .select(staffReportColumns)
      .order("id", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Could not load staff reports:",
        error.message
      );

      setStaffReports([]);
      return;
    }

    setStaffReports(
      (data || []).map(fromSupabaseReport)
    );
  }, []);

  const loadOperations = useCallback(async () => {
    const [
      organizationsResult,
      assignmentsResult,
      actionsResult,
      evidenceResult,
      communityConfirmationsResult,
    ] = await Promise.all([
      supabase
        .from("organizations")
        .select(organizationColumns)
        .eq("status", "Active")
        .order("name", {
          ascending: true,
        }),
      supabase
        .from("report_assignments")
        .select(assignmentColumns)
        .order("assigned_at", {
          ascending: false,
        }),
      supabase
        .from("report_actions")
        .select(actionColumns)
        .order("created_at", {
          ascending: false,
        }),
      supabase
        .from("resolution_evidence")
        .select(evidenceColumns)
        .order("submitted_at", {
          ascending: false,
        }),
      supabase
        .from("community_confirmations")
        .select(communityConfirmationColumns)
        .order("submitted_at", {
          ascending: false,
        }),
    ]);

    const errors = [
      organizationsResult.error,
      assignmentsResult.error,
      actionsResult.error,
      evidenceResult.error,
      communityConfirmationsResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error(
        "Could not load operations data:",
        errors.map((error) => error.message)
      );
      setOperations({
        organizations: [],
        assignments: [],
        actions: [],
        evidence: [],
        communityConfirmations: [],
      });
      return;
    }

    const evidenceWithSignedUrls =
      await Promise.all(
        (evidenceResult.data || []).map(
          async (item) => {
            if (!item.photo_path) return item;

            const { data, error } =
              await supabase.storage
                .from("resolution-evidence")
                .createSignedUrl(
                  item.photo_path,
                  60 * 10
                );

            if (error) {
              console.error(
                "Could not create evidence signed URL:",
                error.message
              );
              return item;
            }

            return {
              ...item,
              signed_url: data?.signedUrl || "",
            };
          }
        )
      );

    setOperations({
      organizations:
        organizationsResult.data || [],
      assignments: (
        assignmentsResult.data || []
      ).map(fromAssignment),
      actions: actionsResult.data || [],
      evidence: evidenceWithSignedUrls,
      communityConfirmations:
        communityConfirmationsResult.data || [],
    });
  }, []);

  const loadCurrentUser = useCallback(async () => {
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
      .select(profileColumns)
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      setUser(null);
      setProfile(null);
      setStaffReports([]);
      return;
    }

    setUser(data.user);
    setProfile(profileData);

    if (
      [
        "admin",
        "champion",
        "organization",
      ].includes(profileData.role)
    ) {
      await loadStaffReports();
      if (
        ["admin", "organization"].includes(
          profileData.role
        )
      ) {
        await loadOperations();
      } else {
        setOperations({
          organizations: [],
          assignments: [],
          actions: [],
          evidence: [],
          communityConfirmations: [],
        });
      }
    } else {
      setStaffReports([]);
      setOperations({
        organizations: [],
        assignments: [],
        actions: [],
        evidence: [],
        communityConfirmations: [],
      });
    }
  }, [loadOperations, loadStaffReports]);

  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      await Promise.all([
        loadPublicReports(),
        loadCurrentUser(),
      ]);
    }

    if (isMounted) {
      initializeApp();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      () => {
        loadCurrentUser();
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadCurrentUser, loadPublicReports]);

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

    setPublicReports((current) => [
      toPublicReport(newReport),
      ...current,
    ]);

    setStaffReports((current) =>
      current.length > 0
        ? [newReport, ...current]
        : current
    );

    return true;
  }

  async function updateReportStatus(
    reportId,
    newStatus,
    note = ""
  ) {
    const currentReport = operationalReports.find(
      (report) => report.id === reportId
    );

    if (!currentReport) {
      return false;
    }

    const oldStatus = currentReport.status;

    setPublicReports((current) =>
      current.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: newStatus,
            }
          : report
      )
    );

    setStaffReports((current) =>
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
      setPublicReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: oldStatus,
              }
            : report
        )
      );

      setStaffReports((current) =>
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
    setOperations({
      organizations: [],
      assignments: [],
      actions: [],
      evidence: [],
      communityConfirmations: [],
    });
  }

  async function refreshOperationalData() {
    await Promise.all([
      loadPublicReports(),
      loadStaffReports(),
      loadOperations(),
    ]);
  }

  async function assignReportToOrganization(
    reportId,
    organizationId,
    note
  ) {
    const { data, error } = await supabase.rpc(
      "assign_report_to_organization",
      {
        p_report_id: reportId,
        p_organization_id: organizationId,
        p_note: note,
      }
    );

    if (error || data?.success === false) {
      return {
        success: false,
        error:
          error?.message ||
          data?.error ||
          "Assignment failed.",
      };
    }

    await refreshOperationalData();
    return data;
  }

  async function acceptAssignment(assignmentId) {
    const { data, error } = await supabase.rpc(
      "accept_report_assignment",
      {
        p_assignment_id: assignmentId,
      }
    );

    if (error || data?.success === false) {
      return {
        success: false,
        error:
          error?.message ||
          data?.error ||
          "Assignment acceptance failed.",
      };
    }

    await refreshOperationalData();
    return data;
  }

  async function addAssignmentAction(
    assignmentId,
    actionType,
    note,
    visibility
  ) {
    const { data, error } = await supabase.rpc(
      "add_report_action",
      {
        p_assignment_id: assignmentId,
        p_action_type: actionType,
        p_note: note,
        p_visibility: visibility,
      }
    );

    if (error || data?.success === false) {
      return {
        success: false,
        error:
          error?.message ||
          data?.error ||
          "Action update failed.",
      };
    }

    await refreshOperationalData();
    return data;
  }

  async function uploadResolutionPhoto(
    assignmentId,
    file
  ) {
    if (!file?.type?.startsWith("image/")) {
      return {
        success: false,
        error: "Please upload an image file.",
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "Image must be under 5MB.",
      };
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() ||
      "jpg";
    const randomPart =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random()}`;
    const filePath = `${profile?.organization_id || user?.id}/${assignmentId}/${randomPart}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("resolution-evidence")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
      };
    }

    return {
      success: true,
      photoPath: filePath,
    };
  }

  async function submitResolutionEvidence(
    assignmentId,
    file,
    note,
    completedAt
  ) {
    const uploadResult =
      await uploadResolutionPhoto(
        assignmentId,
        file
      );

    if (!uploadResult.success) {
      return uploadResult;
    }

    const { data, error } = await supabase.rpc(
      "submit_resolution_evidence",
      {
        p_assignment_id: assignmentId,
        p_photo_path: uploadResult.photoPath,
        p_note: note,
        p_completed_at: completedAt || null,
      }
    );

    if (error || data?.success === false) {
      return {
        success: false,
        error:
          error?.message ||
          data?.error ||
          "Resolution submission failed.",
      };
    }

    await refreshOperationalData();
    return data;
  }

  async function reviewResolutionEvidence(
    evidenceId,
    approved,
    note
  ) {
    const { data, error } = await supabase.rpc(
      "review_resolution_evidence",
      {
        p_evidence_id: evidenceId,
        p_approved: approved,
        p_review_note: note,
      }
    );

    if (error || data?.success === false) {
      return {
        success: false,
        error:
          error?.message ||
          data?.error ||
          "Resolution review failed.",
      };
    }

    await refreshOperationalData();
    return data;
  }

  async function reviewCommunityConfirmation(
    confirmationId,
    decision,
    note
  ) {
    const { data, error } = await supabase.rpc(
      "review_community_confirmation",
      {
        p_confirmation_id: confirmationId,
        p_decision: decision,
        p_review_note: note,
      }
    );

    if (error || data?.success === false) {
      return {
        success: false,
        error:
          error?.message ||
          data?.error ||
          "Community feedback review failed.",
      };
    }

    await refreshOperationalData();
    return data;
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

          {profile?.role === "admin" && (
            <Link to="/admin/access-requests">
              Access Requests
            </Link>
          )}

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
                reports={publicReports}
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
                reports={publicReports}
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
                  reports={staffReports}
                  updateReportStatus={
                    updateReportStatus
                  }
                  profile={profile}
                  operations={operations}
                  onAssignReport={
                    assignReportToOrganization
                  }
                  onAcceptAssignment={
                    acceptAssignment
                  }
                  onAddAction={
                    addAssignmentAction
                  }
                  onSubmitResolution={
                    submitResolutionEvidence
                  }
                  onReviewResolution={
                    reviewResolutionEvidence
                  }
                  onReviewCommunityConfirmation={
                    reviewCommunityConfirmation
                  }
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
                  reports={staffReports}
                  updateReportStatus={
                    updateReportStatus
                  }
                  profile={profile}
                />
              </ProtectedPage>
            }
          />

          <Route
            path="/admin/access-requests"
            element={
              <ProtectedPage
                user={user}
                profile={profile}
                allowedRoles={["admin"]}
              >
                <AdminAccessRequestsPage />
              </ProtectedPage>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
