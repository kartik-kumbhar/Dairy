// src/layout/mainLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#F8F4E3]">
      {/* Left: sidebar */}
      <Sidebar />

      {/* Right: navbar + page content */}
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
