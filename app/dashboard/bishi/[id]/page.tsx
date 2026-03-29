'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Check, Plus, ArrowLeft, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'

export default function BishiGroupDetailPage({ params }: { params: { id: string } }) {
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingMember, setIsAddingMember] = useState(false)
  
  // New Member Form
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch members and the group info (mocking group info from first member for now or separate API if exists)
      // Actually we need a fetch group details API. Let's see if it exists.
      const [mRes, bRes] = await Promise.all([
        fetch(`/api/bishi/${params.id}/members`),
        fetch(`/api/bishi`) // find my group in the list
      ])
      
      const mData = await mRes.json()
      const bData = await bRes.json()
      
      setMembers(mData.members || [])
      const g = bData.bishi?.find((bg: any) => bg.id === Number(params.id))
      setGroup(g)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/bishi/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mName, phone: mPhone })
      })
      if (res.ok) {
        setMName('')
        setMPhone('')
        setIsAddingMember(false)
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleContribute = async (memberId: number) => {
    const amount = prompt(`Enter contribution amount for this member (Default: ₹${group.contribution_amount}):`, group.contribution_amount)
    if (amount === null) return

    try {
      const res = await fetch(`/api/bishi/${params.id}/members/${memberId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount) })
      })
      if (res.ok) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="p-8 text-center text-boutique-charcoalLight">Loading group details...</div>
  if (!group) return <div className="p-8 text-center text-red-500">Group not found.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bishi">
           <Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        </Link>
        <PageHeader 
          title={group.name} 
          description={`Target members: ${group.total_members} | Contribution: ₹${group.contribution_amount}`} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-boutique-border shadow-soft">
           <p className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Current Members</p>
           <p className="text-2xl font-bold text-boutique-charcoal mt-1">{members.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-boutique-border shadow-soft">
           <p className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Total Pool Value</p>
           <p className="text-2xl font-bold text-boutique-charcoal mt-1">
             ₹{members.reduce((acc, m) => acc + Number(m.total_contributed), 0).toLocaleString()}
           </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <h3 className="text-lg font-serif font-bold text-boutique-charcoal">Group Members</h3>
        <Button onClick={() => setIsAddingMember(!isAddingMember)} variant={isAddingMember ? 'outline' : 'primary'}>
           {isAddingMember ? 'Cancel' : (
             <>
               <Plus className="w-4 h-4 mr-2" />
               Add Member
             </>
           )}
        </Button>
      </div>

      {isAddingMember && (
        <form onSubmit={handleAddMember} className="bg-white p-6 rounded-xl border border-boutique-border shadow-soft grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <Input label="Member Name" value={mName} onChange={e => setMName(e.target.value)} required placeholder="Full Name" />
          <Input label="Phone Number" value={mPhone} onChange={e => setMPhone(e.target.value)} placeholder="+91..." />
          <Button type="submit">Register Member</Button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-soft border border-boutique-border overflow-hidden">
        <div className="overflow-x-auto">
          {members.length === 0 ? (
            <div className="p-8 text-center text-boutique-charcoalLight">No members registered in this group yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-boutique-creamDark/50 text-boutique-charcoal font-medium border-b border-boutique-border">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Total Contributed</th>
                  <th className="px-6 py-4">Redeemed</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-boutique-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-boutique-cream transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-boutique-charcoalLight">{member.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-boutique-charcoal">₹{member.total_contributed}</td>
                    <td className="px-6 py-4 text-boutique-charcoalLight">₹{member.total_redeemed}</td>
                    <td className="px-6 py-4 font-bold text-boutique-rose">₹{member.balance}</td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        size="sm" 
                        className="text-white bg-green-600 hover:bg-green-700"
                        onClick={() => handleContribute(member.id)}
                      >
                         <ArrowUpCircle className="w-4 h-4 mr-1" />
                         Contribute
                      </Button>
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
