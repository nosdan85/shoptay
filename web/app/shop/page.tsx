"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Search, ShoppingCart, Package, Loader2, X, Plus, Minus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  game: string;
  price: number;
  bulkPrice?: number;
  image?: string;
  itemDescription?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const mockProducts: Product[] = [
  { id: "1", name: "Ancient Chest", category: "Chest", game: "NosTale", price: 15.99, bulkPrice: 13.99, itemDescription: "$15.99 for 1x Ancient Chest" },
  { id: "2", name: "Reroll Ticket", category: "Reroll", game: "NosTale", price: 2.50, bulkPrice: 1.99, itemDescription: "$2.50 for 1x Reroll Ticket" },
  { id: "3", name: "Power Seal", category: "Seal", game: "NosTale", price: 8.00, bulkPrice: 6.50, itemDescription: "$8.00 for 1x Power Seal" },
  { id: "4", name: "Legendary Shard", category: "Shard", game: "NosTale", price: 5.99, bulkPrice: 4.99, itemDescription: "$5.99 for 1x Legendary Shard" },
  { id: "5", name: "Mystic Relic", category: "Relic", game: "NosTale", price: 25.00, bulkPrice: 20.00, itemDescription: "$25.00 for 1x Mystic Relic" },
  { id: "6", name: "Warrior Set", category: "Sets", game: "NosTale", price: 45.00, bulkPrice: 38.00, itemDescription: "$45.00 for 1x Warrior Set" },
  { id: "7", name: "Combo Pack", category: "Combo", game: "NosTale", price: 12.99, bulkPrice: 10.99, itemDescription: "$12.99 for 1x Combo Pack" },
  { id: "8", name: "Dragon Chest", category: "Chest", game: "NosTale", price: 35.00, bulkPrice: 29.00, itemDescription: "$35.00 for 1x Dragon Chest" },
  { id: "9", name: "Skill Reroll", category: "Reroll", game: "NosTale", price: 3.50, bulkPrice: 2.75, itemDescription: "$3.50 for 1x Skill Reroll" },
  { id: "10", name: "Time Seal", category: "Seal", game: "NosTale", price: 6.50, bulkPrice: 5.25, itemDescription: "$6.50 for 1x Time Seal" },
  { id: "11", name: "Fire Shard", category: "Shard", game: "NosTale", price: 7.99, bulkPrice: 6.49, itemDescription: "$7.99 for 1x Fire Shard" },
  { id: "12", name: "Mage Set", category: "Sets", game: "NosTale", price: 42.00, bulkPrice: 35.00, itemDescription: "$42.00 for 1x Mage Set" },
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
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState(1);

  // Simulate loading products
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = mockProducts
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => activeGame === "All" || p.game === activeGame)
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "Price Low-High") return a.price - b.price;
      if (sortBy === "Price High-Low") return b.price - a.price;
      return 0;
    });

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
    showToast(`Added ${quantity}x ${product.name} to bag`);
  };

  const showToast = (message: string) => {
    setToast(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
    setTimeout(() => setToast(null), 2700);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast("Item removed from bag");
  };

  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    setAddQty(1);
  };

  const getItemPricing = (item: CartItem) => {
    const regularUnits = Math.min(item.quantity, 10);
    const bulkUnits = Math.max(0, item.quantity - 10);
    const regularPrice = Math.max(1, Math.floor(item.price));
    const bulkPrice = Math.max(1, Math.floor(item.bulkPrice || item.price * 0.85));
    const total = regularUnits * regularPrice + bulkUnits * bulkPrice;
    return { regularUnits, bulkUnits, regularPrice, bulkPrice, total, bulkApplied: bulkUnits > 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          <p className="text-slate-400 font-medium animate-pulse">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar cartCount={cartItemCount} showCart />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 bg-slate-700 flex items-center justify-center p-8 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                <Package className="w-32 h-32 text-slate-500" />
              </div>
              <div className="md:w-1/2 p-6 flex flex-col">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="self-end text-slate-400 hover:text-white mb-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">{selectedProduct.category}</span>
                <h2 className="text-2xl font-bold text-white mt-1 mb-2">{selectedProduct.name}</h2>
                <p className="text-slate-400 text-sm mb-4 font-serif">{selectedProduct.itemDescription}</p>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <span>&#10003;</span> Instant Delivery
                  </div>
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <span>&#10003;</span> Secure Transaction
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setAddQty(Math.max(1, addQty - 1))}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={addQty}
                    onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center bg-slate-700 border border-slate-600 rounded-lg py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setAddQty(addQty + 1)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 ml-1">selected</span>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProduct, addQty);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/30"
                >
                  ADD TO CART  ${(selectedProduct.price * addQty).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-800 border-l border-slate-700 shadow-2xl animate-slide-in-right flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                Bag ({cartItemCount})
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Your bag is empty</p>
                </div>
              ) : (
                cart.map((item) => {
                  const pricing = getItemPricing(item);
                  return (
                    <div key={item.id} className="flex gap-3 bg-slate-700/50 rounded-lg p-3 animate-fade-in">
                      <div className="w-14 h-14 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-7 h-7 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.quantity}x  qty {item.quantity}x {item.name}</p>
                        {pricing.bulkApplied && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/15 text-green-400 text-xs rounded font-medium">
                            Bulk discount applied
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <p className="text-sm font-bold text-green-400">${pricing.total.toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 text-xs hover:underline transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-700 space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Subtotal</span>
                  <span className="text-green-400">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {games.map((game, i) => (
              <button
                key={game}
                onClick={() => setActiveGame(game)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  activeGame === game
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {game}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Default">Default Sort</option>
              <option value="Price Low-High">Price: Low to High</option>
              <option value="Price High-Low">Price: High to Low</option>
            </select>

            <button
              onClick={() => setIsCartOpen(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, i) => (
            <div
              key={product.id}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <button onClick={() => handleOpenDetail(product)} className="w-full">
                <div className="bg-slate-700 h-36 flex items-center justify-center group">
                  <Package className="w-14 h-14 text-slate-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </button>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-white font-semibold text-sm flex-1 line-clamp-1 text-left">{product.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded ml-2 flex-shrink-0">
                    {product.category}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mb-3 text-left">{product.game}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-green-400">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No products found matching your criteria.</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("All"); setActiveGame("All"); }}
              className="mt-4 px-6 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 z-[100] ${
            toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">OK</span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
