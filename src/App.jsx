import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Droplets, Home, LayoutDashboard, MapPinned, ShieldCheck } from "lucide-react";
import "./App.css";

function LandingPage() {
  return (
    <main className="page hero-page">
      <section className="hero">
        <div className="badge">Community Water & Sanitation Intelligence</div>

        <h1>Make Kenya Clean</h1>

        <p className="hero-text">
          A community-driven platform that helps residents report sanitation risks,
          maps hotspots in real time, and supports faster response through local
          verification and risk scoring.
        </p>

        <div className="hero-actions">
          <Link to="/report" className="btn primary-btn">
            Report an Issue
          </Link>
          <Link to="/dashboard" className="btn secondary-btn">
            View Dashboard
          </Link>
        </div>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <Droplets size={32} />
          <h3>Report Water & Sanitation Issues</h3>
          <p>
            Residents can report sewage leaks, blocked drainage, dirty water,
            burst pipes, flooding, and illegal dumping.
          </p>
        </div>

        <div className="feature-card">
          <MapPinned size={32} />
          <h3>Live Hotspot Map</h3>
          <p>
            Community reports appear on a map so high-risk areas can be seen,
            verified, and prioritized.
          </p>
        </div>

        <div className="feature-card">
          <ShieldCheck size={32} />
          <h3>Maji Champions</h3>
          <p>
            Trusted local volunteers verify reports, confirm action, and help
            close the accountability loop.
          </p>
        </div>
      </section>
    </main>
  );
}

function ReportIssue() {
  return (
    <main className="page">
      <h1>Report an Issue</h1>
      <p>
        This is where residents will submit water and sanitation problems from
        their community.
      </p>
    </main>
  );
}

function MapView() {
  return (
    <main className="page">
      <h1>Community Risk Map</h1>
      <p>
        This page will show sanitation and water-risk hotspots using a live map.
      </p>
    </main>
  );
}

function Dashboard() {
  return (
    <main className="page">
      <h1>Response Dashboard</h1>
      <p>
        This dashboard will show risk scores, reports, pending cases, and
        resolved sanitation issues.
      </p>
    </main>
  );
}

function Champions() {
  return (
    <main className="page">
      <h1>Maji Champions</h1>
      <p>
        Maji Champions are community volunteers who verify reports and confirm
        whether issues have been resolved.
      </p>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/" className="logo">
          <Droplets size={24} />
          Make Kenya Clean
        </Link>

        <div className="nav-links">
          <Link to="/">
            <Home size={18} />
            Home
          </Link>
          <Link to="/report">Report</Link>
          <Link to="/map">Map</Link>
          <Link to="/dashboard">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/champions">Champions</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/report" element={<ReportIssue />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/champions" element={<Champions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;