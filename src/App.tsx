import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import CrisisPage from "./pages/CrisisPage";
import HomePage from "./pages/HomePage";
import PhysicsPage from "./pages/PhysicsPage";
import PolicyPage from "./pages/PolicyPage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
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
          <Route path="/solutions" element={<PlaceholderPage />} />
          <Route path="/get-involved" element={<PlaceholderPage />} />
          <Route path="/about" element={<PlaceholderPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
