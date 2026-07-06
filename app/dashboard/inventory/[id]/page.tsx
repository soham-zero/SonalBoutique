'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import {
  Edit2, Save, X, ArrowLeft, ArrowUpRight, ArrowDownLeft,
  Lock, AlertTriangle, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import { PasswordModal } from '@/components/ui/PasswordModal'

const getLocalDateTimeValue = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function InventoryDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [item, setItem] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Editing Flags (Name, Price)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingPrice, setIsEditingPrice] = useState(false)
  
  // Edited values
  const [editName, setEditName] = useState('')
  const [editPriceVal, setEditPriceVal] = useState<number | ''>('')
  
  // Password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [savingProtected, setSavingProtected] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Restocking State
  const [restockQty, setRestockQty] = useState<number | ''>('')
  const [restockCost, setRestockCost] = useState<number | ''>('')
  const [restockDateTime, setRestockDateTime] = useState<string>(getLocalDateTimeValue())
  const [restocking, setRestocking] = useState(false)

  const loadItem = async () => {
    try {
      const res = await fetch(`/api/inventory/${params.id}`)
      const data = await res.json()
      if (res.ok) {
        setItem(data.item)
        setTimeline(data.timeline || [])
        setEditPriceVal(data.item.selling_price)
        setEditName(data.item.name)
      } else {
        setError(data.error)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
       setLoading(false)
    }
  }

  useEffect(() => {
    loadItem()
  }, [params.id])

  const handleProtectedSave = () => {
    if (isEditingName && !editName.trim()) { setError('Name cannot be empty.'); return }
    if (isEditingPrice && (editPriceVal === '' || Number(editPriceVal) < 0)) { setError('Price must be 0 or more.'); return }
    setError(null)
    setPasswordError('')
    setShowPasswordModal(true)
  }

  const handlePasswordConfirm = async (password: string) => {
    setSavingProtected(true)
    setPasswordError('')

    try {
      const body: any = { password }
      if (isEditingName) body.name = editName.trim()
      if (isEditingPrice) body.selling_price = Number(editPriceVal)

      const res = await fetch(`/api/inventory/${params.id}/update-protected`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.status === 401) {
        const d = await res.json()
        setPasswordError(d.error || 'Incorrect password')
        setSavingProtected(false)
        return
      }

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to update')
      }

      // Success
      setShowPasswordModal(false)
      setIsEditingName(false)
      setIsEditingPrice(false)
      setPasswordError('')
      loadItem()
    } catch (e: any) {
      setPasswordError(e.message)
    } finally {
      setSavingProtected(false)
    }
  }

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    setRestocking(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/inventory/${params.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity_added: Number(restockQty),
          cost_price: Number(restockCost),
          date_time: restockDateTime ? new Date(restockDateTime).toISOString() : null
        })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to restock')
      }
      
      setRestockQty('')
      setRestockCost('')
      setRestockDateTime(getLocalDateTimeValue())
      loadItem()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRestocking(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading item details...</div>
  if (!item) return <div className="p-8 text-center text-red-500">Item not found.</div>

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal
          onConfirm={handlePasswordConfirm}
          onClose={() => { setShowPasswordModal(false); setPasswordError('') }}
          loading={savingProtected}
          externalError={passwordError}
          title="Protected Inventory Edit"
          subtitle="Manager password required to save changes"
        />
      )}

      <div className="flex items-center justify-between no-print">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        
        {(isEditingName || isEditingPrice) && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => {
              setIsEditingName(false)
              setIsEditingPrice(false)
              setEditName(item.name)
              setEditPriceVal(item.selling_price)
              setError(null)
            }}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleProtectedSave}>
              <Save className="w-4 h-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight mb-1">Item Name</label>
            {isEditingName ? (
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-2xl font-serif font-bold text-boutique-charcoal bg-white border-2 border-amber-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-serif font-bold text-boutique-charcoal">{item.name}</h1>
                <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={() => setIsEditingName(true)}>
                  <Edit2 className="w-3.5 h-3.5 text-boutique-charcoalLight hover:text-boutique-charcoal" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-boutique-charcoalLight mt-2">Code: {item.custom_code} <span className="text-[10px] text-amber-600 font-semibold uppercase ml-2">(read-only)</span></p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* HIGHLIGHT STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detail Card */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col justify-between h-full">
          <div>
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-4">Stock Status</h3>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700 text-sm">Current Quantity Available</span>
              <span className="text-2xl font-bold text-boutique-charcoal">
                {item.current_quantity}
              </span>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-4 flex justify-between items-center">
              Selling Price
              {!isEditingPrice && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditingPrice(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </h3>
            
            {isEditingPrice ? (
              <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <span className="text-gray-700">₹</span>
                <Input 
                  type="number"
                  min={0}
                  step="0.01"
                  value={editPriceVal}
                  onChange={(e) => setEditPriceVal(e.target.value ? Number(e.target.value) : '')}
                  className="bg-white"
                  autoFocus
                />
              </div>
            ) : (
              <p className="text-3xl font-medium text-boutique-charcoal tracking-tight">₹{Number(item.selling_price).toFixed(2)}</p>
            )}
          </div>
        </div>

        {/* Restock Form */}
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-6 h-full">
          <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-1">Record Restock</h3>
          <p className="text-sm text-boutique-charcoalLight mb-6">Add new inward inventory logically updating the history.</p>
          
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Quantity to Add"
                type="number"
                min={1}
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <Input 
                label="Cost Price (per unit)"
                type="number"
                min={0}
                step="0.01"
                value={restockCost}
                onChange={(e) => setRestockCost(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-boutique-charcoal mb-1">Restock Date &amp; Time</label>
              <input
                type="datetime-local"
                value={restockDateTime}
                onChange={(e) => setRestockDateTime(e.target.value)}
                className="w-full rounded-lg border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30"
                required
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={restocking}>
              {restocking ? 'Processing...' : 'Add Stock'}
            </Button>
          </form>
        </div>
      </div>

      {/* TIMELINE TABLE */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border bg-gray-50">
          <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Stock History Timeline</h3>
        </div>
        <div className="overflow-x-auto">
          {timeline.length === 0 ? (
             <div className="p-8 text-center text-gray-700">No stock history entries found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-boutique-charcoal font-medium border-b border-gray-200 bg-white">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Quantity Change</th>
                  <th className="px-6 py-4 text-right">Price / Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {timeline.map((entry) => {
                   const isRestock = entry.type === 'restock'
                   const isCancelled = entry.cancelled
                   return (
                     <tr key={entry.id} className={`hover:bg-gray-50 ${isCancelled ? 'opacity-60 text-gray-400' : ''}`}>
                       <td className="px-6 py-4 text-gray-600">
                         {format(new Date(entry.date_time), 'PPp')}
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-1.5 font-medium text-boutique-charcoal">
                           {isRestock ? (
                             <>
                               <ArrowUpRight className="w-4 h-4 text-green-600" />
                               <span>Restock Inflow</span>
                             </>
                           ) : (
                             <>
                               <ArrowDownLeft className={`w-4 h-4 ${isCancelled ? 'text-gray-400' : 'text-boutique-ruby'}`} />
                               <span className={isCancelled ? 'line-through' : ''}>
                                 Sale Outflow {isCancelled && '(Cancelled)'}
                               </span>
                             </>
                           )}
                         </div>
                         <p className="text-xs text-boutique-charcoalLight mt-0.5">{entry.notes}</p>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                           isCancelled
                             ? 'text-gray-500 bg-gray-100 line-through'
                             : isRestock 
                               ? 'text-green-700 bg-green-50' 
                               : 'text-red-700 bg-red-50'
                         }`}>
                           {isRestock ? `+${entry.quantity}` : `${entry.quantity}`}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right font-medium">
                         ₹{Number(entry.price).toFixed(2)}
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


