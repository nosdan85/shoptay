import Link from "next/link";
import { ShoppingCart, Wallet, FileText, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">NosMarket</h1>
          <div className="flex gap-4">
            <Link href="/shop" className="text-slate-300 hover:text-white transition">Shop</Link>
            <Link href="/wallet" className="text-slate-300 hover:text-white transition">Wallet</Link>
            <Link href="/proofs" className="text-slate-300 hover:text-white transition">Proofs</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">Gaming Marketplace</h2>
          <p className="text-xl text-slate-300">Buy and sell gaming items securely with instant delivery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/shop" className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
            <ShoppingCart className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Shop</h3>
            <p className="text-slate-400">Browse and purchase items</p>
          </Link>
          <Link href="/wallet" className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition">
            <Wallet className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Wallet</h3>
            <p className="text-slate-400">Manage your balance</p>
          </Link>
          <Link href="/proofs" className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition">
            <FileText className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Proofs</h3>
            <p className="text-slate-400">View delivery proofs</p>
          </Link>
          <Link href="/admin" className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-orange-500 transition">
            <ShieldCheck className="w-8 h-8 text-orange-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Admin</h3>
            <p className="text-slate-400">Manage store</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
