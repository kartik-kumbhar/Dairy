// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./App.css";
import App from "./App";
import { FarmerProvider } from "./context/FarmerContext";
import { Toaster } from "react-hot-toast";
import { NetworkProvider } from "./context/NetworkContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#363636",
          color: "#fff",
          fontSize: "16px",
        },
        success: {
          style: {
            background: "#2A9D8F",
          },
        },
        error: {
          style: {
            background: "#E76F51",
          },
        },
      }}
    />
    <React.StrictMode>
      <BrowserRouter>
        <NetworkProvider>
          <FarmerProvider>
            <App />
          </FarmerProvider>
        </NetworkProvider>
      </BrowserRouter>
    </React.StrictMode>
  </>,
);
