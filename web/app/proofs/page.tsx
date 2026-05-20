"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import {
  ShieldCheck,
  ImageIcon,
  ExternalLink,
  Loader2,
  Home,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Check,
  Copy,
  CheckCheck,
} from "lucide-react"
import { formatPrice } from "@/lib/timezones"

interface ProofItem {
  name: string
  packQuantity: number
  deliveredLabel: string
  lineTotal: number
}

interface Proof {
  id: string
  totalAmount: number
  items: ProofItem[]
  imageUrls: string[]
  robloxUsername?: string
}

interface ProofsResponse {
  page: number
  hasMore: boolean
  items: Proof[]
}

const ITEMS_PER_PAGE = 12
const ADMIN_IDS = ["1146730730060271736", "1005326332001009784"]

export default function ProofsPage() {
  const [proofs, setProofs] = useState<Proof[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [lightbox, setLightbox] = useState<{ proofIndex: number; imageIndex: number } | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [editingProofId, setEditingProofId] = useState<string | null>(null)
  const [editingItems, setEditingItems] = useState<ProofItem[]>([])
  const [saving, setSaving] = useState(false)
  const [copiedProofId, setCopiedProofId] = useState<string | null>(null)

  const fetchProofs = async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/proofs?page=${pageNum}&limit=${ITEMS_PER_PAGE}`, {
        cache: "no-store",
      })
      const data: ProofsResponse = await res.json()
      setProofs(Array.isArray(data.items) ? data.items : [])
      setHasMore(Boolean(data.hasMore))
      setPage(Number(data.page || pageNum))
    } catch (error) {
      console.error("Failed to fetch proofs:", error)
    } finally {
      setLoading(false)
    }
  }

  const detectAdmin = useCallback(() => {
    try {
      const token = localStorage.getItem("discordToken")
      const rawUser = localStorage.getItem("discordUser")
      if (!rawUser || !token) return
      const user = JSON.parse(rawUser)
      const discordId = String(user?.discordId || "").trim()
      if (ADMIN_IDS.includes(discordId)) {
        setIsAdmin(true)
        setAdminToken(token)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void fetchProofs(1)
    detectAdmin()
  }, [detectAdmin])

  const handlePrevPage = () => {
    if (page > 1) void fetchProofs(page - 1)
  }

  const handleNextPage = () => {
    if (hasMore) void fetchProofs(page + 1)
  }

  const openLightbox = (proofIndex: number, imageIndex: number) => {
    setClosing(false)
    setLightbox({ proofIndex, imageIndex })
  }

  const closeLightbox = () => {
    setClosing(true)
    setTimeout(() => {
      setLightbox(null)
      setClosing(false)
    }, 180)
  }

  const activeProof = lightbox ? proofs[lightbox.proofIndex] : null
  const activeImages = activeProof?.imageUrls || []
  const activeIndex = lightbox?.imageIndex ?? 0

  const prevImage = () => {
    if (!lightbox || activeImages.length <= 1) return
    setLightbox({
      ...lightbox,
      imageIndex: (lightbox.imageIndex - 1 + activeImages.length) % activeImages.length,
    })
  }

  const nextImage = () => {
    if (!lightbox || activeImages.length <= 1) return
    setLightbox({
      ...lightbox,
      imageIndex: (lightbox.imageIndex + 1) % activeImages.length,
    })
  }

  const startEdit = (proof: Proof) => {
    setEditingProofId(proof.id)
    setEditingItems(proof.items.map((item) => ({ ...item })))
  }

  const cancelEdit = () => {
    setEditingProofId(null)
    setEditingItems([])
  }

  const updateEditingItem = (index: number, field: keyof ProofItem, value: string | number) => {
    setEditingItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const saveEdit = async (proofId: string) => {
    if (!adminToken) return
    setSaving(true)
    try {
      const res = await fetch(`/api/shop/proofs/${proofId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ items: editingItems }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Save failed")

      setProofs((prev) =>
        prev.map((proof) =>
          proof.id === proofId
            ? {
                ...proof,
                items: editingItems,
                totalAmount: editingItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
              }
            : proof
        )
      )
      cancelEdit()
    } catch (error) {
      console.error("Save proof failed:", error)
    } finally {
      setSaving(false)
    }
  }

  const deleteProof = async (proofId: string) => {
    if (!adminToken || !confirm("Xóa proof này?")) return
    try {
      const res = await fetch(`/api/shop/proofs/${proofId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
      if (!res.ok) return
      setProofs((prev) => prev.filter((proof) => proof.id !== proofId))
    } catch (error) {
      console.error("Delete proof failed:", error)
    }
  }

  const copyRobloxName = async (proofId: string, robloxUsername?: string) => {
    if (!robloxUsername) return
    try {
      await navigator.clipboard.writeText(robloxUsername)
      setCopiedProofId(proofId)
      window.setTimeout(() => {
        setCopiedProofId((current) => (current === proofId ? null : current))
      }, 1500)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  const getGalleryGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1"
    return "grid-cols-2"
  }

  const getImageSpanClass = (count: number, index: number) => {
    return ""
  }

  const pageLabel = useMemo(() => `Trang ${page}`, [page])

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 transition-colors hover:bg-slate-700"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">Home</span>
            </a>

            <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
              <ShieldCheck className="h-8 w-8 text-green-400" />
              Proofs
            </h1>
          </div>

          <a
            href="https://discord.com/channels/1398984938111369256/1399154220434853969"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <ExternalLink className="h-5 w-5" />
            Vouch Channel
          </a>
        </div>

        {loading && proofs.length === 0 && (
          <div className="flex items-center justify-center py-20 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        )}

        {!loading && proofs.length === 0 && (
          <div className="animate-fade-in py-20 text-center">
            <ImageIcon className="mx-auto mb-4 h-16 w-16 text-slate-600" />
            <p className="text-xl text-slate-400">No proofs yet</p>
          </div>
        )}

        {!loading && proofs.length > 0 && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {proofs.map((proof, idx) => {
                const isEditing = editingProofId === proof.id
                const currentItems = isEditing ? editingItems : proof.items
                const currentTotal = isEditing
                  ? editingItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0)
                  : proof.totalAmount

                return (
                  <div
                    key={proof.id}
                    className="animate-vouch-entrance rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-sm transition-all hover:border-slate-600/50"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    {proof.robloxUsername && (
                      <div className="mb-4 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-sky-100">
                          {proof.robloxUsername}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyRobloxName(proof.id, proof.robloxUsername)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-100 hover:bg-sky-500/30"
                          title="Copy Roblox username"
                        >
                          {copiedProofId === proof.id ? (
                            <CheckCheck className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}

                    {proof.imageUrls.length > 0 ? (
                      <div className={`mb-4 grid gap-2 ${getGalleryGridClass(proof.imageUrls.length)}`}>
                        {proof.imageUrls.slice(0, 2).map((url, imageIndex) => (
                          <button
                            key={imageIndex}
                            type="button"
                            onClick={() => openLightbox(idx, imageIndex)}
                            className={`group relative overflow-hidden rounded-lg bg-slate-700/40 ${getImageSpanClass(proof.imageUrls.length, imageIndex)}`}
                          >
                            <img
                              src={url}
                              alt={`Proof ${imageIndex + 1}`}
                              className="h-auto max-h-[420px] w-full object-contain transition duration-200 group-hover:scale-[1.015] group-hover:opacity-90"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-4 flex h-32 w-full items-center justify-center rounded-lg bg-slate-700/50">
                        <ImageIcon className="h-8 w-8 text-slate-500" />
                      </div>
                    )}

                    <div className="mb-3 space-y-2">
                      {currentItems.map((item, itemIndex) =>
                        isEditing ? (
                          <div
                            key={itemIndex}
                            className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/60 p-2"
                          >
                            <input
                              value={item.name}
                              onChange={(e) => updateEditingItem(itemIndex, "name", e.target.value)}
                              className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white outline-none"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={item.lineTotal}
                              onChange={(e) =>
                                updateEditingItem(itemIndex, "lineTotal", Number(e.target.value || 0))
                              }
                              className="w-full rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-white outline-none"
                            />
                          </div>
                        ) : (
                          <div key={itemIndex} className="flex justify-between text-sm">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="text-slate-400">{formatPrice(item.lineTotal, "USD")}</span>
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-700 pt-3">
                      <span className="text-lg font-bold text-green-400">
                        {formatPrice(currentTotal, "USD")}
                      </span>

                      {isAdmin && (
                        <div className="flex gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => void saveEdit(proof.id)}
                                disabled={saving}
                                className="rounded bg-green-600 p-1.5 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                                title="Lưu"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="rounded bg-slate-700 p-1.5 text-white transition-colors hover:bg-slate-600"
                                title="Hủy"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(proof)}
                                className="rounded bg-slate-700 p-1.5 text-white transition-colors hover:bg-blue-600"
                                title="Sửa"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteProof(proof.id)}
                                className="rounded bg-slate-700 p-1.5 text-white transition-colors hover:bg-red-600"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-4 animate-fade-in">
              <button
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
                Previous
              </button>

              <span className="font-medium text-slate-400">{pageLabel}</span>

              <button
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {lightbox && activeImages.length > 0 && (
        <div
          className={
            "fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 " +
            (closing ? "animate-fade-out" : "animate-fade-in")
          }
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 rounded-lg bg-slate-800 p-2 transition-colors hover:bg-slate-700"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {activeImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-3"
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          <img
            src={activeImages[activeIndex]}
            alt={`Proof ${activeIndex + 1}`}
            className={
              "max-h-[90vh] max-w-[90vw] rounded-lg object-contain " +
              (closing ? "animate-modal-zoom-out" : "animate-modal-zoom-in")
            }
            onClick={(e) => e.stopPropagation()}
          />

          {activeImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-800/80 p-3"
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}

          {activeImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-800/80 px-4 py-2 text-sm font-medium text-white">
              {activeIndex + 1} / {activeImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
