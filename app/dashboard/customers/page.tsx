'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Eye } from 'lucide-react'

type Customer = { id: number; name: string; phone: string; total_billed: number; total_paid: number; balance: number }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10

  const fetchCustomers = async (q = '', isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset)
    })
    if (q) params.set('q', q)

    try {
      const res = await fetch(`/api/customers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newCustomers = data.customers || []
        if (isLoadMore) {
          setCustomers(prev => [...prev, ...newCustomers])
          setOffset(currentOffset)
        } else {
          setCustomers(newCustomers)
          setOffset(0)
        }
        setTotalCount(data.count || 0)
        setHasMore(currentOffset + newCustomers.length < (data.count || 0))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCustomers(search)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Outstanding Receivables" 
        description="Customers with pending outstanding balances."
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="w-full sm:flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <Input 
              placeholder="Search by name or phone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="text-right text-sm text-boutique-charcoalLight font-medium">
             Loaded Outstanding: <span className="text-red-500 font-bold ml-1">₹{customers.reduce((acc, c) => acc + Number(c.balance), 0).toFixed(2)}</span>
             <span className="block text-xs text-boutique-charcoalLight">{customers.length} of {totalCount} customers</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading records...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No outstanding balances found!</div>
          ) : (
            <>
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-right">Total Billed</th>
                  <th className="px-6 py-4 text-right">Total Paid</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-boutique-cream transition-colors">
                    <td className="px-6 py-4 font-medium text-boutique-charcoal">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-boutique-charcoalLight">
                      {c.phone}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ₹{c.total_billed.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-700 font-medium">
                      ₹{c.total_paid.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600 font-bold">
                      ₹{c.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/dashboard/customers/${c.id}`}>
                        <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-charcoal py-1 px-2 h-8">
                          <Eye className="w-4 h-4 mr-1" />
                          Ledger
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
                  onClick={() => fetchCustomers(search, true)}
                  disabled={loadingMore}
                  className="min-w-[150px]"
                >
                  {loadingMore ? 'Loading More...' : 'Load More'}
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
