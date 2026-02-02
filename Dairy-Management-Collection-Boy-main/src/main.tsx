// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./App.css";
import App from "./App";
import { FarmerProvider } from "./context/FarmerContext";

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <BrowserRouter>
      <FarmerProvider>
        <App />
      </FarmerProvider>
    </BrowserRouter>
  </React.StrictMode>
);