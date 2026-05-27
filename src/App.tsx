import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/the-crisis" element={<PlaceholderPage />} />
        <Route path="/the-physics" element={<PlaceholderPage />} />
        <Route path="/policy" element={<PlaceholderPage />} />
        <Route path="/solutions" element={<PlaceholderPage />} />
        <Route path="/get-involved" element={<PlaceholderPage />} />
        <Route path="/about" element={<PlaceholderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
