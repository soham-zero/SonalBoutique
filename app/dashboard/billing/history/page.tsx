'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Plus, Receipt, TrendingUp, XCircle, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: string
  transaction_number: string
  customer_name: string | null
  customer_phone: string | null
  payment_mode: string
  total_amount: number
  amount_paid: number
  date_time: string
  status: 'ACTIVE' | 'CANCELLED' | 'REVISED'
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 border border-red-200',
  REVISED: 'bg-amber-100 text-amber-800 border border-amber-200',
}
const STATUS_DOT: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
  REVISED: 'bg-amber-500',
}

const PAYMENT_BADGE: Record<string, string> = {
  cash: 'bg-green-50 text-green-800',
  upi: 'bg-blue-50 text-blue-800',
  card: 'bg-purple-50 text-purple-800',
  credit: 'bg-orange-50 text-orange-800',
}

export default function BillingHistoryPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 10

  const fetchTransactions = async (q = '', isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const queryStr = q ? `&q=${encodeURIComponent(q)}` : ''

    try {
      const res = await fetch(`/api/billing?limit=${LIMIT}&offset=${currentOffset}${queryStr}`)
      if (res.ok) {
        const data = await res.json()
        const newTransactions = data.transactions || []

        if (isLoadMore) {
          setTransactions(prev => [...prev, ...newTransactions])
          setOffset(currentOffset)
        } else {
          setTransactions(newTransactions)
          setOffset(0)
        }

        if (data.total_count !== undefined) {
          setTotalCount(data.total_count)
        }
        setHasMore(newTransactions.length === LIMIT)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { fetchTransactions() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTransactions(search)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing History"
        titleBadge={
          totalCount !== null ? (
            <span className="badge bg-boutique-creamDark text-boutique-charcoal font-semibold text-xs px-2.5 py-1">
              {totalCount} Total
            </span>
          ) : undefined
        }
        description="View and manage all transactions and receipts."
        action={
          <Link href="/dashboard/billing">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-2xl shadow-card border border-boutique-border overflow-hidden">
        {/* Search bar */}
        <div className="px-5 py-4 border-b border-boutique-border bg-boutique-cream/30 flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
            <Input
              placeholder="Search by name, phone or bill no…"
              className="pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          {!loading && transactions.length > 0 && (
            <span className="text-xs font-semibold text-boutique-charcoalLight bg-boutique-creamDark px-3 py-1.5 rounded-full border border-boutique-border">
              {transactions.length}{hasMore ? '+' : ''} result{transactions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading && transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-boutique-charcoalLight gap-3">
              <div className="w-8 h-8 border-3 border-boutique-roseLight border-t-boutique-roseDark rounded-full animate-spin" />
              <p className="text-sm">Loading transactions…</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Receipt className="w-10 h-10 text-boutique-border" />
              <p className="text-boutique-charcoalLight text-sm font-medium">No transactions found.</p>
              <Link href="/dashboard/billing">
                <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" />Create First Bill</Button>
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-boutique-creamDark/50 border-b border-boutique-border">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Bill No.</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Customer</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Mode</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Total</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Paid</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-boutique-charcoalLight">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-boutique-border/60">
                  {transactions.map((tx) => {
                    const balance = tx.total_amount - tx.amount_paid
                    return (
                      <tr 
                        key={tx.id} 
                        className="hover:bg-boutique-cream transition-colors cursor-pointer animate-fade-in group"
                        onClick={() => router.push(`/dashboard/billing/${tx.id}`)}
                      >
                        <td className="px-6 py-5 font-bold text-boutique-charcoal">#{tx.transaction_number}</td>
                        <td className="px-6 py-5 text-boutique-charcoalLight font-medium">
                          {format(new Date(tx.date_time), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-semibold text-boutique-charcoal">{tx.customer_name || 'Walk-in'}</div>
                          {tx.customer_phone && <div className="text-xs text-boutique-charcoalLight/80 font-medium">{tx.customer_phone}</div>}
                        </td>
                        <td className="px-6 py-5 capitalize font-medium text-boutique-charcoal/80">{tx.payment_mode}</td>
                        <td className="px-6 py-5 text-right font-bold text-boutique-charcoal">₹{Number(tx.total_amount).toFixed(2)}</td>
                        <td className="px-6 py-5 text-right">
                          <p className="font-bold text-emerald-700">₹{Number(tx.amount_paid).toFixed(2)}</p>
                          {balance > 0 && (
                            <p className="text-[11px] text-red-600 font-medium mt-0.5">Due: ₹{balance.toFixed(2)}</p>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[tx.status] || ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[tx.status] || 'bg-gray-400'}`} />
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {hasMore && (
                <div className="p-5 text-center border-t border-boutique-border bg-boutique-cream/20">
                  <Button
                    variant="outline"
                    onClick={() => fetchTransactions(search, true)}
                    disabled={loadingMore}
                    className="min-w-[160px]"
                  >
                    {loadingMore ? 'Loading…' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
