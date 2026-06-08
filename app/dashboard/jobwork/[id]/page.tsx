'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Check, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const STAGE_ORDER = [
  'ordered',
  'preparation',
  'cutting',
  'stitching',
  'finishing',
  'ironing',
  'complete',
  'delivered'
]

type JobData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  charge: number;
  due_date: string | null;
  cloth_provided_by: string;
  transactions?: { 
    id: string; 
    bill_number: string;
    customers?: { name: string; phone: string } | null;
  } | null;
  job_item_ledger: Array<{
    id: string;
    employee_id: string;
    work: string;
    changed_at: string;
    employees?: { name: string } | null;
  }>
}

type Employee = { id: string; name: string }

export default function JobWorkDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [job, setJob] = useState<JobData | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`/api/billing/jobwork/${params.id}`)
      if (res.ok) {
        const jobData = await res.json()
        setJob(jobData.job)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/billing/jobwork/${params.id}`).then(res => res.json()),
      fetch(`/api/employees`).then(res => res.json())
    ]).then(([jobData, empData]) => {
      setJob(jobData.job)
      setEmployees(empData.employees || [])
      setLoading(false)
    }).catch(e => {
      console.error(e)
      setLoading(false)
    })
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading job details...</div>
  if (!job) return <div className="p-8 text-center text-red-500">Job not found.</div>

  const currentStageIndex = STAGE_ORDER.indexOf(job.status)
  const nextStage = STAGE_ORDER[currentStageIndex + 1]

  const handleUpdateStatus = async () => {
    if (!nextStage) return
    if (!selectedEmployee) {
      setError("Please select the employee advancing this stage.")
      return
    }

    setUpdating(true)
    setError(null)

    try {
      const res = await fetch(`/api/billing/jobwork/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          next_status: nextStage,
          employee_id: selectedEmployee
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      await fetchJobDetails()
      setSelectedEmployee('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <PageHeader 
        title={`Job Work: ${job.name}`} 
        description={`Bill Reference: #${job.transactions?.bill_number || 'N/A'}`} 
      />

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
           <h3 className="text-sm font-medium text-boutique-charcoalLight mb-1">Customer</h3>
           <p className="font-semibold text-boutique-charcoal">
             {job.transactions?.customers?.name || 'Walk-in Customer'}
           </p>
           {job.transactions?.customers?.phone && (
             <p className="text-xs text-boutique-charcoalLight">{job.transactions.customers.phone}</p>
           )}
        </div>
        <div>
           <h3 className="text-sm font-medium text-boutique-charcoalLight mb-1">Due Date</h3>
           <p className="font-semibold text-lg text-boutique-charcoal">
             {job.due_date ? format(new Date(job.due_date), 'dd MMM yyyy') : 'No Due Date'}
           </p>
        </div>
        <div>
           <h3 className="text-sm font-medium text-boutique-charcoalLight mb-1">Status</h3>
           <p className="font-semibold text-lg text-boutique-charcoal capitalize">
             {job.status}
           </p>
        </div>
        <div className="md:text-right">
           <h3 className="text-sm font-medium text-boutique-charcoalLight mb-1">Charge</h3>
           <p className="font-semibold text-lg text-boutique-charcoal">
             ₹{job.charge.toFixed(2)}
           </p>
        </div>
      </div>

      {job.description && (
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6">
          <h3 className="text-sm font-medium text-boutique-charcoalLight mb-2">Description / Notes</h3>
          <p className="text-sm text-boutique-charcoal whitespace-pre-line">{job.description}</p>
        </div>
      )}

      {/* Stage Progression UI */}
      <div className="bg-white rounded-xl shadow-soft border border-boutique-border p-6 overflow-x-auto">
        <h3 className="font-serif font-bold text-lg text-boutique-charcoal mb-6">Progression Track</h3>
        <div className="flex items-center justify-between min-w-[700px] relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 hidden md:block" />
          {STAGE_ORDER.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex
            const isCurrent = idx === currentStageIndex
            
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center">
                <div 
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-2 transition-colors",
                    isCompleted ? "bg-boutique-rose text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                </div>
                <span className={clsx(
                  "text-xs font-semibold capitalize tracking-wide text-center",
                  isCurrent ? "text-boutique-rose font-bold" : "text-gray-700"
                )}>
                  {stage}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Update Job Status Section */}
        <div className="bg-boutique-creamDark rounded-xl shadow-soft border border-boutique-border p-6 space-y-4">
          <h3 className="font-serif font-bold text-lg text-boutique-charcoal">Advance Stage</h3>
          {nextStage ? (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-md border border-boutique-border">
                <p className="text-sm text-boutique-charcoalLight">Next stage is:</p>
                <p className="font-medium text-lg text-boutique-charcoal capitalize">{nextStage}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-boutique-charcoal mb-1">Assigned Employee</label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-boutique-border bg-white px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseLight"
                >
                  <option value="" disabled>Select the employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <Button 
                onClick={handleUpdateStatus} 
                className="w-full mt-4"
                disabled={!selectedEmployee || updating}
              >
                {updating ? 'Updating...' : `Advance to ${nextStage}`}
              </Button>
            </div>
          ) : (
             <div className="p-4 bg-green-50 rounded border border-green-200 text-green-700 font-medium">
               This job has been fully delivered.
             </div>
          )}
        </div>

        {/* Ledger History */}
        <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
           <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h3 className="font-serif font-bold text-lg text-boutique-charcoal">History Log</h3>
           </div>
           {job.job_item_ledger && job.job_item_ledger.length > 0 ? (
             <div className="p-6 relative space-y-6">
                <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-gray-200 animate-slide-down"></div>
                {job.job_item_ledger.map((ledger) => (
                  <div key={ledger.id} className="relative z-10 flex gap-4">
                     <div className="w-6 h-6 rounded-full bg-boutique-roseLight flex items-center justify-center shrink-0 border border-white shadow-sm text-white relative right-1">
                        <Check className="w-3 h-3 text-white" />
                     </div>
                     <div>
                       <p className="font-medium text-sm text-boutique-charcoal capitalize">Moved to {ledger.work}</p>
                       <p className="text-xs text-boutique-charcoalLight mt-0.5">By {ledger.employees?.name || 'Unknown'}</p>
                       <p className="text-xs text-gray-600 mt-0.5">{format(new Date(ledger.changed_at), 'MMM dd, h:mm a')}</p>
                     </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="p-6 text-center text-gray-700 text-sm">No ledger history.</div>
           )}
        </div>
      </div>
    </div>
  )
}
