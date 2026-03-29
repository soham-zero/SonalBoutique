import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function POST(request: Request, { params }: { params: { id: string, memberId: string } }) {
  try {
    const { amount, notes } = await request.json()
    const bishi_id = Number(params.id)
    const memberId = Number(params.memberId)
    
    if (Number(amount) <= 0) throw new Error("Contribution must be greater than 0")

    const admin = createAdminClient()

    // 1. Fetch member
    const { data: member, error: mbErr } = await (admin.from('bishi_members') as any).select('*').eq('id', memberId).single()
    if (mbErr) throw new Error("Member not found")

    // 2. Insert ledger
    await (admin.from('bishi_ledger') as any).insert({
      bishi_id: bishi_id,
      bishi_member_id: memberId,
      contribution_amount: Number(amount),
      notes: notes || null
    })

    // 3. Update member balances
    const newTotalContributed = Number(member.total_contributed) + Number(amount)
    const newBalance = Number(member.balance) + Number(amount)

    await (admin.from('bishi_members') as any).update({
       total_contributed: newTotalContributed,
       balance: newBalance,
       last_updated: new Date().toISOString()
    }).eq('id', memberId)

    return NextResponse.json({ success: true, balance: newBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
