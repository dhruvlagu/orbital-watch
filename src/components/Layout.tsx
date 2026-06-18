import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import RouteProgressBar from "./RouteProgressBar";
import BackToTop from "./BackToTop";

export default function Layout() {
  return (
    <>
      <RouteProgressBar />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="appMain" role="main">
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
