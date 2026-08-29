import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { recalculateBishiMember } from '@/utils/bishi'

export async function POST(request: Request, { params }: { params: { id: string, memberId: string } }) {
  try {
    const { amount, notes, payment_mode, date_time } = await request.json()
    const bishi_id = params.id
    const memberId = params.memberId
    
    if (Number(amount) <= 0) throw new Error("Contribution must be greater than 0")
    if (!payment_mode) throw new Error("payment_mode is required")

    const admin = createAdminClient()

    // 1. Insert ledger entry first
    const ledgerPayload: any = {
      bishi_id: bishi_id,
      bishi_member_id: memberId,
      contribution_amount: Number(amount),
      payment_mode: payment_mode,
      notes: notes || null
    }

    if (date_time) {
      ledgerPayload.date_time = new Date(date_time).toISOString()
    }

    const { error: insertErr } = await (admin.from('bishi_ledger') as any).insert(ledgerPayload)
    if (insertErr) throw new Error("Failed to log contribution: " + insertErr.message)

    // 2. Recalculate balances centrally
    const newBalance = await recalculateBishiMember(memberId, admin)

    return NextResponse.json({ success: true, balance: newBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
