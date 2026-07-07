import { X } from "lucide-react";

const anyValue = "Any";

const defaultFilters = {
  trackingCode: "",
  issueType: anyValue,
  status: anyValue,
  organizationId: anyValue,
  riskLabel: anyValue,
  location: "",
};

export default function ReportFilters({
  filters,
  organizations,
  onChange,
}) {
  function updateFilter(name, value) {
    onChange({
      ...filters,
      [name]: value,
    });
  }

  const hasActiveFilters = Object.keys(defaultFilters).some(
    (key) => (filters[key] || "") !== defaultFilters[key]
  );

  function handleReset() {
    onChange({ ...defaultFilters });
  }

  return (
    <div className="report-filters-bar">
      <div className="report-filters">
        <input
          type="search"
          placeholder="Tracking code"
          aria-label="Filter by tracking code"
          value={filters.trackingCode || ""}
          onChange={(event) =>
            updateFilter("trackingCode", event.target.value)
          }
        />

        <input
          type="search"
          placeholder="Location"
          aria-label="Filter by location"
          value={filters.location || ""}
          onChange={(event) =>
            updateFilter("location", event.target.value)
          }
        />

        <select
          aria-label="Filter by issue type"
          value={filters.issueType || anyValue}
          onChange={(event) =>
            updateFilter("issueType", event.target.value)
          }
        >
          <option>{anyValue}</option>
          <option>Sewage Leak</option>
          <option>Blocked Drainage</option>
          <option>Dirty Water</option>
          <option>Burst Pipe</option>
          <option>Illegal Dumping</option>
          <option>Flooding</option>
          <option>Broken Public Toilet</option>
        </select>

        <select
          aria-label="Filter by status"
          value={filters.status || anyValue}
          onChange={(event) =>
            updateFilter("status", event.target.value)
          }
        >
          <option>{anyValue}</option>
          <option>Reported</option>
          <option>Verified</option>
          <option>Assigned</option>
          <option>In Progress</option>
          <option>Resolution Submitted</option>
          <option>Resolved</option>
          <option>Community Confirmed</option>
        </select>

        <select
          aria-label="Filter by organization"
          value={filters.organizationId || anyValue}
          onChange={(event) =>
            updateFilter("organizationId", event.target.value)
          }
        >
          <option>{anyValue}</option>
          {organizations.map((organization) => (
            <option value={organization.id} key={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by risk level"
          value={filters.riskLabel || anyValue}
          onChange={(event) =>
            updateFilter("riskLabel", event.target.value)
          }
        >
          <option>{anyValue}</option>
          <option>Critical</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="reset-btn compact-reset-btn"
          onClick={handleReset}
        >
          <X size={14} />
          Reset filters
        </button>
      )}
    </div>
  );
}