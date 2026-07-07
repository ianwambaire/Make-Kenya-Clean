import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import PhotoUploader from "../components/PhotoUploader";
import ReportTimeline from "../components/ReportTimeline";
import {
  formatDate,
  loadPublicReportDetail,
  loadReportTimeline,
  loadStaffReportDetail,
  submitCommunityConfirmation,
} from "../services/reports";

function latestActionFor(actions, assignmentId) {
  return actions.find(
    (action) => action.assignment_id === assignmentId
  );
}

function statusTone(status) {
  if (["Resolved", "Community Confirmed"].includes(status)) {
    return "tone-done";
  }

  if (
    ["Assigned", "In Progress", "Resolution Submitted"].includes(
      status
    )
  ) {
    return "tone-progress";
  }

  if (status === "Verified") {
    return "tone-verified";
  }

  return "tone-neutral";
}

export default function ReportDetailPage({
  user,
  profile,
  operations,
  onAcceptAssignment,
  onAddAction,
  onSubmitResolution,
  onReviewResolution,
  onReviewCommunityConfirmation,
}) {
  const { trackingCode } = useParams();

  const [report, setReport] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyOperation, setBusyOperation] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [actionForm, setActionForm] = useState({
    actionType: "Inspection",
    visibility: "Public",
    note: "",
  });

  const [resolutionForm, setResolutionForm] = useState({
    file: null,
    completedAt: "",
    note: "",
  });

  const [evidenceReviewNotes, setEvidenceReviewNotes] =
    useState({});

  const [communityReviewNotes, setCommunityReviewNotes] =
    useState({});

  const [confirmationNote, setConfirmationNote] =
    useState("");

  const hasStaffView =
    user &&
    profile &&
    ["admin", "champion", "organization"].includes(
      profile.role
    );

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      setIsLoading(true);
      setMessage("");

      try {
        const publicReport =
          await loadPublicReportDetail(trackingCode);

        let resolvedReport = publicReport;
        let canLoadStaffTimeline = false;

        if (hasStaffView) {
          try {
            const staffReport =
              await loadStaffReportDetail(trackingCode);

            if (staffReport) {
              resolvedReport = staffReport;
              canLoadStaffTimeline = true;
            }
          } catch {
            resolvedReport = publicReport;
          }
        }

        const updates = resolvedReport
          ? await loadReportTimeline(resolvedReport.id, {
              staff: canLoadStaffTimeline,
            })
          : [];

        if (isMounted) {
          setReport(resolvedReport);
          setTimeline(updates);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      isMounted = false;
    };
  }, [trackingCode, hasStaffView]);

  const assignments = operations?.assignments || [];
  const actions = operations?.actions || [];
  const evidence = operations?.evidence || [];
  const communityConfirmations =
    operations?.communityConfirmations || [];

  const reportAssignments = report
    ? assignments.filter(
        (assignment) => assignment.report_id === report.id
      )
    : [];

  const currentAssignment =
    reportAssignments.find((assignment) =>
      ["Assigned", "Accepted"].includes(
        assignment.status
      )
    ) || reportAssignments[0];

  const canManageThisAssignment =
    profile?.role === "organization" &&
    currentAssignment &&
    profile.organization_id ===
      currentAssignment.organization_id;

  const reportEvidence = report
    ? evidence.filter(
        (item) => item.report_id === report.id
      )
    : [];

  const pendingCommunityFeedback = report
    ? communityConfirmations.filter(
        (item) =>
          item.report_id === report.id &&
          item.review_status === "Pending"
      )
    : [];

  async function handleAccept() {
    setBusyOperation("accept");

    const result = await onAcceptAssignment(
      currentAssignment.id
    );

    setBusyOperation("");

    if (!result?.success) {
      setMessage(
        result?.error || "Assignment could not be accepted."
      );
    }
  }

  async function handleAddAction() {
    if (!actionForm.note.trim()) {
      setMessage("Add an action note first.");
      return;
    }

    setBusyOperation("action");

    const result = await onAddAction(
      currentAssignment.id,
      actionForm.actionType,
      actionForm.note.trim(),
      actionForm.visibility
    );

    setBusyOperation("");

    if (!result?.success) {
      setMessage(
        result?.error || "Action update could not be saved."
      );
      return;
    }

    setActionForm({
      actionType: "Inspection",
      visibility: "Public",
      note: "",
    });

    setMessage("Action update saved.");
  }

  async function handleSubmitResolution() {
    if (!resolutionForm.file) {
      setMessage("Upload resolution photo evidence first.");
      return;
    }

    setBusyOperation("resolution");
    setUploadStatus("Preparing evidence...");

    const result = await onSubmitResolution(
      currentAssignment.id,
      resolutionForm.file,
      resolutionForm.note,
      resolutionForm.completedAt,
      setUploadStatus
    );

    setBusyOperation("");
    setUploadStatus("");

    if (!result?.success) {
      setMessage(
        result?.error ||
          "Resolution evidence could not be submitted."
      );
      return;
    }

    setResolutionForm({
      file: null,
      completedAt: "",
      note: "",
    });

    setMessage("Resolution submitted for admin review.");
  }

  async function handleCommunityConfirmation(confirmation) {
    setBusyOperation(`community:${confirmation}`);
    setMessage("");

    try {
      await submitCommunityConfirmation({
        trackingCode: report.trackingCode,
        confirmation,
        note: confirmationNote.trim(),
      });

      setMessage(
        confirmation === "Confirmed"
          ? "Thank you. Your confirmation has been submitted for review."
          : "Thank you. Your dispute has been submitted for review."
      );

      setConfirmationNote("");

      setTimeline(
        await loadReportTimeline(report.id)
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyOperation("");
    }
  }

  async function handleReviewEvidence(evidenceId, approved) {
    setBusyOperation(`evidence:${evidenceId}`);

    const result = await onReviewResolution(
      evidenceId,
      approved,
      (evidenceReviewNotes[evidenceId] || "").trim()
    );

    setBusyOperation("");

    if (!result?.success) {
      setMessage(
        result?.error || "Resolution review failed."
      );
      return;
    }

    setEvidenceReviewNotes((current) => ({
      ...current,
      [evidenceId]: "",
    }));
  }

  async function handleReviewCommunity(
    confirmationId,
    decision
  ) {
    setBusyOperation(`feedback:${confirmationId}`);

    const result = await onReviewCommunityConfirmation(
      confirmationId,
      decision,
      (communityReviewNotes[confirmationId] || "").trim()
    );

    setBusyOperation("");

    if (!result?.success) {
      setMessage(
        result?.error ||
          "Community feedback review failed."
      );
      return;
    }

    setCommunityReviewNotes((current) => ({
      ...current,
      [confirmationId]: "",
    }));
  }

  if (isLoading) {
    return (
      <main className="page">
        <section className="section-heading">
          <span className="section-tag">
            Report Detail
          </span>
          <h1>Loading report...</h1>
          <p>Fetching the latest status and timeline.</p>
        </section>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="page form-page">
        <section className="section-heading">
          <span className="section-tag">
            Report Detail
          </span>

          <h1>Report not found</h1>

          <p>
            Check the tracking code and try again from the
            tracking page.
          </p>

          <Link
            to="/track"
            className="btn primary-btn"
          >
            Track another report
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page report-detail-page">
      {message && (
        <p className="form-message success-message">
          {message}
        </p>
      )}

      <section className="case-header">
        <div className="case-header-top">
          <span className="section-tag">
            Report Detail
          </span>

          <span
            className={`status-badge ${statusTone(
              report.status
            )}`}
          >
            {report.status}
          </span>
        </div>

        <h1 className="case-tracking-code">
          {report.trackingCode}
        </h1>

        <div className="case-what-where">
          <div className="case-what">
            <h2>{report.issueType}</h2>

            <p>
              {report.description ||
                "No description provided."}
            </p>
          </div>

          <div className="case-facts">
            <div className="case-fact">
              <MapPin size={16} />

              <div>
                <span>Location</span>

                <strong>
                  {report.locationName}
                </strong>

                {report.area && (
                  <small>{report.area}</small>
                )}
              </div>
            </div>

            <div className="case-fact">
              <AlertTriangle size={16} />

              <div>
                <span>Severity</span>

                <strong
                  className={`risk-pill ${report.riskLabel.toLowerCase()}`}
                >
                  {report.riskLabel} ·{" "}
                  {report.riskScore}/100
                </strong>
              </div>
            </div>

            <div className="case-fact">
              <Clock size={16} />

              <div>
                <span>Reported</span>

                <strong>
                  {formatDate(report.createdAt)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {report.photoUrl && (
          <img
            src={report.photoUrl}
            alt="Report evidence"
            className="case-photo"
          />
        )}
      </section>

      {hasStaffView && currentAssignment && (
        <section className="responder-panel">
          <ShieldCheck size={20} />

          <div className="responder-panel-body">
            <div className="responder-panel-header">
              <div>
                <span>Assigned to</span>

                <h3>
                  {currentAssignment.organization?.name ||
                    "Organization"}
                </h3>
              </div>

              <span className="request-status">
                {currentAssignment.status}
              </span>
            </div>

            <p>
              Assigned{" "}
              {formatDate(
                currentAssignment.assigned_at
              )}

              {currentAssignment.note &&
                ` — ${currentAssignment.note}`}
            </p>

            <p className="responder-latest-action">
              <strong>Latest action:</strong>{" "}
              {latestActionFor(
                actions,
                currentAssignment.id
              )?.note || "No action logged yet"}
            </p>
          </div>
        </section>
      )}

      {canManageThisAssignment && (
        <section className="dashboard-panel operations-panel next-action-panel">
          <div className="panel-header">
            <h2>Your Next Action</h2>

            <p>
              Move this case forward from assignment to
              resolution.
            </p>
          </div>

          {currentAssignment.status === "Assigned" && (
            <button
              type="button"
              className="approve-btn"
              disabled={busyOperation === "accept"}
              onClick={handleAccept}
            >
              {busyOperation === "accept"
                ? "Accepting..."
                : "Accept Assignment"}
            </button>
          )}

          {currentAssignment.status === "Accepted" && (
            <div className="organization-workflow">
              <div className="workflow-step">
                <h3>Log an action</h3>

                <div className="assignment-controls">
                  <select
                    value={actionForm.actionType}
                    onChange={(event) =>
                      setActionForm((current) => ({
                        ...current,
                        actionType:
                          event.target.value,
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
                      <option key={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    value={actionForm.visibility}
                    onChange={(event) =>
                      setActionForm((current) => ({
                        ...current,
                        visibility:
                          event.target.value,
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
                      setActionForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    className="approve-btn"
                    disabled={
                      busyOperation === "action"
                    }
                    onClick={handleAddAction}
                  >
                    Add Action
                  </button>
                </div>
              </div>

              <div className="workflow-step">
                <h3>
                  Submit resolution evidence
                </h3>

                <div className="assignment-controls">
                  <PhotoUploader
                    id="resolution-evidence-photo"
                    label="Resolution Photo"
                    file={resolutionForm.file}
                    onChange={(file) =>
                      setResolutionForm((current) => ({
                        ...current,
                        file,
                      }))
                    }
                    required
                    hint="Upload issue-resolution evidence only. Avoid faces, private documents, ID cards, or unrelated personal information."
                  />

                  <input
                    type="date"
                    value={
                      resolutionForm.completedAt
                    }
                    onChange={(event) =>
                      setResolutionForm((current) => ({
                        ...current,
                        completedAt:
                          event.target.value,
                      }))
                    }
                  />

                  <input
                    type="text"
                    placeholder="Resolution note"
                    value={resolutionForm.note}
                    onChange={(event) =>
                      setResolutionForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    className="approve-btn"
                    disabled={
                      busyOperation === "resolution"
                    }
                    onClick={handleSubmitResolution}
                  >
                    {busyOperation === "resolution"
                      ? "Submitting..."
                      : "Submit Resolution"}
                  </button>
                </div>

                {uploadStatus && (
                  <p
                    className="upload-status"
                    aria-live="polite"
                  >
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {hasStaffView && reportEvidence.length > 0 && (
        <section className="dashboard-panel operations-panel">
          <div className="panel-header">
            <h2>Resolution Evidence</h2>

            <p>
              Private evidence visible only to authorized
              staff.
            </p>
          </div>

          <div className="operation-card-list">
            {reportEvidence.map((item) => (
              <article
                className="operation-card"
                key={item.id}
              >
                <div className="operation-card-header">
                  <div>
                    <h3>{item.review_status}</h3>

                    <p>
                      {formatDate(
                        item.submitted_at
                      )}
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
                    View private evidence
                  </a>
                )}

                {profile?.role === "admin" &&
                  item.review_status ===
                    "Submitted" && (
                    <div className="review-controls">
                      <input
                        type="text"
                        placeholder="Review note"
                        value={
                          evidenceReviewNotes[
                            item.id
                          ] || ""
                        }
                        onChange={(event) =>
                          setEvidenceReviewNotes(
                            (current) => ({
                              ...current,
                              [item.id]:
                                event.target.value,
                            })
                          )
                        }
                      />

                      <div className="access-request-actions">
                        <button
                          type="button"
                          className="approve-btn"
                          disabled={
                            busyOperation ===
                            `evidence:${item.id}`
                          }
                          onClick={() =>
                            handleReviewEvidence(
                              item.id,
                              true
                            )
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="reject-btn"
                          disabled={
                            busyOperation ===
                            `evidence:${item.id}`
                          }
                          onClick={() =>
                            handleReviewEvidence(
                              item.id,
                              false
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-panel timeline-panel">
        <div className="panel-header">
          <h2>Report Timeline</h2>

          <p>
            {hasStaffView
              ? "Full history, including staff-only entries."
              : "Public-safe progress history for this report."}
          </p>
        </div>

        <ReportTimeline
          updates={timeline}
          mode={hasStaffView ? "staff" : "public"}
        />
      </section>

      {report.status === "Resolved" && (
        <section className="dashboard-panel confirmation-panel">
          <div className="panel-header">
            <h2>Community Confirmation</h2>

            <p>
              Was this issue actually resolved? Feedback is
              reviewed before any final status change.
            </p>
          </div>

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
              disabled={Boolean(busyOperation)}
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
              disabled={Boolean(busyOperation)}
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

      {profile?.role === "admin" &&
        pendingCommunityFeedback.length > 0 && (
          <section className="dashboard-panel operations-panel">
            <div className="panel-header">
              <h2>
                Pending Community Feedback
              </h2>

              <p>
                Review feedback before changing status.
              </p>
            </div>

            {pendingCommunityFeedback.map((item) => (
              <article
                className="operation-card"
                key={item.id}
              >
                <div className="operation-card-header">
                  <div>
                    <h3>{item.confirmation}</h3>

                    <p>
                      {formatDate(
                        item.submitted_at
                      )}
                    </p>
                  </div>

                  <span className="request-status">
                    {item.review_status}
                  </span>
                </div>

                <p>
                  {item.note ||
                    "No note provided."}
                </p>

                <div className="review-controls">
                  <input
                    type="text"
                    placeholder="Review note"
                    value={
                      communityReviewNotes[
                        item.id
                      ] || ""
                    }
                    onChange={(event) =>
                      setCommunityReviewNotes(
                        (current) => ({
                          ...current,
                          [item.id]:
                            event.target.value,
                        })
                      )
                    }
                  />

                  <div className="access-request-actions">
                    <button
                      type="button"
                      className="approve-btn"
                      disabled={
                        busyOperation ===
                        `feedback:${item.id}`
                      }
                      onClick={() =>
                        handleReviewCommunity(
                          item.id,
                          "Approved"
                        )
                      }
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      className="reject-btn"
                      disabled={
                        busyOperation ===
                        `feedback:${item.id}`
                      }
                      onClick={() =>
                        handleReviewCommunity(
                          item.id,
                          "Rejected"
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
    </main>
  );
}