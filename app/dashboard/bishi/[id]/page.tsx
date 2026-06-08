'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Check, Plus, ArrowLeft, ArrowUpCircle, AlertTriangle, BookOpen, X, Users, Search } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type BishiMember = {
  id: string
  name: string
  phone: string | null
  total_contributed: number
  total_redeemed: number
  balance: number
}

// ─── Modal ────────────────────────────────────────────────────────────────
function ContributeModal({
  member,
  groupId,
  defaultAmount,
  onClose,
  onSuccess,
}: {
  member: BishiMember
  groupId: string
  defaultAmount: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState<number | ''>(defaultAmount)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { setError('Amount must be positive.'); return }
    setLoading(true); setError('')

    try {
      const res = await fetch(`/api/bishi/${groupId}/members/${member.id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), notes })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed')
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-card-hover border border-boutique-border w-full max-w-sm overflow-hidden animate-modal-in">
        <div className="px-5 py-4 bg-boutique-emeraldLight/60 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-boutique-emerald text-emerald-600" />
            <div>
              <h3 className="font-serif font-bold text-boutique-charcoal leading-tight">Add Contribution</h3>
              <p className="text-[11px] text-emerald-800 uppercase tracking-wider font-semibold">For {member.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
            <X className="w-5 h-5 text-boutique-charcoalLight" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Contribution Amount (₹)"
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
              required
            />
            <div>
              <label className="block text-sm font-medium text-boutique-charcoal mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Paid in cash"
                className="w-full rounded-lg border border-boutique-border bg-boutique-cream/50 px-3 py-2 text-sm text-boutique-charcoal focus:outline-none focus:ring-2 focus:ring-boutique-roseDark/30 resize-none h-20"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" variant="success" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : 'Add Funds'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function BishiGroupDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'members' | 'ledger'>('members')
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<BishiMember[]>([])
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & States
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  
  const [contributeModal, setContributeModal] = useState<BishiMember | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, bRes, lRes] = await Promise.all([
        fetch(`/api/bishi/${params.id}/members`),
        fetch(`/api/bishi/${params.id}`),
        fetch(`/api/bishi/${params.id}/ledger`)
      ])
      
      const mData = await mRes.json()
      const bData = await bRes.json()
      const lData = await lRes.json()
      
      setMembers(mData.members || [])
      setLedger(lData.ledger || [])
      setGroup(bData.bishi || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [params.id])

  // Subhandlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/bishi/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mName, phone: mPhone })
      })
      if (res.ok) {
        setMName(''); setMPhone(''); setIsAddingMember(false)
        fetchData()
      }
    } catch (e) { console.error(e) }
  }

  if (loading) return <div className="p-12 text-center text-boutique-charcoalLight animate-pulse-soft">Loading group details...</div>
  if (!group) return <div className="p-12 text-center text-red-500">Group not found.</div>

  const totalPool = members.reduce((acc, m) => acc + Number(m.total_contributed), 0)

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
    (m.phone && m.phone.includes(memberSearch))
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {contributeModal && (
        <ContributeModal
          member={contributeModal}
          groupId={params.id}
          defaultAmount={group.contribution_amount}
          onClose={() => setContributeModal(null)}
          onSuccess={fetchData}
        />
      )}

      <div className="flex items-center gap-3">
        <Link href="/dashboard/bishi">
           <Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </Link>
      </div>

      <PageHeader 
        title={group.name} 
        description={`Target members: ${group.total_members}  •  Default Contribution: ₹${group.contribution_amount.toLocaleString()}`} 
      />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-boutique-border shadow-soft flex items-center justify-between">
           <div>
             <p className="text-xs font-semibold uppercase tracking-wider text-boutique-charcoalLight">Current Members</p>
             <p className="text-3xl font-bold text-boutique-charcoal mt-1 tracking-tight">{members.length}</p>
           </div>
           <div className="w-12 h-12 bg-boutique-indigoLight/20 rounded-full flex items-center justify-center text-boutique-indigo">
              <Users className="w-5 h-5" />
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-boutique-border shadow-soft border-l-4 border-l-boutique-emerald flex items-center justify-between md:col-span-2">
           <div>
             <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Total Pool Value</p>
             <p className="text-3xl font-bold text-boutique-charcoal mt-1 tracking-tight">₹{totalPool.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-boutique-border pt-4">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 flex gap-2 items-center ${
            activeTab === 'members' 
              ? 'border-boutique-roseDark text-boutique-roseDark font-bold bg-boutique-creamDark/20' 
              : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
          }`}
        >
          <Users className="w-4 h-4" />
          Members
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 flex gap-2 items-center ${
            activeTab === 'ledger' 
              ? 'border-boutique-roseDark text-boutique-roseDark font-bold bg-boutique-creamDark/20' 
              : 'border-transparent text-boutique-charcoalLight hover:text-boutique-charcoal'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          General Ledger
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-soft border border-boutique-border">
            <div className="flex items-center gap-2 max-w-xs w-full relative">
              <Search className="w-4 h-4 text-boutique-charcoalLight absolute left-3 top-1/2 -translate-y-1/2" />
              <Input 
                type="text" 
                placeholder="Filter members by name..." 
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="pl-9 h-9" 
              />
            </div>
            <Button onClick={() => setIsAddingMember(!isAddingMember)} variant={isAddingMember ? 'outline' : 'primary'} size="sm">
               {isAddingMember ? 'Cancel' : ( <><Plus className="w-4 h-4 mr-1.5" /> Add Member</> )}
            </Button>
          </div>

          {isAddingMember && (
            <form onSubmit={handleAddMember} className="bg-white p-6 rounded-2xl border border-boutique-border shadow-soft grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-slide-down">
              <Input label="Member Name" value={mName} onChange={e => setMName(e.target.value)} required placeholder="Full Name" />
              <Input label="Phone Number" value={mPhone} onChange={e => setMPhone(e.target.value)} placeholder="+91..." />
              <Button type="submit" variant="success">Register Member</Button>
            </form>
          )}

          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
             {filteredMembers.length === 0 ? (
               <div className="p-12 text-center text-boutique-charcoalLight">No members registered in this group yet.</div>
             ) : (
               <table className="w-full text-left text-sm">
                 <thead className="bg-boutique-creamDark/60 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight border-b border-boutique-border">
                   <tr>
                     <th className="px-6 py-3.5">Name</th>
                     <th className="px-6 py-3.5">Total Contributed</th>
                     <th className="px-6 py-3.5">Redeemed</th>
                     <th className="px-6 py-3.5 bg-boutique-creamDark/30">Balance</th>
                     <th className="px-6 py-3.5 text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-boutique-border/60">
                   {filteredMembers.map((member) => (
                     <tr key={member.id} className="hover:bg-boutique-cream/50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="font-semibold text-boutique-charcoal">{member.name}</div>
                          <div className="text-xs text-boutique-charcoalLight font-mono">{member.phone || '—'}</div>
                       </td>
                       <td className="px-6 py-4 font-semibold text-boutique-emerald">₹{member.total_contributed.toLocaleString()}</td>
                       <td className="px-6 py-4 text-boutique-charcoalLight font-medium">₹{member.total_redeemed.toLocaleString()}</td>
                       <td className="px-6 py-4 font-bold text-boutique-charcoal bg-boutique-creamDark/10">₹{member.balance.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center">
                         <Button size="sm" variant="success" onClick={() => setContributeModal(member)}>
                             <ArrowUpCircle className="w-3.5 h-3.5 mr-1" /> Contribute
                         </Button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        </div>
      )}

      {/* Ledger Tab */}
      {activeTab === 'ledger' && (
        <div className="animate-fade-in space-y-6">
          <div className="bg-white rounded-2xl shadow-soft border border-boutique-border overflow-hidden">
            {ledger.length === 0 ? (
               <div className="p-12 text-center text-boutique-charcoalLight">No transactions recorded yet.</div>
            ) : (
               <table className="w-full text-left text-sm">
                 <thead className="bg-boutique-creamDark/60 font-semibold text-xs uppercase tracking-wider text-boutique-charcoalLight border-b border-boutique-border">
                   <tr>
                     <th className="px-6 py-3.5">Date &amp; Time</th>
                     <th className="px-6 py-3.5">Member</th>
                     <th className="px-6 py-3.5">Notes</th>
                     <th className="px-6 py-3.5 text-right">Amount</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-boutique-border/60">
                   {ledger.map((entry) => (
                     <tr key={entry.id} className="hover:bg-boutique-cream/50 transition-colors">
                       <td className="px-6 py-4 text-boutique-charcoalLight text-xs">
                         {format(new Date(entry.date_time || new Date()), 'dd MMM yyyy, h:mm a')}
                       </td>
                       <td className="px-6 py-4 font-semibold text-boutique-charcoal">
                         {entry.bishi_members?.name || 'Unknown'}
                       </td>
                       <td className="px-6 py-4 text-boutique-charcoalLight text-xs max-w-[200px] truncate">
                         {entry.notes || '—'}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <span className="badge-emerald">+ ₹{entry.contribution_amount.toLocaleString()}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
