'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AddInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [customCode, setCustomCode] = useState('')
  const [name, setName] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>('')
  const [sellingPrice, setSellingPrice] = useState<number | ''>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_code: customCode,
          name,
          current_quantity: Number(currentQuantity) || 0,
          selling_price: Number(sellingPrice)
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add item')
      }

      router.push('/dashboard/inventory')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader 
        title="Add Inventory Item" 
        description="Register a new purchasable item into the boutique inventory system." 
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
           {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
              {error}
            </div>
           )}

           <div className="space-y-4">
             <Input 
               label="Custom Code" 
               placeholder="e.g. DRESS-001"
               value={customCode}
               onChange={(e) => setCustomCode(e.target.value)}
               required
             />
             
             <Input 
               label="Item Name" 
               placeholder="Georgette Anarkali Suit"
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
             />

             <div className="grid grid-cols-2 gap-4">
               <Input 
                 label="Initial Quantity" 
                 type="number"
                 min={0}
                 value={currentQuantity}
                 onChange={(e) => setCurrentQuantity(e.target.value ? Number(e.target.value) : '')}
                 required
               />
               <Input 
                 label="Selling Price (₹)" 
                 type="number"
                 min={0}
                 step="0.01"
                 value={sellingPrice}
                 onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                 required
               />
             </div>
           </div>

           <div className="pt-4 flex justify-end gap-3 border-t border-boutique-border mt-6">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Item'}
              </Button>
           </div>
        </form>
      </div>
    </div>
  )
}
