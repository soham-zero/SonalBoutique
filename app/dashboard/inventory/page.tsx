'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Eye, AlertTriangle, BookOpen } from 'lucide-react'

type InventoryItem = { id: number; name: string; custom_code: string; selling_price: number; current_quantity: number }

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchItems = async (q = '') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems(search)
  }

  const lowStockCount = items.filter(i => i.current_quantity < 5).length

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

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2.5 p-3.5 bg-boutique-amberLight rounded-xl border border-amber-200 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-boutique-amber" />
          <span><strong>{lowStockCount}</strong> item{lowStockCount > 1 ? 's' : ''} are running low on stock (below 5 units).</span>
        </div>
      )}

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
          <span className="text-sm text-boutique-charcoalLight ml-auto">{items.length} items</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-boutique-charcoalLight">No inventory items found.</div>
          ) : (
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
                  const isLow = item.current_quantity < 5
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-boutique-cream/60 transition-colors ${isLow ? 'bg-boutique-amberLight/30' : ''}`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-boutique-charcoalLight">
                        {item.custom_code}
                      </td>
                      <td className="px-6 py-4 font-medium text-boutique-charcoal">
                        {item.name}
                        {isLow && (
                          <span className="badge-amber ml-2 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-center font-bold text-lg ${isLow ? 'text-boutique-amber' : 'text-boutique-charcoal'}`}>
                        {item.current_quantity}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                        ₹{item.selling_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/dashboard/inventory/${item.id}`}>
                          <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-indigo gap-1.5">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
