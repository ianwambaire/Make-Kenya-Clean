import { Component } from "react";
import { Link } from "react-router-dom";
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
        <section className="dashboard-panel">
          <span className="section-tag">App Error</span>
          <h1>Something went wrong.</h1>
          <p>
            The page could not finish loading. Try reloading,
            or return home and continue from there.
          </p>
          <div className="access-request-actions">
            <button
              type="button"
              className="approve-btn"
              onClick={() => globalThis.location.reload()}
            >
              Reload
            </button>
            <Link to="/" className="btn secondary-btn">
              Home
            </Link>
          </div>
        </section>
      </main>
    );
  }
}
