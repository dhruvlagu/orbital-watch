import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/tokens.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/physics.css";
import "./styles/solutions.css";
import "./styles/get-involved.css";
import "./styles/about.css";
import "./styles/collision-watch.css";

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
