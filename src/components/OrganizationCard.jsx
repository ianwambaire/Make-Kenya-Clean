export default function OrganizationCard({
  organization,
  metrics,
  onEdit,
  onToggleStatus,
  onOpen,
}) {
  return (
    <article className="organization-card">
      <div className="operation-card-header">
        <div>
          <h3>{organization.name}</h3>
          <p>
            {organization.organization_type} ·{" "}
            {organization.area || "No area set"}
          </p>
        </div>

        <span className="request-status">
          {organization.status}
        </span>
      </div>

      <div className="organization-metrics">
        <span>Members: {metrics.members}</span>
        <span>Assigned: {metrics.assigned}</span>
        <span>Active: {metrics.active}</span>
        <span>Resolved: {metrics.resolved}</span>
      </div>

      <p>
        {organization.contact_email || "No email"} ·{" "}
        {organization.contact_phone || "No phone"}
      </p>

      <div className="access-request-actions">
        <button type="button" onClick={onOpen}>
          Open
        </button>
        <button type="button" onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className={
            organization.status === "Active"
              ? "reject-btn"
              : "approve-btn"
          }
          onClick={onToggleStatus}
        >
          {organization.status === "Active"
            ? "Suspend"
            : "Activate"}
        </button>
      </div>
    </article>
  );
}
