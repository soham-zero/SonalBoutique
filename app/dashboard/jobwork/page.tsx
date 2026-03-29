'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { format, isBefore, startOfDay } from 'date-fns'

import { InventoryTab } from './InventoryTab'

const STATUSES = ['ordered', 'preparation', 'cutting', 'stitching', 'finishing', 'ironing']

export default function JobWorkPage() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'inventory'>('tracker')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    if (activeTab !== 'tracker') return
    setLoading(true)
    const q = filter ? `?status=${filter}` : ''
    fetch(`/api/billing/jobwork${q}`)
      .then(r => r.json())
      .then(d => {
        setJobs(d.jobs || [])
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [filter, activeTab])

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    return isBefore(startOfDay(new Date(dateString)), startOfDay(new Date()))
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Job Work Management" 
        description="Manage tailoring workflow status and raw material inventory in one place."
      />

      {/* Tabs */}
      <div className="flex border-b border-boutique-border">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'tracker' 
              ? 'border-boutique-rose text-boutique-rose' 
              : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
          }`}
        >
          Status Tracker
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'inventory' 
              ? 'border-boutique-rose text-boutique-rose' 
              : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
          }`}
        >
          Material Inventory
        </button>
      </div>

      {activeTab === 'tracker' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden flex flex-col items-start gap-4 p-4">
            <label className="text-sm font-medium text-boutique-charcoal">Filter by Status:</label>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={filter === '' ? 'primary' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('')}
              >
                All Active
              </Button>
              {STATUSES.map(s => (
                <Button 
                  key={s} 
                  variant={filter === s ? 'primary' : 'outline'} 
                  size="sm" 
                  onClick={() => setFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-boutique-charcoalLight">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center text-boutique-charcoalLight">No active job work found.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                    <tr>
                      <th className="px-6 py-4">Job ID</th>
                      <th className="px-6 py-4">Trans. #</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Cloth By</th>
                      <th className="px-6 py-4 text-right">Charge</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-boutique-border">
                    {jobs.map((job) => {
                      const overdue = isOverdue(job.due_date)
                      return (
                        <tr key={job.id} className="hover:bg-boutique-cream transition-colors">
                          <td className="px-6 py-4 font-medium uppercase text-boutique-charcoal">
                            JOB-{job.id}
                          </td>
                          <td className="px-6 py-4 text-boutique-charcoalLight break-words">
                             #{job.transactions?.transaction_number}
                          </td>
                          <td className="px-6 py-4 capitalize font-medium text-boutique-charcoalLight">
                            <span className="bg-boutique-roseLight text-boutique-charcoal px-2 py-1 rounded text-xs">
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {job.due_date ? (
                              <span className={overdue ? "text-red-600 font-bold" : ""}>
                                {format(new Date(job.due_date), 'dd MMM yy')}
                                {overdue && " (Overdue)"}
                              </span>
                            ) : 'No due date'}
                          </td>
                          <td className="px-6 py-4 capitalize">{job.cloth_provided_by}</td>
                          <td className="px-6 py-4 text-right font-medium">₹{job.charge.toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <Link href={`/dashboard/jobwork/${job.id}`}>
                              <Button size="sm">Update</Button>
                            </Link>
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
      ) : (
        <div className="animate-in fade-in duration-300">
          <InventoryTab />
        </div>
      )}
    </div>
  )
}
