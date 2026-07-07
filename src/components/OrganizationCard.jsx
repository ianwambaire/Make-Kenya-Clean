import { Mail, Phone, Users } from "lucide-react";

export default function OrganizationCard({
  organization,
  metrics,
  onEdit,
  onToggleStatus,
  onOpen,
}) {
  const isActive = organization.status === "Active";

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

        <span
          className={`request-status ${
            isActive ? "approved" : "rejected"
          }`}
        >
          {organization.status}
        </span>
      </div>

      <div className="organization-metrics">
        <div className="organization-metric">
          <Users size={14} />
          <span>Members</span>
          <strong>{metrics.members}</strong>
        </div>

        <div className="organization-metric">
          <span className="organization-metric-label">
            Assigned
          </span>
          <strong>{metrics.assigned}</strong>
        </div>

        <div className="organization-metric">
          <span className="organization-metric-label">
            Active
          </span>
          <strong>{metrics.active}</strong>
        </div>

        <div className="organization-metric">
          <span className="organization-metric-label">
            Resolved
          </span>
          <strong>{metrics.resolved}</strong>
        </div>
      </div>

      <div className="organization-contact">
        <span>
          <Mail size={14} />
          {organization.contact_email || "No email on file"}
        </span>
        <span>
          <Phone size={14} />
          {organization.contact_phone || "No phone on file"}
        </span>
      </div>

      <div className="access-request-actions">
        <button
          type="button"
          className="secondary-btn compact-link"
          onClick={onOpen}
        >
          Open
        </button>

        <button
          type="button"
          className="secondary-btn compact-link"
          onClick={onEdit}
        >
          Edit
        </button>

        <button
          type="button"
          className={isActive ? "reject-btn" : "approve-btn"}
          onClick={onToggleStatus}
        >
          {isActive ? "Suspend" : "Activate"}
        </button>
      </div>
    </article>
  );
}