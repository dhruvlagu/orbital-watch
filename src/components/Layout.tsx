import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import RouteProgressBar from "./RouteProgressBar";
import BackToTop from "./BackToTop";

function PageLoader() {
  return (
    <div className="pageLoader" aria-live="polite" aria-busy="true">
      <div className="pageLoader__spinner" />
      <div className="pageLoader__text">Loading watch room...</div>
    </div>
  );
}

export default function Layout() {
  return (
    <>
      <RouteProgressBar />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="appMain" role="main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
