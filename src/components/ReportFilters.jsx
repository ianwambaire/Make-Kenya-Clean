const anyValue = "Any";

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

  return (
    <div className="report-filters">
      <input
        type="search"
        placeholder="Tracking code"
        value={filters.trackingCode || ""}
        onChange={(event) =>
          updateFilter("trackingCode", event.target.value)
        }
      />

      <input
        type="search"
        placeholder="Location"
        value={filters.location || ""}
        onChange={(event) =>
          updateFilter("location", event.target.value)
        }
      />

      <select
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
        value={filters.organizationId || anyValue}
        onChange={(event) =>
          updateFilter("organizationId", event.target.value)
        }
      >
        <option>{anyValue}</option>
        {organizations.map((organization) => (
          <option
            value={organization.id}
            key={organization.id}
          >
            {organization.name}
          </option>
        ))}
      </select>

      <select
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
  );
}
