import { CheckCircle2, Circle } from "lucide-react";
import { formatDate } from "../services/reports";

const actionStatuses = new Set([
  "Site Visit",
  "Follow-Up",
  "Note",
  "Update",
]);

function isActionEntry(status) {
  return actionStatuses.has(status);
}

export default function ReportTimeline({
  updates,
  mode = "public",
}) {
  const safeUpdates =
    mode === "staff"
      ? updates
      : updates.filter(
          (update) =>
            !String(update.status || "")
              .toLowerCase()
              .includes("staff only")
        );

  const latestIndex = safeUpdates.length - 1;

  return (
    <div className="report-timeline">
      {safeUpdates.length === 0 ? (
        <p>No timeline updates have been recorded yet.</p>
      ) : (
        safeUpdates.map((update, index) => {
          const isLatest = index === latestIndex;
          const isAction = isActionEntry(update.status);

          return (
            <div
              className={`timeline-item ${
                isLatest ? "is-latest" : ""
              } ${isAction ? "is-action" : "is-status"}`}
              key={update.id || `${update.status}-${index}`}
            >
              <div className="timeline-marker" aria-hidden="true">
                {isLatest ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={10} />
                )}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <h3>
                    {update.status}
                    {isLatest && (
                      <span className="timeline-current-badge">
                        Current
                      </span>
                    )}
                  </h3>

                  <time dateTime={update.created_at}>
                    {formatDate(update.created_at)}
                  </time>
                </div>

                {update.note && <p>{update.note}</p>}

                <small>
                  {isAction ? "Action logged by " : "Updated by "}
                  {update.updated_by_name || "Make Kenya Clean"}
                </small>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}