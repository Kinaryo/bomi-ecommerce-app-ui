"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Settings } from "lucide-react";

export default function SidebarSeller() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 text-xl font-bold border-b">Seller Panel</div>
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/seller/dashboard" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <LayoutDashboard size={18} /> Dashboard
        </Link>
        <Link href="/seller/products" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <Package size={18} /> Products
        </Link>
        <Link href="/seller/orders" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <ShoppingCart size={18} /> Orders
        </Link>
        <Link href="/seller/settings" className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100">
          <Settings size={18} /> Settings
        </Link>
      </nav>
    </div>
  );
}
