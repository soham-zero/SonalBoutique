'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import Link from 'next/link'
import { CreditCard, History, User, Check, X, Printer, ArrowLeft } from 'lucide-react'

type Customer = {
  id: string
  name: string
  phone: string
  total_billed: number
  total_paid: number
  balance: number
}

type Transaction = {
  id: string
  bill_number: string
  date_time: string
  total_amount: number
  payment_mode: string
}

type Payment = {
  id: string
  amount_paid: number
  payment_mode: string
  payment_date: string
  notes: string | null
}

export default function CustomerDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [txOffset, setTxOffset] = useState(0)
  const [hasMoreTx, setHasMoreTx] = useState(true)
  const [loadingMoreTx, setLoadingMoreTx] = useState(false)

  const [payOffset, setPayOffset] = useState(0)
  const [hasMorePay, setHasMorePay] = useState(true)
  const [loadingMorePay, setLoadingMorePay] = useState(false)

  const LIMIT = 10

  // Settlement Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('cash')
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [paying, setPaying] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<{
    customerName: string
    phone: string
    amount: number
    mode: string
    date: string
    notes: string
    refId: string
  } | null>(null)

  const printAreaRef = useRef<HTMLDivElement>(null)

  const loadCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${params.id}?tx_limit=${LIMIT}&pay_limit=${LIMIT}`)
      const data = await res.json()
      if (res.ok) {
        setCustomer(data.customer)
        setTransactions(data.transactions || [])
        setPayments(data.payments || [])
        setTxOffset(0)
        setPayOffset(0)
        setHasMoreTx((data.transactions || []).length === LIMIT)
        setHasMorePay((data.payments || []).length === LIMIT)
      } else {
        setError(data.error)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
       setLoading(false)
    }
  }

  const loadMoreTx = async () => {
    setLoadingMoreTx(true)
    const nextOffset = txOffset + LIMIT
    try {
      const res = await fetch(`/api/customers/${params.id}?tx_limit=${LIMIT}&tx_offset=${nextOffset}&pay_limit=0`)
      if (res.ok) {
        const data = await res.json()
        const newTx = data.transactions || []
        setTransactions(prev => [...prev, ...newTx])
        setTxOffset(nextOffset)
        setHasMoreTx(newTx.length === LIMIT)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMoreTx(false)
    }
  }

  const loadMorePay = async () => {
    setLoadingMorePay(true)
    const nextOffset = payOffset + LIMIT
    try {
      const res = await fetch(`/api/customers/${params.id}?tx_limit=0&pay_limit=${LIMIT}&pay_offset=${nextOffset}`)
      if (res.ok) {
        const data = await res.json()
        const newPay = data.payments || []
        setPayments(prev => [...prev, ...newPay])
        setPayOffset(nextOffset)
        setHasMorePay(newPay.length === LIMIT)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMorePay(false)
    }
  }

  useEffect(() => {
    loadCustomer()
  }, [params.id])

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.")
      return
    }
    setPaying(true)
    setError(null)

    try {
      const res = await fetch(`/api/customers/${params.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: Number(amount),
          payment_mode: paymentMode,
          payment_date: new Date(paymentDate).toISOString(),
          notes: notes || null
        })
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to record settlement.')
      }

      const resData = await res.json()
      
      // Store details for instant printing before state gets reset
      setLastReceipt({
        customerName: customer?.name || '',
        phone: customer?.phone || '',
        amount: Number(amount),
        mode: paymentMode,
        date: paymentDate,
        notes: notes,
        refId: resData.payment?.id || 'N/A'
      })

      // Reset Form and Modal
      setAmount('')
      setNotes('')
      setIsModalOpen(false)
      
      // Re-fetch all data to refresh
      await loadCustomer()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPaying(false)
    }
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading account...</div>
  if (!customer) return <div className="p-8 text-center text-red-500">Customer account not found.</div>

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 print:p-0 print:m-0">
      {/* Header hidden in print */}
      <div className="flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="print:hidden">
        <PageHeader 
          title={customer.name} 
          description={`Phone: ${customer.phone}`} 
          action={
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Record Settlement
            </Button>
          }
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm print:hidden">
          {error}
        </div>
      )}

      {/* HIGHLIGHT STATS (hidden in print) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col justify-between">
           <div>
             <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Total Lifetime Billed</span>
             <h3 className="text-2xl font-bold text-boutique-charcoal mt-1">₹{customer.total_billed.toFixed(2)}</h3>
           </div>
           <User className="w-5 h-5 text-boutique-indigo mt-4 self-end" />
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col justify-between">
           <div>
             <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Total Payments Received</span>
             <h3 className="text-2xl font-bold text-green-600 mt-1">₹{customer.total_paid.toFixed(2)}</h3>
           </div>
           <Check className="w-5 h-5 text-green-600 mt-4 self-end" />
        </div>
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-6 flex flex-col justify-between">
           <div>
             <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Current Balance Due</span>
             <h3 className={`text-2xl font-bold mt-1 ${customer.balance > 0 ? 'text-red-500' : 'text-green-700'}`}>
               ₹{customer.balance.toFixed(2)}
             </h3>
           </div>
           <CreditCard className="w-5 h-5 text-red-400 mt-4 self-end" />
        </div>
      </div>

      {/* Recent Receipt preview & print block (always printed when print is triggered) */}
      {lastReceipt && (
        <div className="bg-boutique-cream border border-boutique-indigo/30 rounded-2xl p-6 shadow-soft max-w-lg mx-auto print:border-0 print:shadow-none print:max-w-none print:p-0">
          <div className="flex justify-between items-center border-b border-boutique-border pb-3 mb-4 print:hidden">
            <h3 className="font-serif font-bold text-lg text-boutique-indigo">Recent Settlement Receipt</h3>
            <Button variant="outline" size="sm" onClick={handlePrintReceipt} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print Receipt
            </Button>
          </div>

          <div ref={printAreaRef} className="space-y-4 print:block text-boutique-charcoal">
            <div className="text-center pb-4 border-b border-dashed border-gray-300">
               <h2 className="font-serif font-bold text-xl uppercase tracking-wider">Sonal Boutique</h2>
               <p className="text-xs text-boutique-charcoalLight">Premium Custom Tailoring &amp; Designing</p>
               <p className="text-xs text-boutique-charcoalLight mt-1">PAYMENT RECEIPT</p>
            </div>
            
            <div className="grid grid-cols-2 text-xs gap-y-2">
               <div><strong>Customer:</strong> {lastReceipt.customerName}</div>
               <div className="text-right"><strong>Phone:</strong> {lastReceipt.phone}</div>
               <div><strong>Date:</strong> {format(new Date(lastReceipt.date), 'dd MMM yyyy')}</div>
               <div className="text-right"><strong>Receipt ID:</strong> <span className="font-mono text-[10px]">{lastReceipt.refId.substring(0, 8)}...</span></div>
            </div>

            <div className="bg-white/60 p-4 border border-boutique-border rounded-xl text-center my-4 print:bg-white print:border-gray-300">
               <p className="text-xs text-boutique-charcoalLight uppercase tracking-wider font-semibold">Amount Settled</p>
               <h4 className="text-3xl font-bold mt-1 text-boutique-indigo">₹{lastReceipt.amount.toFixed(2)}</h4>
               <p className="text-xs capitalize text-boutique-charcoalLight mt-1">Paid via {lastReceipt.mode}</p>
            </div>

            {lastReceipt.notes && (
              <div className="text-xs italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                 Notes: {lastReceipt.notes}
              </div>
            )}

            <div className="text-center pt-4 border-t border-dashed border-gray-300 text-[10px] text-boutique-charcoalLight">
               Thank you for shopping at Sonal Boutique!
            </div>
          </div>
        </div>
      )}

      {/* TABS FOR TRANSACTIONS & PAYMENTS (hidden in print) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        
        {/* Invoice Billings list */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
           <div className="p-4 border-b border-boutique-border bg-gray-50/50 flex items-center gap-2">
              <History className="w-4 h-4 text-boutique-charcoalLight" />
              <h3 className="font-serif font-bold text-base text-boutique-charcoal">Billing Transactions</h3>
           </div>
           <div className="overflow-x-auto">
             {transactions.length === 0 ? (
               <div className="p-8 text-center text-boutique-charcoalLight">No invoice billing records.</div>
             ) : (
               <>
               <table className="w-full text-left text-xs">
                 <thead className="bg-boutique-creamDark/20 font-semibold border-b border-boutique-border text-boutique-charcoalLight">
                   <tr>
                     <th className="px-4 py-3">Bill #</th>
                     <th className="px-4 py-3">Date</th>
                     <th className="px-4 py-3">Payment Mode</th>
                     <th className="px-4 py-3 text-right">Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-boutique-border/50">
                   {transactions.map(tx => (
                     <tr key={tx.id} className="hover:bg-boutique-cream/20">
                       <td className="px-4 py-3.5 font-mono text-boutique-indigo font-semibold">
                         <Link href={`/dashboard/billing/${tx.id}`} className="hover:underline">
                           #{tx.bill_number}
                         </Link>
                       </td>
                       <td className="px-4 py-3.5 text-boutique-charcoalLight">
                         {format(new Date(tx.date_time), 'dd MMM yyyy')}
                       </td>
                       <td className="px-4 py-3.5 capitalize text-boutique-charcoalLight">
                         {tx.payment_mode}
                       </td>
                       <td className="px-4 py-3.5 text-right font-medium text-boutique-charcoal">
                         ₹{tx.total_amount.toFixed(2)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {hasMoreTx && (
                 <div className="p-3 text-center border-t border-boutique-border">
                   <Button variant="ghost" size="sm" onClick={loadMoreTx} disabled={loadingMoreTx}>
                     {loadingMoreTx ? 'Loading...' : 'Load More Billings'}
                   </Button>
                 </div>
               )}
               </>
             )}
           </div>
        </div>

        {/* Payments history */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
           <div className="p-4 border-b border-boutique-border bg-gray-50/50 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-boutique-charcoalLight" />
              <h3 className="font-serif font-bold text-base text-boutique-charcoal">Payments &amp; Settlements</h3>
           </div>
           <div className="overflow-x-auto">
             {payments.length === 0 ? (
               <div className="p-8 text-center text-boutique-charcoalLight">No settlement collections recorded.</div>
             ) : (
               <>
               <table className="w-full text-left text-xs">
                 <thead className="bg-boutique-creamDark/20 font-semibold border-b border-boutique-border text-boutique-charcoalLight">
                   <tr>
                     <th className="px-4 py-3">Date</th>
                     <th className="px-4 py-3">Mode</th>
                     <th className="px-4 py-3">Notes</th>
                     <th className="px-4 py-3 text-right">Settled</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-boutique-border/50">
                   {payments.map(pay => (
                     <tr key={pay.id} className="hover:bg-boutique-cream/20">
                       <td className="px-4 py-3.5 text-boutique-charcoalLight">
                         {format(new Date(pay.payment_date), 'dd MMM yyyy')}
                       </td>
                       <td className="px-4 py-3.5 capitalize text-boutique-charcoalLight">
                         {pay.payment_mode}
                       </td>
                       <td className="px-4 py-3.5 text-boutique-charcoalLight truncate max-w-[150px]" title={pay.notes || ''}>
                         {pay.notes || '—'}
                       </td>
                       <td className="px-4 py-3.5 text-right font-semibold text-green-700">
                         ₹{pay.amount_paid.toFixed(2)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {hasMorePay && (
                 <div className="p-3 text-center border-t border-boutique-border">
                   <Button variant="ghost" size="sm" onClick={loadMorePay} disabled={loadingMorePay}>
                     {loadingMorePay ? 'Loading...' : 'Load More Payments'}
                   </Button>
                 </div>
               )}
               </>
             )}
           </div>
        </div>

      </div>

      {/* SETTLEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 print:hidden" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false) }}>
          <div className="bg-white rounded-2xl border border-boutique-border w-full max-w-md shadow-card-hover overflow-hidden animate-modal-in">
             <div className="bg-boutique-indigoLight/50 px-6 py-4 border-b border-boutique-border flex items-center justify-between">
                <div>
                   <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Record Collection</h3>
                   <p className="text-xs text-boutique-charcoalLight">{customer.name} • Bal: ₹{customer.balance.toFixed(2)}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded hover:bg-black/10 transition-colors">
                   <X className="w-5 h-5 text-boutique-charcoalLight" />
                </button>
             </div>

             <form onSubmit={handleSettlePayment} className="p-6 space-y-4">
                <Input 
                  label="Settlement Amount (₹)"
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={customer.balance > 0 ? customer.balance : undefined}
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-1.5">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-indigo/20"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI (GPay/PhonePe)</option>
                      <option value="debit">Debit Card</option>
                      <option value="credit">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <Input 
                      label="Payment Date"
                      type="date"
                      value={paymentDate}
                      onChange={e => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase tracking-wider mb-1.5">Collection Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Cleared pending dues for invoice #104"
                    rows={3}
                    className="w-full rounded-md border border-boutique-border bg-boutique-cream/40 px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-indigo/20 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-boutique-border mt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" variant="primary" disabled={paying || Number(amount) <= 0} className="flex-1">
                     {paying ? 'Recording...' : 'Record Payment'}
                  </Button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}
