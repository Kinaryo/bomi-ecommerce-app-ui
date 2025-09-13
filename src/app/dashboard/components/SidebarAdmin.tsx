"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, ShoppingBag, Settings } from "lucide-react";

export default function SidebarAdmin() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 text-xl font-bold border-b">Admin Panel</div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/admin/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link href="/admin/users" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <Users size={18} /> Users
        </Link>
        <Link href="/admin/stores" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <ShoppingBag size={18} /> Stores
        </Link>
        <Link href="/admin/settings" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <Settings size={18} /> Settings
        </Link>
      </nav>
    </div>
  );
}
