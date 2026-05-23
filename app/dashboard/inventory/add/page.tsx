'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Package, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

const CUSTOM_CODE_REGEX = /^[A-Z]+-\d+$/
const CUSTOM_CODE_ERROR = 'Custom code must follow CAPITALLETTERS-NUMBERS, e.g. DRESS-001.'

export default function AddInventoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customCodeError, setCustomCodeError] = useState<string | null>(null)
  
  const [customCode, setCustomCode] = useState('')
  const [name, setName] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState<number | ''>('')
  const [sellingPrice, setSellingPrice] = useState<number | ''>('')
  const [costPrice, setCostPrice] = useState<number | ''>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCustomCodeError(null)

    const normalizedCustomCode = customCode.trim()
    if (!CUSTOM_CODE_REGEX.test(normalizedCustomCode)) {
      setCustomCodeError(CUSTOM_CODE_ERROR)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_code: normalizedCustomCode,
          name,
          current_quantity: Number(currentQuantity) || 0,
          selling_price: Number(sellingPrice),
          cost_price: Number(costPrice) || 0,
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add item')
      }

      router.push('/dashboard/inventory')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      <PageHeader 
        title="Add Inventory Item" 
        description="Register a new item into the boutique inventory system." 
      />

      <div className="bg-white rounded-2xl shadow-soft border border-boutique-border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-boutique-rubyLight text-boutique-ruby rounded-xl border border-red-200 text-sm flex items-center gap-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Custom Code" 
                placeholder="e.g. DRESS-001"
                value={customCode}
                onChange={(e) => {
                  const nextValue = e.target.value
                  setCustomCode(nextValue)
                  setCustomCodeError(
                    nextValue.trim() && !CUSTOM_CODE_REGEX.test(nextValue.trim())
                      ? CUSTOM_CODE_ERROR
                      : null
                  )
                }}
                error={customCodeError || undefined}
                required
              />
              <Input 
                label="Item Name" 
                placeholder="Georgette Anarkali Suit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input 
                label="Initial Quantity" 
                type="number"
                min={0}
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <Input 
                label="Cost Price/Unit (₹)" 
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <Input 
                label="Selling Price/Unit (₹)" 
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                required
              />
            </div>

            {/* Margin preview */}
            {costPrice !== '' && sellingPrice !== '' && Number(costPrice) > 0 && (
              <div className="flex items-center gap-3 p-3 bg-boutique-emeraldLight rounded-xl border border-emerald-200 text-sm">
                <Package className="w-4 h-4 text-boutique-emerald flex-shrink-0" />
                <span className="text-emerald-800">
                  Margin: <strong>₹{(Number(sellingPrice) - Number(costPrice)).toFixed(2)}</strong>
                  {' '}({((Number(sellingPrice) - Number(costPrice)) / Number(costPrice) * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-boutique-border mt-6">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
