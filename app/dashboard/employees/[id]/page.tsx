'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import Link from 'next/link'
import { User, ClipboardList, ArrowLeft } from 'lucide-react'

type JobItem = {
  id: string
  name: string
  status: string
  charge: number
  transactions?: {
    id: string
    bill_number: string
  } | null
}

type LedgerContribution = {
  id: string
  work: string
  changed_at: string
  job_items?: JobItem | null
}

type Employee = {
  id: string
  name: string
}

export default function EmployeeDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [ledger, setLedger] = useState<LedgerContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10

  const loadEmployeeData = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    try {
      const res = await fetch(`/api/employees/${params.id}?limit=${LIMIT}&offset=${currentOffset}`)
      const data = await res.json()
      
      if (res.ok) {
        setEmployee(data.employee)
        if (isLoadMore) {
          setLedger(prev => [...prev, ...(data.ledger || [])])
          setOffset(currentOffset)
        } else {
          setLedger(data.ledger || [])
          setOffset(0)
        }
        setTotalCount(data.count || 0)
        setHasMore(currentOffset + (data.ledger || []).length < (data.count || 0))
      } else {
        setError(data.error)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    loadEmployeeData()
  }, [params.id])

  if (loading && offset === 0) return <div className="p-8 text-center text-boutique-charcoalLight">Loading employee records...</div>
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>
  if (!employee) return <div className="p-8 text-center text-red-500">Employee not found.</div>

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <PageHeader 
        title={employee.name} 
        description="Employee work progression logs and tailoring contributions."
      />

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 text-center space-y-4">
           <div className="w-20 h-20 bg-boutique-roseLight/20 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-boutique-roseDark" />
           </div>
           <div>
              <h3 className="font-serif font-bold text-xl text-boutique-charcoal">{employee.name}</h3>
              <p className="text-xs font-mono text-boutique-charcoalLight mt-1">ID: {employee.id.substring(0, 8)}...</p>
           </div>
           <div className="border-t border-boutique-border pt-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-boutique-charcoalLight block">Total Registered Contributions</span>
              <span className="text-3xl font-bold text-boutique-charcoal mt-1 block">{totalCount}</span>
           </div>
        </div>

        {/* Contributions Ledger */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
           <div className="p-4 border-b border-boutique-border bg-gray-50/50 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-boutique-charcoalLight" />
              <h3 className="font-serif font-bold text-base text-boutique-charcoal">Jobwork Stage History</h3>
           </div>
           
           <div className="overflow-x-auto">
             {ledger.length === 0 ? (
               <div className="p-12 text-center text-boutique-charcoalLight">No contributions logged by this employee yet.</div>
             ) : (
               <>
               <table className="w-full text-left text-sm">
                 <thead className="bg-boutique-creamDark/20 font-semibold border-b border-boutique-border text-boutique-charcoalLight">
                   <tr>
                     <th className="px-6 py-3.5">Date</th>
                     <th className="px-6 py-3.5">Bill #</th>
                     <th className="px-6 py-3.5">Job Item</th>
                     <th className="px-6 py-3.5">Operation Done</th>
                     <th className="px-6 py-3.5 text-right">Charge</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-boutique-border/50">
                   {ledger.map(entry => (
                     <tr key={entry.id} className="hover:bg-boutique-cream/10 transition-colors">
                       <td className="px-6 py-4 text-xs text-boutique-charcoalLight">
                         {format(new Date(entry.changed_at), 'dd MMM yyyy, h:mm a')}
                       </td>
                       <td className="px-6 py-4 font-mono text-xs text-boutique-indigo">
                         {entry.job_items?.transactions?.bill_number ? (
                           <Link href={`/dashboard/billing/${entry.job_items.transactions.id}`} className="hover:underline">
                             #{entry.job_items.transactions.bill_number}
                           </Link>
                         ) : '—'}
                       </td>
                       <td className="px-6 py-4 font-medium text-boutique-charcoal">
                         {entry.job_items ? (
                           <Link href={`/dashboard/jobwork/${entry.job_items.id}`} className="hover:underline text-boutique-charcoal">
                             {entry.job_items.name}
                           </Link>
                         ) : 'Deleted Job Item'}
                       </td>
                       <td className="px-6 py-4">
                         <span className="badge badge-indigo capitalize">
                           {entry.work}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">
                         ₹{entry.job_items?.charge ? entry.job_items.charge.toFixed(2) : '0.00'}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {hasMore && (
                 <div className="p-4 text-center border-t border-boutique-border bg-gray-50/50">
                   <Button variant="outline" size="sm" onClick={() => loadEmployeeData(true)} disabled={loadingMore}>
                     {loadingMore ? 'Loading More...' : 'Load More'}
                   </Button>
                 </div>
               )}
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  )
}
