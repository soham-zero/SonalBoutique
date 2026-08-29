'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft, ArrowUpCircle, ArrowDownCircle,
  CreditCard, Banknote, Smartphone, SplitSquareHorizontal, Search
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type PaymentMode = 'cash' | 'upi' | 'split' | 'credit' | 'debit'

const PAYMENT_BADGE: Record<PaymentMode, string> = {
  cash:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  upi:    'bg-blue-50 text-blue-700 border-blue-200',
  credit: 'bg-purple-50 text-purple-700 border-purple-200',
  debit:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  split:  'bg-orange-50 text-orange-700 border-orange-200',
}

export default function BishiMemberDetailPage({ params }: { params: { id: string, memberId: string } }) {
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'contribution' | 'redemption'>('all')

  // Opening Balance Edit State
  const [isEditingOpeningBalance, setIsEditingOpeningBalance] = useState(false)
  const [editOpeningBalanceValue, setEditOpeningBalanceValue] = useState('')
  const [isSavingOpeningBalance, setIsSavingOpeningBalance] = useState(false)

  const handleSaveOpeningBalance = async () => {
    if (!editOpeningBalanceValue) return
    setIsSavingOpeningBalance(true)
    try {
      const res = await fetch(`/api/bishi/${params.id}/members/${params.memberId}/opening-balance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_balance: editOpeningBalanceValue })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to update')
      }
      setIsEditingOpeningBalance(false)
      fetchMemberDetails()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setIsSavingOpeningBalance(false)
    }
  }

  const fetchMemberDetails = async () => {
    try {
      const res = await fetch(`/api/bishi/${params.id}/members/${params.memberId}`)
      const data = await res.json()
      if (res.ok) {
        setMember(data.member)
      } else {
        setError(data.error || 'Failed to fetch details')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemberDetails()
  }, [params.id, params.memberId])

  if (loading) return <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading member details...</div>
  if (error) return <div className="p-12 text-center text-red-500">Error: {error}</div>
  if (!member) return <div className="p-12 text-center text-red-500">Member not found.</div>

  // Unified chronological ledger:
  // contributions come from member.bishi_ledger
  // redemptions come from member.bishi_sales
  const contributionEntries = (member.bishi_ledger || []).map((c: any) => ({
    id: `ledger-${c.id}`,
    type: 'contribution' as const,
    date_time: c.date_time,
    amount: Number(c.contribution_amount),
    payment_mode: c.payment_mode as PaymentMode | null,
    notes: c.notes,
    bill_number: null
  }))

  const redemptionEntries = (member.bishi_sales || []).map((s: any) => ({
    id: `sale-${s.id}`,
    type: 'redemption' as const,
    date_time: s.date_time,
    amount: -Number(s.redeemed),
    payment_mode: null,
    notes: null,
    bill_number: s.transactions?.bill_number ?? null
  }))

  const ledger = [...contributionEntries, ...redemptionEntries].sort(
    (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
  )

  const filteredLedger = ledger.filter(entry => {
    if (typeFilter === 'all') return true
    return entry.type === typeFilter
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/bishi/${params.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Group
          </Button>
        </Link>
      </div>

      <PageHeader 
        title={member.name} 
        description={`Bishi Member • Phone: ${member.phone || 'N/A'} • Group: ${member.bishi?.name || 'Unknown'}`}
      />

      {/* HIGHLIGHT STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Opening Balance Card */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between group hover:border-boutique-roseDark/50 transition-colors relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-boutique-roseLight/20 rounded-full blur-xl" />
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-boutique-roseDark">Opening Balance</span>
            <Banknote className="w-4 h-4 text-boutique-roseDark/70" />
          </div>
          <div className="mt-3 z-10">
            {isEditingOpeningBalance ? (
              <div className="flex flex-col gap-2 mt-1">
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  className="w-full text-lg font-bold border-b-2 border-boutique-roseDark bg-transparent focus:outline-none"
                  value={editOpeningBalanceValue}
                  onChange={e => setEditOpeningBalanceValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveOpeningBalance()
                    if (e.key === 'Escape') setIsEditingOpeningBalance(false)
                  }}
                  disabled={isSavingOpeningBalance}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveOpeningBalance} disabled={isSavingOpeningBalance} className="text-xs font-bold text-boutique-roseDark bg-boutique-roseLight/30 px-2 py-1 rounded hover:bg-boutique-roseLight/50 transition-colors">
                    {isSavingOpeningBalance ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditingOpeningBalance(false)} disabled={isSavingOpeningBalance} className="text-xs font-semibold text-boutique-charcoalLight hover:text-boutique-charcoal transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between group-hover:bg-transparent">
                <h3 className="text-2xl font-bold text-boutique-charcoal">₹{Number(member.opening_balance || 0).toLocaleString()}</h3>
                <button
                  onClick={() => {
                    setEditOpeningBalanceValue(String(member.opening_balance || 0))
                    setIsEditingOpeningBalance(true)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-boutique-roseDark bg-boutique-roseLight/30 px-2 py-1 rounded hover:bg-boutique-roseLight/60 active:scale-95"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Total Contributed</span>
            <h3 className="text-2xl font-bold text-boutique-emerald mt-1">₹{Number(member.total_contributed).toLocaleString()}</h3>
          </div>
          <ArrowUpCircle className="w-5 h-5 text-boutique-emerald mt-4 self-end" />
        </div>
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Total Redeemed</span>
            <h3 className="text-2xl font-bold text-red-500 mt-1">₹{Number(member.total_redeemed).toLocaleString()}</h3>
          </div>
          <ArrowDownCircle className="w-5 h-5 text-red-500 mt-4 self-end" />
        </div>
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-boutique-charcoalLight">Current Balance</span>
            <h3 className="text-2xl font-bold text-boutique-charcoal mt-1">₹{Number(member.balance).toLocaleString()}</h3>
          </div>
          <div className="w-5 h-5 text-boutique-charcoal mt-4 self-end font-semibold text-xs">Bal</div>
        </div>
      </div>

      {/* Ledger Log Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-boutique-border shadow-soft">
          <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Member Ledger Log</h3>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              All Transactions
            </Button>
            <Button
              variant={typeFilter === 'contribution' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('contribution')}
            >
              Contributions
            </Button>
            <Button
              variant={typeFilter === 'redemption' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('redemption')}
            >
              Redemptions
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
          {filteredLedger.length === 0 ? (
            <div className="p-12 text-center text-boutique-charcoalLight">No transactions match the selected filter.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/60 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight border-b border-boutique-border">
                <tr>
                  <th className="px-5 py-3.5">Date &amp; Time</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border/60">
                {filteredLedger.map((entry) => {
                  const isCredit = entry.type === 'contribution'
                  return (
                    <tr key={entry.id} className={`hover:bg-boutique-cream/40 transition-colors ${isCredit ? '' : 'bg-red-50/30'}`}>
                      {/* Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="text-boutique-charcoal text-xs font-medium">
                          {format(new Date(entry.date_time), 'dd MMM yyyy')}
                        </div>
                        <div className="text-boutique-charcoalLight text-[11px]">
                          {format(new Date(entry.date_time), 'h:mm a')}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5">
                        {isCredit ? (
                          <div className="space-y-1">
                            {entry.payment_mode && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PAYMENT_BADGE[entry.payment_mode as PaymentMode]}`}>
                                {entry.payment_mode.toUpperCase()}
                              </span>
                            )}
                            {entry.notes && (
                              <p className="text-boutique-charcoalLight text-xs">{entry.notes}</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                              Redemption Outflow
                            </span>
                            {entry.bill_number && (
                              <p className="text-boutique-charcoalLight text-xs">Bill #{entry.bill_number}</p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {isCredit ? (
                          <span className="inline-flex items-center gap-1 font-bold text-boutique-emerald">
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                            + ₹{Math.abs(entry.amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-500">
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            − ₹{Math.abs(entry.amount).toLocaleString()}
                          </span>
                        )}
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
