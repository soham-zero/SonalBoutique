'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Eye, AlertTriangle } from 'lucide-react'

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

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems(search)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Inventory" 
        description="Manage stock levels, coding, and pricing."
        action={
          <Link href="/dashboard/inventory/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <Input 
              placeholder="Search by name or code..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No inventory items found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-right">Selling Price</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {items.map((item) => {
                  const isLow = item.current_quantity < 5
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-boutique-cream transition-colors ${isLow ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-6 py-4 font-mono text-boutique-charcoalLight">
                        {item.custom_code}
                      </td>
                      <td className="px-6 py-4 font-medium text-boutique-charcoal">
                        {item.name}
                        {isLow && (
                          <span className="inline-flex items-center gap-1 ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-semibold">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-center font-bold ${isLow ? 'text-red-600' : 'text-boutique-charcoal'}`}>
                        {item.current_quantity}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                        ₹{item.selling_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/dashboard/inventory/${item.id}`}>
                          <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-charcoal">
                            <Eye className="w-4 h-4" />
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
