"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Navbar tetap tampil di semua halaman kecuali login/register/dashboard
  const hideNavbarPaths = ["/login", "/register", "/forgotPassword"];
  const hideNavbar = hideNavbarPaths.includes(pathname) || pathname.startsWith("/dashboard");

  // Footer hanya tampil di halaman root "/"
  const showFooter = pathname === "/";

  return (
    <div className="mx-auto w-full">
      {!hideNavbar && <Navbar />}
      {children}
      {showFooter && <Footer />}
    </div>
  );
}
