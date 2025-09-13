"use client";

import React from "react";
import SidebarAdmin from "./components/SidebarAdmin";
import SidebarSeller from "./components/SidebarSeller";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role?: "admin" | "seller"; // optional, bisa di-pass dari page
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        {role === "admin" && <SidebarAdmin />}
        {role === "seller" && <SidebarSeller />}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
