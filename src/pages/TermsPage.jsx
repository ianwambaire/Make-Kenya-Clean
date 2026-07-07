import { Link } from "react-router-dom";

export default function TermsPage() {
  return (
    <main className="page legal-page">
      <section className="section-heading">
        <span className="section-tag">Terms</span>
        <h1>Terms of Use</h1>
        <p>
          Make Kenya Clean is a community water and sanitation
          reporting platform. Use it honestly, safely, and for its
          intended purpose.
        </p>
      </section>

      <section className="dashboard-panel legal-content">
        <h2>Purpose</h2>
        <p>
          The platform helps communities report water and sanitation
          issues, track progress, and coordinate response with
          approved staff, Maji Champions, and organizations.
        </p>

        <h2>Not an Emergency Service</h2>
        <p>
          Make Kenya Clean is not an emergency response service. For
          immediate life-threatening danger, contact local emergency
          services or responsible public authorities directly.
        </p>

        <h2>Acceptable Use</h2>
        <p>
          Submit truthful reports, use accurate details where
          possible, and upload evidence related to the issue. Do not
          impersonate others, spam the service, upload harmful files,
          or share private documents or unrelated personal data.
        </p>

        <h2>Moderation and Accounts</h2>
        <p>
          Reports, feedback, and access requests may be reviewed.
          Staff accounts can be approved, rejected, suspended, or
          removed if they are misused or no longer appropriate.
        </p>

        <h2>Availability and Reliance</h2>
        <p>
          The service may be unavailable at times. Status updates are
          for coordination and transparency, but they should not be
          treated as official government action unless separately
          confirmed by the responsible authority.
        </p>

        <h2>Changes</h2>
        <p>
          These terms may be updated as the product matures. Continued
          use means you accept the latest version available in the
          app.
        </p>

        <p>
          Read the <Link to="/privacy">Privacy Policy</Link> to
          understand how report and account data are handled.
        </p>
      </section>
    </main>
  );
}
