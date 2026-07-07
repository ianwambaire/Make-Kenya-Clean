import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { reportClientError } from "../utils/errorReporting";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    reportClientError(error, { area: "react-boundary" });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="page error-page">
        <section className="dashboard-panel error-panel">
          <AlertTriangle size={28} />
          <span className="section-tag">App Error</span>
          <h1>Something went wrong</h1>
          <p>
            This page could not finish loading. Your reports and
            data are safe — try reloading, or return home and
            continue from there.
          </p>
          <div className="access-request-actions">
            <button
              type="button"
              className="approve-btn"
              onClick={() => globalThis.location.reload()}
            >
              Reload page
            </button>
            <Link to="/" className="btn secondary-btn">
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }
}