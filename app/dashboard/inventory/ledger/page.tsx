'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format } from 'date-fns'
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle, Search, Filter, X } from 'lucide-react'
import Link from 'next/link'

type LedgerEntry = {
  id: number
  quantity_added: number
  cost_price: number
  date_time: string
  inventory: { id: number; name: string; custom_code: string }
}

export default function InventoryLedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')       // '' | 'added' | 'consumed'
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const offsetRef = useRef(0)
  const LIMIT = 10

  const fetchLedger = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const currentOffset = isLoadMore ? offsetRef.current + LIMIT : 0
      const params = new URLSearchParams()
      if (q)    params.set('q', q)
      if (type) params.set('type', type)
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      params.set('limit', String(LIMIT))
      params.set('offset', String(currentOffset))
      const res = await fetch(`/api/inventory/ledger?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newEntries = data.ledger || []
        if (isLoadMore) {
          setEntries(prev => [...prev, ...newEntries])
          offsetRef.current = currentOffset
        } else {
          setEntries(newEntries)
          offsetRef.current = 0
        }
        setTotalCount(data.count || 0)
        setHasMore(currentOffset + newEntries.length < (data.count || 0))
      }
    } catch (e) { console.error(e) }
    finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [q, type, from, to])

  useEffect(() => { fetchLedger() }, [fetchLedger])

  const clearFilters = () => { setQ(''); setType(''); setFrom(''); setTo('') }
  const hasFilters = q || type || from || to

  const totalAdded    = entries.filter(e => e.quantity_added > 0).reduce((a, e) => a + e.quantity_added, 0)
  const totalConsumed = entries.filter(e => e.quantity_added < 0).reduce((a, e) => a + Math.abs(e.quantity_added), 0)
  const totalCost     = entries.filter(e => e.quantity_added > 0).reduce((a, e) => a + e.cost_price * e.quantity_added, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/inventory">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      <PageHeader 
        title="Inventory Ledger"
        description="All stock movement events across every inventory item."
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-boutique-border shadow-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Total Entries</p>
          <p className="text-2xl font-bold text-boutique-charcoal mt-1">{entries.length} / {totalCount}</p>
        </div>
        <div className="bg-boutique-emeraldLight rounded-2xl border border-emerald-200 shadow-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Added</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">+{totalAdded} units</p>
        </div>
        <div className="bg-boutique-rubyLight rounded-2xl border border-red-200 shadow-soft p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Total Consumed</p>
          <p className="text-2xl font-bold text-red-800 mt-1">−{totalConsumed} units</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-boutique-border shadow-soft p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-boutique-charcoalLight" />
          <span className="text-sm font-semibold text-boutique-charcoal">Filters</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs text-boutique-charcoalLight hover:text-boutique-ruby flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
            <input
              type="text"
              placeholder="Item name or code..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-boutique-border text-sm text-boutique-charcoal bg-boutique-cream/50 focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30"
            />
          </div>

          {/* Type filter */}
          <div className="flex gap-2">
            {(['', 'added', 'consumed'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 h-10 rounded-lg text-xs font-semibold border transition-all ${
                  type === t 
                    ? t === 'added' ? 'bg-boutique-emerald text-white border-boutique-emerald' 
                      : t === 'consumed' ? 'bg-boutique-ruby text-white border-boutique-ruby'
                      : 'bg-boutique-charcoal text-white border-boutique-charcoal'
                    : 'bg-white border-boutique-border text-boutique-charcoalLight hover:border-boutique-rose'
                }`}
              >
                {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Date from */}
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="h-10 rounded-lg border border-boutique-border text-sm text-boutique-charcoal bg-boutique-cream/50 px-3 focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30"
          />
          {/* Date to */}
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="h-10 rounded-lg border border-boutique-border text-sm text-boutique-charcoal bg-boutique-cream/50 px-3 focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30"
          />
        </div>
      </div>

      {/* Total cost (only when showing "added" or all) */}
      {(type === '' || type === 'added') && totalCost > 0 && (
        <div className="flex items-center gap-2 text-sm text-boutique-charcoalLight px-1">
          <span>Total purchase cost for filtered period:</span>
          <span className="font-bold text-boutique-charcoal">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-boutique-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading ledger...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-boutique-charcoalLight">No ledger entries match your filters.</div>
          ) : (
            <>
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/60 border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight">Date & Time</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight">Item</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight">Code</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight text-center">Action</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight text-right">Cost / Unit</th>
                  <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border/60">
                {entries.map(entry => {
                  const isAdd = entry.quantity_added > 0
                  return (
                    <tr key={entry.id} className="hover:bg-boutique-cream/50 transition-colors">
                      <td className="px-6 py-4 text-boutique-charcoalLight text-xs">
                        {format(new Date(entry.date_time), 'dd MMM yyyy, h:mm a')}
                      </td>
                      <td className="px-6 py-4 font-medium text-boutique-charcoal">
                        <Link href={`/dashboard/inventory/${entry.inventory?.id}`}
                          className="hover:text-boutique-roseDark hover:underline">
                          {entry.inventory?.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-boutique-charcoalLight">
                        {entry.inventory?.custom_code}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isAdd ? (
                          <span className="badge-emerald inline-flex items-center gap-1">
                            <ArrowUpCircle className="w-3 h-3" />
                            +{entry.quantity_added} Added
                          </span>
                        ) : (
                          <span className="badge-ruby inline-flex items-center gap-1">
                            <ArrowDownCircle className="w-3 h-3" />
                            {Math.abs(entry.quantity_added)} Consumed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                        {isAdd ? `₹${entry.cost_price.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {isAdd ? (
                          <span className="text-boutique-emerald">
                            ₹{(entry.cost_price * entry.quantity_added).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-6 text-center border-t border-boutique-border bg-gray-50/50">
                <Button
                  variant="outline"
                  onClick={() => fetchLedger(true)}
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
