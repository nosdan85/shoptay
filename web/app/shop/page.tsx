"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  game: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

const mockProducts: Product[] = [
  { id: "1", name: "Ancient Chest", category: "Chest", game: "NosTale", price: 15.99 },
  { id: "2", name: "Reroll Ticket", category: "Reroll", game: "NosTale", price: 2.50 },
  { id: "3", name: "Power Seal", category: "Seal", game: "NosTale", price: 8.00 },
  { id: "4", name: "Legendary Shard", category: "Shard", game: "NosTale", price: 5.99 },
  { id: "5", name: "Mystic Relic", category: "Relic", game: "NosTale", price: 25.00 },
  { id: "6", name: "Warrior Set", category: "Sets", game: "NosTale", price: 45.00 },
  { id: "7", name: "Combo Pack", category: "Combo", game: "NosTale", price: 12.99 },
  { id: "8", name: "Dragon Chest", category: "Chest", game: "NosTale", price: 35.00 },
  { id: "9", name: "Skill Reroll", category: "Reroll", game: "NosTale", price: 3.50 },
  { id: "10", name: "Time Seal", category: "Seal", game: "NosTale", price: 6.50 },
  { id: "11", name: "Fire Shard", category: "Shard", game: "NosTale", price: 7.99 },
  { id: "12", name: "Mage Set", category: "Sets", game: "NosTale", price: 42.00 },
];

const categories = ["All", "Chest", "Reroll", "Shard", "Seal", "Relic", "Sets", "Combo"];
const games = ["All", "NosTale", "Metin2", "League of Legends"];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeGame, setActiveGame] = useState("All");
  const [sortBy, setSortBy] = useState("Default");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const filteredProducts = mockProducts
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => activeGame === "All" || p.game === activeGame)
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "Price Low-High") return a.price - b.price;
      if (sortBy === "Price High-Low") return b.price - a.price;
      return 0;
    });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    showToast(`Added ${product.name} to cart`);
  };

  const showToast = (message: string) => {
    setToast(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
    setTimeout(() => setToast(null), 2500);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">NosMarket</Link>
          <div className="flex items-center gap-6">
            <Link href="/shop" className="text-white font-medium">Shop</Link>
            <Link href="/wallet" className="text-slate-300 hover:text-white transition">Wallet</Link>
            <Link href="/proofs" className="text-slate-300 hover:text-white transition">Proofs</Link>
            <Link href="/admin" className="text-slate-300 hover:text-white transition">Admin</Link>
            <Link href="/shop" className="relative text-slate-300 hover:text-white transition">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {games.map((game) => (
              <button
                key={game}
                onClick={() => setActiveGame(game)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeGame === game
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {game}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Default">Default Sort</option>
              <option value="Price Low-High">Price Low-High</option>
              <option value="Price High-Low">Price High-Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-slate-800 border border-slate-800 rounded-lg overflow-hidden hover:border-blue-500 transition flex flex-col justify-between">
              <div className="bg-slate-700 h-40 flex items-center justify-center">
                <Package className="w-16 h-16 text-slate-400" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold text-sm md:text-base flex-1 line-clamp-1">{product.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded ml-2">
                    {product.category}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mb-4">{product.game}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-base md:text-lg font-bold text-green-400">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-600 text-white rounded-lg transition text-xs font-semibold"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No products found matching your criteria.</p>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

