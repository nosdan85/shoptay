"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, LogOut, User, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

interface NavbarProps {
  cartCount?: number;
  showCart?: boolean;
}

export default function Navbar({ cartCount = 0, showCart = false }: NavbarProps) {
  const { user, isLoading, logout, getOAuthUrl } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      setLoggingOut(false);
      setDropdownOpen(false);
    }, 500);
  };

  const getAvatarUrl = (user: { avatar?: string; discordId: string }) => {
    if (!user.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`;
  };

  return (
    <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors duration-200">
          NosMarket
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/shop" className="text-slate-300 hover:text-white transition-colors duration-150 font-medium">
            Shop
          </Link>
          <Link href="/proofs" className="text-slate-300 hover:text-white transition-colors duration-150 font-medium">
            Proofs
          </Link>
          <Link href="/admin" className="text-slate-300 hover:text-white transition-colors duration-150 font-medium">
            Admin
          </Link>

          {showCart && (
            <Link href="/shop" className="relative text-slate-300 hover:text-white transition-colors duration-150">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-bounce-in">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors duration-150 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700 hover:border-blue-500"
              >
                {getAvatarUrl(user) ? (
                  <img
                    src={getAvatarUrl(user)!}
                    alt={user.discordUsername}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
                <span className="text-sm font-medium max-w-[100px] truncate">{user.discordUsername}</span>
                {user.isOwner && (
                  <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded font-bold">
                    ADMIN
                  </span>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-semibold text-white truncate">{user.discordUsername}</p>
                    <p className="text-xs text-slate-400">Discord ID: {user.discordId}</p>
                    {user.isOwner && <span className="text-xs text-orange-400 font-medium">Owner Account</span>}
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-50"
                  >
                    {loggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href={getOAuthUrl()}
              className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Login with Discord
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
