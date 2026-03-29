'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import Link from 'next/link'

export default function CustomerDetail({ params }: { params: { id: string } }) {
  const [cust, setCust] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('')
  const [paying, setPaying] = useState(false)

  const loadCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}`)
      const data = await res.json()
      if (res.ok) {
        setCust(data.customer)
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
    loadCustomer()
  }, [params.id])


  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaying(true)
    setError(null)
    
    try {
      if (Number(paymentAmount) <= 0) throw new Error("Enter an amount greater than 0")
      
      const res = await fetch(`/api/customers/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: Number(paymentAmount) })
      })
      
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to record payment')
      }
      
      setPaymentAmount('')
      loadCustomer()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading account...</div>
  if (!cust) return <div className="p-8 text-center text-red-500">Customer account not found.</div>

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <PageHeader 
        title={cust.name} 
        description={`Phone: ${cust.phone}`} 
      />

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* HIGHLIGHT STATS */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-6">
        {/* Detail Card */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col justify-between h-full">
           <div>
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-4">Summary</h3>
              <div className="space-y-3 mt-4">
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-gray-700 text-sm">Total Billed Lifetime</span>
                   <span className="font-semibold text-boutique-charcoal">₹{cust.total_billed.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-gray-100">
                   <span className="text-gray-700 text-sm">Total Collections</span>
                   <span className="font-semibold text-green-700">₹{cust.total_paid.toFixed(2)}</span>
                 </div>
              </div>
           </div>

           <div className="pt-6">
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-2">Current Outstanding</h3>
              <p className={`text-4xl font-medium tracking-tight ${cust.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                ₹{cust.balance.toFixed(2)}
              </p>
           </div>
        </div>

        {/* Payment Form */}
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-6 h-full flex flex-col">
           <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-1">Record Settlement</h3>
           <p className="text-sm text-boutique-charcoalLight mb-6">Drop outstanding balance by recording a manual ad-hoc payment collection.</p>
           
           <form onSubmit={handlePayment} className="space-y-4 flex-1 flex flex-col justify-end">
              <Input 
                label="Amount Recovered (₹)"
                type="number"
                min={0}
                step="0.01"
                max={cust.balance > 0 ? cust.balance : undefined}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                required
                disabled={cust.balance <= 0}
              />
              <Button type="submit" className="w-full mt-2" disabled={paying || cust.balance <= 0}>
                 {paying ? 'Processing...' : (cust.balance <= 0 ? 'No Dues Pending' : 'Settle Amount')}
              </Button>
           </form>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Customer Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          {cust.customer_balance_ledger?.length === 0 ? (
             <div className="p-8 text-center text-gray-700">No ledger entries found.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right">Billed</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Ledger Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {cust.customer_balance_ledger.map((ledger: any) => {
                   const isPaymentOnly = ledger.transaction_id === null
                   return (
                     <tr key={ledger.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4 text-gray-600">
                         {format(new Date(ledger.date_time), 'dd MMM y')}
                       </td>
                       <td className="px-6 py-4">
                         {isPaymentOnly ? (
                           <span className="text-green-700 italic text-xs font-semibold">Manual Settlement</span>
                         ) : (
                           <Link href={`/dashboard/billing/${ledger.transaction_id}`} className="text-blue-600 hover:underline">
                             View Invoice #{ledger.transaction_id}
                           </Link>
                         )}
                       </td>
                       <td className="px-6 py-4 text-right">
                          {ledger.amount_billed > 0 ? `₹${ledger.amount_billed.toFixed(2)}` : '-'}
                       </td>
                       <td className="px-6 py-4 text-right text-green-700 font-medium">
                          {ledger.amount_paid > 0 ? `₹${ledger.amount_paid.toFixed(2)}` : '-'}
                       </td>
                       <td className={`px-6 py-4 text-right font-medium ${ledger.due < 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {ledger.due > 0 ? '+' : ''}{ledger.due.toFixed(2)}
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
