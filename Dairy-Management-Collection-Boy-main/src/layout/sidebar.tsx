// src/layout/sidebar.tsx
import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
const DashboardIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="5" rx="1" />
    <rect x="3" y="13" width="5" height="8" rx="1" />
    <rect x="10" y="13" width="11" height="8" rx="1" />
  </svg>
);

const FarmerIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MilkIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <path d="M8 2h8l2 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6z" />
    <path d="M8 6h8" />
  </svg>
);

const DeductionIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M7 10h10" />
    <path d="M9 14h2" />
  </svg>
);

const BillsIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16l2-1 2 1 2-1 2 1 2-1 2 1V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6" />
    <path d="M9 17h3" />
  </svg>
);

const RateChartIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <path d="M3 3v18h18" />
    <path d="M7 15l4-4 3 3 4-6" />
    <circle cx="7" cy="15" r="1" />
    <circle cx="11" cy="11" r="1" />
    <circle cx="14" cy="14" r="1" />
    <circle cx="18" cy="8" r="1" />
  </svg>
);

const InventoryIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <rect x="3" y="4" width="18" height="6" rx="1" />
    <rect x="3" y="14" width="18" height="6" rx="1" />
    <path d="M7 8h2" />
    <path d="M7 18h2" />
  </svg>
);

const BonusIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <circle cx="12" cy="8" r="3" />
    <path d="M7 22v-3a5 5 0 0 1 10 0v3" />
    <path d="M5 9h2" />
    <path d="M17 9h2" />
    <path d="M6 5l1.5 1.5" />
    <path d="M18 5l-1.5 1.5" />
  </svg>
);

const ReportsIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 9h6" />
    <path d="M9 13h4" />
    <path d="M9 17h2" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  const menu: MenuItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Farmer Management", path: "/farmers", icon: <FarmerIcon /> },
    // Clicking this opens Milk Entry + List at /milk-collection
    { label: "Milk Collection", path: "/milk-collection", icon: <MilkIcon /> },
    { label: "Advance / Food", path: "/deduction", icon: <DeductionIcon /> },
    { label: "Generate Bills", path: "/bills", icon: <BillsIcon /> },
    { label: "Bonus Management", path: "/bonus", icon: <BonusIcon /> },
    { label: "Rate Chart", path: "/rate-chart", icon: <RateChartIcon /> },
    { label: "Inventory", path: "/inventory", icon: <InventoryIcon /> },
    { label: "Reports", path: "/reports/daily", icon: <ReportsIcon /> },
  ];

  return (
    <aside
      className={`
    fixed lg:relative z-40 flex flex-col h-full w-60 
    bg-[#2A9D8F] text-white shadow-lg
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
    >
      {/* Brand */}
      <div className="border-b border-[#247B71] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-2xl">
            🥛
          </div>
          <div>
            <div className="text-base font-bold leading-tight">My Dairy</div>
            <div className="text-xs text-white/80">Gokul Dairy Farm</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-3">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 1024) {
                onClose();
              }
            }}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-4",
                isActive
                  ? "bg-[#247B71] border-white text-white font-medium"
                  : "border-transparent text-white/85 hover:bg-[#247B71]/60",
              ].join(" ")
            }
          >
            <span className="text-white">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Date / time */}
      <div className="border-t border-[#247B71] bg-[#247B71]/40 px-4 py-3 text-xs text-white/85">
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>{formatDate(dateTime)}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span>🕒</span>
          <span>{formatTime(dateTime)}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
