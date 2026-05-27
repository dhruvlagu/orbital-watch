import { Link, useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const location = useLocation();
  const title = location.pathname.replace("/", "").replace(/-/g, " ");

  return (
    <section className="heroPlaceholder">
      <div className="container heroPlaceholder__inner">
        <div className="card heroPlaceholder__card">
          <div className="badge badge--amber">PLACEHOLDER</div>
          <h2>{title || "Page"} coming soon</h2>
          <p className="muted">This route exists to validate the active navbar state.</p>
          <div className="heroPlaceholder__actions">
            <Link className="btn btn--secondary" to="/">
              Back home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
