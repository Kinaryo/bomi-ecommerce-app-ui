"use client";

import { useNotification } from "../context/NotificationContext";
import Link from "next/link";
import { Bell, User, Menu, X } from "lucide-react";
import Image from "next/image";
import Navigasi from "./Navigasi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Ambil context notification
  const { unreadCount } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-300 shadow-md z-50">
      <div className="relative flex items-center justify-between p-4">
        {/* LEFT (Logo) */}
        <div className="flex items-center">
          <Link className="flex items-center gap-2" href="/">
            <Image
              src="/rootImage/icon.png"
              alt="Bomi E-commerce"
              width={40}
              height={40}
            />
            <p className="hidden md:block text-md font-medium text-gray-800">
              BOMI-Ecommerce.com
            </p>
          </Link>
        </div>

        {/* CENTER (Navigasi) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:block">
          <Navigasi />
        </div>

        {/* RIGHT (Icons & Login/Logout) */}
        <div className="flex items-center gap-4 text-gray-800 ml-auto">
          {/* Bell (selalu tampil jika login) */}
          {isLoggedIn && (
            <Link href="/notification" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Profile icon hanya di desktop */}
          {isLoggedIn && (
            <Link href="/profile" className="hidden sm:block">
              <User className="w-5 h-5" />
            </Link>
          )}

          {/* Login/Logout desktop */}
          {!isLoggedIn ? (
            <Link
              href="/login"
              className="hidden sm:block bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="hidden sm:block text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-white text-gray-800 p-4 space-y-4 shadow-md">
          <Navigasi isMobile isLoggedIn={isLoggedIn} />

          {!isLoggedIn ? (
            <Link
              href="/login"
              className="block bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 text-center"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
