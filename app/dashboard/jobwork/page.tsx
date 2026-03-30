'use client'

import React, { useState, useEffect } from 'react'
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
        const fetchedJobs = d.jobs || []
        
        // Sorting Logic
        fetchedJobs.sort((a: any, b: any) => {
          // 1. Sort by Due Date (closest first, null at bottom)
          const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity
          const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity
          if (dateA !== dateB) return dateA - dateB
          
          // 2. Sort by Status index (closest to complete first)
          const statusA = STATUSES.indexOf(a.status)
          const statusB = STATUSES.indexOf(b.status)
          return statusA - statusB
        })
        
        setJobs(fetchedJobs)
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

  // Group rendering logic
  let lastGroupDate: string | null = null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
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
              ? 'border-boutique-roseDark text-boutique-roseDark' 
              : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
          }`}
        >
          Status Tracker
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'inventory' 
              ? 'border-boutique-roseDark text-boutique-roseDark' 
              : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
          }`}
        >
          Material Inventory
        </button>
      </div>

      {activeTab === 'tracker' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-boutique-charcoalLight whitespace-nowrap">Filter Status</span>
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
            <span className="text-sm text-boutique-charcoalLight ml-auto font-medium">{jobs.length} Jobs</span>
          </div>

          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="p-12 text-center text-boutique-charcoalLight">No active job work found.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-boutique-creamDark/60 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight border-b border-boutique-border">
                    <tr>
                      <th className="px-6 py-3.5">Job ID</th>
                      <th className="px-6 py-3.5">Trans. #</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Due Date</th>
                      <th className="px-6 py-3.5">Cloth By</th>
                      <th className="px-6 py-3.5 text-right">Charge</th>
                      <th className="px-6 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => {
                      const overdue = isOverdue(job.due_date)
                      const currentDateStr = job.due_date ? format(new Date(job.due_date), 'yyyy-MM-dd') : 'No Date'
                      const isNewGroup = lastGroupDate !== currentDateStr
                      
                      if (isNewGroup) {
                        lastGroupDate = currentDateStr
                      }

                      return (
                        <React.Fragment key={job.id}>
                          {isNewGroup && (
                            <tr className="group-header-row">
                              <td colSpan={7}>
                                {job.due_date ? format(new Date(job.due_date), 'dd MMMM yyyy (EEEE)') : 'No Due Date Set'}
                              </td>
                            </tr>
                          )}
                          <tr className="table-row-hover">
                            <td className="px-6 py-4 font-mono font-medium text-boutique-charcoal">
                              JOB-{job.id}
                            </td>
                            <td className="px-6 py-4 text-boutique-charcoalLight break-words text-xs">
                               #{job.transactions?.transaction_number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 capitalize font-medium">
                              <span className={`badge ${
                                job.status === 'stitching' ? 'badge-indigo' : 
                                job.status === 'finishing' || job.status === 'ironing' ? 'badge-teal' :
                                'badge-amber'
                              }`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {job.due_date ? (
                                <span className={overdue ? "badge-ruby text-[11px]" : "text-boutique-charcoal"}>
                                  {format(new Date(job.due_date), 'dd MMM yy')}
                                  {overdue && " (Overdue)"}
                                </span>
                              ) : <span className="text-boutique-charcoalLight">—</span>}
                            </td>
                            <td className="px-6 py-4 capitalize text-boutique-charcoalLight">{job.cloth_provided_by}</td>
                            <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">₹{job.charge.toFixed(2)}</td>
                            <td className="px-6 py-4 text-center">
                              <Link href={`/dashboard/jobwork/${job.id}`}>
                                <Button size="sm" variant="outline">Update</Button>
                              </Link>
                            </td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <InventoryTab />
        </div>
      )}
    </div>
  )
}

