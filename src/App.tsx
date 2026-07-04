import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import CrisisPage from "./pages/CrisisPage";
import HomePage from "./pages/HomePage";
import PhysicsPage from "./pages/PhysicsPage";
import PolicyPage from "./pages/PolicyPage";
import SolutionsPage from "./pages/SolutionsPage";
import GetInvolvedPage from "./pages/GetInvolvedPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  const location = useLocation();
  const pageStartTimeRef = useRef<number | null>(null);
  const currentPathRef = useRef(location.pathname);

  useEffect(() => {
    const logPageDuration = (path: string, startTime: number) => {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      if (typeof window === "undefined") return;

      const gtagFn = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtagFn === "function") {
        gtagFn("event", "page_duration", {
          page_path: path,
          duration_seconds: durationSeconds,
        });
      }

      console.info(`[analytics] ${path} viewed for ${durationSeconds}s`);
    };

    const handlePageHide = () => {
      if (pageStartTimeRef.current !== null) {
        logPageDuration(currentPathRef.current, pageStartTimeRef.current);
      }
    };

    pageStartTimeRef.current = Date.now();
    currentPathRef.current = location.pathname;
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (pageStartTimeRef.current !== null) {
        logPageDuration(currentPathRef.current, pageStartTimeRef.current);
      }
    };
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/crisis" element={<CrisisPage />} />
          <Route path="/physics" element={<PhysicsPage />} />
          <Route path="/the-crisis" element={<Navigate to="/crisis" replace />} />
          <Route path="/the-physics" element={<Navigate to="/physics" replace />} />
          <Route path="/policy" element={<PolicyPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/get-involved" element={<GetInvolvedPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
