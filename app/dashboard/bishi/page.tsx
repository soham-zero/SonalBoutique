'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Users, Plus, ArrowRight } from 'lucide-react'

export default function BishiGroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const LIMIT = 10
  
  // New Group Form
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [members, setMembers] = useState('')
  const [date, setDate] = useState('')

  const fetchGroups = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    const currentOffset = isLoadMore ? offset + LIMIT : 0
    const params = new URLSearchParams({
      limit: String(LIMIT),
      offset: String(currentOffset)
    })

    try {
      const res = await fetch(`/api/bishi?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newGroups = data.bishi || []
        if (isLoadMore) {
          setGroups(prev => [...prev, ...newGroups])
          setOffset(currentOffset)
        } else {
          setGroups(newGroups)
          setOffset(0)
        }
        setTotalCount(data.count || 0)
        setHasMore(currentOffset + newGroups.length < (data.count || 0))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/bishi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          contribution_amount: Number(amount), 
          total_members: Number(members),
          started_at: date
        })
      })
      if (res.ok) {
        setIsAdding(false)
        fetchGroups()
        setName('')
        setAmount('')
        setMembers('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Bishi Groups" 
          description="Manage community-based savings and redemption groups."
        />
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'outline' : 'primary'}>
          {isAdding ? 'Cancel' : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-boutique-border shadow-soft grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <Input label="Group Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Monday Morning Bishi" />
          <Input label="Contribution (₹)" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
          <Input label="Max Members" type="number" value={members} onChange={e => setMembers(e.target.value)} required />
          <Input label="Start Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          <Button type="submit" className="md:col-start-4">Create Group</Button>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-boutique-border shadow-soft">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-boutique-charcoalLight">No Bishi groups found. Create one to get started.</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white p-6 rounded-xl border border-boutique-border shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-boutique-charcoal mb-2">{group.name}</h3>
                <div className="space-y-1">
                  <p className="text-sm text-boutique-charcoalLight flex justify-between">
                    <span>Contribution:</span>
                    <span className="font-semibold text-boutique-charcoal">₹{group.contribution_amount}</span>
                  </p>
                  <p className="text-sm text-boutique-charcoalLight flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-semibold text-boutique-charcoal">{group.total_members} members</span>
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Link href={`/dashboard/bishi/${group.id}`}>
                  <Button variant="outline" className="w-full text-xs font-bold uppercase tracking-wider">
                    View Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => fetchGroups(true)}
              disabled={loadingMore}
              className="min-w-[150px]"
            >
              {loadingMore ? 'Loading More...' : `Load More (${groups.length} of ${totalCount})`}
            </Button>
          </div>
        )}
        </>
      )}
    </div>
  )
}
