export default function HomePage() {
  return (
    <section className="heroPlaceholder">
      <div className="container heroPlaceholder__inner">
        <div className="card heroPlaceholder__card">
          <div className="badge badge--blue">HOME</div>
          <h2>Hero section coming next</h2>
          <p className="muted">
            This is a blank placeholder page to confirm global styles, typography,
            navbar, and footer are applied correctly.
          </p>
          <div className="heroPlaceholder__actions">
            <button className="btn btn--primary" type="button">
              Primary Button
            </button>
            <button className="btn btn--secondary" type="button">
              Secondary Button
            </button>
            <div className="heroPlaceholder__badges">
              <span className="badge badge--red">Red</span>
              <span className="badge badge--amber">Amber</span>
              <span className="badge badge--green">Green</span>
              <span className="badge badge--blue">Blue</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
