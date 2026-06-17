import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bishiId = params.id
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')

    // ── 1. Fetch contributions from bishi_ledger ──────────────────────────
    let ledgerQuery = supabase
      .from('bishi_ledger')
      .select(`
        id,
        date_time,
        contribution_amount,
        payment_mode,
        notes,
        bishi_member_id,
        bishi_members (
          id,
          name
        )
      `)
      .eq('bishi_id', bishiId)

    if (memberId) ledgerQuery = ledgerQuery.eq('bishi_member_id', memberId)

    const { data: contributions, error: ledgerErr } = await ledgerQuery
    if (ledgerErr) throw new Error(ledgerErr.message)

    // ── 2. Fetch redemptions from bishi_sales + bill_number join ──────────
    let salesQuery = supabase
      .from('bishi_sales')
      .select(`
        id,
        date_time,
        redeemed,
        bishi_member_id,
        transaction_id,
        bishi_members (
          id,
          name
        ),
        transactions (
          bill_number
        )
      `)
      .eq('bishi_id', bishiId) as any

    if (memberId) salesQuery = salesQuery.eq('bishi_member_id', memberId)

    const { data: sales, error: salesErr } = await salesQuery
    if (salesErr) throw new Error(salesErr.message)

    // ── 3. Normalise into unified entries ─────────────────────────────────
    const contributionEntries = (contributions || []).map((c: any) => ({
      id: `ledger-${c.id}`,
      type: 'contribution' as const,
      date_time: c.date_time,
      member_name: c.bishi_members?.name ?? 'Unknown',
      bishi_member_id: c.bishi_member_id,
      amount: Number(c.contribution_amount),        // positive
      payment_mode: c.payment_mode ?? null,
      notes: c.notes ?? null,
      bill_number: null,
    }))

    const redemptionEntries = (sales || []).map((s: any) => ({
      id: `sale-${s.id}`,
      type: 'redemption' as const,
      date_time: s.date_time,
      member_name: s.bishi_members?.name ?? 'Unknown',
      bishi_member_id: s.bishi_member_id,
      amount: -Number(s.redeemed),                 // negative
      payment_mode: null,
      notes: null,
      bill_number: s.transactions?.bill_number ?? null,
    }))

    // ── 4. Merge and sort by date_time DESC ───────────────────────────────
    const ledger = [...contributionEntries, ...redemptionEntries].sort(
      (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
    )

    return NextResponse.json({ ledger })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
