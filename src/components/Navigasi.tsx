"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  role?: string;
  exp?: number;
}

const Navigasi = ({
  isMobile = false,
  isLoggedIn = false,
}: {
  isMobile?: boolean;
  isLoggedIn?: boolean;
}) => {
  const pathname = usePathname();
  const [isLogin, setIsLogin] = useState(isLoggedIn);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          setIsLogin(false);
          setRole(null);
        } else {
          setIsLogin(true);
          setRole(decoded.role || null);
        }
      } catch (err) {
        console.error("Invalid token", err);
        setIsLogin(false);
        setRole(null);
      }
    }
  }, []);

  const baseClass = isMobile
    ? "flex flex-col gap-4"
    : "hidden sm:flex items-center gap-6 px-4 py-2";

  const linkClass = (active: boolean) =>
    `px-3 py-1 rounded font-bold transition-colors ${
      active ? "bg-white text-black" : "text-gray-500 hover:text-black"
    }`;

  return (
    <div className={baseClass}>
      <Link href="/" className={linkClass(pathname === "/")}>
        Home
      </Link>
      <Link href="/about" className={linkClass(pathname === "/about")}>
        About
      </Link>
      <Link href="/products" className={linkClass(pathname === "/products")}>
        Product
      </Link>

      {isLogin && (
        <>
          <Link href="/order" className={linkClass(pathname === "/order")}>
            Order
          </Link>
          <Link href="/cart" className={linkClass(pathname === "/cart")}>
            Cart
          </Link>
          {/* ✅ Profile teks hanya muncul di mobile */}
          {isMobile && (
            <Link href="/profile" className={linkClass(pathname === "/profile")}>
              Profile
            </Link>
          )}
        </>
      )}

      {isLogin && role === "seller" && (
        <Link href="/seller/store" className={linkClass(pathname === "seller/store")}>
          Store
        </Link>
      )}
    </div>
  );
};

export default Navigasi;
