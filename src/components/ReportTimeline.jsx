import { formatDate } from "../services/reports";

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

  return (
    <div className="report-timeline">
      {safeUpdates.length === 0 ? (
        <p>No timeline updates have been recorded.</p>
      ) : (
        safeUpdates.map((update, index) => (
          <div
            className="timeline-item"
            key={update.id || `${update.status}-${index}`}
          >
            <div className="timeline-marker">
              <span>{index + 1}</span>
            </div>

            <div className="timeline-content">
              <div className="timeline-header">
                <h3>{update.status}</h3>

                <span>{formatDate(update.created_at)}</span>
              </div>

              {update.note && <p>{update.note}</p>}

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
  );
}
