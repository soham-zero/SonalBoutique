'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { format, isBefore, startOfDay } from 'date-fns'
import { Search, Eye, AlertTriangle } from 'lucide-react'
import { InventoryTab } from './InventoryTab'

const ACTIVE_STATUSES = ['ordered', 'preparation', 'cutting', 'stitching', 'finishing', 'ironing']

type JobItem = {
  id: string
  name: string
  status: string
  due_date: string | null
  cloth_provided_by: string
  charge: number
  transactions?: {
    id: string
    bill_number: string
    customers?: {
      name: string
      phone: string
    } | null
  } | null
}

type Employee = {
  id: string
  name: string
}

export default function JobWorkPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'delivered' | 'inventory'>('active')
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  
  // Track selected employee for each complete job to deliver it
  const [deliveryEmployees, setDeliveryEmployees] = useState<Record<string, string>>({})
  const [deliveringIds, setDeliveringIds] = useState<Record<string, boolean>>({})

  const LIMIT = 10

  const fetchJobs = async (isLoadMore = false, q = searchQuery, status = statusFilter) => {
    if (activeTab === 'inventory') return
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset),
      group: activeTab
    })
    
    if (q) params.set('q', q)
    if (status && activeTab === 'active') params.set('status', status)

    try {
      const res = await fetch(`/api/billing/jobwork?${params.toString()}`)
      if (res.ok) {
        const d = await res.json()
        const fetchedJobs = d.jobs || []
        
        if (isLoadMore) {
          setJobs(prev => [...prev, ...fetchedJobs])
          setOffset(currentOffset)
        } else {
          setJobs(fetchedJobs)
          setOffset(0)
        }
        setTotalCount(d.count || 0)
        setHasMore(currentOffset + fetchedJobs.length < (d.count || 0))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Fetch employees to select when delivering
  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data.employees || []))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    fetchJobs(false, searchQuery, statusFilter)
  }, [activeTab, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJobs(false, searchQuery, statusFilter)
  }

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false
    return isBefore(startOfDay(new Date(dateString)), startOfDay(new Date()))
  }

  const handleMarkDelivered = async (jobId: string) => {
    const empId = deliveryEmployees[jobId]
    if (!empId) {
      alert("Please select the employee who is handing over/delivering the jobwork.")
      return
    }

    setDeliveringIds(prev => ({ ...prev, [jobId]: true }))
    try {
      const res = await fetch(`/api/billing/jobwork/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          next_status: 'delivered',
          employee_id: empId
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update status')
      }

      // Remove from the list or reload
      setJobs(prev => prev.filter(j => j.id !== jobId))
      setTotalCount(prev => prev - 1)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setDeliveringIds(prev => ({ ...prev, [jobId]: false }))
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Job Work Management" 
        description="Track custom tailoring, updates, status cycles, and material audits."
      />

      {/* Tabs */}
      <div className="flex border-b border-boutique-border">
        {(['active', 'completed', 'delivered', 'inventory'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setStatusFilter('')
            }}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 capitalize ${
              activeTab === tab 
                ? 'border-boutique-roseDark text-boutique-roseDark font-bold' 
                : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
            }`}
          >
            {tab === 'active' ? 'Active Jobs' : tab === 'completed' ? 'Completed' : tab === 'delivered' ? 'Delivered' : 'Material Inventory'}
          </button>
        ))}
      </div>

      {activeTab !== 'inventory' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-boutique-charcoalLight" />
              <Input 
                placeholder="Search job name..."
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </form>

            {activeTab === 'active' && (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <Button 
                  variant={statusFilter === '' ? 'primary' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatusFilter('')}
                >
                  All Active
                </Button>
                {ACTIVE_STATUSES.map(s => (
                  <Button 
                    key={s} 
                    variant={statusFilter === s ? 'primary' : 'outline'} 
                    size="sm" 
                    onClick={() => setStatusFilter(s)}
                    className="capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}

            <span className="text-sm text-boutique-charcoalLight md:ml-auto font-medium self-center">
              {jobs.length} of {totalCount} Jobs
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="p-12 text-center text-boutique-charcoalLight">No job work items found.</div>
              ) : (
                <>
                <table className="w-full text-left text-sm">
                  <thead className="bg-boutique-creamDark/60 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight border-b border-boutique-border">
                    <tr>
                      <th className="px-6 py-3.5">Bill #</th>
                      <th className="px-6 py-3.5">Job Name</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Due Date</th>
                      <th className="px-6 py-3.5">Cloth By</th>
                      <th className="px-6 py-3.5 text-right">Charge</th>
                      <th className="px-6 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-boutique-border/60">
                    {jobs.map((job) => {
                      const overdue = activeTab === 'active' && isOverdue(job.due_date)
                      
                      return (
                        <tr key={job.id} className="hover:bg-boutique-cream/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-boutique-charcoalLight">
                             {job.transactions?.bill_number ? (
                               <Link href={`/dashboard/billing/${job.transactions.id}`} className="hover:underline text-boutique-indigo">
                                 #{job.transactions.bill_number}
                               </Link>
                             ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-medium text-boutique-charcoal">
                            {job.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-boutique-charcoal font-medium">
                              {job.transactions?.customers?.name || 'Walk-in'}
                            </div>
                            {job.transactions?.customers?.phone && (
                              <div className="text-xs text-boutique-charcoalLight">{job.transactions.customers.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 capitalize">
                            <span className={`badge ${
                              job.status === 'stitching' ? 'badge-indigo' : 
                              job.status === 'complete' ? 'badge-emerald' : 
                              job.status === 'delivered' ? 'badge-teal' :
                              'badge-amber'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {job.due_date ? (
                              <span className={overdue ? "badge-ruby text-[11px]" : "text-boutique-charcoal text-xs"}>
                                {format(new Date(job.due_date), 'dd MMM yy')}
                                {overdue && " (Overdue)"}
                              </span>
                            ) : <span className="text-boutique-charcoalLight">—</span>}
                          </td>
                          <td className="px-6 py-4 capitalize text-boutique-charcoalLight text-xs">{job.cloth_provided_by}</td>
                          <td className="px-6 py-4 text-right font-medium text-boutique-charcoal">₹{job.charge.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              {activeTab === 'active' && (
                                <Link href={`/dashboard/jobwork/${job.id}`}>
                                  <Button size="sm" variant="outline" className="gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    Update
                                  </Button>
                                </Link>
                              )}

                              {activeTab === 'completed' && (
                                <div className="flex items-center gap-2">
                                  <select 
                                    value={deliveryEmployees[job.id] || ''} 
                                    onChange={e => setDeliveryEmployees(prev => ({ ...prev, [job.id]: e.target.value }))}
                                    className="h-8 rounded border border-boutique-border bg-white px-2 py-0.5 text-xs text-boutique-charcoal focus:outline-none"
                                  >
                                    <option value="">Select Handover Employee...</option>
                                    {employees.map(e => (
                                      <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                  </select>
                                  <Button 
                                    size="sm" 
                                    variant="success"
                                    onClick={() => handleMarkDelivered(job.id)}
                                    disabled={!deliveryEmployees[job.id] || deliveringIds[job.id]}
                                  >
                                    {deliveringIds[job.id] ? 'Delivering...' : 'Mark Delivered'}
                                  </Button>
                                </div>
                              )}

                              {activeTab === 'delivered' && (
                                <Link href={`/dashboard/jobwork/${job.id}`}>
                                  <Button size="sm" variant="ghost" className="text-boutique-charcoalLight hover:text-boutique-indigo gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    View Log
                                  </Button>
                                </Link>
                              )}
                            </div>
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
                      onClick={() => fetchJobs(true)}
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
      ) : (
        <div className="animate-fade-in">
          <InventoryTab />
        </div>
      )}
    </div>
  )
}
