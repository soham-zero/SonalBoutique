'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const TYPES = ['capex', 'opex']
const CATEGORIES = ['salary', 'electricity', 'grocery', 'maintenance', 'transport', 'advertisement', 'miscellaneous']
const PAYMENT_MODES = ['cash', 'upi', 'split', 'credit', 'debit']

const getLocalDateTimeValue = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export default function AddExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [expenseType, setExpenseType] = useState('opex')
  const [category, setCategory] = useState('miscellaneous')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const [dateTime, setDateTime] = useState(getLocalDateTimeValue())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_type: expenseType,
          category,
          description,
          amount: Number(amount),
          payment_mode: paymentMode,
          date_time: dateTime
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to log expense')
      }

      router.push('/dashboard/expenses')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <PageHeader 
        title="Log New Expense" 
        description="Record outbound expenditures incurred by the boutique." 
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
           {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
              {error}
            </div>
           )}

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-boutique-charcoal mb-1">Expense Type</label>
               <select 
                 value={expenseType} 
                 onChange={(e) => setExpenseType(e.target.value)}
                 className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight capitalize"
               >
                 {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-boutique-charcoal mb-1">Category</label>
               <select 
                 value={category} 
                 onChange={(e) => setCategory(e.target.value)}
                 className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight capitalize"
               >
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
           </div>

           <Input 
             label="Description (Optional)" 
             placeholder="e.g. Printer Cartridges"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
           />

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Input 
               label="Amount (₹)" 
               type="number"
               min={0}
               step="0.01"
               value={amount}
               onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
               required
             />

             <div>
               <label className="block text-sm font-medium text-boutique-charcoal mb-1">Payment Mode</label>
               <select 
                 value={paymentMode} 
                 onChange={(e) => setPaymentMode(e.target.value)}
                 className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight capitalize"
               >
                 {PAYMENT_MODES.map(pm => <option key={pm} value={pm}>{pm}</option>)}
               </select>
             </div>

             <Input 
               label="Date & Time"
               type="datetime-local"
               value={dateTime}
               max={getLocalDateTimeValue()}
               onChange={(e) => setDateTime(e.target.value)}
               required
             />
           </div>

           <div className="pt-4 flex justify-end gap-3 border-t border-boutique-border mt-6">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Logging...' : 'Log Expense'}
              </Button>
           </div>
        </form>
      </div>
    </div>
  )
}
