'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, Eye, Trash2 } from 'lucide-react'

type Customer = { 
  id: string
  name: string
  phone: string
  total_billed: number
  total_paid: number
  balance: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [onlyOutstanding, setOnlyOutstanding] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10

  const fetchCustomers = async (q = search, isLoadMore = false, outstanding = onlyOutstanding) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset)
    })
    if (q) params.set('q', q)
    if (outstanding) params.set('onlyWithBalance', 'true')

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
    fetchCustomers('', false, onlyOutstanding)
  }, [onlyOutstanding])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCustomers(search, false, onlyOutstanding)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete customer')
      }
      fetchCustomers(search, false, onlyOutstanding)
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader 
        title="Boutique Customers" 
        description="Manage customer transaction ledgers and outstanding balances."
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="p-4 border-b border-boutique-border flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="w-full md:flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
            <Input 
              placeholder="Search by name or phone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-boutique-charcoal font-medium cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={onlyOutstanding}
                onChange={e => setOnlyOutstanding(e.target.checked)}
                className="w-4 h-4 rounded text-boutique-rose border-boutique-border focus:ring-boutique-rose/25"
              />
              Only Outstanding Dues
            </label>
            <div className="text-right text-xs text-boutique-charcoalLight font-medium">
               Outstanding Total: <span className="text-red-500 font-bold ml-1">₹{customers.reduce((acc, c) => acc + Number(c.balance), 0).toFixed(2)}</span>
               <span className="block text-gray-500">{customers.length} of {totalCount} customers</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight animate-pulse-soft">Loading customer records...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No customer accounts found.</div>
          ) : (
            <>
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold">Customer</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold">Phone</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold text-right">Total Billed</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold text-right">Total Paid</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold text-right">Balance Due</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-boutique-charcoalLight font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-boutique-cream/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-boutique-charcoal">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-boutique-charcoalLight">
                      {c.phone}
                    </td>
                    <td className="px-6 py-4 text-right text-boutique-charcoalLight font-mono">
                      ₹{c.total_billed.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-700 font-medium font-mono">
                      ₹{c.total_paid.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold font-mono ${c.balance > 0 ? 'text-red-500' : 'text-green-700'}`}>
                      ₹{c.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-1.5">
                      <Link href={`/dashboard/customers/${c.id}`}>
                        <Button variant="ghost" size="sm" className="text-boutique-charcoalLight hover:text-boutique-indigo gap-1">
                          <Eye className="w-4 h-4" />
                          View Ledger
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-6 text-center border-t border-boutique-border bg-gray-50/50">
                <Button
                  variant="outline"
                  onClick={() => fetchCustomers(search, true, onlyOutstanding)}
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
