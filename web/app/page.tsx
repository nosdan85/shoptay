import Link from "next/link";
import { ShoppingCart, FileText, ShieldCheck, Loader2, Package } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors duration-200">
            NosMarket
          </Link>
          <div className="flex gap-4">
            <Link href="/shop" className="text-slate-300 hover:text-white transition-colors duration-200 font-medium">
              Shop
            </Link>
            <Link href="/proofs" className="text-slate-300 hover:text-white transition-colors duration-200 font-medium">
              Proofs
            </Link>
            <Link href="/admin" className="text-slate-300 hover:text-white transition-colors duration-200 font-medium">
              Admin
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl font-bold text-white mb-4 animate-float">Gaming Marketplace</h2>
          <p className="text-xl text-slate-300">Buy and sell gaming items securely with instant delivery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/shop"
            className="group bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-1"
          >
            <ShoppingCart className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
            <h3 className="text-lg font-semibold text-white mb-2">Shop</h3>
            <p className="text-slate-400">Browse and purchase items</p>
          </Link>

          <Link
            href="/proofs"
            className="group bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-2"
          >
            <FileText className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
            <h3 className="text-lg font-semibold text-white mb-2">Proofs</h3>
            <p className="text-slate-400">View delivery proofs</p>
          </Link>

          <Link
            href="/admin"
            className="group bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-3"
          >
            <ShieldCheck className="w-8 h-8 text-orange-400 mb-3 group-hover:scale-110 transition-transform duration-200" />
            <h3 className="text-lg font-semibold text-white mb-2">Admin</h3>
            <p className="text-slate-400">Manage store</p>
          </Link>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center animate-fade-in-up stagger-4">
            <Loader2 className="w-8 h-8 text-slate-500 mb-3 animate-spin" />
            <p className="text-slate-500 text-sm">More coming soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
