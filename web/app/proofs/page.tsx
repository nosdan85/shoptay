"use client"

import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import { ShieldCheck, ImageIcon, ExternalLink, Loader2, Home, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { formatPrice } from "@/lib/timezones"

interface ProofItem {
  name: string
  packQuantity: number
  deliveredLabel: string
  lineTotal: number
}

interface Proof {
  id: string
  orderId: string
  discordUsername: string
  totalAmount: number
  items: ProofItem[]
  imageUrls: string[]
  createdAt: string
}

interface ProofsResponse {
  page: number
  hasMore: boolean
  items: Proof[]
}

const ITEMS_PER_PAGE = 12

export default function ProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  const fetchProofs = async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/proofs?page=${pageNum}&limit=${ITEMS_PER_PAGE}`)
      const data: ProofsResponse = await res.json()
      setProofs(data.items)
      setHasMore(data.hasMore)
      setPage(data.page)
    } catch (error) {
      console.error("Failed to fetch proofs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProofs(1)
  }, [])

  const handlePrevPage = () => {
    if (page > 1) fetchProofs(page - 1)
  }

  const handleNextPage = () => {
    if (hasMore) fetchProofs(page + 1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </a>
            
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-green-400" />
              Proofs
            </h1>
          </div>
          
          <a
            href="https://discord.com/channels/1398984938111369256/1399154220434853969"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-white font-medium"
          >
            <ExternalLink className="w-5 h-5" />
            Vouch Channel
          </a>
        </div>

        {/* Loading State */}
        {loading && proofs.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        )}

        {/* Empty State */}
        {!loading && proofs.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 text-xl">No proofs yet</p>
          </div>
        )}

        {/* Proofs Grid */}
        {!loading && proofs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                >
                  {/* Images Grid */}
                  {proof.imageUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {proof.imageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setLightboxImage(url)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-slate-700/50 rounded-lg flex items-center justify-center mb-4">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                  )}

                  {/* User Info */}
                  <div className="mb-3">
                    <p className="text-slate-400 text-sm">Order: {proof.orderId}</p>
                    <p className="text-white font-semibold text-lg">@{proof.discordUsername}</p>
                  </div>

                  {/* Items */}
                  <div className="mb-3 space-y-1">
                    {proof.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-300">
                          {item.name} <span className="text-slate-500">{item.deliveredLabel}</span>
                        </span>
                        <span className="text-slate-400">{formatPrice(item.lineTotal, "USD")}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Date */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                    <span className="text-green-400 font-bold text-lg">
                      {formatPrice(proof.totalAmount, "USD")}
                    </span>
                    <span className="text-slate-500 text-sm">{formatDate(proof.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              <span className="text-slate-400 font-medium">Page {page}</span>

              <button
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size proof"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
