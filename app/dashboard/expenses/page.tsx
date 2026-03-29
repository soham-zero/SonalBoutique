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
  
  const [typeFilter, setTypeFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.append('type', typeFilter)
    if (catFilter) params.append('category', catFilter)
    
    fetch(`/api/expenses?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        setExpenses(d.expenses || [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [typeFilter, catFilter])

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

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/3">
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
        <div className="w-full md:w-1/3">
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
        <div className="w-full md:w-1/3 text-right">
           <div className="text-sm text-boutique-charcoalLight">Filtered Total</div>
           <div className="font-serif text-2xl font-bold text-boutique-charcoal">
             ₹{expenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-boutique-charcoalLight">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No expenses recorded.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Classification</th>
                  <th className="px-6 py-4">Description</th>
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
                    <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                      ₹{exp.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
