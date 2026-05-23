'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Plus, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  id: number
  transaction_number: number
  customer_name: string | null
  customer_phone: string | null
  payment_mode: string
  total_amount: number
  amount_paid: number
  date_time: string
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
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

        setHasMore(newTransactions.length === LIMIT)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTransactions(search)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Billing" 
        description="View and manage all transactions and receipts."
        action={
          <Link href="/dashboard/billing/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <Input 
              placeholder="Search by name, phone or bill no..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          {loading && transactions.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No transactions found.</div>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                  <tr>
                    <th className="px-6 py-4">Bill No.</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-right">Paid</th>
                    <th className="px-6 py-4 text-center">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-boutique-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-boutique-cream transition-colors">
                      <td className="px-6 py-4 font-medium">#{tx.transaction_number}</td>
                      <td className="px-6 py-4 text-boutique-charcoalLight">
                        {format(new Date(tx.date_time), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        {tx.customer_name || 'Walk-in'}
                        {tx.customer_phone && <span className="block text-xs text-gray-700">{tx.customer_phone}</span>}
                      </td>
                      <td className="px-6 py-4 capitalize">{tx.payment_mode}</td>
                      <td className="px-6 py-4 text-right font-medium">₹{tx.total_amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-green-700">₹{tx.amount_paid.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/dashboard/billing/${tx.id}`}>
                          <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-charcoal">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {hasMore && (
                <div className="p-6 text-center border-t border-boutique-border bg-gray-50/50">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchTransactions(search, true)} 
                    disabled={loadingMore}
                    className="min-w-[150px]"
                  >
                    {loadingMore ? 'Loading More...' : 'Load All Transactions'}
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

