import { useEffect, useState } from "react";
import { Building2, UserMinus, UserPlus } from "lucide-react";
import OrganizationCard from "../components/OrganizationCard";
import { supabase } from "../lib/supabase";
import {
  assignProfileToOrganization,
  createOrganization,
  organizationTypes,
  removeProfileFromOrganization,
  setOrganizationStatus,
  updateOrganization,
} from "../services/organizations";

const emptyForm = {
  name: "",
  organizationType: "Other",
  area: "",
  contactEmail: "",
  contactPhone: "",
};

function toForm(organization) {
  return {
    name: organization.name || "",
    organizationType:
      organization.organization_type || "Other",
    area: organization.area || "",
    contactEmail: organization.contact_email || "",
    contactPhone: organization.contact_phone || "",
  };
}

export default function AdminOrganizationsPage({
  operations,
  onRefresh,
}) {
  const [profiles, setProfiles] = useState([]);
  const [selectedOrganizationId, setSelectedOrganizationId] =
    useState("");
  const [editingOrganizationId, setEditingOrganizationId] =
    useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const organizations = operations?.organizations ?? [];
  const assignments = operations?.assignments ?? [];

  async function loadProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, role, area, organization_name, organization_id"
      )
      .order("full_name", {
        ascending: true,
      });

    if (error) throw error;
    setProfiles(data || []);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentProfiles() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, full_name, role, area, organization_name, organization_id"
          )
          .order("full_name", {
            ascending: true,
          });

        if (error) throw error;

        if (isMounted) {
          setProfiles(data || []);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.message);
        }
      }
    }

    loadCurrentProfiles();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedOrganization = organizations.find(
    (organization) =>
      organization.id === selectedOrganizationId
  );

  const organizationProfiles = profiles.filter(
    (profile) => profile.role === "organization"
  );

  const unassignedOrganizationProfiles =
    organizationProfiles.filter(
      (profile) => !profile.organization_id
    );

  const selectedMembers = selectedOrganization
    ? organizationProfiles.filter(
        (profile) =>
          profile.organization_id ===
          selectedOrganization.id
      )
    : [];

  const metricsByOrganization = new Map();

  organizations.forEach((organization) => {
    metricsByOrganization.set(organization.id, {
      members: organizationProfiles.filter(
        (profile) =>
          profile.organization_id === organization.id
      ).length,
      assigned: assignments.filter(
        (assignment) =>
          assignment.organization_id === organization.id
      ).length,
      active: assignments.filter(
        (assignment) =>
          assignment.organization_id === organization.id &&
          ["Assigned", "Accepted"].includes(
            assignment.status
          )
      ).length,
      resolved: assignments.filter(
        (assignment) =>
          assignment.organization_id === organization.id &&
          assignment.status === "Completed"
      ).length,
    });
  });

  const activeOrganizationsCount = organizations.filter(
    (organization) => organization.status === "Active"
  ).length;

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEditing(organization) {
    setEditingOrganizationId(organization.id);
    setSelectedOrganizationId(organization.id);
    setForm(toForm(organization));
  }

  async function refreshAll() {
    await Promise.all([onRefresh(), loadProfiles()]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy("save");
    setMessage("");

    try {
      if (editingOrganizationId) {
        await updateOrganization(
          editingOrganizationId,
          form
        );
        setMessage("Organization updated.");
      } else {
        await createOrganization(form);
        setMessage("Organization created.");
      }

      setForm(emptyForm);
      setEditingOrganizationId("");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  }

  async function handleToggleStatus(organization) {
    const nextStatus =
      organization.status === "Active"
        ? "Suspended"
        : "Active";

    setBusy(`status:${organization.id}`);
    setMessage("");

    try {
      await setOrganizationStatus(
        organization.id,
        nextStatus
      );
      setMessage(`Organization ${nextStatus.toLowerCase()}.`);
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  }

  async function handleAssignProfile(profileId) {
    if (!selectedOrganization) return;

    setBusy(`assign:${profileId}`);
    setMessage("");

    try {
      await assignProfileToOrganization(
        profileId,
        selectedOrganization.id
      );
      setMessage("Member assigned.");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  }

  async function handleRemoveProfile(profileId) {
    setBusy(`remove:${profileId}`);
    setMessage("");

    try {
      await removeProfileFromOrganization(profileId);
      setMessage("Membership removed.");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="page dashboard-page">
      <section className="section-heading">
        <span className="section-tag">
          Organization Management
        </span>
        <h1>Organizations</h1>
        <p>
          Manage response organizations and approved
          organization users.
        </p>
      </section>

      <section className="stats-grid org-stats-grid">
        <div className="stat-card">
          <Building2 size={26} />
          <div>
            <p>Total Organizations</p>
            <h2>{organizations.length}</h2>
          </div>
        </div>
        <div className="stat-card success">
          <Building2 size={26} />
          <div>
            <p>Active</p>
            <h2>{activeOrganizationsCount}</h2>
          </div>
        </div>
        <div className="stat-card">
          <UserPlus size={26} />
          <div>
            <p>Organization Users</p>
            <h2>{organizationProfiles.length}</h2>
          </div>
        </div>
        <div className="stat-card danger">
          <UserMinus size={26} />
          <div>
            <p>Unassigned Users</p>
            <h2>{unassignedOrganizationProfiles.length}</h2>
          </div>
        </div>
      </section>

      {message && (
        <p className="form-message success-message">{message}</p>
      )}

      <section className="admin-organization-layout">
        <form
          className="dashboard-panel organization-form"
          onSubmit={handleSubmit}
        >
          <div className="panel-header compact">
            <div>
              <h2>
                {editingOrganizationId
                  ? "Edit Organization"
                  : "Create Organization"}
              </h2>
              <p>Basic operating profile only.</p>
            </div>
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(event) =>
                updateForm("name", event.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={form.organizationType}
              onChange={(event) =>
                updateForm(
                  "organizationType",
                  event.target.value
                )
              }
            >
              {organizationTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Area</label>
            <input
              value={form.area}
              onChange={(event) =>
                updateForm("area", event.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label>Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                updateForm(
                  "contactEmail",
                  event.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>Contact Phone</label>
            <input
              value={form.contactPhone}
              onChange={(event) =>
                updateForm(
                  "contactPhone",
                  event.target.value
                )
              }
            />
          </div>

          <div className="access-request-actions">
            <button
              type="submit"
              className="approve-btn"
              disabled={busy === "save"}
            >
              {busy === "save"
                ? "Saving..."
                : editingOrganizationId
                ? "Save Changes"
                : "Create Organization"}
            </button>
            {editingOrganizationId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setEditingOrganizationId("");
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <section className="dashboard-panel organization-members-panel">
          <div className="panel-header compact">
            <div>
              <h2>Membership</h2>
              <p>
                Assign approved organization profiles
                through secure admin RPCs.
              </p>
            </div>
          </div>

          <select
            value={selectedOrganizationId}
            onChange={(event) =>
              setSelectedOrganizationId(event.target.value)
            }
          >
            <option value="">Select organization</option>
            {organizations.map((organization) => (
              <option
                value={organization.id}
                key={organization.id}
              >
                {organization.name}
              </option>
            ))}
          </select>

          {selectedOrganization ? (
            <>
              <div className="mini-list membership-list">
                <strong>
                  Current Members ({selectedMembers.length})
                </strong>
                {selectedMembers.length === 0 ? (
                  <p>No members assigned yet.</p>
                ) : (
                  selectedMembers.map((member) => (
                    <div
                      className="membership-row"
                      key={member.id}
                    >
                      <span>
                        {member.full_name ||
                          member.organization_name ||
                          member.id}
                      </span>
                      <button
                        type="button"
                        className="reject-btn compact-link"
                        disabled={
                          busy === `remove:${member.id}`
                        }
                        onClick={() =>
                          handleRemoveProfile(member.id)
                        }
                      >
                        {busy === `remove:${member.id}`
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mini-list membership-list">
                <strong>
                  Unassigned Organization Users (
                  {unassignedOrganizationProfiles.length})
                </strong>
                {unassignedOrganizationProfiles.length ===
                0 ? (
                  <p>No unassigned organization users.</p>
                ) : (
                  unassignedOrganizationProfiles.map(
                    (member) => (
                      <div
                        className="membership-row"
                        key={member.id}
                      >
                        <span>
                          {member.full_name ||
                            member.organization_name ||
                            member.id}
                        </span>
                        <button
                          type="button"
                          className="approve-btn compact-link"
                          disabled={
                            busy ===
                            `assign:${member.id}`
                          }
                          onClick={() =>
                            handleAssignProfile(member.id)
                          }
                        >
                          {busy === `assign:${member.id}`
                            ? "Assigning..."
                            : "Assign"}
                        </button>
                      </div>
                    )
                  )
                )}
              </div>
            </>
          ) : (
            <p className="membership-empty">
              Select an organization above to manage its
              members.
            </p>
          )}
        </section>
      </section>

      <section className="dashboard-panel operations-panel">
        <div className="panel-header">
          <h2>Organization Directory</h2>
          <p>Active and suspended response partners.</p>
        </div>

        {organizations.length === 0 ? (
          <p>No organizations have been created yet.</p>
        ) : (
          <div className="organization-card-grid">
            {organizations.map((organization) => (
              <OrganizationCard
                organization={organization}
                metrics={
                  metricsByOrganization.get(organization.id) || {
                    members: 0,
                    assigned: 0,
                    active: 0,
                    resolved: 0,
                  }
                }
                key={organization.id}
                onOpen={() =>
                  setSelectedOrganizationId(organization.id)
                }
                onEdit={() => startEditing(organization)}
                onToggleStatus={() =>
                  handleToggleStatus(organization)
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}