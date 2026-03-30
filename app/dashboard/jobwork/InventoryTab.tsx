'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, X, ChevronDown, ChevronUp,
  BookOpen, AlertTriangle, ReceiptText
} from 'lucide-react'

type InventoryItem = {
  id: number
  name: string
  custom_code: string
  unit: string
  current_quantity: number
}

type LedgerEntry = {
  id: number
  action: string
  quantity: number
  cost_price: number | null
  notes: string | null
  created_at: string
}

// ─── Action Modal ────────────────────────────────────────────────────────────
function ActionModal({
  item,
  action,
  onClose,
  onSuccess,
}: {
  item: InventoryItem
  action: 'restock' | 'used'
  onClose: () => void
  onSuccess: () => void
}) {
  const [qty, setQty] = useState<number | ''>('')
  const [costPrice, setCostPrice] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isRestock = action === 'restock'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qty || Number(qty) <= 0) { setError('Enter a valid quantity.'); return }
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = { action, quantity: Number(qty), notes }
      if (isRestock) body.cost_price = Number(costPrice) || 0
      const res = await fetch(`/api/jobwork/inventory/${item.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed')
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-card-hover border border-boutique-border w-full max-w-md animate-modal-in">
        {/* Header */}
        <div className={`px-6 py-4 rounded-t-2xl flex items-center justify-between ${
          isRestock
            ? 'bg-boutique-emeraldLight border-b border-emerald-200'
            : 'bg-boutique-rubyLight border-b border-red-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {isRestock
              ? <ArrowUpCircle className="w-5 h-5 text-boutique-emerald" />
              : <ArrowDownCircle className="w-5 h-5 text-boutique-ruby" />
            }
            <div>
              <h3 className="font-serif font-bold text-boutique-charcoal">
                {isRestock ? 'Restock Material' : 'Record Usage'}
              </h3>
              <p className="text-xs text-boutique-charcoalLight">{item.name} ({item.custom_code})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
            <X className="w-5 h-5 text-boutique-charcoalLight" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-boutique-rubyLight text-boutique-ruby rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className={`grid gap-4 ${isRestock ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Input
              label={`Quantity (${item.unit})`}
              type="number"
              min={1}
              step="0.01"
              placeholder="0"
              value={qty}
              onChange={e => setQty(e.target.value ? Number(e.target.value) : '')}
              required
            />
            {isRestock && (
              <Input
                label="Cost Price / Unit (₹)"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={costPrice}
                onChange={e => setCostPrice(e.target.value ? Number(e.target.value) : '')}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-boutique-charcoal mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isRestock ? 'e.g. Purchased from Textiles Hub' : 'e.g. Used for job #42'}
              rows={2}
              className="w-full rounded-lg border border-boutique-border bg-boutique-cream/50 px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30 resize-none"
            />
          </div>

          {/* Cost preview */}
          {isRestock && qty !== '' && costPrice !== '' && Number(qty) > 0 && Number(costPrice) > 0 && (
            <div className="p-3 bg-boutique-emeraldLight rounded-lg text-sm text-emerald-800 flex items-center gap-2">
              <ReceiptText className="w-4 h-4" />
              Total purchase cost: <strong className="ml-1">₹{(Number(qty) * Number(costPrice)).toFixed(2)}</strong>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              type="submit"
              variant={isRestock ? 'success' : 'danger'}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : isRestock ? 'Restock' : 'Record Usage'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Ledger Row ───────────────────────────────────────────────────────────────
function LedgerRow({ itemId }: { itemId: number }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (entries.length > 0) { setOpen(o => !o); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/jobwork/inventory/${itemId}/ledger`)
      if (res.ok) {
        const d = await res.json()
        setEntries(d.ledger || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setOpen(true) }
  }

  return (
    <>
      <button
        onClick={load}
        className="inline-flex items-center gap-1 text-xs font-medium text-boutique-indigo hover:underline"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Ledger
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 bg-boutique-indigoLight/40 rounded-xl border border-boutique-indigo/20 p-3 text-xs space-y-1.5 animate-slide-down">
          {loading && <p className="text-boutique-charcoalLight">Loading...</p>}
          {!loading && entries.length === 0 && <p className="text-boutique-charcoalLight">No ledger entries.</p>}
          {entries.map(e => (
            <div key={e.id} className="flex items-center gap-3 py-1 border-b border-boutique-indigo/10 last:border-0">
              {e.action === 'restock'
                ? <ArrowUpCircle className="w-3.5 h-3.5 text-boutique-emerald flex-shrink-0" />
                : <ArrowDownCircle className="w-3.5 h-3.5 text-boutique-ruby flex-shrink-0" />}
              <span className={`font-semibold ${e.action === 'restock' ? 'text-emerald-700' : 'text-red-700'}`}>
                {e.action === 'restock' ? `+${e.quantity}` : `-${e.quantity}`}
              </span>
              {e.cost_price != null && e.action === 'restock' && (
                <span className="text-boutique-charcoalLight">@ ₹{e.cost_price}/unit</span>
              )}
              {e.notes && <span className="text-boutique-charcoalLight truncate">{e.notes}</span>}
              <span className="ml-auto text-boutique-charcoalLight whitespace-nowrap">
                {format(new Date(e.created_at), 'dd MMM, h:mm a')}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [modal, setModal] = useState<{ item: InventoryItem; action: 'restock' | 'used' } | null>(null)

  // Add-material form
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [unit, setUnit] = useState<'metres' | 'pieces'>('metres')
  const [qty, setQty] = useState<number | ''>('')
  const [initCost, setInitCost] = useState<number | ''>('')

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobwork/inventory')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchItems() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/jobwork/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, custom_code: code, unit, current_quantity: Number(qty) || 0, cost_price: Number(initCost) || 0 })
      })
      if (res.ok) {
        setIsAdding(false)
        fetchItems()
        setName(''); setCode(''); setQty(''); setInitCost('')
      }
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      {modal && (
        <ActionModal
          item={modal.item}
          action={modal.action}
          onClose={() => setModal(null)}
          onSuccess={fetchItems}
        />
      )}

      <div className="flex justify-between items-center">
        <h2 className="section-title">Raw Materials &amp; Supplies</h2>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'outline' : 'primary'}>
          {isAdding ? 'Cancel' : (
            <><Plus className="w-4 h-4 mr-1.5" />Add Material</>
          )}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-boutique-border shadow-soft animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input label="Material Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Silk Thread" />
            <Input label="Custom Code" value={code} onChange={e => setCode(e.target.value)} required placeholder="ST-01" />
            <div>
              <label className="block text-sm font-medium text-boutique-charcoal mb-1">Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as 'metres' | 'pieces')}
                className="flex h-10 w-full rounded-lg border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30"
              >
                <option value="metres">Metres</option>
                <option value="pieces">Pieces</option>
              </select>
            </div>
            <Input label="Initial Qty" type="number" min={0} value={qty} onChange={e => setQty(e.target.value ? Number(e.target.value) : '')} />
            <Input label="Cost Price / Unit (₹)" type="number" min={0} step="0.01" placeholder="0.00" value={initCost} onChange={e => setInitCost(e.target.value ? Number(e.target.value) : '')} />
            <Button type="submit" variant="success">Create Item</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-boutique-charcoalLight">No inventory records found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/60 border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Code</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Name</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Stock</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Unit</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-boutique-cream/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-boutique-charcoalLight">{item.custom_code}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-boutique-charcoal">{item.name}</div>
                      <LedgerRow itemId={item.id} />
                    </td>
                    <td className={`px-6 py-4 font-bold text-lg ${item.current_quantity < 5 ? 'text-boutique-amber' : 'text-boutique-charcoal'}`}>
                      {item.current_quantity}
                      {item.current_quantity < 5 && (
                        <span className="badge-amber ml-2 text-xs">Low</span>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize text-boutique-charcoalLight">{item.unit}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setModal({ item, action: 'restock' })}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5 mr-1" />
                          Restock
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setModal({ item, action: 'used' })}
                        >
                          <ArrowDownCircle className="w-3.5 h-3.5 mr-1" />
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
