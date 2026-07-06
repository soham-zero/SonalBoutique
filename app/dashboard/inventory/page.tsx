'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Eye, AlertTriangle, BookOpen, Trash2 } from 'lucide-react'

type InventoryItem = { id: string; name: string; custom_code: string; selling_price: number; current_quantity: number }


export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10

  const fetchItems = async (q = '', isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset)
    })
    if (q) params.set('q', q)

    try {
      const res = await fetch(`/api/inventory?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newItems = data.items || []
        if (isLoadMore) {
          setItems(prev => [...prev, ...newItems])
          setOffset(currentOffset)
        } else {
          setItems(newItems)
          setOffset(0)
        }
        setTotalCount(data.count || 0)
        setHasMore(currentOffset + newItems.length < (data.count || 0))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems(search)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete item')
      }
      fetchItems(search)
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Inventory" 
        description="Manage stock levels, coding, and pricing."
        action={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory/ledger">
              <Button variant="outline" size="sm" className="gap-1.5">
                <BookOpen className="w-4 h-4" />
                Ledger
              </Button>
            </Link>
            <Link href="/dashboard/inventory/add">
              <Button variant="success">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Item
              </Button>
            </Link>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
            <Input 
              placeholder="Search by name or code..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <span className="text-sm text-boutique-charcoalLight ml-auto">{items.length} of {totalCount} items</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-boutique-charcoalLight">No inventory items found.</div>
          ) : (
            <>
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/60 border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight">Code</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight">Item Name</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight text-center">Stock</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight text-right">Selling Price</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border/60">
                {items.map((item) => {
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-boutique-cream/60 transition-colors`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-boutique-charcoalLight">
                        {item.custom_code}
                      </td>
                      <td className="px-6 py-4 font-medium text-boutique-charcoal">
                        {item.name}
                      </td>
                      <td className={`px-6 py-4 text-center font-bold text-lg`}>
                        {item.current_quantity}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                        ₹{item.selling_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center flex items-center justify-center gap-1.5">
                        <Link href={`/dashboard/inventory/${item.id}`}>
                          <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-indigo gap-1.5">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-6 text-center border-t border-boutique-border bg-gray-50/50">
                <Button
                  variant="outline"
                  onClick={() => fetchItems(search, true)}
                  disabled={loadingMore}
                  className="min-w-[150px]"
                >
                  {loadingMore ? 'Loading More...' : 'Load More'}
                </Button>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}