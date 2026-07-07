// PrivacyPolicyPage.jsx
import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <main className="page legal-page">
      <section className="section-heading">
        <span className="section-tag">Privacy</span>
        <h1>Privacy Policy</h1>
        <p>
          Make Kenya Clean collects only what is needed to
          receive reports, coordinate response work, and keep
          communities informed.
        </p>
      </section>

      <section className="dashboard-panel legal-content">
        <h2>Information We Collect</h2>
        <p>
          Public reports may include issue type, description,
          location, risk details, tracking code, and an optional
          photo. If you choose to share contact details, we collect
          your name, phone number, or email so authorized staff can
          follow up.
        </p>

        <h2>Public and Private Data</h2>
        <p>
          Report details, general location, status, public photos,
          and public-safe timeline updates may be shown publicly.
          Reporter contact details and private resolution evidence
          are restricted to authorized staff and approved response
          organizations where needed.
        </p>

        <h2>Location and Photos</h2>
        <p>
          Location helps place reports on the map and guide response
          teams. Photos should show the water or sanitation issue,
          not private documents, ID cards, unnecessary faces, or
          unrelated personal information.
        </p>

        <h2>Accounts and Notifications</h2>
        <p>
          Staff, Maji Champion, and organization accounts are used
          to verify, assign, resolve, and review reports.
          Notifications are used to keep authorized users informed
          about work assigned to them or requiring review.
        </p>

        <h2>Retention and Security</h2>
        <p>
          Records are retained while they remain useful for
          sanitation intelligence, accountability, and response
          coordination. We use role-based access controls and
          database security policies, but no online service can
          promise perfect security.
        </p>

        <h2>Your Choices</h2>
        <p>
          You may submit a public report anonymously. If you want a
          correction or have a privacy concern, contact the Make
          Kenya Clean team through the project contact channel.
        </p>

        <p>
          Read the <Link to="/terms">Terms of Use</Link> for
          acceptable use and platform limitations.
        </p>
      </section>
    </main>
  );
}