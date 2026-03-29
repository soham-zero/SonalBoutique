'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export function InventoryTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  
  // Form states
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState<'metres' | 'pieces'>('metres')
  const [qty, setQty] = useState(0)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobwork/inventory')
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/jobwork/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, custom_code: code, unit, current_quantity: qty })
      })
      if (res.ok) {
        setIsAdding(false)
        fetchItems()
        setName('')
        setCode('')
        setQty(0)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleAction = async (id: number, action: 'restock' | 'used', amount: number) => {
    const notes = prompt(`Enter notes for this ${action}:`)
    if (notes === null) return

    try {
      const res = await fetch(`/api/jobwork/inventory/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, quantity: amount, notes })
      })
      if (res.ok) fetchItems()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-serif font-bold text-boutique-charcoal">Raw Materials & Supplies</h2>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'outline' : 'primary'}>
          {isAdding ? 'Cancel' : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-boutique-border shadow-soft grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <Input label="Material Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Silk Thread" />
          <Input label="Custom Code" value={code} onChange={e => setCode(e.target.value)} required placeholder="ST-01" />
          <div>
            <label className="block text-sm font-medium text-boutique-charcoal mb-1">Unit</label>
            <select 
              value={unit} 
              onChange={e => setUnit(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-boutique-roseLight"
            >
              <option value="metres">Metres</option>
              <option value="pieces">Pieces</option>
            </select>
          </div>
          <Input label="Initial Qty" type="number" min={0} value={qty} onChange={e => setQty(Number(e.target.value))} />
          <Button type="submit" className="md:col-start-4">Create Item</Button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No inventory records found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-boutique-cream transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{item.custom_code}</td>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className={`px-6 py-4 font-bold ${item.current_quantity < 5 ? 'text-red-600' : 'text-boutique-charcoal'}`}>
                      {item.current_quantity}
                    </td>
                    <td className="px-6 py-4 capitalize">{item.unit}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            const val = prompt('Enter quantity to add:')
                            if (val) handleAction(item.id, 'restock', Number(val))
                          }}
                        >
                          <ArrowUpCircle className="w-4 h-4 mr-1" />
                          Restock
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-boutique-rose border-boutique-roseLight hover:bg-red-50"
                          onClick={() => {
                            const val = prompt('Enter quantity used:')
                            if (val) handleAction(item.id, 'used', Number(val))
                          }}
                        >
                          <ArrowDownCircle className="w-4 h-4 mr-1" />
                          Used
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
