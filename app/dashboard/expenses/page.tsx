'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'

// Enums
const TYPES = ['capex', 'opex']
const CATEGORIES = ['salary', 'electricity', 'grocery', 'maintenance', 'transport', 'advertisement', 'miscellaneous']

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10
  
  const [typeFilter, setTypeFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchExpenses = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const params = new URLSearchParams()
    if (typeFilter) params.append('type', typeFilter)
    if (catFilter) params.append('category', catFilter)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    params.append('limit', String(LIMIT))
    params.append('offset', String(currentOffset))
    
    fetch(`/api/expenses?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        const newExpenses = d.expenses || []
        if (isLoadMore) {
          setExpenses(prev => [...prev, ...newExpenses])
          setOffset(currentOffset)
        } else {
          setExpenses(newExpenses)
          setOffset(0)
        }
        setTotalCount(d.count || 0)
        setHasMore(currentOffset + newExpenses.length < (d.count || 0))
        setLoading(false)
        setLoadingMore(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
        setLoadingMore(false)
      })
  }

  useEffect(() => {
    fetchExpenses()
  }, [typeFilter, catFilter, startDate, endDate])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <PageHeader 
        title="Expenses" 
        description="Monitor and register business expenditures."
        action={
          <Link href="/dashboard/expenses/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
           <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase mb-1">Expense Type</label>
           <select 
             value={typeFilter} 
             onChange={(e) => setTypeFilter(e.target.value)}
             className="w-full text-sm border-boutique-border rounded-md px-3 py-2 bg-gray-50 focus:ring-boutique-roseLight focus:outline-none ring-1 ring-inset ring-gray-200"
           >
             <option value="">All Types</option>
             {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase mb-1">Category</label>
           <select 
             value={catFilter} 
             onChange={(e) => setCatFilter(e.target.value)}
             className="w-full text-sm border-boutique-border rounded-md px-3 py-2 bg-gray-50 focus:ring-boutique-roseLight focus:outline-none ring-1 ring-inset ring-gray-200"
           >
             <option value="">All Categories</option>
             {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase mb-1">Start Date</label>
           <input 
             type="date"
             value={startDate} 
             onChange={(e) => setStartDate(e.target.value)}
             className="w-full text-sm border border-boutique-border rounded-md px-3 py-2 bg-gray-50 focus:ring-boutique-roseLight focus:outline-none ring-1 ring-inset ring-gray-200 text-boutique-charcoal"
           />
        </div>
        <div>
           <label className="block text-xs font-semibold text-boutique-charcoalLight uppercase mb-1">End Date</label>
           <input 
             type="date"
             value={endDate} 
             onChange={(e) => setEndDate(e.target.value)}
             className="w-full text-sm border border-boutique-border rounded-md px-3 py-2 bg-gray-50 focus:ring-boutique-roseLight focus:outline-none ring-1 ring-inset ring-gray-200 text-boutique-charcoal"
           />
        </div>
        <div className="text-right">
           <div className="text-sm text-boutique-charcoalLight">Loaded Total</div>
           <div className="font-serif text-xl font-bold text-boutique-charcoal">
             ₹{expenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)}
           </div>
           <div className="text-[11px] text-boutique-charcoalLight">{expenses.length} of {totalCount} expenses</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No expenses recorded.</div>
          ) : (
            <>
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Payment Mode</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-boutique-cream transition-colors">
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                      {format(new Date(exp.date_time), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-boutique-charcoal capitalize">{exp.category}</span>
                        <span className="text-xs text-boutique-charcoalLight uppercase">{exp.expense_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-boutique-charcoalLight max-w-xs truncate">
                      {exp.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-1 bg-boutique-roseLight text-boutique-charcoal text-xs rounded-md font-medium">
                        {exp.payment_mode || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                      ₹{exp.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-6 text-center border-t border-boutique-border bg-gray-50/50">
                <Button
                  variant="outline"
                  onClick={() => fetchExpenses(true)}
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
