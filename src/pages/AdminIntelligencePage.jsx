import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Factory,
  MapPinned,
  Timer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  createCsv,
  downloadCsv,
} from "../utils/csvExport";

const unresolvedStatuses = new Set([
  "Reported",
  "Verified",
  "Assigned",
  "In Progress",
  "Resolution Submitted",
]);

function countBy(items, getKey) {
  const counts = {};

  items.forEach((item) => {
    const key = getKey(item) || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function reportsOverTime(reports) {
  return countBy(reports, (report) => {
    if (!report.createdAt) return "Unknown";

    const date = new Date(report.createdAt);
    if (Number.isNaN(date.getTime())) return "Unknown";

    return date.toISOString().slice(0, 10);
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function average(values) {
  if (values.length === 0) return 0;

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) /
      values.length
  );
}

function averageResolutionHours(reports, evidence) {
  const reportsById = new Map(
    reports.map((report) => [report.id, report])
  );

  const durations = evidence
    .filter(
      (item) =>
        item.review_status === "Approved" &&
        item.reviewed_at
    )
    .map((item) => {
      const report = reportsById.get(item.report_id);
      if (!report?.createdAt) return null;

      const start = new Date(report.createdAt);
      const end = new Date(item.reviewed_at);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end < start
      ) {
        return null;
      }

      return (
        (end.getTime() - start.getTime()) /
        (1000 * 60 * 60)
      );
    })
    .filter((value) => Number.isFinite(value));

  if (durations.length === 0) return null;

  return Math.round(
    durations.reduce((sum, value) => sum + value, 0) /
      durations.length
  );
}

function formatResolutionTime(hours) {
  if (hours === null) return "Not enough data";
  if (hours < 24) return `${hours}h`;

  return `${Math.round(hours / 24)}d`;
}

function getOrganizationPerformance(assignments) {
  const metrics = new Map();

  assignments.forEach((assignment) => {
    const organization =
      assignment.organization?.name ||
      "Unassigned organization";

    if (!metrics.has(organization)) {
      metrics.set(organization, {
        name: organization,
        assigned: 0,
        active: 0,
        resolved: 0,
      });
    }

    const row = metrics.get(organization);
    row.assigned += 1;

    if (
      ["Assigned", "Accepted"].includes(
        assignment.status
      )
    ) {
      row.active += 1;
    }

    if (
      ["Resolved", "Community Confirmed"].includes(
        assignment.report?.status
      )
    ) {
      row.resolved += 1;
    }
  });

  return Array.from(metrics.values())
    .sort((a, b) => b.assigned - a.assigned)
    .slice(0, 8);
}

function getLatestByReportId(items, getTimestamp) {
  const latestItems = new Map();

  items.forEach((item) => {
    if (!item.report_id) return;

    const existing = latestItems.get(item.report_id);
    const itemTime = new Date(
      getTimestamp(item) || 0
    ).getTime();
    const existingTime = new Date(
      existing ? getTimestamp(existing) || 0 : 0
    ).getTime();

    if (!existing || itemTime >= existingTime) {
      latestItems.set(item.report_id, item);
    }
  });

  return latestItems;
}

function getCsvDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function formatCommunityStatus(confirmation) {
  if (!confirmation) return "";

  return [
    confirmation.confirmation,
    confirmation.review_status,
  ]
    .filter(Boolean)
    .join(" / ");
}

const exportColumns = [
  {
    header: "tracking_code",
    accessor: "tracking_code",
  },
  {
    header: "issue_type",
    accessor: "issue_type",
  },
  { header: "status", accessor: "status" },
  {
    header: "location_name",
    accessor: "location_name",
  },
  { header: "area", accessor: "area" },
  { header: "latitude", accessor: "latitude" },
  { header: "longitude", accessor: "longitude" },
  { header: "urgency", accessor: "urgency" },
  {
    header: "near_sensitive_area",
    accessor: "near_sensitive_area",
  },
  { header: "risk_score", accessor: "risk_score" },
  { header: "risk_label", accessor: "risk_label" },
  { header: "created_at", accessor: "created_at" },
  { header: "updated_at", accessor: "updated_at" },
  {
    header: "assigned_organization_name",
    accessor: "assigned_organization_name",
  },
  {
    header: "assignment_status",
    accessor: "assignment_status",
  },
  {
    header: "resolution_status",
    accessor: "resolution_status",
  },
  {
    header: "community_status",
    accessor: "community_status",
  },
];

function SummaryCard({ icon, label, value }) {
  return (
    <div className="stat-card intelligence-card">
      {icon}
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

function IntelligenceChart({ title, subtitle, children }) {
  return (
    <section className="dashboard-panel intelligence-chart">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="chart-wrapper">
        {children}
      </div>
    </section>
  );
}

export default function AdminIntelligencePage({
  reports,
  operations,
}) {
  const assignments = operations?.assignments || [];
  const evidence = operations?.evidence || [];
  const communityConfirmations =
    operations?.communityConfirmations || [];
  const latestAssignmentByReportId =
    getLatestByReportId(
      assignments,
      (assignment) =>
        assignment.updated_at ||
        assignment.accepted_at ||
        assignment.assigned_at ||
        assignment.created_at
    );
  const latestEvidenceByReportId =
    getLatestByReportId(
      evidence,
      (item) =>
        item.reviewed_at ||
        item.submitted_at ||
        item.completed_at
    );
  const latestCommunityByReportId =
    getLatestByReportId(
      communityConfirmations,
      (item) => item.reviewed_at || item.submitted_at
    );

  const openReports = reports.filter((report) =>
    unresolvedStatuses.has(report.status)
  );
  const assignedReportIds = new Set(
    assignments.map((assignment) => assignment.report_id)
  );
  const criticalReports = reports.filter(
    (report) => report.riskLabel === "Critical"
  );
  const highRiskReports = reports.filter(
    (report) => report.riskLabel === "High"
  );
  const verifiedReports = reports.filter(
    (report) => report.status === "Verified"
  );
  const assignedOrProgressReports = reports.filter(
    (report) =>
      ["Assigned", "In Progress"].includes(
        report.status
      )
  );
  const resolvedReports = reports.filter(
    (report) => report.status === "Resolved"
  );
  const communityConfirmedReports = reports.filter(
    (report) => report.status === "Community Confirmed"
  );

  const averageRisk = average(
    reports.map((report) => report.riskScore)
  );
  const resolutionHours = averageResolutionHours(
    reports,
    evidence
  );

  const issueChart = countBy(
    reports,
    (report) => report.issueType
  );
  const statusChart = countBy(
    reports,
    (report) => report.status
  );
  const riskChart = countBy(
    reports,
    (report) => report.riskLabel
  );
  const timeChart = reportsOverTime(reports);
  const responseStatusChart = countBy(
    assignments,
    (assignment) => assignment.status
  );
  const organizationPerformance =
    getOrganizationPerformance(assignments);

  const hotspotAreas = countBy(
    reports,
    (report) =>
      report.locationName?.trim() ||
      report.area?.trim()
  ).slice(0, 8);

  const topIssue =
    issueChart[0]?.name || "Not enough data";
  const highestRiskUnresolved = [...openReports]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6);
  const criticalUnresolved =
    highestRiskUnresolved.filter(
      (report) => report.riskLabel === "Critical"
    );

  const awaitingVerification = reports.filter(
    (report) => report.status === "Reported"
  );
  const awaitingAssignment = reports.filter(
    (report) =>
      report.status === "Verified" &&
      !assignedReportIds.has(report.id)
  );
  const inProgress = reports.filter(
    (report) => report.status === "In Progress"
  );
  const awaitingEvidenceReview = evidence.filter(
    (item) => item.review_status === "Submitted"
  );
  const pendingDisputes =
    communityConfirmations.filter(
      (item) =>
        item.review_status === "Pending" &&
        item.confirmation === "Disputed"
    );

  const operationalRows = [
    [
      "Awaiting verification",
      awaitingVerification.length,
    ],
    [
      "Awaiting assignment",
      awaitingAssignment.length,
    ],
    ["In progress", inProgress.length],
    [
      "Resolution evidence awaiting review",
      awaitingEvidenceReview.length,
    ],
    [
      "Community disputes / reopened review",
      pendingDisputes.length,
    ],
  ];

  function handleExportCsv() {
    const exportRows = reports.map((report) => {
      const assignment =
        latestAssignmentByReportId.get(report.id);
      const latestEvidence =
        latestEvidenceByReportId.get(report.id);
      const latestCommunity =
        latestCommunityByReportId.get(report.id);

      return {
        tracking_code: report.trackingCode,
        issue_type: report.issueType,
        status: report.status,
        location_name: report.locationName,
        area: report.area,
        latitude: report.latitude,
        longitude: report.longitude,
        urgency: report.urgency,
        near_sensitive_area:
          report.nearSensitiveArea,
        risk_score: report.riskScore,
        risk_label: report.riskLabel,
        created_at: report.createdAt,
        updated_at: report.updatedAt || "",
        assigned_organization_name:
          assignment?.organization?.name || "",
        assignment_status: assignment?.status || "",
        resolution_status:
          latestEvidence?.review_status || "",
        community_status:
          formatCommunityStatus(latestCommunity),
      };
    });

    const csv = createCsv(exportRows, exportColumns);

    downloadCsv(
      `make-kenya-clean-urban-intelligence-${getCsvDateStamp()}.csv`,
      csv
    );
  }

  return (
    <main className="page dashboard-page intelligence-page">
      <section className="section-heading">
        <span className="section-tag">
          UrbanPulse Intelligence
        </span>

        <h1>Urban Intelligence Dashboard</h1>

        <p>
          Water, sanitation, drainage and utility risk
          overview for Nairobi response coordination.
        </p>
      </section>

      <section className="dashboard-panel intelligence-export-panel">
        <div>
          <h2>Export CSV</h2>
          <p>
            Exports privacy-safe operational fields only.
          </p>
        </div>

        <button
          type="button"
          className="btn secondary-btn"
          onClick={handleExportCsv}
          disabled={reports.length === 0}
        >
          Export CSV
        </button>
      </section>

      <section className="stats-grid intelligence-stats-grid">
        <SummaryCard
          icon={<MapPinned size={30} />}
          label="Total reports"
          value={reports.length}
        />
        <SummaryCard
          icon={<Clock size={30} />}
          label="Open / unresolved"
          value={openReports.length}
        />
        <SummaryCard
          icon={<AlertTriangle size={30} />}
          label="Critical reports"
          value={criticalReports.length}
        />
        <SummaryCard
          icon={<BarChart3 size={30} />}
          label="High-risk reports"
          value={highRiskReports.length}
        />
        <SummaryCard
          icon={<CheckCircle2 size={30} />}
          label="Verified reports"
          value={verifiedReports.length}
        />
        <SummaryCard
          icon={<Factory size={30} />}
          label="Assigned / in progress"
          value={assignedOrProgressReports.length}
        />
        <SummaryCard
          icon={<CheckCircle2 size={30} />}
          label="Resolved reports"
          value={resolvedReports.length}
        />
        <SummaryCard
          icon={<CheckCircle2 size={30} />}
          label="Community confirmed"
          value={communityConfirmedReports.length}
        />
        <SummaryCard
          icon={<AlertTriangle size={30} />}
          label="Average Maji Risk Index"
          value={`${averageRisk}/100`}
        />
        <SummaryCard
          icon={<Timer size={30} />}
          label="Average resolution time"
          value={formatResolutionTime(resolutionHours)}
        />
      </section>

      <section className="dashboard-layout intelligence-chart-grid">
        <IntelligenceChart
          title="Reports by Issue Type"
          subtitle="Urban utility categories reported by the community."
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </IntelligenceChart>

        <IntelligenceChart
          title="Reports by Status"
          subtitle="Lifecycle distribution across the response workflow."
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </IntelligenceChart>

        <IntelligenceChart
          title="Reports by Risk Label"
          subtitle="Maji Risk Index priority levels."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </IntelligenceChart>

        <IntelligenceChart
          title="Reports Over Time"
          subtitle="Daily reporting pattern from existing report dates."
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={timeChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0f766e"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </IntelligenceChart>

        <IntelligenceChart
          title="Response Status Breakdown"
          subtitle="Assignment status across organization workflows."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={responseStatusChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </IntelligenceChart>

        <IntelligenceChart
          title="Organization Performance"
          subtitle="Assigned, active and resolved cases by organization."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={organizationPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="assigned" />
              <Bar dataKey="active" />
              <Bar dataKey="resolved" />
            </BarChart>
          </ResponsiveContainer>
        </IntelligenceChart>
      </section>

      <section className="dashboard-layout intelligence-section-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Hotspot Intelligence</h2>
              <p>
                Location-name clusters and critical open
                cases from public-safe report fields.
              </p>
            </div>
          </div>

          <div className="intelligence-facts">
            <div>
              <span>Top issue type</span>
              <strong>{topIssue}</strong>
            </div>

            <div>
              <span>Critical unresolved cases</span>
              <strong>{criticalUnresolved.length}</strong>
            </div>
          </div>

          <div className="hotspot-list">
            {hotspotAreas.length === 0 ? (
              <p>No hotspot areas yet.</p>
            ) : (
              hotspotAreas.map((area) => (
                <div
                  className="hotspot-item"
                  key={area.name}
                >
                  <div>
                    <h3>{area.name}</h3>
                    <p>{area.count} reports</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Highest-Risk Unresolved Reports</h2>
              <p>
                Open cases ranked by Maji Risk Index.
              </p>
            </div>
          </div>

          <div className="operation-card-list compact-list">
            {highestRiskUnresolved.length === 0 ? (
              <p>No unresolved reports in the current data.</p>
            ) : (
              highestRiskUnresolved.map((report) => (
                <article
                  className="operation-card compact-card"
                  key={report.id}
                >
                  <div>
                    <h3>{report.issueType}</h3>
                    <p>
                      {report.locationName} · {report.status}
                    </p>
                    <Link to={`/reports/${report.trackingCode}`}>
                      {report.trackingCode}
                    </Link>
                  </div>

                  <span
                    className={`risk-pill small ${report.riskLabel.toLowerCase()}`}
                  >
                    {report.riskScore}
                  </span>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-panel operations-panel">
        <div className="panel-header">
          <div>
            <h2>Operational Intelligence</h2>
            <p>
              Response bottlenecks across verification,
              assignment, resolution review and community
              dispute workflows.
            </p>
          </div>
        </div>

        <div className="operations-summary-grid">
          {operationalRows.map(([label, count]) => (
            <div
              className="operations-summary-card"
              key={label}
            >
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
