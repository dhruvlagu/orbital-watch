import { Link } from "react-router-dom";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

export default function NotFoundPage() {
  useDocumentMetadata(
    "Page Not Found | Orbital Watch",
    "The requested Orbital Watch page could not be found.",
    undefined,
    "noindex, follow",
  );

  return (
    <section className="heroPlaceholder">
      <div className="container heroPlaceholder__inner">
        <div className="card heroPlaceholder__card">
          <div className="badge badge--amber">404</div>
          <h1>Page not found</h1>
          <p className="muted">The page you requested does not exist or has moved.</p>
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
