"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, LogOut, User, Loader2, Menu, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface NavbarProps {
  cartCount?: number;
  showCart?: boolean;
}

export default function Navbar({ cartCount = 0, showCart = false }: NavbarProps) {
  const { user, isLoading, logout, getOAuthUrl } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      setLoggingOut(false);
      setDropdownOpen(false);
      setMobileMenuOpen(false);
    }, 500);
  };

  const getAvatarUrl = (user: { avatar?: string; discordId: string }) => {
    if (!user.avatar) return null;
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`;
  };

  return (
    <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 h-[64px]">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/shop" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-blue-400 transition-all duration-200">
          <img src="/site-logo.png" alt="NosMarket" className="h-8 w-auto object-contain animate-float" />
          <span>NosMarket</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/shop" className="text-slate-300 hover:text-white transition-colors duration-150 font-medium">
            Shop
          </Link>
          <Link href="/proofs" className="text-slate-300 hover:text-white transition-colors duration-150 font-medium">
            Proofs
          </Link>
          {user?.isOwner && (
            <Link href="/admin" className="text-slate-300 hover:text-white transition-colors duration-150 font-medium">
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showCart && (
            <Link href="/shop" className="relative text-slate-300 hover:text-white transition-colors duration-150 mr-2">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg animate-bounce-in">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* User Section (Hidden on mobile if not logged in to save space, or shown inside hamburger) */}
          <div className="hidden md:block">
            {isLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-all duration-150 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700 hover:border-blue-500"
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
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors duration-150 disabled:opacity-50"
                    >
                      {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
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
                Login with Discord
              </a>
            )}
          </div>

          {/* Hamburger Icon for Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-lg animate-fade-in absolute left-0 right-0 top-[100%] shadow-2xl z-40">
          <div className="px-4 py-4 flex flex-col gap-4">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-lg font-medium text-slate-200 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all"
            >
              <span>Shop</span>
            </Link>
            <Link
              href="/proofs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-lg font-medium text-slate-200 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all"
            >
              <span>Proofs</span>
            </Link>
            {user?.isOwner && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-lg font-medium text-orange-400 hover:text-orange-300 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all"
              >
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* Mobile Auth Section */}
            <div className="border-t border-slate-800 pt-4 mt-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-2 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading User...</span>
                </div>
              ) : user ? (
                <div className="space-y-3 px-3">
                  <div className="flex items-center gap-3 py-2">
                    {getAvatarUrl(user) ? (
                      <img src={getAvatarUrl(user)!} alt="" className="w-10 h-10 rounded-full border border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>
                    )}
                    <div>
                      <p className="font-semibold text-white truncate max-w-[180px]">{user.discordUsername}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">ID: {user.discordId}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all font-medium disabled:opacity-50"
                  >
                    {loggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <a
                  href={getOAuthUrl()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition-all font-medium shadow-lg"
                >
                  Login with Discord
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}


